# Documento de Arquitectura Técnica - Zyntratek Remote Manager

## 1. Visión General y Objetivos de Arquitectura

**Zyntratek Remote Manager** es un administrador de conexiones remotas de escritorio multiplataforma (Windows, macOS, Linux) inspirado en herramientas como Windows Remote Desktop Connection, MobaXterm y Royal TS. 

El objetivo principal es permitir la gestión centralizada, estructurada y extremadamente segura de conexiones **SSH** y **RDP**, garantizando que ninguna credencial sensible (contraseñas, claves privadas, tokens, passphrases) sea almacenada en texto plano ni en la base de datos de metadatos.

### Principios de Diseño y Seguridad
1. **Cero Secretos en Texto Plano**: SQLite almacena únicamente metadatos de configuración, carpetas, etiquetas y referencias abstractas a credenciales (`credential_id`).
2. **Uso Exclusivo de Keyring del SO**: Las credenciales sensibles se custodian directamente en el almacén seguro del sistema operativo (Windows Credential Manager, macOS Keychain, Linux Secret Service API vía Freedesktop SecretService/KWallet).
3. **Aislamiento Estricto (Defense in Depth)**: El Frontend React/TypeScript opera sin conocimiento ni visibilidad directa sobre los secretos guardados. El acceso al vault de secretos ocurre exclusivamente en Rust mediante comandos Tauri sanitizados.
4. **Prevención de Fugas y Command Injection**: Las contraseñas o claves privadas nunca se concatenan en argumentos de línea de comandos de procesos secundarios (ej. `xfreerdp` recibe credenciales mediante `stdin`; en Windows `mstsc` utiliza inyección temporal en Credential Manager con limpieza garantizada).
5. **Zeroización de Memoria**: En el backend de Rust, los búferes que contengan secretos temporales implementan borrado seguro (`zeroize`) al destruirse.
6. **Sin logs de información sensible**: Filtro estricto en la capa de trazado (`tracing`) para enmascarar cualquier secreto.

---

## 2. Arquitectura de Capas

```
+-----------------------------------------------------------------------+
|                         CAPA FRONTEND (UI)                            |
|    React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + xterm.js |
+-----------------------------------------------------------------------+
                                   |
                   IPC Bridge (Tauri Commands v2)
                  Type-Safe JSON Payload Boundary
                                   v
+-----------------------------------------------------------------------+
|                       CAPA TAURI / CORE (Rust)                        |
|                                                                       |
|  +---------------------+  +--------------------+  +----------------+  |
|  | Connection Service  |  | Credential Manager |  | Session Runner |  |
|  +---------------------+  +--------------------+  +----------------+  |
|            |                        |                     |           |
|            v                        v                     v           |
|   SQLite DB (rusqlite)       OS Keyring (keyring-rs)   SSH/RDP Engine |
+-----------------------------------------------------------------------+
```

---

## 3. Estructura de Directorios

```
zyntratek-remote-manager/
├── ARCHITECTURE.md
├── ROADMAP.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── components.json
├── src/                                  # Capa Frontend (React + TS)
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/                       # Componentes UI (shadcn/ui & custom)
│   │   ├── ui/                           # Componentes atomicos shadcn
│   │   ├── layout/                       # Sidebar, Header, Breadcrumbs, Navigation
│   │   ├── connections/                  # Listas, Tarjetas, Formularios Conexión
│   │   ├── credentials/                  # Formularios Credencial (Vault)
│   │   ├── folders/                      # Árbol de carpetas
│   │   ├── terminal/                     # Componente de Terminal SSH (xterm.js)
│   │   └── rdp/                          # Visor / Lanzador RDP
│   ├── hooks/                            # Hooks personalizados (useConnections, useVault)
│   ├── services/                         # Wrapper de Tauri IPC Commands
│   │   ├── connectionService.ts
│   │   ├── credentialService.ts
│   │   ├── folderService.ts
│   │   └── sessionService.ts
│   ├── store/                            # Estado global (Zustand)
│   └── types/                            # Definiciones de TypeScript
│       ├── connection.ts
│       ├── credential.ts
│       ├── folder.ts
│       └── tauri.ts
│
└── src-tauri/                            # Capa Backend (Rust + Tauri v2)
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    └── src/
        ├── main.rs
        ├── lib.rs
        ├── error.rs                      # Sistema de errores unificado e inmune a fugas
        ├── commands/                     # Controladores Tauri IPC
        │   ├── mod.rs
        │   ├── connection_cmd.rs
        │   ├── credential_cmd.rs
        │   ├── folder_cmd.rs
        │   └── session_cmd.rs
        ├── core/                         # Lógica de Dominio
        │   ├── mod.rs
        │   ├── connection.rs
        │   ├── credential.rs
        │   └── folder.rs
        ├── db/                           # Capa de Persistencia SQLite
        │   ├── mod.rs
        │   ├── schema.rs
        │   ├── migrations.rs
        │   └── repository.rs
        ├── vault/                        # Integración segura OS Keyring
        │   ├── mod.rs
        │   ├── keyring_provider.rs
        │   └── secret_store.rs
        └── protocols/                    # Motores de Protocolos de Conexión
            ├── mod.rs
            ├── ssh.rs                    # Cliente SSH (russh/ssh2 + PTY stream)
            └── rdp.rs                    # Gestor de sesión RDP (mstsc/freerdp wrapper)
```

---

## 4. Modelo de Datos y Esquema SQLite

### 4.1 Script DDL SQLite (`schema.rs` / Migración Inicial)

```sql
-- Tabla de Carpetas
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Referencia de Credenciales (Metadata Únicamente)
CREATE TABLE IF NOT EXISTS credentials (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Password', 'PrivateKey', 'PassphraseKey')),
    provider TEXT NOT NULL DEFAULT 'OSKeyring',
    username_hint TEXT, -- Nombre de usuario visible opcional para referencia rápida
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Conexiones
CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    protocol TEXT NOT NULL CHECK(protocol IN ('SSH', 'RDP')),
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT NOT NULL,
    credential_id TEXT REFERENCES credentials(id) ON DELETE SET NULL,
    folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
    favorite BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tags
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL DEFAULT '#64748b'
);

-- Relación N:M Conexiones - Tags
CREATE TABLE IF NOT EXISTS connection_tags (
    connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (connection_id, tag_id)
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_connections_folder ON connections(folder_id);
CREATE INDEX IF NOT EXISTS idx_connections_favorite ON connections(favorite);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
```

> **NOTA DE SEGURIDAD**: Ningún campo en las tablas SQLite guarda contraseñas, secretos, tokens o llaves SSH RSA/ED25519. El campo `credential_id` es un UUIDv4 estático que actúa como clave única dentro del OS Keyring.

---

## 5. Estrategia de Almacenamiento Seguro (Credential Vault)

### 5.1 Mecanismo de Keyring del SO
Se utiliza la biblioteca nativa de Rust `keyring` v2+ que interactúa con los subsistemas de seguridad nativos:
* **Windows**: Windows Credential Manager (`CredentialWriteW` / `CredentialReadW`).
* **macOS**: Apple Keychain Services (`SecItemAdd` / `SecItemCopyMatching`).
* **Linux**: Secret Service API mediante D-Bus (`org.freedesktop.secrets`).

### 5.2 Estructura de Claves en Keyring
Format de namespace seguro en el OS Keyring:
* **Target / Service Name**: `zyntratek-remote-manager`
* **Account Name**: `credential:{credential_id}` (ej. `credential:550e8400-e29b-41d4-a716-446655440000`)

### 5.3 Manejo de Secretos en Memoria (Zeroization)
Cualquier estructura en Rust que transporte contraseñas o claves privadas implementa el trait `Zeroize` de la crate `zeroize`:
```rust
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Zeroize, ZeroizeOnDrop)]
pub struct SecretPayload {
    pub secret: String,
}
```
Al finalizar la conexión o al salir de alcance, el área de memoria RAM ocupada por el secreto es sobrescrita explícitamente con ceros antes de liberarse.

---

## 6. Definición de Comandos Tauri (IPC Interface)

Todos los comandos Tauri devuelven una estructura `Result<T, AppError>` donde `AppError` limpia automáticamente mensajes sensibles de error antes de cruzar el límite IPC hacia el frontend.

### 6.1 Conexiones (`connection_cmd.rs`)
* `get_connections() -> Result<Vec<ConnectionDto>, AppError>`
* `get_connection_by_id(id: String) -> Result<ConnectionDto, AppError>`
* `create_connection(payload: CreateConnectionPayload) -> Result<ConnectionDto, AppError>`
* `update_connection(id: String, payload: UpdateConnectionPayload) -> Result<ConnectionDto, AppError>`
* `delete_connection(id: String) -> Result<(), AppError>`
* `duplicate_connection(id: String) -> Result<ConnectionDto, AppError>`
* `toggle_favorite(id: String) -> Result<bool, AppError>`

### 6.2 Credenciales y Vault (`credential_cmd.rs`)
* `list_credentials_metadata() -> Result<Vec<CredentialMetadataDto>, AppError>`
* `create_credential(payload: CreateCredentialPayload) -> Result<CredentialMetadataDto, AppError>`
* `update_credential(id: String, payload: UpdateCredentialPayload) -> Result<CredentialMetadataDto, AppError>`
* `delete_credential(id: String) -> Result<(), AppError>`

> **REGLA DE SEGURIDAD**: NO existe ningún comando IPC Tauri para obtener la contraseña o clave privada en texto plano hacia el frontend. Las credenciales sólo entran de Frontend a Rust durante `create_credential` o `update_credential`.

### 6.3 Carpetas y Tags (`folder_cmd.rs`)
* `get_folders() -> Result<Vec<FolderDto>, AppError>`
* `create_folder(name: String, parent_id: Option<String>) -> Result<FolderDto, AppError>`
* `delete_folder(id: String) -> Result<(), AppError>`
* `get_tags() -> Result<Vec<TagDto>, AppError>`

### 6.4 Sesiones de Conexión (`session_cmd.rs`)
* `start_ssh_session(connection_id: String, window: tauri::Window) -> Result<String, AppError>`
* `send_ssh_input(session_id: String, data: Vec<u8>) -> Result<(), AppError>`
* `resize_ssh_pty(session_id: String, cols: u16, rows: u16) -> Result<(), AppError>`
* `close_ssh_session(session_id: String) -> Result<(), AppError>`
* `start_rdp_session(connection_id: String) -> Result<(), AppError>`

---

## 7. Interfaces TypeScript (`src/types/`)

```typescript
// src/types/connection.ts
export type Protocol = 'SSH' | 'RDP';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Connection {
  id: string;
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  username: string;
  credentialId?: string;
  folderId?: string;
  favorite: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectionPayload {
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  username: string;
  credentialId?: string;
  folderId?: string;
  favorite?: boolean;
  tagIds?: string[];
}

// src/types/credential.ts
export type CredentialType = 'Password' | 'PrivateKey' | 'PassphraseKey';

export interface CredentialMetadata {
  id: string;
  name: string;
  type: CredentialType;
  provider: 'OSKeyring';
  usernameHint?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialPayload {
  name: string;
  type: CredentialType;
  usernameHint?: string;
  // El secreto solo se transmite en el payload de creación/edición:
  secret: string; 
}

// src/types/folder.ts
export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 8. Flujo de Conexión SSH

```
+----------+                     +------------------+                    +--------------------+
| Frontend |                     | Tauri Command    |                    | SSH Remote Server  |
| xterm.js |                     | (Rust Backend)   |                    |                    |
+----------+                     +------------------+                    +--------------------+
     |                                    |                                         |
     |--- 1. start_ssh_session(conn_id)->|                                         |
     |                                    |--- 2. Carga Conn de SQLite              |
     |                                    |--- 3. Pide Secreto a OS Keyring         |
     |                                    |--- 4. Asigna PTY (russh/ssh2)           |
     |                                    |--- 5. Autenticación SSH --------------->|
     |                                    |<-- 6. Handshake Completado -------------|
     |<-- 7. Retorna session_id ----------|                                         |
     |                                    |                                         |
     |=== 8. IPC Channel Events ==========|                                         |
     |--- send_ssh_input(data) ---------->|--- Escribe en STDIN PTY --------------->|
     |<-- Emit("ssh_output") -------------|<-- Lee de STDOUT PTY -------------------|
     |                                    |                                         |
```

### Protocolo de Seguridad en SSH:
1. **Validación de Host Key**: Se verifica el fingerprint del host contra `~/.ssh/known_hosts` o se solicita al usuario confirmar huellas nuevas.
2. **Autenticación en Memoria**: El secreto (password o privada) se extrae del OS Keyring directamente al cliente SSH de Rust y la memoria se destruye con `zeroize` inmediatamente después de la autenticación.
3. **Flujo de Terminal Emulada**: Se utiliza `xterm.js` en el Frontend comunicándose mediante canal IPC de eventos de Tauri v2 con baja latencia.

---

## 9. Flujo de Conexión RDP y Análisis de Seguridad

```
+----------+                     +------------------+                    +--------------------+
| Frontend |                     | Tauri Command    |                    | Servidor RDP       |
| (UI)     |                     | (Rust Backend)   |                    | (Windows Server)   |
+----------+                     +------------------+                    +--------------------+
     |                                    |                                         |
     |--- 1. start_rdp_session(conn_id) ->|                                         |
     |                                    |--- 2. Obtiene Conn de SQLite            |
     |                                    |--- 3. Obtiene Pass de OS Keyring        |
     |                                    |--- 4. CredWriteW (Win32 API) / stdin    |
     |                                    |--- 5. Spawns `mstsc.exe` o `xfreerdp` ->|
     |                                    |--- 6. Cleanup con RAII (CredDeleteW)    |
     |<-- 7. OK (Proceso Lanzado) --------|                                         |
```

### 9.1 Evaluación Técnica de Seguridad RDP en Windows (`cmdkey` vs Win32 Credential API)

#### Análisis de Riesgos y Limitaciones de `cmdkey.exe`
1. **Exposición en Invocación de Proceso**: Ejecutar `cmdkey /generic:TERMSRV/<host> /user:<user> /pass:<pass>` expone la contraseña en la lista de argumentos de proceso en Windows (visible vía Task Manager o auditorías de procesos como Process Explorer/Sysmon Event ID 4688).
2. **Persistencia en Caídas de Sistema (Crashes)**: Si `mstsc.exe` o Zyntratek sufren una terminación inesperada (crash, kill forzado, corte de energía), la credencial `TERMSRV/<host>` permanece guardada indefinidamente en el Windows Credential Manager del usuario.
3. **Lectura por Procesos del Mismo Usuario**: Cualquier aplicación en ejecución con los mismos privilegios del usuario actual puede listar las credenciales almacenadas (`cmdkey /list`).
4. **Colisión de Sesiones Simultáneas**: Si se abren dos conexiones RDP al mismo host con credenciales distintas, la clave `TERMSRV/<host>` se sobrescribe en el Credential Manager.

#### Decisión Arquitectónica y Mitigaciones Implementadas:

1. **Uso de Win32 API Nativa (`CredWriteW` / `CredDeleteW`) en lugar de `cmdkey.exe` CLI**:
   * En lugar de lanzar el binario `cmdkey.exe` por línea de comandos (evitando la fuga en argumentos de proceso), Rust invoca directamente las funciones de la API nativa de Windows `CredWriteW` con tipo `CRED_TYPE_GENERIC` y nombre de objetivo `TERMSRV/<host>`.

2. **Limpieza Garantizada con RAII (Resource Acquisition Is Initialization)**:
   * El proceso de sesión RDP se encapsula en una estructura Rust `RdpSessionGuard` que implementa el trait `Drop`.
   * Tan pronto como `mstsc.exe` se cierra o finaliza, el método `drop()` ejecuta inmediatamente `CredDeleteW("TERMSRV/<host>")`.

3. **Limpieza de Huérfanos al Iniciar la Aplicación (Orphan Cleanup Pass)**:
   * Al iniciar Zyntratek Remote Manager, el backend Rust ejecuta la función `cleanup_orphaned_rdp_credentials()`.
   * Esta función inspecciona y elimina cualquier entrada `TERMSRV/*` creada previamente por la aplicación que haya quedado huérfana debido a un crash previo del sistema.

### 9.2 Prevención de Fugas en Linux / macOS (`xfreerdp` / `wlfreerdp`)
* Se ejecuta `xfreerdp /v:<host>:<port> /u:<username> /from-stdin`.
* La contraseña se escribe directamente en el stream `stdin` del subproceso secundario inmediatamente después de crearlo y se cierra `stdin`.
* **Cero argumentos sensibles** expuestos en `ps aux` o `/proc/<pid>/cmdline`.

---

## 10. Estrategia de Testing y Calidad

1. **Pruebas Unitarias en Rust (`cargo test`)**:
   * Pruebas de repositorios SQLite sobre bases de datos en memoria (`:memory:`).
   * Pruebas de parseo y sintaxis de hosts/puertos.
   * Pruebas de sanitización de errores (`AppError`).
   * Pruebas de mocking del proveedor Keyring.
2. **Pruebas de Integración Frontend (`Vitest` + `React Testing Library`)**:
   * Rendimiento y renderizado del árbol de carpetas.
   * Pruebas de validación de formularios de conexión y credenciales.
   * Manejo de estados y filtros de búsqueda.
3. **Auditoría de Seguridad Automatizada**:
   * `cargo audit` para vulnerabilidades en crates de Rust.
   * `clippy` con flags de seguridad activados.
   * `npm audit` para dependencias frontend.

---

## 11. Cumplimiento de Reglas de Seguridad

| Regla | Implementación en Arquitectura |
| :--- | :--- |
| **1. No passwords en texto plano** | Guardados exclusivamente en el Keyring del SO. |
| **2 & 3. No contraseñas ni claves en logs** | Tracing customizado con atributos enmascarados `#[debug(skip)]`. |
| **4. No secretos en errores** | Estructura `AppError` devuelve códigos genéricos (`VaultError`, `DatabaseError`) sin exponer contenidos. |
| **5. No secretos hardcodeados** | Configuración puramente dinámica de credenciales por usuario. |
| **6 & 7. No criptografía propia** | Utilización de `keyring-rs`, `russh`/`ssh2`, `zeroize` y APIs nativas del SO. |
| **8. Validar entradas** | Input sanitization en Rust (validación de formatos de IPs/Hostnames, rangos de puertos 1-65535). |
| **9. Evitar Command Injection** | Uso de `std::process::Command` enviando argumentos como array estricto y secretos vía `stdin`/`cmdkey` seguro. |
| **10. Mínimo privilegio** | Aislamiento de procesos y memoria efímera para secretos. |
| **11. Separación de capas** | Frontend -> Comandos Tauri -> Servicios Rust -> SQLite / OS Keyring. |
| **12 & 13. Frontend sin acceso a secretos** | No existen comandos Tauri IPC que retornen secretos al frontend. |

---

## 12. Arquitectura de Distribución y Empaquetado de Producción (Fase 7)

### 12.1 Sincronización de Versión 1.0.0 (Semantic Versioning)
El ecosistema completo utiliza versionado semántico unificado `1.0.0`:
* Frontend: `package.json` (`"version": "1.0.0"`)
* Backend Rust: `src-tauri/Cargo.toml` (`version = "1.0.0"`)
* Tauri Config: `src-tauri/tauri.conf.json` (`"version": "1.0.0"`)

### 12.2 Distribución y Verificación de Integridad Criptográfica
Cada ejecutable o instalador publicado cuenta con una suma de verificación criptográfica registrada en [`SHA256SUMS.txt`](file:///c:/Users/danie/Documents/zyntratek-remote-manager/SHA256SUMS.txt).

### 12.3 Firma de Código (Code Signing)
* **Windows**: Firma de código Authenticode en instaladores NSIS/MSI.
* **macOS**: Firma Developer ID Application y proceso de notarización con Apple Notary Service.
* **Aviso Obligatorio**: `SIGNING REQUIRED BEFORE PUBLIC RELEASE`.


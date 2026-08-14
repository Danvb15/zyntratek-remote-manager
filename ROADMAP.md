# Roadmap de Implementación - Zyntratek Remote Manager

Este documento detalla la hoja de ruta por fases para el desarrollo de **Zyntratek Remote Manager**. Cada fase contiene hitos verficables y entregables concretos.

---

## Fase 1: Configuración de Entorno y Arquitectura Base
**Objetivo**: Inicializar el proyecto con el stack obligatorio (Tauri v2, Rust, React, TypeScript, Vite, Tailwind CSS, shadcn/ui) y configurar las capas base de persistencia y seguridad.

### Hitos
1. [x] **Inicialización de Tauri 2 + Vite + React + TypeScript**:
   * Estructura base de carpetas (`src/` y `src-tauri/`).
   * Configuración de Tailwind CSS y tokens HSL.
2. [x] **Estructura Rust Backend Base**:
   * Proyecto `src-tauri` inicializado con Tauri v2.
   * Módulos base de arquitectura: `commands`, `core`, `db`, `error`, `vault`, `protocols`.
3. [x] **Configuración de Seguridad e Integridad**:
   * Crate `zeroize` agregada y probada para estructuras de memoria.
   * Estructura `AppError` implementada previniendo la fuga de trazas o secretos por IPC.
4. [x] **Configuración de Linting, Typecheck y Tests**:
   * `cargo check` y `cargo test` (5/5 tests unitarios en verde).
   * `npm run typecheck`, `npm run lint`, `npm run test` (Vitest) y `npm run build` completados sin errores.

---

## Fase 2: Capa de Servicios Backend Rust y Comandos Tauri IPC
**Objetivo**: Implementar la lógica de negocio en Rust, repositorios SQLite, integración segura de secretos con OS Keyring y exponerlos a través de comandos IPC fuertemente tipados.

### Hitos
1. [x] **Repositorios SQLite (`rusqlite`)**:
   * CRUD de Conexiones (crear, obtener, listar, editar, eliminar, duplicar).
   * CRUD de Metadatos de Credenciales.
   * CRUD de Carpetas y Tags asociados.
2. [x] **Servicio de Credenciales (OS Keyring + Zeroize)**:
   * Almacenamiento directo de secretos en OS Keyring por `credential_id` UUID.
   * Destrucción segura en memoria RAM implementando `Zeroize` y `ZeroizeOnDrop`.
   * Eliminación sincronizada de secretos al borrar credenciales.
3. [x] **Comandos Tauri IPC Fuertemente Tipados**:
   * `create_credential`, `update_credential`, `delete_credential`, `list_credentials_metadata`.
   * `create_connection`, `get_connection`, `list_connections`, `update_connection`, `delete_connection`, `duplicate_connection`.
   * `create_folder`, `list_folders`, `delete_folder`.
   * Respuestas estructuradas con `AppError` sin fugas de secretos.
4. [x] **Suite de Tests de Seguridad y Persistencia**:
   * 10/10 tests en verde demostrando aislamiento de secretos en SQLite, logs, errores, DTOs y supervivencia al reinicio de la app.

---

## Fase 3: Interfaz de Usuario (UI/UX React + TypeScript)
**Objetivo**: Construir una interfaz moderna, limpia y profesional para la gestión de conexiones y credenciales conectada a los comandos Tauri IPC existentes.

### Hitos
1. [x] **Arquitectura Frontend Modular**:
   * Capa de servicios Tauri IPC (`src/services/tauri/`).
   * Custom Hooks de React (`useConnections`, `useCredentials`, `useFolders`, `useTags`).
   * Tipos TypeScript alineados con DTOs de Rust (`src/types/`).
2. [x] **Gestión de Conexiones (CRUD & Búsqueda)**:
   * Listado en tarjetas con indicadores de protocolo (SSH/RDP), favorito, folder y badges de etiquetas.
   * Modal de Creación y Edición con validación estricta (Host, Puerto 1-65535, Usuario, Credencial del Vault).
   * Confirmación explícita de eliminación.
   * Acción Duplicar conexión.
   * Botón Conectar con aviso modal explícito de motor SSH/RDP pendiente para Fases 4 y 5.
3. [x] **Vault de Credenciales UI**:
   * Listado en tabla únicamente de metadatos (Nombre, Tipo, Proveedor, Hint).
   * Modal de Creación/Edición con ingreso transitorio en memoria RAM.
   * Protección estricta: Los secretos **nunca** se guardan en el estado persistente del frontend ni se exponen en texto plano.
4. [x] **Navegación, Carpetas y Etiquetas**:
   * Sidebar dinámico con contadores (Todas, Favoritos, SSH, RDP, Vault).
   * Árbol/Lista de carpetas con creación y eliminación.
   * Etiquetas dinámicas con selector de color.
   * Topbar con buscador global (Atajo `Cmd+K` / `Ctrl+K`), creación rápida (`Cmd+N` / `Ctrl+N`) y filtros rápidos.
5. [x] **Suite de Tests de Frontend**:
   * Vitest (8/8 tests pasados) validando invocación segura de servicios IPC, listado, creación, duplicado, alternancia de favoritos e inmunidad de secretos.

---

## Fase 4: Implementación del Protocolo SSH
**Objetivo**: Permitir la conexión remota mediante SSH e integrar una terminal gráfica funcional dentro del cliente desktop.

### Hitos
1. [x] **Motor Backend de SSH en Rust (`russh`)**:
   * Selección de `russh` 0.49 (asíncrono nativo con Tokio, sin dependencias de C).
   * Autenticación por Contraseña y Clave Privada (con/sin passphrase) leyendo secretos efímeramente del OS Keyring.
   * Política estricta de `known_hosts` (`HOST_UNKNOWN`, `HOST_VERIFIED`, `HOST_KEY_CHANGED`).
   * Asignación de PTY (`xterm-256color`), solicitud de shell interactivo y canal streaming bidireccional mediante `tauri::ipc::Channel<SshEvent>`.
2. [x] **Integración de Terminal Frontend (`xterm.js`)**:
   * Componente de terminal React (`SshTerminalComponent.tsx`) envolviendo `@xterm/xterm` + `@xterm/addon-fit`.
   * Comunicación IPC en tiempo real para entrada/salida de datos, estados de sesión (`CONNECTING`, `CONNECTED`, `DISCONNECTED`, `ERROR`) y cambio dinámico de tamaño de ventana (`resizePty`).
   * Tests unitarios y de integración (`cargo check`, `cargo test` 11/11 verde, `cargo clippy`, `cargo audit`, `npm run typecheck`, `npm run lint`, `npx vitest run` 8/8 verde, `npm run build`).


---

## Fase 5: Implementación del Protocolo RDP
**Objetivo**: Permitir el lanzamiento de sesiones de escritorio remoto RDP de forma nativa e inmune a filtraciones de credenciales.

### Hitos
1. [x] **Gestor de Lanzamiento RDP en Rust (`RdpSessionManager`)**:
   * **Windows**: Inyección efímera en Windows Credential Manager (`CredWriteW` / `CredDeleteW`) con target único `TERMSRV/<host>` y lanzamiento de `mstsc.exe /v:<host>:<port>` sin pasar contraseñas por línea de comandos.
   * **Linux/macOS**: Detección dinámica de `xfreerdp3` / `xfreerdp` pasando secretos exclusivamente a través de `stdin` (`/from-stdin`).
   * Monitoreo en segundo plano con limpieza inmediata de credenciales al salir el proceso y función de purga de huérfanos al inicio del sistema.
2. [x] **Integración UI**:
   * Botón de conexión RDP lanzando la sesión nativa con ventana de estado y manejo de errores sanitizado.
   * Suite de pruebas completada (`cargo check`, `cargo test` 13/13 verde, `cargo clippy`, `cargo audit`, `npm run typecheck`, `npm run lint`, `npx vitest run` 8/8 verde, `npm run build`).


---

## Fase 6: Seguridad, Auditoría, Manejo de Errores y Testing
**Objetivo**: Validar el cumplimiento estricto de las reglas de seguridad, auditoría de IPC, saneamiento de entradas y suite de pruebas adversariales.

### Hitos
1. [x] **Auditoría de Secretos y Logging**:
   * Redacción estricta en `SecretPayload` (`fmt::Debug` -> `[REDACTED]`) y erradicación de trazas sensibles.
2. [x] **Inmunidad a Inyección de Comandos e Inputs Adversariales**:
   * Pruebas Fuzz y Adversariales (`tests/adversarial_and_fuzz_tests.rs`) validando saneamiento de inputs en SQLite y CLI.
3. [x] **Auditoría de Seguridad e IPC**:
   * Matriz de comandos IPC auditada, saneamiento de errores con `AppError`, verificación de `known_hosts` y limpieza de Windows Credential Manager.
   * Documentación de seguridad entregada: `SECURITY.md` y `PHASE6-SECURITY-AUDIT.md`.


---

## Fase 7: Embalaje, Empaquetado y Distribución
**Objetivo**: Compilar ejecutables nativos, empaquetar instaladores y preparar distribución pública.

### Hitos
1. [x] **Compilación de Producción y Sincronización de Versión 1.0.0**:
   * Sincronizados `package.json`, `Cargo.toml` y `tauri.conf.json` en versión `1.0.0`.
   * Generado binario release de producción `zyntratek-remote-manager.exe`.
   * Generado archivo de sumas de verificación `SHA256SUMS.txt`.
2. [x] **Configuración de CI/CD para Release**:
   * Archivo de workflow `.github/workflows/release.yml` para compilación en matriz (Windows, Linux, macOS).
3. [x] **Documentación Completa de Release**:
   * Entregados `RELEASE.md`, `TROUBLESHOOTING.md`, `README.md`, `PHASE7-RELEASE-PLAN.md` y `PHASE7-STATUS.md`.


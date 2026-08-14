# Especificación Técnica de Diseño - Fase 4: Protocolo SSH

## 1. Evaluación y Selección de Librería SSH en Rust

### Alternativas Evaluadas

1. **`russh` (Versión 0.49+)** - *Seleccionada*
   * **Mantenimiento**: Activo y respaldado por la comunidad de Rust async (`Hickory DNS`, `Eugenia`).
   * **Arquitectura**: 100% Rust Puro, asíncrona sobre el runtime de `tokio`.
   * **Funcionalidades**:
     * Autenticación por contraseña (`authenticate_password`).
     * Autenticación por clave privada (`authenticate_publickey` con RSA, ED25519, ECDSA).
     * Solicitud de PTY interactivo (`request_pty`).
     * Canales de sesión con streaming bidireccional (`channel.data()`, `channel.write_all()`).
     * Redimensionamiento dinámico de PTY (`window_change`).
     * Verificación de Host Keys.
   * **Ventajas**: Cero dependencias C/C++ nativas (evita compilación de OpenSSL/libssh2 en Windows MSVC), compatibilidad nativa con Tauri 2 y Tokio, cero riesgo de desbordamientos de buffer C.

2. **`ssh2` (Bindings de `libssh2`)**
   * **Mantenimiento**: Mantenido pero dependiente de librerías C nativas (`libssh2`, `OpenSSL`).
   * **Arquitectura**: Síncrona / Bloqueante por defecto.
   * **Desventajas**: Requiere envolver llamadas I/O en `spawn_blocking`, complica la compilación cruzada en Windows/macOS/Linux y presenta riesgos de enlaces DLL/C.

3. **`thrussh`**
   * Predecesor de `russh`, actualmente deprecado a favor de `russh`.

**Decisión**: Usar **`russh`** junto con `russh-keys` para gestión de firmas y claves.

---

## 2. Arquitectura de Flujo SSH & Aislamiento de Secretos

```mermaid
sequenceDiagram
    participant React UI
    participant Tauri IPC
    participant SshSessionManager
    participant SQLite DB
    participant OS Keyring
    participant Russh Engine
    participant Remote SSH Server

    React UI->>Tauri IPC: start_ssh_session(connection_id, cols, rows, channel)
    Tauri IPC->>SQLite DB: get_connection(connection_id)
    SQLite DB-->>Tauri IPC: ConnectionDto (host, port, username, credential_id)
    Tauri IPC->>OS Keyring: get_secret(credential_id)
    OS Keyring-->>Tauri IPC: SecretPayload (Password / PrivateKey in RAM)
    Tauri IPC->>SshSessionManager: spawn_session(config, secret, channel)
    SshSessionManager->>Russh Engine: connect(host:port) & authenticate()
    Note over SshSessionManager,Russh Engine: Secret zeroized after auth handshake
    Russh Engine->>Remote SSH Server: SSH Handshake & Auth
    Russh Engine->>Remote SSH Server: request_pty("xterm-256color", cols, rows)
    Russh Engine->>Remote SSH Server: request_shell()
    Remote SSH Server-->>Russh Engine: PTY Channel Established
    Russh Engine border Tauri IPC: Stream PTY Output -> Tauri Channel -> React (xterm.js)
```

### Principios Fundamentales de Seguridad:
1. **El Frontend NUNCA recibe contraseñas ni claves privadas**: El formulario de React únicamente envía `connection_id`. Rust recupera el secreto del OS Keyring de forma efímera.
2. **Zeroización de RAM**: El secreto en memoria RAM es destruido inmediatamente después del handshake de autenticación mediante `ZeroizeOnDrop`.
3. **Sin Comandos de Shell `sh -c`**: Las sesiones SSH se gestionan directamente a nivel de protocolo binario mediante la API nativa de `russh`.

---

## 3. Política de Verificación de Host Keys (`known_hosts`)

Se implementa una verificación estricta de la huella digital SSH (SHA-256 / Ed25519 / RSA):

* **Directorio de Almacenamiento**: `%APPDATA%/zyntratek-remote-manager/known_hosts` (o equivalente en Linux/macOS).
* **Estados**:
  1. `HOST_VERIFIED`: La huella coincide con el registro de `known_hosts`. La conexión prosigue.
  2. `HOST_UNKNOWN`: El host no está registrado. Se notifica al usuario vía evento Tauri IPC solicitando confirmación para guardar la huella digital.
  3. `HOST_KEY_CHANGED`: La huella digital ha cambiado. La conexión **se bloquea inmediatamente** y se muestra una advertencia de seguridad (posible ataque Man-in-the-Middle).

---

## 4. Gestión de Sesiones PTY y Streaming IPC (Tauri 2)

* **Tauri 2 Channels**: La salida del PTY se transmite en tiempo real hacia la terminal `xterm.js` mediante la API de `tauri::ipc::Channel<SshEvent>`.
* **Eventos Bidireccionales**:
  * **Rust $\rightarrow$ Frontend**: `SshEvent::Output(Vec<u8>)`, `SshEvent::Status(SessionStatus)`, `SshEvent::Error(String)`, `SshEvent::Exit(u32)`.
  * **Frontend $\rightarrow$ Rust**: `send_ssh_input(session_id, data)`, `resize_ssh_pty(session_id, cols, rows)`, `disconnect_ssh(session_id)`.

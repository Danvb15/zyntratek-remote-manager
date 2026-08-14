# ESPECIFICACIÓN TÉCNICA Y ARQUITECTURA DE FASE 5 — PROTOCOLO RDP

**Proyecto**: Zyntratek Remote Manager  
**Autor**: Principal Software Engineer & Security Engineer  
**Fecha**: 13 de Agosto, 2026  

---

## 1. OBJETIVO Y ALCANCE DE LA FASE 5

Implementar la capacidad de lanzar sesiones de Escritorio Remoto RDP reales utilizando el cliente nativo de la plataforma host (`mstsc.exe` en Windows, `xfreerdp` / `xfreerdp3` en Linux/macOS) sin exponer contraseñas ni secretos en texto plano en argumentos de procesos, variables de entorno, logs, SQLite ni interfaz de usuario.

---

## 2. ANÁLISIS DE SEGURIDAD Y ESTRATEGIA POR PLATAFORMA

### 2.1 Estrategia en Windows (`mstsc.exe` + Windows Credential Manager)

#### Prohibiciones Estrictas:
* **PROHIBIDO**: Pasar `/password:...` en los argumentos de `mstsc.exe` (no soportado y altamente inseguro).
* **PROHIBIDO**: Escribir credenciales en archivos RDP temporales (`.rdp`) en disco.

#### Mecanismo de Inyección de Credenciales:
1. **Windows Credential Manager**:
   * `mstsc.exe` consulta automáticamente el almacén de credenciales de Windows buscando una entrada de tipo `CRED_TYPE_GENERIC` cuyo campo `TargetName` coincida con `TERMSRV/<host>` o `TERMSRV/<host>:<port>`.
   * Rust invoca las APIs nativas de Win32: `CredWriteW` y `CredDeleteW` (vía crate `windows-sys` o bindings Win32).

2. **Formato del `TargetName`**:
   * Se utiliza el formato único `TERMSRV/<host>:<port>` o `TERMSRV/<host>` para asegurar el desacoplamiento entre múltiples sesiones.
   * `UserName`: `<domain>\<username>` si existe dominio, o `<username>`.
   * `CredentialBlob`: El secreto UTF-16 extraído efímeramente de RAM (`SecretPayload`).

3. **Ciclo de Vida y Limpieza Garantizada (Cleanup)**:
   * **Lanzamiento de proceso**: Rust ejecuta `mstsc.exe /v:<host>:<port>` utilizando `tokio::process::Command` (lanzamiento directo de proceso, sin pasar por `cmd /c` ni PowerShell).
   * **Monitoreo de Proceso**: `RdpSessionManager` registra el `session_id`, `connection_id` y PID del proceso `mstsc.exe`.
   * **Limpieza al salir**: Al finalizar o abortar el proceso `mstsc.exe`, un listener Tokio ejecuta inmediatamente `CredDeleteW` eliminando la entrada `TERMSRV/<host>:<port>` del OS Credential Manager.
   * **Protección ante Crashes**: Al iniciar la aplicación (`lib.rs` / `run()`), `RdpSessionManager::cleanup_orphaned_credentials()` escanea y elimina cualquier credencial residual `TERMSRV/*` que pudiera haber quedado debido a un apago forzado del sistema o crash previo.

---

### 2.2 Estrategia en Linux / macOS (`xfreerdp` / `FreeRDP`)

1. **Detección de Cliente RDP**:
   * Rust verifica la existencia de `xfreerdp3` o `xfreerdp` en el `PATH` del sistema.
   * Si no se detecta ningún cliente FreeRDP, retorna `AppError::RdpError("Cliente FreeRDP (xfreerdp) no encontrado en el sistema...")`.

2. **Pasaje Seguro de Credenciales**:
   * **PROHIBIDO**: Escribir `/p:<password>` en los argumentos del proceso.
   * **Mecanismo**: Invocación de `xfreerdp /v:<host>:<port> /u:<username> /d:<domain> /from-stdin`.
   * El secreto se transmite a través del `stdin` del proceso secundario inmediatamente después del lanzamiento y se cierra la tubería `stdin`.

---

## 3. ARQUITECTURA DE COMPONENTES RUST (`src-tauri/src/protocols/rdp/`)

```
src-tauri/src/protocols/rdp/
├── mod.rs             # Exportación de tipos y RdpSessionManager
├── launcher.rs        # Trait RdpLauncher y platform adapters (Windows / Unix)
├── manager.rs         # RdpSessionManager (Gestión de ciclo de vida de sesiones RDP)
└── win_cred.rs        # Wrappers nativos CredWriteW / CredDeleteW (Windows only)
```

### Modelo de Sesión RDP (`RdpSession`):
```rust
pub struct RdpSession {
    pub id: String,
    pub connection_id: String,
    pub target_name: String,
    pub status: RdpSessionStatus, // STARTING, RUNNING, EXITED, ERROR
    pub created_at: String,
}
```

---

## 4. COMANDOS TAURI 2 IPC (`src-tauri/src/commands/rdp_cmd.rs`)

* `start_rdp_session(connection_id: String)` -> `Result<String, AppError>`
* `list_rdp_sessions()` -> `Result<Vec<RdpSessionDto>, AppError>`
* `disconnect_rdp_session(session_id: String)` -> `Result<(), AppError>`

---

## 5. REGLAS Y AUDITORÍA DE SEGURIDAD

1. **Cero Fuga de Secretos**: Ningún argumento de línea de comandos ni log de `tracing` contendrá contraseñas ni hashes.
2. **Sin Invocación de Shell**: Prohibido usar `cmd.exe /c`, `powershell.exe`, `sh -c` o `bash -c`.
3. **Persistencia Cero**: Todas las entradas temporales `TERMSRV/*` son eliminadas al cerrar `mstsc.exe` o durante la inicialización de la app.

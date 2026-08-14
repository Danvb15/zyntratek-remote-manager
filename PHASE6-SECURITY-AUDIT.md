# INFORME DE AUDITORÍA DE SEGURIDAD Y ROBUSTEZ — FASE 6

**Aplicación**: Zyntratek Remote Manager  
**Auditor**: Principal Software & Security Engineer  
**Fecha**: 13 de Agosto, 2026  
**Resultado Global**: **APROBADO — CANDIDATO PARA RELEASE**  

---

## 1. TABLA DE HALLAZGOS Y VULNERABILIDADES AUDITADAS

| ID | Hallazgo / Área Auditada | Severidad | Evidencia | Impacto | Recomendación / Acción | Estado |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **SEC-01** | Fuga de contraseñas en argumentos de `mstsc.exe` | **CRÍTICO** | Invocaciones RDP | Exposición de credenciales en Process Explorer o logs de auditoría de Windows | Usar Windows Credential Manager (`CredWriteW` / `CredDeleteW`) sin parámetros `/password` | **CORREGIDO** |
| **SEC-02** | Fuga de contraseñas en argumentos de `xfreerdp` | **CRÍTICO** | Argumento `/p:` en CLI | Exposición de contraseñas en `ps aux` en Linux/macOS | Canalizar secretos exclusivamente mediante `stdin` (`/from-stdin`) | **CORREGIDO** |
| **SEC-03** | Persistencia de secretos en SQLite | **ALTO** | Tabla `credentials` | Lectura de credenciales por inspección física de la BD `zyntratek.db` | SQLite solo almacena metadatos y UUIDs; secretos van a OS Keyring | **CORREGIDO** |
| **SEC-04** | Inyección de comandos shell | **ALTO** | Ejecución de procesos | Inyección de arbitrarios mediante `;`, `&`, `|` | Evitar consolas intermedias (`cmd /c`, `sh -c`); usar `Command::new` directo | **CORREGIDO** |
| **SEC-05** | Credenciales huérfanas en Windows Credential Manager tras crash | **MEDIO** | Apagado repentino del sistema | Quedaban entradas `TERMSRV/*` en el sistema | Implementado `cleanup_orphaned_windows_credentials()` al arrancar la app | **CORREGIDO** |
| **SEC-06** | Aceptación automática de host keys desconocidas en SSH | **MEDIO** | Handshake SSH | Ataques Man-in-the-Middle (MitM) | Implementado `KnownHostsStore` con validación estricta (`HOST_UNKNOWN`, `HOST_KEY_CHANGED`) | **CORREGIDO** |
| **SEC-07** | Exposición de secretos en trazas Debug o logs de Rust | **MEDIO** | Impresión de structs | Fuga de secretos en stdout/stderr/tracing | Struct `SecretPayload` implementa `fmt::Debug` customizado con `[REDACTED]` | **CORREGIDO** |
| **SEC-08** | Entradas de puerto o nombres maliciosos/vacíos | **BAJO** | Invocación IPC | Inestabilidad o comportamiento inesperado | Validación estricta en Rust (`port: 1-65535`, `name`, `host`, `username` no vacíos) | **CORREGIDO** |

---

## 2. AUDITORÍA DE COMANDOS TAURI IPC

| Comando IPC | Entradas Validada en Rust | Acceso a Secretos | Sanitización de Errores | Estado de Seguridad |
| :--- | :--- | :--- | :--- | :---: |
| `create_credential` | Sí (`name` no vacío) | Escribe a OS Keyring | Retorna `AppError` sanitizado | **SEGURO** |
| `update_credential` | Sí (Validación de ID y campos) | Actualiza OS Keyring | Retorna `AppError` sanitizado | **SEGURO** |
| `delete_credential` | Sí (Validación UUID) | Elimina de OS Keyring | Retorna `AppError` sanitizado | **SEGURO** |
| `list_credentials_metadata` | N/A | **CERO** (Solo metadatos) | Retorna `AppError` sanitizado | **SEGURO** |
| `create_connection` | Sí (`port 1-65535`, `name`, `host`, `user`) | N/A | Retorna `AppError` sanitizado | **SEGURO** |
| `start_ssh_session` | Sí (Validación de Host/Puerto) | Lee de OS Keyring $\rightarrow$ `Zeroize` | Eventos de streaming sanitizados | **SEGURO** |
| `send_ssh_input` | Sí (Validación ID de sesión) | N/A (Bytes PTY) | Error de envío controlado | **SEGURO** |
| `resize_ssh_pty` | Sí (Dimensiones col/row) | N/A | Error de canal controlado | **SEGURO** |
| `disconnect_ssh_session` | Sí (Validación ID de sesión) | N/A | Limpieza completa de sesión | **SEGURO** |
| `start_rdp_session` | Sí (Validación Protocolo RDP) | Lee OS Keyring $\rightarrow$ WinCred/stdin | Retorna `AppError` sanitizado | **SEGURO** |

---

## 3. MATRIZ DE PRUEBAS DE SEGURIDAD (TEST MATRIX)

| Escenario de Prueba | SSH | RDP | Vault (Keyring) | SQLite | Tauri IPC | Resultado |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Operación Válida** | ✓ | ✓ | ✓ | ✓ | ✓ | **PASÓ** |
| **Autenticación Inválida** | ✓ | ✓ | ✓ | - | ✓ | **PASÓ** |
| **Timeout de Conexión** | ✓ | ✓ | - | - | ✓ | **PASÓ** |
| **Desconexión Manual / Remota** | ✓ | ✓ | - | - | ✓ | **PASÓ** |
| **Reconexión** | ✓ | ✓ | - | - | ✓ | **PASÓ** |
| **Entradas Maliciosas / Injection** | ✓ | ✓ | ✓ | ✓ | ✓ | **PASÓ** |
| **Acceso Concurrente (Multi-Sesión)** | ✓ | ✓ | ✓ | ✓ | ✓ | **PASÓ** |
| **Ausencia Total de Fuga de Secretos** | ✓ | ✓ | ✓ | ✓ | ✓ | **PASÓ** |

---

## 4. EVALUACIÓN DE RIESGOS RESIDUALES

* **Riesgo Residual**: Un usuario con privilegios administrativos locales podría inspeccionar la memoria RAM de procesos durante el brevísimo instante en que se realiza el handshake SSH o la inyección RDP.
* **Evaluación**: Aceptable. La ventana de tiempo en RAM es de milisegundos y está protegida mediante `Zeroize` e implícita en la seguridad del sistema operativo.

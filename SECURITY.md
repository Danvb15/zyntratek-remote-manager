# POLÍTICA DE SEGURIDAD Y ARQUITECTURA DE CUSTODIA

**Proyecto**: Zyntratek Remote Manager  
**Última actualización**: 13 de Agosto, 2026  

---

## 1. MODELO DE AMENAZAS (THREAT MODEL)

Zyntratek Remote Manager está diseñado bajo el principio de **Mínimo Privilegio y Aislamiento de Secretos**.

### Amenazas Consideradas y Mitigaciones:
1. **Inspección de Archivos SQLite / Data Leaks en Disco**:
   * *Riesgo*: Un atacante con acceso al sistema de archivos local podría leer la base de datos `zyntratek.db`.
   * *Mitigación*: La base de datos SQLite almacena **ÚNICAMENTE METADATOS** (nombres, IPs, puertos, referencias UUID). Está estrictamente prohibido guardar contraseñas, claves privadas SSH, passphrases o tokens en SQLite.
2. **Inyección de Secretos por IPC o Trazas de Log**:
   * *Riesgo*: Fuga accidental de credenciales en logs de consola, trazas `tracing`, `console.log` o respuestas Tauri IPC.
   * *Mitigación*:
     * Los DTOs expuestos al frontend no contienen campos de contraseña.
     * `SecretPayload` implementa una derivación customizada de `std::fmt::Debug` que imprime siempre `[REDACTED]`.
     * `AppError` sanitiza las respuestas omitiendo stack traces o información interna.
3. **Inyección de Comandos en Línea de Argumentos de Procesos**:
   * *Riesgo*: Fuga de secretos o inyección de comandos shell al lanzar clientes externos como `mstsc.exe` o `xfreerdp`.
   * *Mitigación*:
     * En Windows (`mstsc.exe`), el secreto se inyecta temporalmente en Windows Credential Manager (`CredWriteW`) bajo la clave `TERMSRV/<host>`. **NUNCA** se pasa `/password:` en los argumentos.
     * En Linux/macOS (`xfreerdp`), los secretos se canalizan directamente a través de la tubería `stdin` (`/from-stdin`). **NUNCA** se utiliza `/p:`.
     * Todos los procesos secundarios son ejecutados mediante APIs estructuradas (`Command::new`), sin hacer uso de consolas intermedias (`cmd.exe /c`, `powershell`, `sh -c`).
4. **Modificación Maliciosa de Host Keys SSH (Man-in-the-Middle)**:
   * *Riesgo*: Un atacante suplanta un servidor SSH remoto.
   * *Mitigación*: Verificación estricta en `KnownHostsStore` clasificando en `HOST_VERIFIED`, `HOST_UNKNOWN` y `HOST_KEY_CHANGED`. Los cambios de clave detienen la conexión inmediatamente.

---

## 2. ARQUITECTURA DE CUSTODIA Y CICLO DE VIDA DE SECRETOS

```
    React Frontend (Metadata UI)
                │
                │ IPC (Solo connection_id UUID)
                ▼
      Rust Core Engine
                │
                ├────────► SQLite (Lee metadatos e ID de credencial)
                │
                └────────► OS Keyring (Windows CredManager / Keychain / SecretService)
                                │
                                ▼
                       SecretPayload (RAM)
                                │
                                ├──► Zeroize implícito/explícito (Drop)
                                └──► Destrucción segura en RAM
```

* **Frontend**: Cero almacenamiento persistente o en estado global de secretos.
* **Rust Backend**: Mantiene el secreto en memoria únicamente durante el instante de autenticación SSH o inyección RDP, liberándolo de inmediato mediante `zeroize`.
* **OS Keyring**: Es la única entidad responsable del almacenamiento seguro y cifrado en reposo de las credenciales del usuario.

---

## 3. NOTIFICACIÓN DE VULNERABILIDADES

Para reportar problemas de seguridad o hallazgos técnicos en Zyntratek Remote Manager, por favor contactar directamente al equipo de Ingeniería de Seguridad de Zyntratek.

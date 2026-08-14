# DOCUMENTACIÓN Y POLÍTICA DE RELEASE

**Zyntratek Remote Manager v1.0.0**

---

## 1. ESTRATEGIA DE VERSIONADO (SEMANTIC VERSIONING)

Zyntratek Remote Manager sigue la especificación de **Semantic Versioning 2.0.0 (`MAJOR.MINOR.PATCH`)**:

* **MAJOR**: Cambios incompatibles en la API IPC, esquema de base de datos o arquitectura de custodia de credenciales.
* **MINOR**: Incorporación de nuevas funcionalidades (ej. nuevos protocolos, SFTP, agrupaciones) manteniendo compatibilidad hacia atrás.
* **PATCH**: Corrección de errores de software, parches de seguridad y ajustes menores de UI/UX.

Todos los componentes del sistema (`package.json`, `Cargo.toml` y `tauri.conf.json`) deben mantener **sincronización estricta** con el número de versión.

---

## 2. POLÍTICA DE FIRMA DE CÓDIGO (CODE SIGNING)

> [!IMPORTANT]  
> **Aviso Obligatorio de Producción**: `SIGNING REQUIRED BEFORE PUBLIC RELEASE`  
> Ningún binario de distribución pública debe ser publicado sin las firmas digitales correspondientes.

### Requisitos por Plataforma:
1. **Windows**:
   * Certificado Authenticode de firma de código (archivo `.pfx` o token HSM) integrado en el proceso de empaquetado NSIS/MSI.
2. **macOS**:
   * Certificado Developer ID Application emitido por Apple + Notarización automatizada mediante `xcrun notarytool`.
3. **Linux**:
   * Firmado GPG de archivos `SHA256SUMS.txt` e integridad de repositorios APT/AppImage.

---

## 3. POLÍTICA DE ACTUALIZACIÓN Y DESINSTALACIÓN (UPGRADES & UNINSTALL)

### A. Preservación de Datos de Usuario durante Actualización (Upgrade)
* Las actualizaciones de versión **NO** modifican ni eliminan la base de datos SQLite (`zyntratek.db`) ni el almacén de credenciales del sistema operativo (**OS Keyring**).
* Las migraciones de SQLite se aplican automáticamente de forma aditiva y segura al iniciar el nuevo binario.

### B. Desinstalación (Uninstall)
* La desinstalación elimina únicamente los archivos ejecutables y librerías de la aplicación.
* Los metadatos de usuario (`zyntratek.db`) y los secretos custodiados en el OS Keyring son preservados independientemente para evitar la pérdida accidental de credenciales del usuario.

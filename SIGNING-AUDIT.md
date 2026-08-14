# INFORME AUDITORÍA DEL PROCESO DE FIRMA DE CÓDIGO (SIGNING AUDIT)

**Aplicación**: Zyntratek Remote Manager  
**Versión Auditada**: `1.0.0` (Release Candidate)  
**Fecha de Auditoría**: 13 de Agosto, 2026  
**Estado Global**: **PREPARADO TÉCNICAMENTE — PENDIENTE DE CARGA DE SECRETOS**  

---

## 1. WINDOWS CODE SIGNING (AUTHENTICODE)

### A. Estado Actual
* **Estado**: `PENDING — CODE SIGNING`
* **Instaladores Afectados**: `Zyntratek Remote Manager_1.0.0_x64-setup.exe` (NSIS), `Zyntratek Remote Manager_1.0.0_x64_en-US.msi` (MSI) y el ejecutable principal `zyntratek-remote-manager.exe`.

### B. Certificado Requerido
* **Tipo**: Certificado de Firma de Código Authenticode de Windows (Standard OV Code Signing o EV Code Signing).
* **Formato de Entrega**: Archivo `.pfx` o `.p12` conteniendo la clave privada y la cadena completa de autoridades emisoras (CA Intermedia y Raíz).
* **Preparación**: Convertir el archivo `.pfx` a una cadena Base64 limpia en PowerShell:
  ```powershell
  [Convert]::ToBase64String([System.IO.File]::ReadAllBytes(".\Zyntratek_Authenticode_Cert.pfx")) | Set-Content -Path ".\cert_base64.txt"
  ```

### C. Secretos de GitHub Actions Requeridos
En la configuración del repositorio GitHub (**Settings -> Secrets and variables -> Actions**):
1. `WINDOWS_CERTIFICATE`: El contenido completo en texto Base64 generado desde el archivo `.pfx`.
2. `WINDOWS_CERTIFICATE_PASSWORD`: La contraseña asignada al archivo `.pfx`.

### D. Flujo de Firma en Tauri 2 & CI/CD
1. `tauri-action` decodifica dinámicamente `WINDOWS_CERTIFICATE` en el runner de Windows.
2. Firma automáticamente:
   - El ejecutable binario `zyntratek-remote-manager.exe`.
   - El archivo empaquetado `.msi` generado vía WiX Toolset (`candle`/`light`).
   - El archivo instalador ejecutable `.exe` generado vía NSIS (`makensis`).
3. Estampa de tiempo (Timestamping RFC 3161): Se utiliza automáticamente el servidor de tiempo de DigiCert (`http://timestamp.digicert.com`).

### E. Procedimiento de Verificación de Firma en Windows
Una vez generado y firmado el instalador, ejecute los siguientes comandos en PowerShell para verificar la validez de la firma digital:

```powershell
# 1. Verificar firma del instalador NSIS
Get-AuthenticodeSignature -FilePath ".\Zyntratek Remote Manager_1.0.0_x64-setup.exe" | Format-List

# 2. Verificar firma del instalador MSI
Get-AuthenticodeSignature -FilePath ".\Zyntratek Remote Manager_1.0.0_x64_en-US.msi" | Format-List

# 3. Verificación avanzada mediante SignTool de Windows SDK
signtool verify /v /pa /tr http://timestamp.digicert.com ".\Zyntratek Remote Manager_1.0.0_x64-setup.exe"
```

**Resultado Esperado de Verificación Valida**:
* `Status`: `Valid`
* `StatusMessage`: `Signature verified.`
* `SignerCertificate`: `CN=Zyntratek Inc`
* `IsOSBinary`: `False`
* `TimeStampingCertificate`: `DigiCert Timestamp Responder`

---

## 2. MACOS CODE SIGNING & NOTARIZATION

### A. Estado Actual
* **Estado**: `PENDING — CODE SIGNING & NOTARIZATION`
* **Artefacto Afectado**: `Zyntratek-Remote-Manager-1.0.0.dmg` y paquete `.app`.

### B. Credenciales de Apple Requeridas
1. **Certificado Developer ID Application**: Certificado exportado desde Xcode / Apple Developer Portal en formato `.p12`.
2. **Apple ID**: Correo electrónico asociado a la cuenta de desarrollador de Apple.
3. **App-Specific Password**: Contraseña de aplicación generada en `appleid.apple.com`.
4. **Team ID**: Código alfanumérico de 10 caracteres identificador del equipo en Apple Developer Account.

### C. Secretos de GitHub Actions Requeridos
En **Settings -> Secrets and variables -> Actions**:
1. `APPLE_CERTIFICATE`: Base64 del archivo `.p12` del certificado Developer ID Application.
2. `APPLE_CERTIFICATE_PASSWORD`: Contraseña del archivo `.p12`.
3. `APPLE_SIGNING_IDENTITY`: Identidad exacta (ej. `"Developer ID Application: Zyntratek Inc (XXXXXXXXXX)"`).
4. `APPLE_ID`: Correo de la cuenta Apple Developer.
5. `APPLE_PASSWORD`: App-specific password de Apple.
6. `APPLE_TEAM_ID`: ID del equipo de Apple.

### D. Procedimiento de Notarización
1. `tauri-action` firma el paquete `.app` y la imagen `.dmg`.
2. Envía el paquete al servicio de notarización de Apple mediante `xcrun notarytool submit`.
3. Una vez aprobada por Apple, adjudica la marca mediante `xcrun stapler staple`.

---

## 3. AUDITORÍA DEL WORKFLOW `.github/workflows/release.yml`

### ¿Está el workflow técnicamente preparado para recibir los secretos?
**SÍ**. Se ha actualizado el archivo `.github/workflows/release.yml` exponiendo todas las variables de entorno de firma (`WINDOWS_CERTIFICATE`, `WINDOWS_CERTIFICATE_PASSWORD`, `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`) directamente hacia la acción `tauri-apps/tauri-action@v0`.

Cuando los secretos sean agregados en el repositorio de GitHub, la firma y notarización se ejecutarán de forma completamente transparente sin necesidad de alterar el código del repositorio.

### ¿Hay errores actuales en `release.yml`?
**NO**. El pipeline de GitHub Actions está limpio, valida tipos (`typecheck`), lints (`eslint`), tests de frontend (`vitest`) y tests de Rust (`cargo test`) antes de intentar el empaquetado.

### ¿Hay algo que deba modificarse antes de adquirir o configurar certificados?
**NO**. El proyecto `tauri.conf.json`, manifiestos `Cargo.toml`/`package.json` y el pipeline de CI/CD están **100% listos y aprobados**.

---

## REGLA DE DETENCIÓN CUMPLIDA

Se ha completado la auditoría del proceso de firma de código.  
* **Sin publicación automática**.
* **Sin creación de tags**.
* **Sin modificación de versión**.

# GUÍA DE SOLUCIÓN DE PROBLEMAS (TROUBLESHOOTING)

**Zyntratek Remote Manager v1.0.0**

---

## 1. PROBLEMAS DE CONEXIÓN SSH

### A. Fallo de Verificación `HOST_KEY_CHANGED` (Advertencia de Seguridad)
* **Síntoma**: La terminal muestra un error indicando que la clave pública del servidor remoto ha cambiado.
* **Causa**: El servidor SSH fue reinstalado, cambió sus claves de host o existe un ataque de suplantación Man-in-the-Middle (MitM).
* **Solución**:
  1. Verifique con el administrador de red la autenticidad de la nueva clave pública.
  2. Para aceptar la nueva clave, edite el archivo `known_hosts` ubicado en la carpeta de datos de usuario de Zyntratek Remote Manager:
     * Windows: `%APPDATA%\zyntratek-remote-manager\known_hosts`
     * Linux: `~/.config/zyntratek-remote-manager/known_hosts`
     * macOS: `~/Library/Application Support/zyntratek-remote-manager/known_hosts`
  3. Elimine la línea correspondiente a la IP/host afectado y reconéctese.

### B. Error de Autenticación ("Autenticación SSH rechazada por el servidor")
* **Síntoma**: La sesión no logra conectar y muestra estado `ERROR`.
* **Solución**:
  1. Ingrese a la sección **Vault** y confirme que la credencial registrada tenga la contraseña o clave privada correcta.
  2. Si utiliza clave privada SSH, asegúrese de que el formato sea OpenSSH válido (comenzando con `-----BEGIN OPENSSH PRIVATE KEY-----` o `-----BEGIN RSA PRIVATE KEY-----`).

---

## 2. PROBLEMAS DE CONEXIÓN RDP

### A. "Cliente RDP no encontrado" (Linux / macOS)
* **Síntoma**: Al intentar conectar una sesión RDP en Linux o macOS, aparece el mensaje `Cliente FreeRDP (xfreerdp) no encontrado en el sistema`.
* **Causa**: El paquete `freerdp2-x11` / `freerdp` / `xfreerdp` no está instalado en el sistema operativo.
* **Solución**:
  * **Ubuntu / Debian**: `sudo apt install freerdp2-x11` o `sudo apt install freerdp3-x11`
  * **Fedora / RHEL**: `sudo dnf install freerdp`
  * **macOS (Homebrew)**: `brew install freerdp`

### B. El cliente RDP de Windows (`mstsc.exe`) no inicia la sesión automáticamente
* **Síntoma**: Se abre la ventana de `mstsc.exe` pero solicita nuevamente la contraseña.
* **Solución**:
  1. Abra el Administrador de Credenciales de Windows (`control /name Microsoft.CredentialManager`).
  2. Verifique en **Credenciales de Windows** que la política de su grupo permita guardar credenciales genéricas para destinos `TERMSRV/*`.

---

## 3. PROBLEMAS DEL ALMACÉN NATIVO (OS KEYRING)

### A. Error al guardar o leer credenciales en Linux
* **Síntoma**: Falla con mensaje `Vault error: SecretService / D-Bus unavailable`.
* **Causa**: El demonio `gnome-keyring` o `kwallet` no está desbloqueado en la sesión de escritorio.
* **Solución**: Instale y ejecute `gnome-keyring` o configure `libsecret-1-dev`.

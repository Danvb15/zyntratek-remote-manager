# GUÍA DE INSTALACIÓN — ZYNTRATEK REMOTE MANAGER

**Versión**: `1.0.0`

---

## 1. REQUISITOS DEL SISTEMA

* **Windows**: Windows 10 u 11 (64-bit).
* **Linux**: Ubuntu 22.04 LTS o superior, Debian 11+, Fedora 38+ (64-bit).
* **macOS**: macOS 12 Monterey o superior (Intel o Apple Silicon ARM64).

---

## 2. INSTALACIÓN EN WINDOWS

### Opción A: Instalador Interactivo NSIS (`.exe`)
1. Descargue `Zyntratek Remote Manager_1.0.0_x64-setup.exe`.
2. Haga doble clic sobre el archivo ejecutable.
3. Siga las instrucciones del asistente de instalación (instala la aplicación en `%LOCALAPPDATA%\Programs\zyntratek-remote-manager`).
4. Inicie la aplicación desde el Menú Inicio o el acceso directo del Escritorio.

### Opción B: Paquete de Instalación MSI (`.msi`)
1. Descargue `Zyntratek Remote Manager_1.0.0_x64_en-US.msi`.
2. Inicie la instalación mediante el instalador de Windows.
3. Útil para despliegues corporativos centralizados (Active Directory / GPO).

---

## 3. INSTALACIÓN EN LINUX

### Opción A: Paquete Portable AppImage
```bash
# Otorgar permisos de ejecución
chmod +x Zyntratek-Remote-Manager-1.0.0-x86_64.AppImage

# Ejecutar la aplicación
./Zyntratek-Remote-Manager-1.0.0-x86_64.AppImage
```

### Opción B: Paquete Debian (`.deb`)
```bash
sudo dpkg -i zyntratek-remote-manager_1.0.0_amd64.deb
sudo apt-get install -f
```

---

## 4. POLÍTICA DE DATOS DE USUARIO EN DESINSTALACIÓN

* **Ubicación de Base de Datos SQLite**: `%APPDATA%\zyntratek-remote-manager\zyntratek.db` (Windows) / `~/.config/zyntratek-remote-manager/zyntratek.db` (Linux).
* **Ubicación de Credenciales**: Windows Credential Manager / Linux SecretService.
* **Desinstalación**: Al desinstalar la aplicación, la base de datos SQLite y las credenciales custodiadas en el OS Keyring **NO SE ELIMINAN ACCIDENTALMENTE**, permitiendo actualizar a futuras versiones conservando íntegros los datos del usuario.

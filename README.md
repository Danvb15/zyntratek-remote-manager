# Zyntratek Remote Manager

[![Release Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](RELEASE.md)
[![Security Status](https://img.shields.io/badge/security-hardened-emerald.svg)](SECURITY.md)
[![License](https://img.shields.io/badge/license-Proprietary-slate.svg)](#)

**Zyntratek Remote Manager** es una aplicación de escritorio profesional de alto rendimiento diseñada para la administración centralizada y custodia segura de conexiones remotas **SSH** y **RDP**.

Inspirada en herramientas consolidadas como Windows Remote Desktop Connection, MobaXterm y Royal TS, Zyntratek Remote Manager destaca por su arquitectura propia de aislamiento de secretos, garantizando que **ninguna contraseña ni clave privada sea almacenada en texto plano ni en la base de datos**.

---

## 🔒 ARQUITECTURA DE SEGURIDAD Y CUSTODIA NATIVA

* **Custodia en OS Keyring**: Las contraseñas, passphrases y claves privadas SSH son custodiadas exclusivamente en el almacén seguro nativo del sistema operativo (Windows Credential Manager / macOS Keychain / Linux SecretService).
* **SQLite Solo Metadatos**: La base de datos SQLite almacena únicamente metadatos (nombres, IPs, puertos, referencias UUID y etiquetas).
* **Cero Fuga en Argumentos de Procesos**:
  * **Windows RDP (`mstsc.exe`)**: Inyección de credenciales genéricas mediante `CredWriteW` bajo la clave `TERMSRV/<host>` con eliminación inmediata (`CredDeleteW`) al terminar la sesión. Nunca se pasa `/password:` en CLI.
  * **Linux/macOS RDP (`xfreerdp`)**: Transmisión del secreto a través de `stdin` (`/from-stdin`). Nunca se utiliza `/p:`.
* **Memoria Protegida (`Zeroize`)**: Todos los payloads de secretos en memoria RAM de Rust implementan `Zeroize` y `ZeroizeOnDrop`, destruyendo la memoria inmediatamente tras el handshake de autenticación.

---

## ✨ CARACTERÍSTICAS PRINCIPALES

* **Protocolo SSH NATIVO**:
  * Motor asíncrono Rust sobre `russh`.
  * Autenticación por Contraseña y Clave Privada (OpenSSH).
  * PTY interactivo (`xterm-256color`) con shell dinámico (`bash`, `zsh`, `sh`).
  * Terminal gráfica integrada con `@xterm/xterm` y `@xterm/addon-fit`.
  * Verificación estricta de host keys (`known_hosts`) con prevención de ataques MitM.
* **Protocolo RDP NATIVO**:
  * Lanzamiento directo de `mstsc.exe` en Windows y `FreeRDP` en Linux/macOS.
  * Monitoreo de procesos y purga automática de credenciales huérfanas al iniciar el sistema.
* **Gestión de Conexiones y Vault**:
  * Organización en carpetas jerárquicas y etiquetas personalizables con colores.
  * Buscador global rápido con atajo `Cmd+K` / `Ctrl+K` y creación rápida `Cmd+N` / `Ctrl+N`.
  * Modo Favoritos ⭐ e indicadores visuales de estado.

---

## 🚀 INSTALACIÓN Y COMPILACIÓN

### Requisitos Previos:
* Node.js v20+
* Rust Stable (v1.75+)
* Tauri CLI v2 (`npm install -g @tauri-apps/cli@latest`)

### Compilación para Desarrollo:
```bash
# Instalar dependencias del frontend
npm install

# Iniciar servidor de desarrollo Tauri + Vite
npm run tauri dev
```

### Compilación para Producción:
```bash
# Compilar paquete binario de producción
npm run tauri build
```

---

## 🛠️ PLATAFORMAS SOPORTADAS

| Plataforma | Soporte RDP Nativo | Soporte SSH Nativo | OS Keyring |
| :--- | :---: | :---: | :---: |
| **Windows 10 / 11** | `mstsc.exe` (WinCred) | `russh` + `xterm.js` | Windows Credential Manager |
| **Linux (Ubuntu/Fedora)** | `xfreerdp` (stdin) | `russh` + `xterm.js` | SecretService / KWallet |
| **macOS (Intel / Apple Silicon)** | `FreeRDP` | `russh` + `xterm.js` | macOS Keychain |

---

## 📄 DOCUMENTACIÓN DE REFERENCIA

* [`SECURITY.md`](file:///c:/Users/danie/Documents/zyntratek-remote-manager/SECURITY.md): Política de seguridad y modelo de amenazas.
* [`RELEASE.md`](file:///c:/Users/danie/Documents/zyntratek-remote-manager/RELEASE.md): Política de lanzamientos, firmas de código y versionado.
* [`TROUBLESHOOTING.md`](file:///c:/Users/danie/Documents/zyntratek-remote-manager/TROUBLESHOOTING.md): Guía de solución de problemas frecuentes.

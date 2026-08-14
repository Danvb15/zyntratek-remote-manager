# PLAN DE IMPLEMENTACIÓN Y RELEASE — FASE 7

**Proyecto**: Zyntratek Remote Manager  
**Versión Objetivo**: `1.0.0` (Semantic Versioning)  
**Autor**: Principal Software Engineer & Release Engineer  
**Fecha**: 13 de Agosto, 2026  

---

## 1. OBJETIVO Y ESTRATEGIA DE RELEASE

Convertir Zyntratek Remote Manager en un paquete de software ejecutable y distribuible profesionalmente en plataformas de escritorio (Windows, Linux y macOS) manteniendo la integridad de la arquitectura de custodia de credenciales y la seguridad del sistema local.

### Principios Fundamentales:
* **Cero Modificación Funcional**: No se alterará la lógica interna de SSH, RDP, SQLite u OS Keyring desarrollada en las Fases 1 a 6.
* **Alineación de Versiones**: Sincronización estricta de la versión `1.0.0` en `package.json`, `src-tauri/Cargo.toml` y `src-tauri/tauri.conf.json`.
* **Empaquetado Multi-Plataforma**:
  * **Windows**: Instalador ejecutable nativo NSIS (`.exe`) e instalador `.msi`.
  * **Linux**: Paquetes portables `.AppImage` y Debian `.deb`.
  * **macOS**: Formato `.dmg` (Arquitectura documentada; ejecutable en CI/CD).
* **Firma de Código (Code Signing)**:
  * Marcado con el aviso obligatorio `SIGNING REQUIRED BEFORE PUBLIC RELEASE`. Cero claves en Git.

---

## 2. METADATOS Y VERSIONADO REVISADO

* **Product Name**: `Zyntratek Remote Manager`
* **Bundle Identifier**: `com.zyntratek.remote-manager`
* **Semantic Versioning**: `1.0.0`
* **Publisher / Author**: `Zyntratek`

---

## 3. ENTREGABLES DE DOCUMENTACIÓN DE RELEASE

1. `.github/workflows/release.yml`: Workflow automatizado de GitHub Actions para compilación en matriz (Windows, Linux, macOS).
2. `RELEASE.md`: Guía de procedimiento de lanzamiento, versionado y política de firmas.
3. `TROUBLESHOOTING.md`: Guía de solución de problemas de instalación, OS Keyring, SSH y RDP.
4. `README.md`: Documentación principal de producto actualizada para producción.
5. `SHA256SUMS.txt`: Checksums criptográficos SHA-256 de los artefactos generados.
6. `PHASE7-STATUS.md`: Informe final de la Fase 7.

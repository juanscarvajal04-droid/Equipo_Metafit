---
tags: [oracle, vps, dokploy, infraestructura, despliegue]
created: 2026-09-22
updated: 2026-09-22
---

# ☁️ VPS Oracle Cloud — MetaFit

> Instancia **Always Free** de Oracle Cloud donde vive la **base de datos de producción**
> (`metafit`), administrada por Dokploy. Detalles de despliegue atendidos en
> `../manual_despliegue.md`.

---

## 📋 Datos de la instancia

| Recurso | Valor |
|---|---|
| **IP pública** | `141.148.94.173` |
| **Región** | US East (Ashburn) - AD-2 |
| **Shape** | VM.Standard.A1.Flex (4 OCPU / 24 GB RAM - Always Free) |
| **Imagen** | Oracle Linux 9 (aarch64/ARM) |
| **Usuario SSH** | `opc` |
| **Puerto SSH** | `22` |

---

## 🔐 Acceso SSH

Desde **Windows 11 (PowerShell)**:

```powershell
ssh -i C:\ruta\a\metafit_ssh.key opc@141.148.94.173
```

> ⚠️ **La llave privada (`metafit_ssh.key`) NO se comparte nunca**: ni en el repositorio, ni
> en Discord, ni por correo. Si se filtra, hay que **regenerarla** en el panel de Oracle y
> eliminar la anterior. Ver [[Seguridad]].

---

## 🐳 Dokploy (PaaS auto-alojado)

- **Panel**: http://141.148.94.173:3000
- **Qué es**: Dokploy es un **PaaS auto-alojado** (open source) para desplegar aplicaciones y
  bases de datos con **Docker Compose**, incluyendo logs, backups y dominios.
- **Por qué lo usamos**: administramos nuestra propia **MySQL 8 de producción** en el VPS sin
  pagar servicios de BD administrados, y con una interfaz web integrada al mismo servidor.
- Nota completa: [[Dokploy]]

---

## 🗄️ MySQL en el VPS

| Recurso | Valor |
|---|---|
| **Host** | `141.148.94.173:3306` |
| **Usuario** | `metafit` |
| **Contraseña** | `Admin123!` |
| **Base de datos** | `metafit` |

> Es la base usada por el backend de producción. Esquema completo en [[Base de datos MySQL]].

---

## 🌐 Puertos abiertos

| Puerto | Servicio |
|---|---|
| 22 | SSH (usuario `opc`) |
| 80 | HTTP |
| 443 | HTTPS |
| 3000 | Panel **Dokploy** |
| 3306 | **MySQL** (producción) |
| 8978 | CloudBeaver (cliente BD web — futuro) |

### Cómo agregar más puertos en Oracle Cloud (Security List)

1. Consola OCI → *Networking → Virtual Cloud Networks* → la VCN del VPS.
2. *Security Lists* → la lista activa → **Add Ingress Rules**.
3. Configurar: `Source = 0.0.0.0/0`, `IP Protocol = TCP`, `Destination Port = <puerto>`.
4. Si además hay firewall en el sistema (firewalld/UFW), abrir el mismo puerto dentro del SO.

---

## 🔗 Enlaces relacionados

- [[Dokploy]]
- [[Cloudinary]]
- [[Render]]
- [[Base de datos MySQL]]
- [[Infraestructura]]

---

## ⚠️ Troubleshooting

| Error | Solución |
|---|---|
| **Out of capacity** al crear el VPS | La capa Always Free tiene capacidad limitada. Si aparece este error, **pasar la cuenta a Pay As You Go** (manteniendo las instancias en Always Free) para prioridad de recursos |
| **Permission denied (publickey)** en SSH | La llave `.key` debe tener permisos restringidos: `icacls` en Windows o `chmod 600` en Linux/Mac; confirmar que se usa la llave correcta (`-i`) |
| **This script must be run as root** | La sesión SSH entra como `opc`; anteponer `sudo`: `sudo bash script.sh` |
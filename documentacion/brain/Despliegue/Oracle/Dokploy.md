---
tags: [dokploy, paas, docker, despliegue]
created: 2026-09-22
updated: 2026-09-22
---

# 🐳 Dokploy — PaaS auto-alojado

> Panel de despliegues y bases de datos corriendo en el **VPS de Oracle Cloud**.
> Alternativa **open source** a Railway / Render / Heroku, pero auto-alojada.

---

## ¿Qué es Dokploy?

Dokploy es una plataforma como servicio (PaaS) **auto-alojada** que permite:

- Desplegar aplicaciones con **Docker / Docker Compose** desde Git o registry.
- Administrar **bases de datos** (MySQL, Postgres, MariaDB…) con **backups**.
- Ver **logs en tiempo real**, monitoreo de recursos y configurar dominios/HTTPS.
- Todo dentro de **nuestra propia infraestructura**, sin costo mensual de plataforma.

Es la alternativa open source usada para gestionar el MySQL 8 de producción en lugar de
depender de un servicio de BD administrado.

---

## 📍 Panel

| Recurso | Valor |
|---|---|
| **URL** | http://141.148.94.173:3000 |
| **Acceso** | Login con el email y contraseña configurados por el usuario administrador |
| **Instalación** | Docker manual en el VPS + **script oficial** de instalación de Dokploy |

---

## 🗃️ Servicios corriendo actualmente

| Servicio | Estado | Notas |
|---|---|---|
| **MySQL `metafit-db`** | ✅ Activo | MySQL 8 · base `metafit` · usuario `metafit` en `141.148.94.173:3306` |
| **CloudBeaver** | ⏳ Futuro | Cliente web de BD; se montará en el puerto `8978` cuando se agregue |

---

## 🔑 API Key de Dokploy

- Dokploy genera una **API key** para automatizar despliegues (Panel → Settings).
- El valor completo **no se escribe aquí ni en el repositorio**: solo se referencia en
  [[Seguridad]] como credencial a rotar. **Nunca compartirla.**

---

## 🔗 Enlaces

- [[VPS Oracle Cloud]]
- [[Base de datos MySQL]]
- [[Seguridad]]
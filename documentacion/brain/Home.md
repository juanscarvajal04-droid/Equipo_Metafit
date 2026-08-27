# 🧠 MetaFit — Segundo Cerebro

> **Sistema de Gestión Deportiva** para *Sport Gym Sede 80* — Bogotá, Colombia
> Líder técnico: Juan Sebastian Carvajal | Versión 2.0

---

## 🏠 Navegación Rápida

### 📋 Proyecto
- [[Visión general]] — Qué es MetaFit, alcance y stack tecnológico
- [[Historias de usuario]] — Roles, funcionalidades y flujos
- [[Roadmap]] — Fases de desarrollo y próximos pasos

### 🏗️ Arquitectura
- [[Diagrama general]] — Visión de los 4 componentes del sistema
- [[Backend Node.js]] — Express, middlewares, estructura de carpetas
- [[Frontend React]] — Vite, RBAC, componentes, estilos
- [[App Móvil React Native]] — Expo, navegación, pantallas
- [[Base de datos MySQL]] — 17 tablas, 5 vistas, esquema completo

### 🔌 APIs
- [[Autenticación]] — Login, JWT, recuperación de contraseña
- [[Afiliados]] — CRUD, ciclos, progreso, restricciones, seguimiento diario
- [[Pagos]] — Registro, facturación por correo, métricas admin
- [[PlanEntrenamiento y Nutrición|Planes]] — Planes de entrenamiento, rutinas, dietas
- [[Notificaciones]] — Push notifications y notificaciones por rol

### 🚀 Despliegue
- [[Render]] — Backend en Render.com con Docker
- [[Railway]] — Base de datos MySQL en Railway
- [[Brevo]] — Envío de correos transaccionales
- [[Cloudinary]] — Almacenamiento de fotos de perfil
- [[CI-CD]] — GitHub Actions con 74 tests
- [[n8n]] — Automatización: Telegram, Google Sheets, recordatorios

### 🐛 Bugs y Soluciones
- [[Historial de bugs]] — Bugs documentados y cómo se resolvieron
- [[Lecciones aprendidas]] — Mejores prácticas descubiertas

### 📖 Manuales
- [[ManualTécnico|Técnico]] — Arquitectura, seguridad, endpoints
- [[ManualUsuario|Usuario]] — Guías por rol (Admin, Entrenador, Recepcionista, Afiliado)
- [[ManualPostman|Postman]] — Colecciones y uso de la API

### 🎨 Diseño
- [[Paleta de colores]] — Tokens de color dark/light, roles, marca
- [[Tokens CSS]] — Variables CSS del design system
- [[Favicon e iconos]] — Assets gráficos y branding

### 🔗 Enlaces
- [[Enlaces útiles]] — URLs, repositorios, herramientas

---

## 📊 Resumen del Proyecto

| Componente | Tecnología | Puerto |
|---|---|---|
| Backend | Node.js + Express | 3001 |
| Frontend Web | React 19 + Vite | 5173 |
| App Móvil | React Native + Expo 55 | — |
| Base de datos | MySQL 8.0 | 3306 |
| phpMyAdmin | — | 8080 |
| n8n | Automatización | 5678 |

| Métrica | Valor |
|---|---|
| Endpoints API | 57 |
| Tablas BD | 17 + 5 vistas |
| Tests verdes | 74 (30 FE + 25 BE + 19 Móvil) |
| Roles | 4 (Admin, Entrenador, Recepcionista, Afiliado) |
| Despliegue | Render (BE) + Railway (DB) + EAS (Móvil) |

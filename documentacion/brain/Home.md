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
- [[Base de datos MySQL]] — 26 tablas, 5 vistas, esquema completo

### 🔌 APIs
- [[Autenticación]] — Login, JWT, recuperación de contraseña
- [[Afiliados]] — CRUD, ciclos, progreso, restricciones, seguimiento diario
- [[Pagos]] — Registro, facturación por correo, métricas admin
- [[PlanEntrenamiento y Nutrición|Planes]] — Planes de entrenamiento, rutinas, dietas
- [[Notificaciones]] — Push notifications y notificaciones por rol

### 🚀 Despliegue
- `../entregables/Diagrama_de_Despliegue_MetaFit.drawio` — Diagrama de despliegue (Render, Docker, MariaDB, Brevo, Cloudinary, CI/CD)
- `../n8n.md` — Automatización n8n: webhooks, credenciales, troubleshooting

### 🐛 Bugs y Soluciones
- [[Historial de bugs]] — Bugs documentados y cómo se resolvieron
- [[Lecciones aprendidas]] — Mejores prácticas descubiertas

### 📖 Manuales
- `../entregables/Manual_Tecnico_MetaFit.docx` — Arquitectura, seguridad, endpoints, BD e implementación
- `../entregables/Manual_de_Usuario_MetaFit.docx` — Guías por rol (Admin, Entrenador, Recepcionista, Afiliado)
- `../entregables/Manual_de_Instalacion_MetaFit.docx` — Instalación local, Docker, producción y APK
- `../entregables/Diagrama_de_Clases_MetaFit.drawio` — Diagrama de clases UML 2.4.1
- `../entregables/Normalizacion_Modelo_Relacional_MetaFit.xlsx` — Normalización 0FN → 3FN
- `../entregables/Fichas_Tecnicas_MetaFit.docx` — Fichas técnicas de hardware y software
- `../entregables/Estimacion_de_Costos_MetaFit.xlsx` — Costos, proveedores y fases (≤ $30M COP)
- `../MANUAL_POSTMAN.md` — Colecciones y uso de la API

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
| Base de datos | MariaDB 11 | 3306 |
| phpMyAdmin | — | 8080 |
| n8n | Automatización | 5678 |

| Métrica | Valor |
|---|---|
| Endpoints API | 91 |
| Tablas BD | 26 + 5 vistas |
| Tests verdes | 74 (30 FE + 25 BE + 19 Móvil) |
| Roles | 4 (Admin, Entrenador, Recepcionista, Afiliado) |
| Despliegue | Render (BE) + Railway (DB) + EAS (Móvil) |

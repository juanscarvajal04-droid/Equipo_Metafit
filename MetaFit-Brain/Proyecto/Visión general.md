# 📋 Visión General del Proyecto

> MetaFit v2.0 — Sistema de gestión deportiva para **Sport Gym Sede 80**

---

## ¿Qué es MetaFit?

Sistema integral de administración de gimnasio que gestiona afiliados, planes de entrenamiento, nutrición, pagos y seguimiento diario. Incluye panel web para el personal y app móvil para los afiliados.

---

## 🏢 Contexto

- **Cliente:** Sport Gym Sede 80 — Bogotá, Colombia
- **Líder técnico:** Juan Sebastian Carvajal
- **Equipo:** Equipo Metafit (SENA)
- **Versión actual:** 2.0

---

## 🔧 Stack Tecnológico

### Backend
- **Runtime:** Node.js 22 + Express
- **BD:** MySQL 8.0 (sin ORM — mysql2/promise nativo)
- **Auth:** JWT (8h) + bcrypt (12 rondas)
- **Seguridad:** Helmet, rate limiting, validación Content-Type
- **Docs:** Swagger UI (`/api-docs`)

### Frontend Web
- **Framework:** React 19 + Vite 6
- **Router:** react-router-dom 7 (HashRouter)
- **Estilos:** CSS Modules + Bootstrap 5 + Custom Properties
- **Gráficas:** Chart.js + react-chartjs-2
- **PDF:** jsPDF + jsPDF-AutoTable
- **Iconos:** Lucide React
- **Storybook:** v10.5

### App Móvil
- **Framework:** React Native + Expo SDK 55
- **Navegación:** React Navigation 7 (Stack + BottomTabs)
- **Storage:** AsyncStorage
- **Push Notifications:** expo-notifications

### Despliegue
- **Backend:** Render.com (Docker)
- **BD:** Railway (MySQL)
- **Móvil:** EAS (Expo Application Services)
- **CI/CD:** GitHub Actions (74 tests)

---

## 👥 Roles del Sistema

| Rol | Acceso Web | Acceso Móvil |
|---|---|---|
| **Administrador** | Dashboard, Finanzas, Afiliados, Rutinas, Dietas, Personal | — |
| **Entrenador** | Rutinas, Dietas, Afiliados (lectura) | — |
| **Recepcionista** | Afiliados (CRUD), Pagos | — |
| **Afiliado** | — | Perfil, Rutina, Dieta, Progreso |

---

## 📦 Estructura del Código

```
Equipo_Metafit/
├── backend/           # API REST (Node.js + Express)
├── frontend_web/      # Panel admin (React + Vite)
├── movil/             # App afiliados (React Native + Expo)
├── database/          # Scripts SQL (schema, seed, migraciones)
├── documentacion/     # 15 archivos de documentación
├── postman/           # Colecciones Postman
├── docker-compose.yml # Orquestación local
├── Dockerfile         # Build all-in-one (BE + MariaDB)
└── render.yaml        # Despliegue Render
```

---

## 📎 Notas Relacionadas

- [[Home]]
- [[Diagrama general]]
- [[Historias de usuario]]
- [[Roadmap]]
- [[Enlaces útiles]]

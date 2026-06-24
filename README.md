# 🚀 MetaFit - Sistema de Gestión Deportiva

Bienvenido a la rama de trabajo de la dirección del proyecto. Esta sección es administrada por el líder técnico para garantizar la integridad del código.

## 👤 Perfil del Integrante
**Nombre:** Juan Sebastián Carvajal 
ilidades Técnicas:**
    * Gestión y mantenimiento de la rama de Producción (`main`)
    * Integración de código en la rama de Desarrollo (`develop`)
    * Supervisión de Pull Requests y control de versiones mediante Git Flow
    * Coordinación de los módulos de Administrador y Recepción 

## 🛠️ Estado de la Rama
Esta rama se encuentra sincronizada con la base estable de **MetaFit v2.0**. Aquí se realizan las validaciones finales antes de realizar los despliegues a las ramas globales del equipo.

---

## 🐳 Levantar el proyecto con Docker

```bash
# Clonar el repositorio
git clone <repo-url>
cd Equipo_Metafit

# Iniciar todos los servicios (MySQL + Backend + Frontend + phpMyAdmin)
docker compose up -d --build

# Verificar que los contenedores estén corriendo
docker compose ps
```

Los scripts SQL (`01_schema.sql`, `02_seed.sql`) se ejecutan automáticamente al iniciar MySQL por primera vez.

## 🔌 Puertos

| Servicio   | Puerto | URL                        |
|------------|--------|----------------------------|
| Frontend   | 5173   | http://localhost:5173       |
| Backend    | 3001   | http://localhost:3001       |
| phpMyAdmin | 8080   | http://localhost:8080       |
| MySQL      | 3306   | localhost:3306              |

## 👤 Credenciales de prueba

| Rol             | Email                    | Contraseña     |
|-----------------|--------------------------|----------------|
| Administrador   | carlos@metafit.com       | Admin123!      |
| Recepcionista   | maria@metafit.com        | Maria123!      |
| Entrenador      | laura@metafit.com        | Laura123!      |
| Entrenador      | andres@metafit.com       | Andres123!     |
| Afiliado        | ana.lopez@example.com    | Afiliado123!   |

## 🔬 Tests

```bash
# Backend (16 tests — integración + unitarios)
cd backend && npm test
```

Respuesta esperada:
```
Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
```

## 📬 Postman

Se proporcionan **dos** colecciones Postman (dentro de [`postman/`](./postman)):

| Colección | Archivo | Para quién |
|-----------|---------|------------|
| Web (Staff) | `postman/MetaFit_API_Web.postman_collection.json` | Admin / Recepcionista / Entrenador |
| Móvil (Afiliado) | `postman/MetaFit_API_Movil.postman_collection.json` | Afiliado (app móvil) |

**Configuración:**
1. Importa los 3 archivos de la carpeta `postman/` en Postman
2. Selecciona el entorno `MetaFit Environment`
3. Ejecuta primero el login — el token JWT se guarda automáticamente

## 📊 ISO 25000 — Cumplimiento

| Característica | Estado |
|----------------|--------|
| Mantenibilidad | ✅ Código modular MVC (controller → service → model) |
| Funcionalidad  | ✅ 30+ endpoints documentados con Swagger |
| Confiabilidad  | ✅ Manejo de errores con try-catch + códigos HTTP |
| Seguridad      | ✅ JWT + bcrypt (12 rondas) + rutas protegidas |
| Capacidad de prueba | ✅ 16 tests (integración + unitarios) pasando |
| Portabilidad   | ✅ Web (Vite) + Móvil (Expo) + Docker |

## 📚 Documentación

Todos los documentos se encuentran en la carpeta [`documentacion/`](./documentacion).

| Documento | Descripción |
|---|---|
| `documentacion/MANUAL_TECNICO.md` | Manual técnico completo: arquitectura, endpoints, BD, seguridad, despliegue |
| `documentacion/MANUAL_USUARIO.md` | Guías paso a paso para cada rol del sistema |
| `documentacion/MANUAL_POSTMAN.md` | Guía para probar la API con Postman desde cero |
| `documentacion/DIAGRAMAS.md` | Diagramas de arquitectura, componentes, navegación, BD y flujos |
| `documentacion/PRESENTACION.md` | Guion de sustentación (15-20 min) con diapositivas |
| `documentacion/QA_REPORT.md` | Reporte de aseguramiento de calidad |
| `documentacion/AUDITORIA_FINAL.md` | Auditoría final del proyecto |

---
*MetaFit Inc. · Sport Gym Sede 80 · Bogotá, Colombia* 
# MetaFit

**Sistema de gestión deportiva para Sport Gym Sede Santa Rosita**

MetaFit es una aplicación full-stack para administrar la operación de un gimnasio: afiliados, ciclos de entrenamiento, rutinas, planes nutricionales, pagos, finanzas, restricciones médicas y progreso físico. El personal del gimnasio trabaja desde la web y los afiliados desde una app móvil Android.

> **Este README está orientado a producción y evaluación.**
> Si vas a desarrollar o ejecutar el proyecto en local, consulta [`README_DEV.md`](./README_DEV.md).

[![Web](https://img.shields.io/badge/Web-producci%C3%B3n-e31c25?style=for-the-badge)](https://metafit-frontend-78x6.onrender.com)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0%20%7C%2093%20endpoints-85EA2D?style=for-the-badge&logo=swagger&logoColor=white)](https://metafit-backend-rr18.onrender.com/api-docs)
[![APK](https://img.shields.io/badge/APK-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://metafit-frontend-78x6.onrender.com/app/metafit.apk)
[![SonarQube](https://img.shields.io/badge/SonarQube-0%20issues-4E9BCD?style=for-the-badge&logo=sonarqube&logoColor=white)](#calidad-y-métricas)

---

## ¿Qué incluye?

| Módulo | Para quién | Funcionalidad principal |
|---|---|---|
| Web de gestión | Administrador, Recepcionista y Entrenador | Dashboard, afiliados, ciclos, rutinas, dietas, pagos, finanzas, personal y restricciones |
| App móvil | Afiliado | Perfil, rutina del día, dieta, progreso, registro de ejercicio, consumo de alimentos, agua y notas |
| API REST | Web y móvil | 93 endpoints documentados con OpenAPI 3.0, autenticación JWT y control de acceso por rol |
| Base de datos | Backend | Modelo relacional en 3FN con vistas para cálculos de IMC, calorías y seguimiento |

La web y la app móvil son **dos clientes del mismo backend**: lo que registra un entrenador en la web aparece en la app del afiliado y viceversa.

---

## Enlaces de producción

| Recurso | URL |
|---|---|
| 🌐 **Aplicación web (staff)** | https://metafit-frontend-78x6.onrender.com |
| 📖 **Swagger UI (93 endpoints)** | https://metafit-backend-rr18.onrender.com/api-docs |
| 📄 **Especificación OpenAPI en vivo** | https://metafit-backend-rr18.onrender.com/api-docs.json |
| ❤️ **Health check del backend** | https://metafit-backend-rr18.onrender.com/health |
| 🗄️ **Adminer (consulta de la BD)** | https://metafit-adminer.onrender.com |
| 📱 **Descarga del APK Android** | https://metafit-frontend-78x6.onrender.com/app/metafit.apk |
| 💻 **Repositorio GitHub** | https://github.com/juanscarvajal04-droid/Equipo_Metafit |

> Adminer abre con el servidor de producción ya configurado. Usuario: `metafit`, base de datos: `metafit`. Las credenciales completas y el procedimiento de conexión están en [`documentacion/adminer.md`](./documentacion/adminer.md).
>
> Los servicios gratuitos de Render pueden tardar unos segundos en responder después de un periodo de inactividad.

---

## Arquitectura en la nube

```text
Usuarios web (staff) ─┐
                      ├──► Render: Frontend React + Vite ──► Render: API Node/Express
App móvil (afiliados) ┘                                             │
                                                                    ├──► Oracle Cloud VPS: MySQL 8
                                                                    └──► Cloudinary: fotos
Render: Adminer ────────────────────────────────────────────────────► Oracle Cloud VPS: MySQL 8
```

| Componente | Plataforma | Detalle |
|---|---|---|
| Frontend web | Render | React 19 + Vite 6, desplegado como sitio estático |
| Backend / API | Render | Node.js + Express, Web Service con Docker y health check |
| Base de datos | Oracle Cloud VPS | MySQL 8 administrado con Dokploy; separada de la BD local |
| Imágenes | Cloudinary | Fotos de perfil y recursos; fallback local en desarrollo |
| Administración de BD | Render | Adminer apuntando al MySQL del VPS |
| CI/CD | GitHub Actions | Tests de backend, frontend y móvil + deploy automático a Render |

---

## Calidad y métricas

| Indicador | Resultado |
|---|---|
| **SonarQube** | **0 issues** · Quality Gate `MetaFit`: **OK** |
| **Cobertura backend** | **100.00%** · 2474/2474 líneas |
| **Cobertura frontend web** | **99.45%** · 2509/2523 líneas |
| **Cobertura app móvil** | **99.37%** · 944/950 líneas |
| **Duplicación de código** | **0.9%** · 311 líneas |
| **CI/CD** | GitHub Actions en verde: tests + build + deploy |
| **Documentación de API** | 93/93 endpoints documentados en Swagger/OpenAPI 3.0 |

Todas las suites de pruebas se ejecutan en cada push y el pipeline despliega automáticamente a Render cuando la rama `main` queda en verde.

---

## Cómo usar la app

### 1. Web de gestión (personal del gimnasio)

1. Abre https://metafit-frontend-78x6.onrender.com
2. Entra con una de las cuentas de prueba.
3. Según el rol, verás el dashboard, afiliados, pagos, rutinas, dietas, finanzas o gestión de personal.

### 2. App móvil (afiliados)

1. Descarga el APK desde https://metafit-frontend-78x6.onrender.com/app/metafit.apk
2. En Android, permite la instalación desde orígenes desconocidos si el sistema lo solicita.
3. Instala **MetaFit**, ábrela e inicia sesión con la cuenta de afiliado.

### Credenciales de prueba

| Rol | Correo | Contraseña | Dónde entrar |
|---|---|---|---|
| **Administrador** | `carlos@metafit.com` | `Admin123!` | Web |
| **Recepcionista** | `maria@metafit.com` | `Maria123!` | Web |
| **Entrenador** | `laura@metafit.com` | `Laura123!` | Web |
| **Afiliado** | `ana.lopez@example.com` | `Afiliado123!` | App móvil (o Expo web en local) |

> También existe una segunda cuenta de entrenador: `andres@metafit.com` / `Andres123!`.
>
> Estas cuentas son datos de demostración para la evaluación. No elimines registros ni cambies contraseñas durante la revisión.

### Alcance por rol

| Rol | Puede hacer |
|---|---|
| **Administrador** | Todo: dashboard, afiliados, ciclos, personal, pagos, finanzas, rutinas, dietas y restricciones |
| **Recepcionista** | Gestionar afiliados, registrar pagos y administrar restricciones |
| **Entrenador** | Crear y editar rutinas, dietas y restricciones; consultar afiliados y su progreso |
| **Afiliado** | Ver su perfil, rutina, dieta y progreso; registrar ejercicio, alimentos, agua y notas |

---

## Tecnologías principales

| Capa | Tecnologías |
|---|---|
| Frontend web | React 19, Vite 6, React Router 7, Bootstrap 5, Chart.js, Axios, Storybook |
| App móvil | Expo SDK 55, React Native 0.83, React Navigation, AsyncStorage, Axios |
| Backend | Node.js 22, Express 4, MySQL2, JWT, bcrypt (12 rondas), Multer, Swagger |
| Base de datos | MySQL 8 en producción · MariaDB 11 en local |
| Infraestructura | Docker Compose, Render, Oracle Cloud VPS, Cloudinary, GitHub Actions |

---

## Documentación

### Desarrollo

| Documento | Contenido |
|---|---|
| [`README_DEV.md`](./README_DEV.md) | Clonado, entorno local con Docker, tests, migraciones, variables de entorno y generación del APK |
| [`backend/README.md`](./backend/README.md) | Arquitectura MVC + Services, scripts, migraciones y despliegue del backend |
| [`frontend_web/README.md`](./frontend_web/README.md) | Stack, estructura de carpetas, comandos y build del frontend |
| [`movil/README.md`](./movil/README.md) | Expo, ejecución web en `localhost:8081`, tests y compilación del APK |
| [`database/README.md`](./database/README.md) | Orden de scripts SQL, convenciones y ejecución manual |

### Producción y operación

| Documento | Contenido |
|---|---|
| [`documentacion/MANUAL_TECNICO.md`](./documentacion/MANUAL_TECNICO.md) | Arquitectura, endpoints, base de datos, seguridad y despliegue |
| [`documentacion/MANUAL_USUARIO.md`](./documentacion/MANUAL_USUARIO.md) | Guías de uso por rol |
| [`documentacion/MANUAL_POSTMAN.md`](./documentacion/MANUAL_POSTMAN.md) | Pruebas de la API con las colecciones Postman |
| [`documentacion/adminer.md`](./documentacion/adminer.md) | Conexión a la base de datos de producción con Adminer |
| [`documentacion/entornos.md`](./documentacion/entornos.md) | Separación entre entorno local y producción |
| [`documentacion/infraestructura_vps.md`](./documentacion/infraestructura_vps.md) | Infraestructura de la BD en Oracle Cloud + Dokploy |
| [`documentacion/manual_apk_movil.md`](./documentacion/manual_apk_movil.md) | Generación, firma y publicación del APK |
| [`documentacion/QA_REPORT.md`](./documentacion/QA_REPORT.md) | Reporte de aseguramiento de calidad |
| [`documentacion/seguridad.md`](./documentacion/seguridad.md) | Medidas de seguridad y rotación de credenciales |
| [`documentacion/DIAGRAMAS.md`](./documentacion/DIAGRAMAS.md) | Diagramas de arquitectura, componentes y flujos |
| [`documentacion/brain/Home.md`](./documentacion/brain/Home.md) | Vault de Obsidian con documentación viva del proyecto |

---

## Estado del proyecto

Proyecto académico **finalizado y congelado** para entrega. La versión de producción mantiene los 93 endpoints documentados, las suites de pruebas en verde y el Quality Gate de SonarQube aprobado.

---

*MetaFit · Sport Gym Sede Santa Rosita · Bogotá, Colombia*

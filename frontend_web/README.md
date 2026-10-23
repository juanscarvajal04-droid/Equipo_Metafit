# Frontend web MetaFit

Aplicación web de gestión para el personal de **Sport Gym Sede Santa Rosita**. Consume la API REST de MetaFit y ofrece vistas por rol para administración, recepción y entrenamiento.

- **Producción:** https://metafit-frontend-78x6.onrender.com
- **API:** https://metafit-backend-rr18.onrender.com
- **Swagger:** https://metafit-backend-rr18.onrender.com/api-docs

---

## Stack

| Tecnología | Uso |
|---|---|
| **React 19** | Interfaz de usuario |
| **Vite 6** | Servidor de desarrollo y build |
| **React Router 7** | Navegación con `HashRouter` |
| **Bootstrap 5** | Base visual y utilidades responsive |
| **Chart.js + react-chartjs-2** | Gráficos de progreso y finanzas |
| **Axios** | Cliente HTTP con interceptor JWT |
| **Vitest + Testing Library** | Pruebas unitarias y de componentes |
| **Storybook** | Catálogo de componentes visuales |
| **ESLint** | Análisis estático |

---

## Requisitos

- Node.js 20 o 22
- npm 10+
- Backend de MetaFit disponible en `http://localhost:3001` (o la URL configurada)

---

## Configuración

### Variables de entorno

El proyecto incluye `frontend_web/.env.development`:

```env
VITE_API_URL=http://localhost:3001
```

En producción (Render) se configura:

```env
VITE_API_URL=https://metafit-backend-rr18.onrender.com
```

Vite solo expone al navegador las variables que empiezan por `VITE_`.

### Instalación

```bash
cd frontend_web
npm ci
```

---

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve localmente el build de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm test` | Ejecuta Vitest con cobertura y normaliza `lcov.info` |
| `npm run test:watch` | Vitest en modo watch |
| `npm run storybook` | Storybook en http://localhost:6006 |
| `npm run build-storybook` | Build estático de Storybook |

### Flujo típico de desarrollo

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend_web
npm run dev
```

Abre http://localhost:5173.

---

## Estructura de carpetas

```text
frontend_web/
├── public/                  Recursos estáticos y APK
├── src/
│   ├── assets/              Imágenes y recursos
│   ├── components/          Componentes reutilizables
│   │   ├── common/          Botones, cards, modales, identidad de afiliado
│   │   └── graficos/        Gráficos de peso y volumen
│   ├── context/             AuthContext
│   ├── hooks/               useApi, useAfiliados, useDashboard, etc.
│   ├── services/            Cliente Axios y servicios por dominio
│   ├── stories/             Historias de Storybook
│   ├── test/                Configuración de pruebas
│   ├── utils/               Helpers, tema y analítica
│   ├── views/               Pantallas de la aplicación
│   ├── App.jsx              Rutas y control de acceso
│   └── main.jsx             Punto de entrada
├── index.html
├── vite.config.js
├── Dockerfile
└── package.json
```

### Vistas principales

| Vista | Ruta | Roles |
|---|---|---|
| Landing pública | `/` | Público |
| Login | `/login` | Público |
| Recuperar contraseña | `/recuperar-password` | Público |
| Dashboard administrativo | `/dashboard` | Administrador |
| Gestión de personal | `/personal` | Administrador |
| Finanzas | `/finanzas` | Administrador |
| Afiliados | `/afiliados` | Administrador, Recepcionista, Entrenador |
| Pagos | `/pagos` | Administrador, Recepcionista |
| Rutinas | `/rutinas` | Administrador, Entrenador |
| Dietas | `/dietas` | Administrador, Entrenador |
| Progreso del afiliado | `/progreso/:id` | Administrador, Entrenador |
| Restricciones | `/restricciones` | Todo el staff |

La aplicación usa `HashRouter`, por lo que las rutas se resuelven en el cliente con el formato `/#/login`, `/#/afiliados`, etc. Esto evita configuraciones adicionales de rewrite en el hosting estático.

---

## Pruebas

```bash
cd frontend_web
npm ci
npm test
```

- Framework: **Vitest**
- Entorno: **jsdom**
- Utilidades: **Testing Library**, `@testing-library/user-event`, `jest-dom`
- Cobertura actual: **99.45% de líneas** (2509/2523)
- Reporte: `coverage/lcov.info`, consumido por SonarQube

Los archivos de prueba viven en subcarpetas `__tests__/` junto al código que prueban. La configuración está en `vite.config.js` (`test.globals`, `environment: 'jsdom'`, `setupFiles: ./src/test/setup.js`).

---

## Build y despliegue

```bash
npm run build
```

El resultado se genera en `dist/`. Para probarlo localmente:

```bash
npm run preview
```

En Render, el frontend se publica como **sitio estático**:

| Configuración | Valor |
|---|---|
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Variable de entorno | `VITE_API_URL=https://metafit-backend-rr18.onrender.com` |

El workflow de GitHub Actions ejecuta `npm test` y `npm run build` antes de desplegar.

---

## Analítica

La landing y la aplicación incluyen integración con Google Tag Manager:

| Servicio | Implementación |
|---|---|
| Google Tag Manager | Contenedor `GTM-K6JZS4MG` en `index.html` |
| Google Analytics 4 | Configurado dentro de GTM; Measurement ID `G-81SWBDG2P6` |
| Search Console | Verificación por archivo en `public/google784a94e7c83aeb9e.html` |

La navegación usa `HashRouter`, por lo que GTM captura los cambios de ruta mediante el trigger **History Change**.

---

## Documentación relacionada

- [`../README.md`](../README.md) — presentación del proyecto y enlaces de producción.
- [`../README_DEV.md`](../README_DEV.md) — entorno local completo y flujo de trabajo.
- [`../backend/README.md`](../backend/README.md) — API, capas y endpoints.
- [`../documentacion/MANUAL_USUARIO.md`](../documentacion/MANUAL_USUARIO.md) — guías de uso por rol.

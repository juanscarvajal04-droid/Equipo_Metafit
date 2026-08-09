# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Pruebas

Los tests corren con **Vitest** + **Testing Library** (jsdom).

```bash
npm test          # ejecuta la suite una sola vez
npm run test:watch # modo watch
```

Qué cubren (26 tests):

| Archivo | Cobertura |
|---|---|
| `src/components/__tests__/ErrorBoundary.test.jsx` | Fallback ante errores de renderizado (Fiabilidad) |
| `src/services/__tests__/api.test.js` | Interceptor JWT, manejo de 401 global, helpers del cliente API |
| `src/context/__tests__/AuthContext.test.jsx` | login/logout, persistencia y restauración en localStorage |
| `src/utils/__tests__/helpers.test.js` | Funciones puras de afiliados (getId, nombreCompleto, inicial, cicloActivo, toDateInput) |

Los archivos de prueba viven junto al código en subcarpetas `__tests__/`. La configuración está en `vite.config.js` (`test.globals`, `environment: 'jsdom'`, `setupFiles: ./src/test/setup.js`).

## Google Analytics / Tag Manager / Search Console

El sitio trae integrados los snippets de Google en `index.html` (GTM + verificación de Search Console). Son **placeholders** que deben reemplazarse por los IDs reales de las cuentas de `metafit.sistema@gmail.com`:

| Servicio | Dónde reemplazar | Valor |
|---|---|---|
| Google Tag Manager | `index.html` → 2 ocurrencias de `GTM-XXXXXXX` | Container ID (p. ej. `GTM-ABCDEFG`) |
| Google Search Console | `index.html` → `CODIGO_DE_VERIFICACION` | content de la metaetiqueta HTML |
| Google Analytics 4 | Dentro de GTM (tag GA4 Configuration) | Measurement ID `G-XXXXXXXX` |

> **Importante**: este proyecto usa GA4 **vía GTM** (no gtag.js directo) para evitar doble conteo; la app usa `HashRouter`, y GTM captura los cambios de ruta con el trigger "History Change". Ver `src/utils/analytics.js` para más contexto.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

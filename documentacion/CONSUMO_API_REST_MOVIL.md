# Consumo de la API REST desde la app móvil (MetaFit)

Documento técnico sobre **cómo la app móvil Expo/React Native consume la API REST del backend MetaFit**: arquitectura del cliente HTTP, autenticación, inventario de endpoints, mapeo por pantalla, manejo de errores y sesiones, casos especiales, diferencias web/móvil y problemas conocidos.

Todos los hallazgos fueron verificados leyendo el código fuente en el momento de redacción del documento y se citan como `archivo:línea`. Lo que no pudo confirmarse se marca explícitamente como **no verificable**.

---

## 1. Alcance, fuentes y cifras verificadas

| Dato | Valor | Verificación |
|---|---|---|
| App móvil | Expo SDK 55 / React Native 0.83 | `movil/package.json` (`expo: ~55.0.28`, `react-native: 0.83.10`) |
| Cliente HTTP único | `movil/src/services/api.js` (axios) | `movil/src/services/api.js:8-25` |
| Pantallas | 10 en `movil/src/screens/` | Listado de archivos; registradas en `movil/src/navigation/AppNavigator.js:20-29` |
| Endpoints REST del backend | 91 | Conteo de `router.get/post/put/patch/delete(` sobre `backend/routes/*.js` = 91 |
| Endpoints únicos consumidos por el móvil | **27** | Conteo propio, ver apartado 4 |
| Prefijo `/api` | No existe | `backend/server.js:142-154` monta `/login`, `/usuarios`, `/afiliados`, `/planes`, etc. sin prefijo |
| Autenticación | JWT (`Authorization: Bearer`) | `movil/src/services/api.js:32-41`; `backend/routes/afiliadoRoutes.js:85` (`requireAuth`) |
| Expiración del JWT | 8 h (`JWT_EXPIRES_IN=8h`) | `.env.example` (`JWT_EXPIRES_IN=8h`); `backend/services/authService.js:27` |
| URL de producción | `https://metafit-backend-rr18.onrender.com` | `movil/src/services/api.js:18` |

Documento hermano de referencia: **`documentacion/TRAZABILIDAD_MOVIL_RUTINA.md`** (324 líneas). Cubre en profundidad el arranque de la app, la asignación de rutina desde la web, la consulta móvil, el SQL, el JWT, el progreso y el volumen. Este documento **no repite** ese contenido: solo lo enlaza y complementa con el inventario de endpoints y el mapa por pantalla (ver apartado 11).

---

## 2. Arquitectura del consumo

### 2.1 Dónde vive el cliente HTTP

Existe **un único cliente HTTP** para toda la app: la instancia axios creada en `movil/src/services/api.js:21-25`.

```js
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
```

Características verificadas:

- **Timeout de 10 000 ms** (`movil/src/services/api.js:23`).
- **Interceptor de request** que inyecta el token desde AsyncStorage en cada petición (`movil/src/services/api.js:32-41`).
- **Interceptor de response** que limpia la sesión ante un 401 fuera de `/login` (`movil/src/services/api.js:50-59`).
- Exporta además `TOKEN_KEY`, `USER_KEY`, `ROLE_KEY` y `API_URL` (`movil/src/services/api.js:62`), claves que deben coincidir con las del AuthContext (`movil/src/services/api.js:11-14`).

Sobre esta misma instancia se apoyan los servicios derivados, que **no crean clientes nuevos**:

| Servicio | Qué hace | Archivo |
|---|---|---|
| `registroService.js` | 4 helpers de registro real (ejercicio/consumo + historiales) | `movil/src/services/registroService.js:1-13` |
| `perfilService.js` | 4 helpers de perfil (duplicados de `api.js`) | `movil/src/services/perfilService.js:6-12` |
| `notifications.js` | Registro del push token | `movil/src/services/notifications.js:44` |

No hay ningún otro `axios.create`, `fetch(` ni cliente HTTP en `movil/src` (verificado por búsqueda).

### 2.2 Configuración de la base URL por entorno

**Hallazgo que contradice el enunciado de partida:** en el código actual la URL **NO** se resuelve desde `EXPO_PUBLIC_API_URL`. Está **hardcodeada**:

- `movil/src/services/api.js:18` → `const API_URL = 'https://metafit-backend-rr18.onrender.com';`
- No existe ningún archivo `.env` dentro de `movil/` (verificado con listado de archivos, solo hay `.gitignore`).
- `EXPO_PUBLIC_API_URL` **no aparece en ningún archivo del código fuente** del repositorio: solo aparece en documentación y en una tarea pendiente de auditoría:
  - `documentacion/entregables/Manual_Tecnico_MetaFit.docx` (§ App Móvil → Servicio API móvil; documenta `EXPO_PUBLIC_API_URL` como mejora pendiente).
  - `documentacion/AUDITORIA_METAFIT.md:314` → `[ ] Apt Móvil: dejar de hardcodear API_URL (usar EXPO_PUBLIC_API_URL) y añadir guard de rol.` (abierta).
  - `documentacion/AUDITORIA_METAFIT.md:343` documenta además que en el pasado apuntó a `localhost:3001` en el emulador.

Consecuencia práctica verificada: **desarrollo y producción apuntan al mismo host (producción en Render)**. El comentario del propio archivo lo asume: "el móvil NO usa localhost porque la app corre en un dispositivo/emulador, así que siempre apunta al entorno de producción" (`movil/src/services/api.js:16-17`). Para probar contra un backend local hay que editar `api.js` a mano; **no verificable** que exista algún otro mecanismo (script, plugin de Babel o variable de EAS) que lo haga, porque no se encontró ninguno.

Único caso en que la URL se consume aparte: para completar rutas relativas de foto de perfil (`${API_URL}${foto}`) en `movil/src/screens/MiPerfilScreen.js:62`.

### 2.3 Resolución en el build de Expo

- `movil/app.json` no define ninguna variable de entorno ni `apiUrl` en `extra`; lo único en `extra` es el `projectId` de EAS (`movil/app.json:47-51`).
- `movil/eas.json` solo define perfiles de build (`development`, `preview`, `production`) sin env vars (`movil/eas.json:4-23`).
- Por tanto, en un build de EAS/producción el valor que viaja es el literal de `movil/src/services/api.js:18`. Cualquier cambio de URL exige rebuild de la app (no es configurable en runtime).

---

## 3. Autenticación end-to-end desde el móvil

### 3.1 Login

1. `LoginScreen` valida localmente que correo y contraseña no estén vacíos (`movil/src/screens/LoginScreen.js:72-75`), activa `loading` y llama a `login()` del AuthContext (`movil/src/screens/LoginScreen.js:79`).
2. `AuthContext.login` invoca `loginRequest(correo, contrasena)` → **POST `/login`** con cuerpo `{ email, password }` (`movil/src/context/AuthContext.js:75`, `movil/src/services/api.js:65-66`).
3. La respuesta se espera como `{ accessToken, user }` (`movil/src/context/AuthContext.js:76`).
4. Se persisten tres claves en un solo `multiSet`: `metafit_token`, `metafit_user` (JSON con `role`) y `metafit_role` (`movil/src/context/AuthContext.js:78-82`).
5. Se actualiza el estado en memoria (`setToken`, `setUser`) → `AppNavigator` re-renderiza y muestra las tabs (`movil/src/navigation/AppNavigator.js:139-140`).
6. Tras el login exitoso se activan las push notifications (`movil/src/screens/LoginScreen.js:80`).

### 3.2 Guardado y restauración del token

- Persistencia en **AsyncStorage** (no localStorage) — diferencia clave con el web explicada en `movil/src/context/AuthContext.js:5-12`.
- Al arrancar, `restoreSession` lee `multiGet([TOKEN_KEY, USER_KEY])` y solo marca sesión activa si el usuario parseado tiene `role` (`movil/src/context/AuthContext.js:46-63`).
- Mientras `loading === true`, `AppNavigator` muestra `LoadingScreen` para evitar el flash de Login (`movil/src/navigation/AppNavigator.js:131-133`).
- La restauración **no consulta el backend**: confía en el storage local (`movil/src/context/AuthContext.js:26`).

### 3.3 Cabecera en cada petición

Interceptor de request: lee `metafit_token` de AsyncStorage y, si existe, escribe `Authorization: Bearer <token>` (`movil/src/services/api.js:32-41`). Si la lectura falla, la petición sale sin token (error silenciado en `catch (_)`, `movil/src/services/api.js:37`).

### 3.4 Expiración

- Backend: `JWT_EXPIRES_IN=8h` (`.env.example`), aplicado en `backend/services/authService.js:27,49`. El token de reset de contraseña dura 15 min (`backend/services/authService.js:62-65`).
- Móvil: **no hay decodificación local del JWT ni temporizador de expiración**. No se busca `exp` en ningún archivo de `movil/src` (no verificable que exista: no se encontró). La expiración se detecta **cuando el backend responde 401**.

### 3.5 Manejo de errores 401/403

- **401**: el interceptor de response limpia `metafit_token`, `metafit_user` y `metafit_role` de AsyncStorage **salvo** cuando la URL incluye `/login` (un 401 en login son credenciales incorrectas, no sesión vencida) — `movil/src/services/api.js:50-59`.
- **403**: no hay manejo específico en el cliente (búsqueda de `403` en `movil/src` solo arroja un comentario en `movil/src/screens/LoginScreen.js:66`). El error fluye al catch de cada pantalla y se muestra como mensaje del servidor.
- En login, se distingue fallo de red (sin `err.response`) de error del servidor (`err.response.data.error` o genérico) — `movil/src/screens/LoginScreen.js:82-87`.
- **Limitación verificada**: el interceptor borra el storage pero **no** notifica al AuthContext, que no escucha cambios de AsyncStorage (no hay `setToken(null)` fuera de `logout`, `movil/src/context/AuthContext.js:96`). Por tanto la UI **no** redirige a Login de inmediato: la sesión "muere" en el siguiente arranque de la app. Ver apartado 10.

### 3.6 Logout

`MiPerfilScreen` → `handleLogout` → `AuthContext.logout` → `multiRemove` de las tres claves + `setToken(null)` / `setUser(null)` (`movil/src/screens/MiPerfilScreen.js:265-269`, `movil/src/context/AuthContext.js:94-98`). **No llama al backend** (el token simplemente deja de enviarse, `movil/src/context/AuthContext.js:92`). `AppNavigator` vuelve al stack público automáticamente (`movil/src/navigation/AppNavigator.js:139-146`).

---

## 4. Tabla completa de los 27 endpoints únicos consumidos por el móvil

Método de obtención: enumeración de todas las llamadas HTTP de `movil/src/services/api.js` (22), más las de `registroService.js` invocadas desde pantallas (4), más la subida de foto llamada directamente desde una pantalla (1). Se descartaron los alias duplicados de `perfilService.js` (mismas rutas que `api.js`).

**Total: 27 endpoints únicos. Confirmado.**

| # | Método | Ruta | Función / pantalla que la invoca | `archivo:línea` |
|---|---|---|---|---|
| 1 | POST | `/login` | `loginRequest` (api.js) ← `AuthContext.login` ← LoginScreen | `movil/src/services/api.js:66`, `movil/src/context/AuthContext.js:75`, `movil/src/screens/LoginScreen.js:79` |
| 2 | POST | `/auth/recuperar-password` | `solicitarRecuperacion` ← RecuperarPasswordScreen | `movil/src/services/api.js:70`, `movil/src/screens/RecuperarPasswordScreen.js:37` |
| 3 | POST | `/auth/reset-password` | `resetPasswordRequest` ← RecuperarPasswordScreen | `movil/src/services/api.js:74`, `movil/src/screens/RecuperarPasswordScreen.js:62` |
| 4 | GET | `/afiliados/me` | `getMiPerfil` (api.js) ← MiPerfil; `getPerfil` (perfilService) ← EditarPerfil | `movil/src/services/api.js:78`, `movil/src/screens/MiPerfilScreen.js:232`, `movil/src/services/perfilService.js:6`, `movil/src/screens/EditarPerfilScreen.jsx:26` |
| 5 | GET | `/afiliados/me/ciclos` | `getMisCiclos` ← MiPerfil, MiRutina, MiDieta | `movil/src/services/api.js:80`, `movil/src/screens/MiPerfilScreen.js:233`, `movil/src/screens/MiRutinaScreen.js:401`, `movil/src/screens/MiDietaScreen.js:246` |
| 6 | GET | `/afiliados/me/progreso` | `getMiProgreso` ← MiProgreso | `movil/src/services/api.js:82`, `movil/src/screens/MiProgresoScreen.js:229` |
| 7 | GET | `/afiliados/me/restricciones` | `getMisRestricciones` ← MiPerfil | `movil/src/services/api.js:84`, `movil/src/screens/MiPerfilScreen.js:234` |
| 8 | GET | `/planes/entrenamiento/:idCiclo` | `getPlanEntrenamiento` ← MiRutina | `movil/src/services/api.js:86`, `movil/src/screens/MiRutinaScreen.js:413` |
| 9 | GET | `/planes/nutricional/:idCiclo` | `getPlanNutricional` ← MiDieta | `movil/src/services/api.js:88`, `movil/src/screens/MiDietaScreen.js:259` |
| 10 | POST | `/afiliados/me/progreso-ejercicio` | `guardarProgresoEjercicio` ← MiRutina (guardar progreso del día) | `movil/src/services/api.js:95`, `movil/src/screens/MiRutinaScreen.js:553` |
| 11 | GET | `/afiliados/me/progreso-ejercicio/:idCiclo/:fecha` | `getProgresoEjercicioHoy` ← MiRutina | `movil/src/services/api.js:99`, `movil/src/screens/MiRutinaScreen.js:433` |
| 12 | POST | `/afiliados/me/agua` | `guardarAgua` ← MiDieta | `movil/src/services/api.js:103`, `movil/src/screens/MiDietaScreen.js:313` |
| 13 | GET | `/afiliados/me/agua/:fecha` | `getAguaHoy` ← MiDieta | `movil/src/services/api.js:107`, `movil/src/screens/MiDietaScreen.js:260` |
| 14 | POST | `/afiliados/me/consumo-alimento` | `guardarConsumoAlimento` ← MiDieta | `movil/src/services/api.js:111`, `movil/src/screens/MiDietaScreen.js:359` |
| 15 | GET | `/afiliados/me/agua/historial` | `getAguaHistorial` ← MiProgreso | `movil/src/services/api.js:115`, `movil/src/screens/MiProgresoScreen.js:230` |
| 16 | GET | `/afiliados/me/consumo/historial` | `getConsumoHistorial` ← MiProgreso | `movil/src/services/api.js:119`, `movil/src/screens/MiProgresoScreen.js:231` |
| 17 | GET | `/afiliados/me/progreso-ejercicio/historial` | `getProgresoEjercicioHistorial` ← MiProgreso | `movil/src/services/api.js:123`, `movil/src/screens/MiProgresoScreen.js:232` |
| 18 | PATCH | `/afiliados/me` | `actualizarMiPerfil` (api.js, sin uso en pantallas) / `actualizarPerfil` (perfilService) ← EditarPerfil | `movil/src/services/api.js:127`, `movil/src/services/perfilService.js:8`, `movil/src/screens/EditarPerfilScreen.jsx:46` |
| 19 | GET | `/planes/entrenamiento/:idCiclo/rutina/:diaNumero` | `getPlanRutinaDia` ← MiRutina | `movil/src/services/api.js:131`, `movil/src/screens/MiRutinaScreen.js:379` |
| 20 | POST | `/afiliados/me/notas-ejercicio` | `guardarNotaEjercicio` ← MiRutina | `movil/src/services/api.js:140`, `movil/src/screens/MiRutinaScreen.js:499` |
| 21 | GET | `/afiliados/me/notas-ejercicio` | `getMisNotasEjercicio` ← MiRutina | `movil/src/services/api.js:144`, `movil/src/screens/MiRutinaScreen.js:445` |
| 22 | PATCH | `/afiliados/me/notas-ejercicio/:idNota` | `actualizarNotaEjercicio` (solo definida; **ninguna pantalla la invoca**) | `movil/src/services/api.js:148` (definición); backend: `backend/routes/afiliadoRoutes.js:90` |
| 23 | POST | `/afiliados/me/registro-ejercicio` | `registrarEjercicioReal` (registroService) ← RegistroEjercicioScreen (vía `useMutation`) | `movil/src/services/registroService.js:4`, `movil/src/screens/RegistroEjercicioScreen.jsx:34` |
| 24 | POST | `/afiliados/me/consumo-alimento-real` | `registrarConsumoReal` (registroService) ← RegistroConsumoScreen (vía `useMutation`) | `movil/src/services/registroService.js:7`, `movil/src/screens/RegistroConsumoScreen.jsx:61` |
| 25 | GET | `/afiliados/me/registro-ejercicio/historial` | `getHistorialEjerciciosReales` ← MiProgreso | `movil/src/services/registroService.js:10`, `movil/src/screens/MiProgresoScreen.js:233` |
| 26 | GET | `/afiliados/me/consumo-alimento-real/historial` | `getHistorialConsumosReales` ← MiProgreso | `movil/src/services/registroService.js:13`, `movil/src/screens/MiProgresoScreen.js:234` |
| 27 | POST | `/afiliados/me/foto` | `api.post` directo con `FormData` multipart ← MiPerfilScreen (`handlePhoto`) | `movil/src/screens/MiPerfilScreen.js:293` |

### 4.1 Notas de conteo y de terminología

- **Endpoint fuera de la tabla (posible 28.º):** `PUT /usuarios/me/push-token` está implementado en `movil/src/services/notifications.js:44` (backend: `backend/routes/usuarioRoutes.js:47`) y se invoca tras el login y en el focus de MiPerfil (`movil/src/screens/LoginScreen.js:80`, `movil/src/screens/MiPerfilScreen.js:257`). Como vive en un servicio que no es `api.js` ni una pantalla, queda **fuera del conteo de 27**; si se incluyera, el total sería 28. Marcado aquí para no ocultar la discrepancia.
- **Helpers definidos pero sin invocación en pantallas:** `actualizarNotaEjercicio` (`movil/src/services/api.js:147-148`), `actualizarMiPerfil` (`movil/src/services/api.js:126-127`, su ruta sí se consume vía `perfilService`), `getHistorialCiclos` y `getRestricciones` (`movil/src/services/perfilService.js:10-12`).
- **Rutas relativas de fotos** no cuentan como endpoint: se componen con `API_URL` en `movil/src/screens/MiPerfilScreen.js:62`.
- El comentario de cabecera de `LoginScreen` dice que AuthContext "llama a `/auth/login`" (`movil/src/screens/LoginScreen.js:11`), pero la ruta real es `/login` (`movil/src/services/api.js:66`): es un desajuste de comentario, no de código.

---

## 5. Mapeo por pantalla (10 pantallas)

| # | Pantalla | Ruta de navegación | Endpoints que llama | Estados que maneja (verificados) | Qué muestra |
|---|---|---|---|---|---|
| 1 | `LandingScreen.js` | Stack público (`AppNavigator.js:143`) | Ninguno: contenido 100% estático (`movil/src/screens/LandingScreen.js:9-10,84-86`) | Sin estados de red | Hero con CTA a Login, KPIs, features, pasos, sede, footer |
| 2 | `LoginScreen.js` | Stack público | POST `/login` (vía `AuthContext.login`) | `loading` con spinner y `disabled` (`LoginScreen.js:58,154-166`); `error` en caja roja (`:116-120`); distingue error de red vs del servidor (`:82-87`); "vacío" = validación local de campos vacíos (`:72-75`) | Formulario correo/contraseña con toggle de visibilidad; éxito = navegación automática a tabs (el token ya está en contexto) |
| 3 | `RecuperarPasswordScreen.js` | Stack público | POST `/auth/recuperar-password`, POST `/auth/reset-password` | `loading` (spinner en botón, `:26,176-188`); `error` en caja roja (`:97-101`); `done` = mensaje de éxito (`:103-110`); `tokenInfo` = modo prueba sin SMTP (`:111-116,193-197`) | Dos fases: pedir correo → ingresar token + nueva contraseña (mín. 6 caracteres, `:55-58`) |
| 4 | `MiPerfilScreen.js` | Tab "Perfil" (`AppNavigator.js:103`) | GET `/afiliados/me`, GET `/afiliados/me/ciclos`, GET `/afiliados/me/restricciones`, POST `/afiliados/me/foto` | `loading` → spinner centrado (`:304-310`); error → `Alert 'No se pudo cargar el perfil.'` (`:241`); vacío → card "No tienes un ciclo asignado" (`:429-433`), secciones de historial/restricciones ocultas si están vacías (`:436,446`); `refreshing` con RefreshControl (`:259,383`); refetch en cada focus (`:251-254`) | Avatar (foto o iniciales), badge de rol, datos personales e IMC, ciclo activo, historial de ciclos, restricciones, botón Cerrar Sesión |
| 5 | `MiRutinaScreen.js` | Tab "Rutina" (`AppNavigator.js:104`) | GET `/afiliados/me/ciclos`, GET `/planes/entrenamiento/:idCiclo`, GET `/planes/entrenamiento/:idCiclo/rutina/:diaNumero`, GET `/afiliados/me/progreso-ejercicio/:idCiclo/:fecha`, GET `/afiliados/me/notas-ejercicio`, POST `/afiliados/me/progreso-ejercicio`, POST `/afiliados/me/notas-ejercicio` | `loading` → spinner (`:581-587`); error → pantalla centrada "No tenés un ciclo asignado." (`:407`) o "Error al cargar la rutina." (`:452`, render `:731-737`); vacío → "No hay ejercicios en tu plan actual." (`:783-786`); `refreshing` + botón ↻ "actualizando" (`:461-466`); sub-fetch de progreso y notas son defensivos (falla silenciosa, `:440,450`) | Cards por día con ejercicios (checkbox, series×reps·kg, instrucciones, nota al entrenador), selector de ciclo, chips de grupo muscular, barra flotante "Guardar Progreso" (oculta si hay error, `:810`) |
| 6 | `MiDietaScreen.js` | Tab "Dieta" (`AppNavigator.js:105`) | GET `/afiliados/me/ciclos`, GET `/planes/nutricional/:idCiclo`, GET `/afiliados/me/agua/:fecha`, POST `/afiliados/me/agua`, POST `/afiliados/me/consumo-alimento` | `loading` → spinner; error → "No tenés un ciclo asignado." (`:252`) o "Error al cargar el plan nutricional." (`:278`, render `:508-514`); vacío → "No hay alimentos en tu plan actual." (`:522-525`); `refreshing` (`:287`); el agua tiene fallback a 0 vasos si el GET falla (`:260`) | Widget de 8 vasos de agua (meta fija `MAX_VASOS`, `:45`), cards de comidas con % de progreso y checkboxes "consumido", barra flotante "Guardar Progreso" |
| 7 | `MiProgresoScreen.js` | Tab "Progreso" (`AppNavigator.js:106`) | 6 fuentes: GET `/afiliados/me/progreso`, GET `/afiliados/me/agua/historial`, GET `/afiliados/me/consumo/historial`, GET `/afiliados/me/progreso-ejercicio/historial`, GET `/afiliados/me/registro-ejercicio/historial`, GET `/afiliados/me/consumo-alimento-real/historial` | `loading` → spinner (`:255-261`); error → "Error al cargar el progreso." con icono (`:244,286-292`) — ver nota en apartado 6; vacío → "Aún no hay registros de progreso." (`:293-299`); `refreshing` (`:253`); historial: 5 fichas + "Ver historial completo" (`:264-265`) | Stats (peso actual, cambio, nº de registros), volumen total y kcal calculados de registros reales (`:273-274`), gráficos de peso/volumen/cumplimiento, historial y últimas secciones |
| 8 | `RegistroEjercicioScreen.jsx` | Stack sobre tabs (`AppNavigator.js:63`) | POST `/afiliados/me/registro-ejercicio` (vía `useMutation`) | Sin estado de carga de datos (recibe todo por `route.params`, `:27`); `loading` del botón (`useMutation`, `:34`); error → `Alert` con mensaje del servidor (`:40`); validación local de series/reps ≥ 1 (`:46-48`) | Formulario: fecha (local), ejercicio, series, repeticiones, peso opcional, notas; al éxito vuelve atrás (`:35-39`) |
| 9 | `RegistroConsumoScreen.jsx` | Stack sobre tabs (`AppNavigator.js:64`) | POST `/afiliados/me/consumo-alimento-real` (vía `useMutation`) | Sin carga inicial; `loading` (`:61`); error → `Alert` (`:69`); validación de gramos > 0 (`:74-76`); vista previa de macros en vivo (`:50-59`) | Formulario con cantidad en gramos, preview calculada de kcal/proteínas/carbs/grasas y resultado real del servidor con kcal guardadas (`:62-67`) |
| 10 | `EditarPerfilScreen.jsx` | Stack sobre tabs (`AppNavigator.js:65`) | GET `/afiliados/me` (vía `useApi(getPerfil)`), PATCH `/afiliados/me` (vía `useMutation`) | `loadingPerfil` → spinner a pantalla completa (`:84-92`); `loading` del submit (`:46`); éxito → `Alert` con IMC calculado y `goBack` (`:47-55`); error → `Alert` (`:56`); validaciones locales de peso/altura/correo (`:63-74`). **No muestra estado de error de la carga inicial** (el `error` de `useApi` no se consume, `:26`) | Campos peso, altura, teléfono, correo; banner de IMC en vivo; "Último peso registrado" |

Resumen por tipo de endpoint y pantalla:

- **Escrituras (POST/PATCH):** MiRutina (2), MiDieta (2), MiPerfil (1), EditarPerfil (1), RegistroEjercicio (1), RegistroConsumo (1), Login (1), RecuperarPassword (2) = 11 rutas de escritura.
- **Lecturas (GET):** el resto (16 rutas).

---

## 6. Tratamiento de errores y reintentos

Verificado en el código; **no hay ninguna lógica de reintento** en la app (búsqueda de `retry`/`reintent` en `movil/src` sin resultados).

| Situación | Comportamiento verificado | `archivo:línea` |
|---|---|---|
| Timeout | Axios aborta a los **10 s**; no hay reintento. El error cae en el catch de la pantalla/hook | `movil/src/services/api.js:23` |
| Fallo de red (sin respuesta del servidor) | `useApi`/`useMutation` traducen a `err?.response?.data?.error \|\| err?.message \|\| 'Error de conexión. Intentá de nuevo.'` | `movil/src/hooks/useApi.js:16`, `movil/src/hooks/useMutation.js:16` |
| Fallo de red en Login | Mensaje diferenciado: "Error de conexión. Verificá tu conexión a internet..." (distinto de error del servidor) | `movil/src/screens/LoginScreen.js:82-87` |
| Error del servidor (4xx/5xx) | Se muestra `err.response.data.error` si existe; si no, mensaje genérico | `movil/src/hooks/useMutation.js:16`, `movil/src/screens/RecuperarPasswordScreen.js:44,65` |
| Fallo parcial en carga múltiple | `MiProgreso` usa `Promise.allSettled`: cada fuente que rechaza se vacía por separado sin romper la pantalla | `movil/src/screens/MiProgresoScreen.js:228-242` |
| Fallo en sub-fetch secundario | En `MiRutina` el progreso del día y las notas se cargan con `try/catch` vacío: fallan en silencio | `movil/src/screens/MiRutinaScreen.js:440,450` |
| Fallo en un GET auxiliar | `getAguaHoy` lleva `.catch(() => ({ data: { vasos: 0 } }))` | `movil/src/screens/MiDietaScreen.js:260` |
| Fallo al guardar (optimista) | En `MiDieta`, `handleAgua` actualiza la UI primero y **revierte** el valor si `guardarAgua` falla (sin Alert) | `movil/src/screens/MiDietaScreen.js:308-319` |
| Fallo al guardar (con confirmación) | `MiRutina.handleSave` y `MiDieta.handleSave` muestran `Alert` de error y apagan el spinner en `finally` | `movil/src/screens/MiRutinaScreen.js:555-560`, `movil/src/screens/MiDietaScreen.js:361-365` |
| Reintentos automáticos | **No existen.** El único "reintento" es manual: pull-to-refresh, botón ↻ y re-fetch al ganar el focus | `movil/src/screens/MiPerfilScreen.js:251-259`, `movil/src/screens/MiRutinaScreen.js:461-466` |
| Detección de conectividad (offline) | **No verificable que exista**: no hay uso de NetInfo ni de `@react-native-community/net-info` en `movil/package.json` ni en `movil/src` |

Nota de análisis (no es un bug reportado): en `MiProgresoScreen` el `catch` que dispara "Error al cargar el progreso." es casi inalcanzable porque `Promise.allSettled` no rechaza (`movil/src/screens/MiProgresoScreen.js:228-244`); en la práctica esa pantalla muestra el estado vacío en vez de error. **Marcado como observación, no verificado en runtime.**

---

## 7. Manejo de token y sesiones

| Evento | Qué pasa | `archivo:línea` |
|---|---|---|
| Login OK | `accessToken` guardado en AsyncStorage + estado en memoria | `movil/src/context/AuthContext.js:78-85` |
| Cada petición | Interceptor lee AsyncStorage y agrega `Bearer` | `movil/src/services/api.js:32-41` |
| Arranque de la app | `restoreSession` lee storage; exige `role` para activar sesión; `loading` gatea la navegación | `movil/src/context/AuthContext.js:46-63`, `movil/src/navigation/AppNavigator.js:131-133` |
| Token expirado (401) | Interceptor borra las 3 claves (salvo en `/login`) | `movil/src/services/api.js:50-59` |
| Efecto visible de ese 401 | **No inmediato**: el AuthContext no es notificado, así que la UI sigue en las tabs hasta que la app se reinicie y `restoreSession` no encuentre token | `movil/src/context/AuthContext.js:46-63` (no hay listener de storage ni `setToken(null)` fuera de `logout`, `:96`) |
| Logout manual | Borra storage + estado → `AppNavigator` vuelve al stack público | `movil/src/context/AuthContext.js:94-98`, `movil/src/navigation/AppNavigator.js:139-146` |
| Expiración local del JWT | No se decodifica ni se programa ningún temporizador en el cliente | **No verificable / no encontrado en `movil/src`** |
| Duración del JWT | 8 h en backend (`JWT_EXPIRES_IN=8h`); token de reset de contraseña 15 min | `.env.example`, `backend/services/authService.js:27,62-65` |

---

## 8. Casos especiales verificados en el código

### 8.1 Registro de progreso de ejercicios (dos mecanismos distintos)

1. **Marcado diario del plan** (checkbox "completado"): `MiRutina.handleSave` arma `[{ id_ejercicio, completado }]` y llama `guardarProgresoEjercicio(ciclo, hoy, ejercicios)` → POST `/afiliados/me/progreso-ejercicio`. Alert de éxito/error y spinner en el botón flotante. `movil/src/screens/MiRutinaScreen.js:545-561`, contrato en `movil/src/services/api.js:90-95`. El estado se precarga desde GET `/afiliados/me/progreso-ejercicio/:idCiclo/:fecha` (`movil/src/screens/MiRutinaScreen.js:433`).
2. **Registro real por serie**: el botón "+" de cada ejercicio navega a `RegistroEjercicio` con `{ id_ciclo, id_rutina, orden, nombre, nombre_rutina }` (`movil/src/screens/MiRutinaScreen.js:522-530`); la pantalla envía series, repeticiones, peso y notas con fecha local → POST `/afiliados/me/registro-ejercicio`. `movil/src/screens/RegistroEjercicioScreen.jsx:43-60`. Ese registro alimenta el volumen total de MiProgreso (`movil/src/screens/MiProgresoScreen.js:273`).

### 8.2 Consumo de alimentos (también dos mecanismos)

1. **Checkboxes del plan**: `MiDieta.handleSave` arma `[{ id_alimento, num_comida, consumido }]` → POST `/afiliados/me/consumo-alimento` (`movil/src/screens/MiDietaScreen.js:350-366`). Observación: `consumidos` se reinicia a `{}` en cada carga (`movil/src/screens/MiDietaScreen.js:276`) y **no hay GET del consumo del día** en esta pantalla, por lo que los checks no se restauran desde el servidor (solo el agua sí, vía `getAguaHoy`). **Marcado como limitación, verificado en código.**
2. **Registro real con gramos**: `openRegistro` pasa los macros por 100 g del alimento (`movil/src/screens/MiDietaScreen.js:330-343`); `RegistroConsumoScreen` calcula una vista previa local de kcal/macros y envía `cantidad_g_consumida` → POST `/afiliados/me/consumo-alimento-real` (`movil/src/screens/RegistroConsumoScreen.jsx:72-86`). El backend devuelve `calorias_consumidas`, que se muestra en el Alert (`:64-65`) y se suma en MiProgreso (`movil/src/screens/MiProgresoScreen.js:274`).

### 8.3 Recuperación de contraseña

- Solicitud: `solicitarRecuperacion(email)` → POST `/auth/recuperar-password` (`movil/src/screens/RecuperarPasswordScreen.js:37`).
- Si el backend responde en **modo prueba (sin SMTP)** con `{ modoPrueba, token }`, la pantalla muestra el token en pantalla y habilita el formulario de reset (`movil/src/screens/RecuperarPasswordScreen.js:38-42,111-116,193-197`); si no, muestra el mensaje genérico de éxito (`:103-110`).
- Reset: `resetPasswordRequest(token, nuevaPassword)` → POST `/auth/reset-password`, con validación local de longitud ≥ 6 (`movil/src/screens/RecuperarPasswordScreen.js:55-58,62`).
- El backend aplica rate limit en la solicitud (`recuperarLimiter`, `backend/routes/authRoutes.js:109`) y el enlace de email apunta al frontend web, no a la app (`backend/controllers/authController.js:161`); ese detalle **no está implementado en la app móvil** (no hay pantalla que consuma enlaces deep-link, **no verificable** que exista otro mecanismo).

### 8.4 Subida de foto de perfil

- Pide permiso de galería con `expo-image-picker`; si se niega, Alert y aborta (`movil/src/screens/MiPerfilScreen.js:277-281`).
- Selecciona con `quality: 0.7` y arma `FormData` con `{ uri, name, type }` (`:282-291`).
- POST `/afiliados/me/foto` con header explícito `Content-Type: multipart/form-data` (`:293-295`); éxito → Alert + `onRefresh()`; error → `console.error` + Alert genérico (`:296-301`).
- Las fotos devueltas con ruta relativa se completan con `API_URL` al renderizar el avatar (`movil/src/screens/MiPerfilScreen.js:62`); el backend monta la ruta estática `/uploads` (`backend/server.js:122`) y expone la ruta en `POST /afiliados/me/foto` (`backend/routes/afiliadoRoutes.js:608`).

---

## 9. Diferencias web vs móvil (por qué 27 de 91)

### 9.1 Qué hace el móvil que la web no

- Push notifications: registro del Expo Push Token → `PUT /usuarios/me/push-token` (`movil/src/services/notifications.js:44`), activado tras login y en el focus de MiPerfil (`movil/src/screens/LoginScreen.js:80`, `movil/src/screens/MiPerfilScreen.js:257`).
- Subida de foto de perfil desde el dispositivo con `expo-image-picker` → `POST /afiliados/me/foto` (`movil/src/screens/MiPerfilScreen.js:293`).
- Persistencia de sesión en AsyncStorage con gate de `loading` (patrón móvil, `movil/src/context/AuthContext.js:5-12`).
- Selector de ciclo + rutina del día filtrada por grupo muscular dentro de la propia pantalla (`movil/src/screens/MiRutinaScreen.js:364-384`).

### 9.2 Qué hace la web que el móvil no

La web (`frontend_web/src/views/`) tiene vistas de staff/administración que no existen en la app: `AdminDashboard`, `Dashboard`, `AfiliadosView`, `GestionPersonal`, `RutinasView`, `DietasView`, `PagosView`, `FinanzasView`, `RestriccionesAdmin`, `ProgresoAfiliado`, `LandingPage`. En consecuencia consume también los dominios de backend que el móvil ignora por completo (verificado: `movil/src` no contiene ninguna llamada a `/catalogo`, `/pagos`, `/dashboard`, `/configuracion`, `/notificaciones` GET, ni a `/usuarios` salvo el push-token):

| Router backend | Endpoints | ¿Los usa el móvil? |
|---|---|---|
| `afiliadoRoutes.js` | 40 | Sí, la mayor parte del subconjunto propio |
| `planRoutes.js` | 15 | Sí (3 rutas de plan/rutina) |
| `catalogoRoutes.js` | 12 | No |
| `usuarioRoutes.js` | 7 | Solo `PUT /me/push-token` |
| `progresoRoutes.js` | 4 | No (el móvil usa las rutas `/afiliados/me/progreso*`) |
| `authRoutes.js` | 3 | Sí (las 3) |
| `pagoRoutes.js` / `pagoAdminRoutes.js` | 2 + 2 | No |
| `cicloRoutes.js` | 2 | No (el móvil lee ciclos vía `/afiliados/me/ciclos`) |
| `configuracionRoutes.js` | 2 | No |
| `dashboardRoutes.js` | 1 | No |
| `notificacionRoutes.js` | 1 | No |
| **Total** | **91** | **27 consumidos por el móvil** |

### 9.3 Diferencias técnicas de cliente

| Aspecto | Móvil | Web |
|---|---|---|
| Cliente HTTP | axios con instancia única + interceptores (`movil/src/services/api.js:21-59`) | `authAxios` propio del web, según compara el propio AuthContext móvil (`movil/src/context/AuthContext.js:10-12`) |
| Storage | AsyncStorage (asíncrono → estado `loading`) | localStorage (síncrono) (`movil/src/context/AuthContext.js:5-9`) |
| Roles | Un solo rol visible: afiliado (4 tabs) (`movil/src/navigation/AppNavigator.js:103-107`) | Matriz de permisos por rol (ADMINISTRADOR, ENTRENADOR, RECEPCIONISTA, NUTRICIONISTA) — ver `documentacion/AUDITORIA_METAFIT.md:117-158` |
| Base URL | Hardcodeada (`movil/src/services/api.js:18`) | Configurada en el cliente web (fuera del alcance de este documento) |

El desglose por rol de la web está documentado en `AUDITORIA_METAFIT.md` §3; el mapa de arranque y de la cadena de rutina, en `TRAZABILIDAD_MOVIL_RUTINA.md` (apartados 2 a 4).

---

## 10. Problemas conocidos y limitaciones

| # | Problema | `archivo:línea` | Detalle |
|---|---|---|---|
| 1 | **Test flaky** | `movil/src/screens/__tests__/RecuperarPasswordScreen.test.js:39` | El test "envía el correo y muestra el mensaje de éxito cuando el envío es real" espera en `waitFor` solo a que el mock sea llamado (`:49-51`) y acto seguido afirma de forma síncrona el texto de éxito (`:52-54`), sin esperar el estado `setDone(true)`; la actualización de estado puede no haberse propagado aún → fallo intermitente. |
| 2 | **Hook condicional** | `movil/src/screens/MiPerfilScreen.js:335` | `useTheme()` se invoca **después** del return anticipado `if (loading) return ...` (`:304-310`): el número de hooks cambia entre renders (violación de las Rules of Hooks). Debe moverse arriba del return. |
| 3 | Base URL hardcodeada | `movil/src/services/api.js:18` | No usa `EXPO_PUBLIC_API_URL`; tarea abierta en `documentacion/AUDITORIA_METAFIT.md:314`. Ver apartado 2.2. |
| 4 | El 401 no cierra la sesión en UI | `movil/src/services/api.js:54-56` vs `movil/src/context/AuthContext.js:96` | El interceptor borra el storage pero nadie hace `setToken(null)`: la app queda montada con un token ya caducado en memoria hasta el siguiente arranque. |
| 5 | Sin reintentos ni detección offline | `movil/src/services/api.js:23` | Timeout de 10 s y nada más; no hay NetInfo ni retry. Ver apartado 6. |
| 6 | `actualizarNotaEjercicio` sin uso | `movil/src/services/api.js:147-148` | Helper definido (y ruta soportada por el backend en `backend/routes/afiliadoRoutes.js:90`) pero ninguna pantalla lo invoca: no se puede editar una nota ya guardada desde la app. |
| 7 | Checkboxes de consumo no se restauran | `movil/src/screens/MiDietaScreen.js:276` | `setConsumidos({})` en cada fetch y no hay GET del consumo del día en MiDieta; solo el agua sí se recupera (`:260`). |
| 8 | Error de carga invisible en EditarPerfil | `movil/src/screens/EditarPerfilScreen.jsx:26` | `useApi` devuelve `error` pero solo se destructura `data` y `loading`: si el GET falla, la pantalla queda sin datos y sin mensaje (solo el spinner desaparece). |
| 9 | Error casi inalcanzable en MiProgreso | `movil/src/screens/MiProgresoScreen.js:228-244` | Con `Promise.allSettled` el `catch` del `try` externo rara vez se ejecuta; el estado de error se ve poco y el estado vacío se muestra en su lugar. |
| 10 | Comentario de cabecera desactualizado | `movil/src/screens/LoginScreen.js:11` | Dice "`/auth/login`" pero la ruta real es `/login` (`movil/src/services/api.js:66`). |
| 11 | Token de reset visible en pantalla (modo prueba) | `movil/src/screens/RecuperarPasswordScreen.js:193-197` | Solo aplica cuando el backend responde `modoPrueba`; es intencional para desarrollo sin SMTP, pero debe desactivarse en producción. **Marcado como riesgo de diseño, no como bug.** |
| 12 | Sin guard de rol en la app móvil | `documentacion/AUDITORIA_METAFIT.md:314` | El móvil no verifica el rol más allá de exigir `role` al restaurar la sesión (`movil/src/context/AuthContext.js:52`); cualquier rol con token accede a las 4 tabs. Tarea abierta en la auditoría. |

---

## 11. Documentación relacionada

- **`documentacion/TRAZABILIDAD_MOVIL_RUTINA.md`** — documento hermano: arranque de la app móvil, asignación de rutina (web → BD), consulta de rutina (móvil → BD), tablas, JWT, progreso y volumen (324 líneas; secciones 1 a 7). *No se repite aquí.*
- **`documentacion/API_REST_METAFIT.md`** — catálogo completo de los 91 endpoints del backend.
- `documentacion/AUDITORIA_METAFIT.md` — auditoría general (permisos por rol, tareas abiertas del móvil).
- `documentacion/entregables/Manual_Tecnico_MetaFit.docx` — referencia a `EXPO_PUBLIC_API_URL` (ver § App Móvil) y `documentacion/entregables/Diagrama_de_Despliegue_MetaFit.drawio` — diagrama de despliegue.
- `documentacion/entregables/Manual_de_Instalacion_MetaFit.docx` — empaquetado, descarga y despliegue del APK.

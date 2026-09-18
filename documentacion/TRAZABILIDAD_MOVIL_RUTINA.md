# Trazabilidad Completa del Proyecto Móvil MetaFit

**Propósito:** Documentar, con archivos, funciones y líneas **reales** del código, la trazabilidad de los tres flujos exigidos para sustentación:

1. **Inicio de la app móvil** — desde `package.json` hasta la pantalla "Mi Rutina".
2. **Asignación de rutina** — entrenador (web) → API → base de datos.
3. **Consulta de rutina** — móvil → API → base de datos (incluye progreso, notas y registro real).

> Regla de verificación aplicada: cada archivo, función, endpoint y línea citado fue leído/verificado directamente en el código. Nada se asumió. Todo lo que no existe o difiere de la idea "clásica" se marca explícitamente con **[NOTA]**.

---

## 1. Estructura de carpetas REAL (verificada)

```
Equipo_Metafit/
├── movil/                      # App móvil (Expo + React Native, JS)
│   ├── package.json           # "main": "node_modules/expo/AppEntry.js"  (línea 3)
│   ├── app.json               # config Expo: slug movil, owner sebas-carva07, EAS projectId
│   ├── App.js                 # Entry real: registro del componente raíz
│   └── src/
│       ├── screens/           # Landing, Login, MiRutina, RegistroEjercicio, MiProgreso...
│       ├── navigation/        # AppNavigator.js (stack público + MainTabs + RootStack)
│       ├── context/           # AuthContext.js, ThemeContext.jsx
│       ├── services/          # api.js (axios), registroService.js
│       ├── utils/             # cicloUtils.js
│       └── theme/             # paleta (COLORS, GRADIENTS, FONTS, SPACING...)
├── frontend_web/               # Dashboard web (React)
│   └── src/
│       ├── views/             # RutinasView.jsx (asignación de rutinas)
│       ├── services/          # afiliadosService.js
│       ├── context/           # AuthContext.jsx (expone authAxios)
│       └── utils/             # analytics.js (trackEvent)
├── backend/                    # API REST (Node + Express + MySQL con mysql2/promise)
│   ├── routes/                # afiliadoRoutes.js, planRoutes.js, authRoutes.js, catalogoRoutes.js
│   ├── controllers/           # afiliadoController.js, planController.js, registroController.js
│   ├── services/              # afiliadoService.js, registroService.js, notificacionesService.js
│   ├── models/                # conexion.js, cicloModel.js, planModel.js, seguimientoDiarioModel.js,
│   │                          # notaEjercicioModel.js, registroEjercicioModel.js,
│   │                          # progresoDiarioModel.js, catalogoModel.js
│   └── middlewares/           # auth.js (requireAuth, requireOwnCiclo)
└── database/                   # scripts SQL (001_esquema_metafit.sql, 002_datos_iniciales.sql, ...)
```

**[NOTA]** La app **no tiene `index.js`** en su raíz: Expo SDK 55 resuelve el `"main"` de `package.json` a `node_modules/expo/AppEntry.js`, que es quien carga el `App.js` del proyecto (verificado leyendo el archivo).

**[NOTA]** La API del backend **NO usa prefijo `/api`** (no es un error; es la convención real del repo). La URL de producción apunta a `https://metafit-backend-rr18.onrender.com`.

---

## 2. Bloque 1 — Inicio de la app móvil hasta "Mi Rutina"

### 2.1 Cadena de arranque (archivo → línea)

| Paso | Archivo:Línea | Qué hace |
|---|---|---|
| 1 | `movil/package.json:3` | `"main": "node_modules/expo/AppEntry.js"` → Expo sabe dónde arrancar. |
| 2 | `movil/node_modules/expo/AppEntry.js:1-5` | `import registerRootComponent from 'expo/src/launch/registerRootComponent'` + `import App from '../../App'` + `registerRootComponent(App)`. Es el "mount": registra `App` en el `AppRegistry` nativo. |
| 3 | `movil/App.js:1` | `import 'react-native-gesture-handler'` (debe ir antes que todo). |
| 4 | `movil/App.js:4-6` | Importa `AuthProvider` (src/context/AuthContext), `ThemeProvider` y `useTheme` (src/context/ThemeContext), y `AppNavigator` (src/navigation). |
| 5 | `movil/App.js:8-16` | Componente `Root()`: lee `isDark` del contexto de tema y aplica `StatusBar` con estilo acorde. |
| 6 | `movil/App.js:18-26` | `App()` envuelve todo: **`<ThemeProvider><AuthProvider><Root/></AuthProvider></ThemeProvider>`**. |

### 2.2 ¿Qué renderiza cada provider y de dónde sale el tema?

**ThemeContext (`movil/src/context/ThemeContext.jsx`)**
- `LIGHT_PALETTE` (líneas 8-20): paleta light completa (bg, bgCard, text, red, etc.).
- `STORAGE_KEY = 'metafit_theme_movil'` (línea 22): persistencia en AsyncStorage.
- `swapPalette(isDark)` (líneas 26-28): **muta en el lugar** el objeto compartido `COLORS` (`Object.assign`), por eso todos los componentes que usan `COLORS.xxx` cambian al instante.
- `ThemeProvider` (líneas 37-67): `useColorScheme` (línea 38); estado `mode` con default **'dark'** (línea 39); al montar lee el valor guardado de AsyncStorage (líneas 41-45); `isDark = mode==='dark' || (mode==='system' && scheme!=='light')` (línea 47); aplica `swapPalette(isDark)` (línea 48); expone `toggle()` (líneas 50-55) y `setModeSeguido` (57-60).

**AuthContext (`movil/src/context/AuthContext.js`)**
- Claves de sesión desde `services/api.js`: `TOKEN_KEY = 'metafit_token'`, `USER_KEY = 'metafit_user'`, `ROLE_KEY = 'metafit_role'` (api.js:12-14).
- `restoreSession` (líneas 46-63): `AsyncStorage.multiGet` de las 3 claves; si hay token + usuario con rol, setea estado; al final **siempre** `setLoading(false)` → libera el gate.
- `login` (líneas 74-87): llama `loginRequest` (→ `POST /login`), y si responde con `{token, user}` hace `multiSet` de las 3 claves y actualiza estado.
- `logout` (líneas 94-98): `multiRemove` de las 3 claves y limpia estado.

**Cliente HTTP (`movil/src/services/api.js`)**
- `API_URL = 'https://metafit-backend-rr18.onrender.com'` (línea 18).
- Instancia axios `timeout: 10000` (líneas 21-25).
- **Interceptor de request** (líneas 32-41): lee el token desde AsyncStorage y lo inyecta como `Authorization: Bearer <token>` en cada petición.
- **Interceptor de response** (líneas 50-59): si el servidor responde `401` (y no fue una llamada a `/login`), borra token/usuario/rol para volver al stack público.

### 2.3 Navegación (`movil/src/navigation/AppNavigator.js`)

- `TAB_ICONS` (líneas 45-50) y `LoadingScreen` (líneas 36-42): spinner mientras `loading` sea true.
- `RootStack` (líneas 59-68): pantalla base `MainTabs` + pantallas a pantalla completa `RegistroEjercicio`, `RegistroConsumo`, `EditarPerfil`.
- `MainTabs` (líneas 77-109): bottom-tab con 4 pestañas — **Perfil, Rutina, Dieta, Progreso** — cada una con `tabBarIcon` (Ionicons) y color `COLORS.purpleLight`. La pestaña **Rutina** monta `MiRutinaScreen`.
- `AppNavigator` (líneas 127-150):
  1. Si `loading` → `LoadingScreen` (espera la restauración de sesión).
  2. `NavigationContainer` con `key={isDark ? 'd' : 'l'}` (línea 131): clave distinta por tema fuerza remount limpio al cambiar tema.
  3. **Si hay token** → `RootStack`; **si no** → stack público `Landing → Login → RecuperarPassword` (línea 146).

### 2.4 Flujo de login (acceso a "Mi Rutina")

1. `LandingScreen` (`movil/src/screens/LandingScreen.js`): contenido 100 % estático (KPIS/FEATURES/STEPS/SEDE_STATS, líneas 25-75). Dos CTAs idénticos navegan a `Login` (líneas 110-111 y 238-239). No consume endpoints.
2. `LoginScreen` (`movil/src/screens/LoginScreen.js:71-91`): `handleLogin` → `await login(correo, contrasena)` (línea 79, del contexto) y luego activa push notifications (`activarPushNotifications()`, backend `notificacionesService`).
3. Al quedar `token` en el contexto, `AppNavigator` (que ya no está en modo loading) **re-renderiza solo** y conmuta al `RootStack` (línea 143): aquí el usuario ve el bottom-tab y pulsa **"Rutina"** (segunda pestaña), montando `MiRutinaScreen`.

### 2.5 Diagrama de arranque

```
package.json ("main")
   └── expo/AppEntry.js  (registerRootComponent)
        └── App.js
             ├── ThemeProvider (lee paleta AsyncStorage 'metafit_theme_movil', default dark)
             │   └── AuthProvider (restoreSession: lee token/user/role de AsyncStorage)
             │       └── Root
             │           └── StatusBar estilo según isDark
             │               └── AppNavigator (NavigationContainer)
             │                   ├── loading? ──► LoadingScreen (spinner)
             │                   ├── ¿token? ──► NO ► Landing (CTA login) ► Login
             │                   │                 └─ login: POST /login {email,password}
             │                   │                    └─ guarda 3 claves AsyncStorage
             │                   └── ¿token? ──► SÍ ► re-render ► RootStack
             │                                   │   └── MainTabs ► Tab "Rutina" ► MiRutinaScreen
```

---

## 3. Bloque 2 — Asignación de rutina (entrenador web → BD)

### 3.1 Flujo en el frontend web (`frontend_web/src/views/RutinasView.jsx`)

- `const { user, authAxios } = useAuth()` (línea 67). `authAxios` es la instancia axios con el token inyectado, expuesta por `frontend_web/src/context/AuthContext.jsx` (valor del provider, línea 109: `authAxios: axiosRef.current`).
- `DAY_LABELS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]` (línea 27).
- **Carga inicial:**
  - `getAfiliados()` → `GET /afiliados` (líneas 106-114).
  - `loadCatalogo()` → `GET /catalogo/ejercicios` (líneas 123-129).
- **Al elegir afiliado** `handleAfiliadoSelect` (líneas 180-194): `GET /afiliados/${id}/ejercicios-disponibles` (línea 187) → arma el plan con los ejercicios ya disponibles para ese afiliado; `addEjercicioToRutina` (líneas 201-205) agrega ejercicio con valores por defecto `{series:3, repeticiones:12, dia_numero:1}`.
- **Botón "Asignar Rutina" → `handleAsignar` (líneas 241-340):**

```text
1. Valida: afiliado + al menos 1 ejercicio (l.243-249).
2. CICLO (l.254-269):
     si el afiliado ya tiene cicloActivo → reutiliza su id_ciclo
     si no → POST /afiliados/ciclos {id_usuario, fecha_inicio: hoy,
             fecha_fin: hoy+90 días, objetivo_fisico, nivel_experiencia,
             disponibilidad_dias}                      (l.260)
3. PLAN DE ENTRENAMIENTO (l.272-283):
     GET /planes/entrenamiento/:idCiclo
        ├─ 404       → POST /planes/entrenamiento {id_ciclo, observaciones}  (l.282)
        └─ existe    → PATCH /planes/entrenamiento/:id                       (l.280)
4. Agrupa ejercicios por día (l.293-300).
5. Por CADA día con ejercicios (l.302-328):
     a. Si ya existía rutina ese día → DELETE /planes/rutinas/:idRutina      (l.307)
     b. POST /planes/rutinas {id_ciclo, nombre_rutina: "Rutina <Día>",
                              enfoque_muscular: "Full Body", dia_numero}     (l.313)
     c. Por cada ejercicio → POST /planes/rutinas/:idRutina/ejercicios
                             {id_ejercicio, series, repeticiones, orden: i+1} (l.321)
6. Toast de éxito + trackEvent("metaFit_rutina_asignada", {afiliado_id})      (l.331)
   + closeModal() + recarga afiliados.
```

### 3.2 Endpoints del backend usados (en orden) con cadena completa

> Middlewares en `backend/middlewares/auth.js`: `requireAuth` línea **43**; `requireOwnCiclo` línea **190** (Admin/Entrenador pasan directo; para rol Afiliado consulta `CicloModel.findById`, con 400 si no llega `id_ciclo`, 404 si no existe el ciclo, 403 si no es suyo).

| # | Endpoint | Route:Línea | Controller:Línea | Service:Línea | Model:Línea | SQL / Resumen |
|---|---|---|---|---|---|---|
| 1 | `POST /afiliados/ciclos` | `afiliadoRoutes.js:752` | `AfiliadoController.createCiclo` | `AfiliadoService.createCiclo` (afiliadoService.js:166) | `CicloModel.create` (cicloModel.js:66) | Transacción: `UPDATE CICLO SET activo=0 WHERE id_usuario AND activo=1` y luego `INSERT INTO CICLO` (fecha_inicio/fecha_fin, objetivo_fisico, nivel_experiencia, disponibilidad_dias, registrado_por). |
| 2 | `GET /planes/entrenamiento/:id_ciclo` | `planRoutes.js:77` | `PlanController.getEntrenamiento` (planController.js:24) | — (directo a modelo) | `PlanModel.getEntrenamientoByCiclo` (planModel.js:32) | `SELECT id_ciclo, modificado_por, observaciones FROM PLAN_ENTRENAMIENTO WHERE id_ciclo=?`; con `JSON_ARRAYAGG` de rutinas y sus ejercicios (LEFT JOIN RUTINA_EJERCICIO + EJERCICIO). 404 si no existe plan. |
| 3 | `POST /planes/entrenamiento` | `planRoutes.js:174` | `PlanController.createEntrenamiento` (planController.js:77) | — | `PlanModel.createEntrenamiento` (planModel.js:152) | `INSERT INTO PLAN_ENTRENAMIENTO (id_ciclo, modificado_por, observaciones)`. Luego notificación push al usuario del ciclo. `ER_DUP_ENTRY` → error 400. |
| 4 | `PATCH /planes/entrenamiento/:id` | `planRoutes.js:203` | `PlanController.updateEntrenamiento` | — | `PlanModel.updateEntrenamiento` (planModel.js:170) | `UPDATE PLAN_ENTRENAMIENTO SET observaciones=?, modificado_por=? WHERE id_plan_entrenamiento=?`. |
| 5 | `DELETE /planes/rutinas/:id_rutina` | `planRoutes.js:386` | `PlanController.deleteRutina` (planController.js:252) | — | `PlanModel.deleteRutina` (planModel.js:293) | Transacción: `DELETE ... FROM RUTINA_EJERCICIO` + `DELETE FROM RUTINA WHERE id_rutina=?`. |
| 6 | `POST /planes/rutinas` | `planRoutes.js:246` | `PlanController.createRutina` (planController.js:127, valida dia_numero 1-7) | — | `PlanModel.createRutina` (planModel.js:192) | `INSERT INTO RUTINA (id_ciclo, nombre_rutina, enfoque_muscular, dia_numero)`. |
| 7 | `POST /planes/rutinas/:id_rutina/ejercicios` | `planRoutes.js:289` | `PlanController.addEjercicio` (planController.js:156) | — | `PlanModel.addEjercicioToRutina` (planModel.js:212) | `INSERT INTO RUTINA_EJERCICIO (id_rutina, orden, id_ejercicio, series, repeticiones)`. |

### 3.3 Tablas afectadas en la base

| Tabla | Rol en el flujo |
|---|---|
| `CICLO` | Representa la suscripción de 90 días del afiliado. PK `id_ciclo`. |
| `PLAN_ENTRENAMIENTO` | Registro cabecera del plan por ciclo (PK `id_ciclo`, FK a CICLO). |
| `RUTINA` | Rutina por día del ciclo (PK `id_rutina`, FK `id_ciclo`). **NO** tiene FK a PLAN_ENTRENAMIENTO. |
| `RUTINA_EJERCICIO` | Ejercicios de cada rutina con `orden, series, repeticiones` (FK `id_rutina` y `id_ejercicio`). |

**[NOTA]** El esquema real NO tiene `id_plan_entrenamiento` dentro de `RUTINA`: la rutina cuelga **directo del ciclo** (`RUTINA.id_ciclo`). Es consistente con el `JSON_ARRAYAGG` de `getEntrenamientoByCiclo`, que une `PLAN_ENTRENAMIENTO` con las rutinas **por id_ciclo**, no por id de plan.

### 3.4 Ejemplo real de request/response

`POST /planes/rutinas/:id_rutina/ejercicios` (paso 5c):

```json
// REQUEST
POST /planes/rutinas/42/ejercicios
Authorization: Bearer eyJ...
Content-Type: application/json
{
  "id_ejercicio": 17,
  "series": 3,
  "repeticiones": 12,
  "orden": 1
}
// RESPONSE 201
{
  "ok": true,
  "ejercicio": { "id_rutina_ejercicio": 99, "id_rutina": 42, "orden": 1,
                 "id_ejercicio": 17, "series": 3, "repeticiones": 12 }
}
```

`POST /afiliados/ciclos` (paso 2):

```json
// REQUEST
POST /afiliados/ciclos
Authorization: Bearer eyJ...
{
  "id_usuario": 7,
  "fecha_inicio": "2026-09-01",
  "fecha_fin": "2026-11-30",
  "objetivo_fisico": "Fuerza",
  "nivel_experiencia": "Intermedio",
  "disponibilidad_dias": 3,
  "registrado_por": 1
}
// RESPONSE 201 -> { "ok": true, "ciclo": { "id_ciclo": 210, ... } }
```

---

## 4. Bloque 3 — Consulta de rutina (móvil → BD)

### 4.1 Montaje de la pantalla (`movil/src/screens/MiRutinaScreen.js`)

- Export del componente en línea 340; `const navigation = useNavigation()` en línea 341.
- Cálculo de hoy (`hoy`, `diaSemana`, `diaNumeroHoy`) en líneas 360-362.
- **`fetchData()` (líneas 398-457) — lo que sucede al montar (efecto en línea 459):**

```text
l.401  getMisCiclos()            -> GET /afiliados/me/ciclos
l.405  ciclo = seleccionarCicloActivo(ciclos)   // cicloUtils.js:10-13
         // busca ciclos con activo == 1; si no, usa ciclos[0]
l.406-409  si no hay ciclo -> estado error "No tenés un ciclo asignado."
l.413  getPlanEntrenamiento(ciclo.id_ciclo)   -> GET /planes/entrenamiento/:id_ciclo
l.416-424  aplana las rutinas del plan en una lista de ejercicios
         (id_rutina, id_ejercicio, nombre, series, reps, kg, dia_numero, grupo_muscular)
l.428  loadRutinaDia(ciclo.id_ciclo, diaNumeroHoy)   // ver 4.2
l.430-441 getProgresoEjercicioHoy(ciclo, hoy)
         -> GET /afiliados/me/progreso-ejercicio/:idCiclo/:fecha
         -> arma mapa { id_ejercicio: completado } para hoy
l.444-450 getMisNotasEjercicio(ciclo)
         -> GET /afiliados/me/notas-ejercicio?ciclo=<id>
         -> arma mapa { id_ejercicio: nota }
```

- Utilidad de selección de ciclo — `movil/src/utils/cicloUtils.js`:
  - `seleccionarCicloActivo` (líneas 10-13): `ciclos.find(c => c.activo == 1) || ciclos[0]` — si no existe ninguno con `activo`, usa el primero (la lista llega ordenada por `fecha_inicio DESC`).
  - `esCicloActivo` (línea 15) y `formatearFecha` (líneas 18-19).

### 4.2 Carga de la rutina del día (`loadRutinaDia`, líneas 375-384)

- `getPlanRutinaDia(cicloId, diaNumero)` (definido en `services/api.js`) → `GET /planes/entrenamiento/:id_ciclo/rutina/:dia_numero`.
- Backend: `planRoutes.js:129` → `PlanController.getRutinaDiaria` (planController.js:47; valida `dia_numero` entre 1 y 7) → `PlanModel.getRutinaDiaria` (planModel.js:96): selecciona las rutinas del ciclo cuyo `dia_numero` coincide y filtra por grupo muscular; **si el día no tiene rutina definida hay fallback** a la primera rutina del ciclo que sí exista. Así, el chip del grupo muscular ("Full Body", etc.) se muestra solo cuando llega dato del backend.

### 4.3 Acciones principales de la pantalla

- **Aplanar el plan** (líneas 416-424): un solo array de ejercicios con su `id_rutina`, `dia_numero`, nombre, series, repeticiones, kg y `grupo_muscular`.
- **`toggleEjercicio`** (líneas 510-512): conmuta el `completado` local del ejercicio (no persiste hasta guardar).
- **`openRegistro`** (líneas 522-530): navega a `RegistroEjercicio` pasando `{id_ciclo, id_rutina, orden, nombre, nombre_rutina}`.
- **`handleSave`** (líneas 545-561): `guardarProgresoEjercicio(ciclo, hoy, [{ id_ejercicio, completado }])` → `POST /afiliados/me/progreso-ejercicio`.
- **`selectDia`** (líneas 533-538): re-carga `loadRutinaDia` al cambiar el día del selector.
- **`getDiasData`** (líneas 569-579): agrupa los ejercicios por `dia_numero` para los chips de días.
- **Día default** (líneas 590-611): si el día de hoy tiene rutina aplicable la muestra; si no, cae al primer día con ejercicios.
- **`DiaCard`** (líneas 83-319): card por día con animación (`Animated`), checkbox de completado (líneas 200-219), detalle plegable `series × reps · kg · descanso · instrucciones` (líneas 239-245), **botón "Registrar"** del ejercicio real (líneas 260-267) e **input de nota** con botón de guardado (líneas 271-310).

> **[NOTA IMPORTANTE — dos mecanismos distintos]**
> - **"Marcar completado"** (checkbox) → `PROGRESO_EJERCICIO_DIARIO` (boolean, un registro por ejercicio/día) vía `SeguimientoDiarioModel.saveProgresoEjercicio`. **NO es** el registro de ejecución.
> - **"Registrar"** (RegistroEjercicioScreen) → `REGISTRO_EJERCICIO` (cada serie/fecha real con peso) vía `RegistroService.registerEjercicio`, que además **recalcula el resumen diario** (`PROGRESO_DIARIO`). Este es el que alimenta volumen y gráficas de progreso.

### 4.4 Pantalla de registro real (`movil/src/screens/RegistroEjercicioScreen.jsx`)

- Params recibidos (línea 27): `id_ciclo`, `id_rutina`, `orden`, `nombre`, `nombre_rutina`.
- `useMutation(registrarEjercicioReal)` (líneas 34-41) de `../services/registroService`.
- `handleSubmit` (líneas 43-49): valida `series >= 1` y `repeticiones >= 1`; ejecuta el mutation.
- Payload: `{ id_ciclo, id_rutina, orden, fecha: hoy, series, repeticiones, peso_utilizado_kg, notas }`.
- `movil/src/services/registroService.js`:
  - `registrarEjercicioReal` (líneas 3-4) → `POST /afiliados/me/registro-ejercicio`.
  - `getHistorialEjerciciosReales` (líneas 9-10) → `GET /afiliados/me/registro-ejercicio/historial`.

### 4.5 Endpoints del backend que consume la app (cadena completa)

| # | Endpoint | Route:Línea | Controller:Línea | Service:Línea | Model:Línea | SQL / Resumen |
|---|---|---|---|---|---|---|
| 1 | `GET /afiliados/me/ciclos` | `afiliadoRoutes.js:176` (`requireAuth`) | `AfiliadoController.getMisCiclos` (afiliadoController.js:406) | `AfiliadoService.getCiclos` (afiliadoService.js:162) | `CicloModel.findByAfiliado` (cicloModel.js:28) | `SELECT c.*, COUNT(...) AS numero_ciclo FROM CICLO c WHERE c.id_usuario=? GROUP BY ... ORDER BY fecha_inicio DESC` (subconsulta del número de ciclo). |
| 2 | `GET /planes/entrenamiento/:id_ciclo` | `planRoutes.js:77` (`requireOwnCiclo`) | `PlanController.getEntrenamiento` (planController.js:24) | — | `PlanModel.getEntrenamientoByCiclo` (planModel.js:32) | 404 si no existe el plan. JSON con `rutinas` por día y sus `ejercicios`. |
| 3 | `GET /planes/entrenamiento/:id_ciclo/rutina/:dia_numero` | `planRoutes.js:129` (`requireOwnCiclo`) | `PlanController.getRutinaDiaria` (planController.js:47) | — | `PlanModel.getRutinaDiaria` (planModel.js:96) | Rutinas del ciclo para `dia_numero`; fallback si el día no tiene rutina. |
| 4 | `GET /afiliados/me/progreso-ejercicio/:idCiclo/:fecha` | `afiliadoRoutes.js:1102` (`requireAuth`) | `AfiliadoController.getProgresoEjercicio` (afiliadoController.js:517) | `AfiliadoService.getProgresoEjercicio` (afiliadoService.js:315) | `SeguimientoDiarioModel.getProgresoEjercicio` (seguimientoDiarioModel.js:28) | `SELECT id_ejercicio, completado FROM PROGRESO_EJERCICIO_DIARIO WHERE id_usuario=? AND id_ciclo=? AND fecha=?`. |
| 5 | `POST /afiliados/me/progreso-ejercicio` | `afiliadoRoutes.js:1075` (`requireAuth`) | `AfiliadoController.saveProgresoEjercicio` (afiliadoController.js:496, usa `req.user.sub`) | `AfiliadoService.saveProgresoEjercicio` (afiliadoService.js:307) | `SeguimientoDiarioModel.saveProgresoEjercicio` (seguimientoDiarioModel.js:5) | Transacción: `INSERT INTO PROGRESO_EJERCICIO_DIARIO (id_usuario, id_ciclo, id_ejercicio, fecha, completado) VALUES ... ON DUPLICATE KEY UPDATE completado=VALUES(completado), updated_at=...`. |
| 6 | `POST /afiliados/me/notas-ejercicio` | `afiliadoRoutes.js:76` (`requireAuth`) | `AfiliadoController.crearNotaEjercicio` (afiliadoController.js:653) | `AfiliadoService.guardarNotaEjercicio` (afiliadoService.js:354, valida id_ejercicio/id_ciclo/nota) | `NotaEjercicioModel.create` (notaEjercicioModel.js:13) | Upsert idempotente: `SELECT id_nota ...`; si existe → `UPDATE NOTA_EJERCICIO SET nota=?`; si no → `INSERT INTO NOTA_EJERCICIO (id_usuario, id_ejercicio, id_ciclo, nota, fecha_nota)`. |
| 7 | `GET /afiliados/me/notas-ejercicio` | `afiliadoRoutes.js:77` (`requireAuth`) | `AfiliadoController.getMisNotasEjercicio` (afiliadoController.js:677) | `AfiliadoService.getMisNotasEjercicio` (afiliadoService.js:369) | `NotaEjercicioModel.findByUsuarioYCiclo` (l.53) / `findByUsuario` (l.40) | JOIN con `EJERCICIO` para devolver el nombre del ejercicio. |
| 8 | `POST /afiliados/me/registro-ejercicio` (registro REAL) | `afiliadoRoutes.js:309` (`requireAuth`) | `RegistroController.registerEjercicio` (registroController.js:65) | `RegistroService.registerEjercicio` (registroService.js:43) | `RegistroEjercicioModel.insertar` (registroEjercicioModel.js:28) + `ProgresoDiarioModel.sincronizar` (progresoDiarioModel.js:12) | Transacción (ver 4.6). |

### 4.6 Registro real de ejercicio: transacción y volumen

`backend/services/registroService.js` `registerEjercicio` (línea 43):
1. Valida campos obligatorios (líneas 45-49).
2. `normalizarFechaSegura` (línea 50).
3. `verificarCicloDe` (líneas 25-38): `404 CICLO_NO_ENCONTRADO` si el ciclo no existe y `403 CICLO_AJENO` si no pertenece al usuario.
4. Valida `series >= 1` y `repeticiones >= 1` (líneas 52-56).
5. **Transacción** (líneas 58-73): usa una **misma conexión** `conn` para:
   - `RegistroEjercicioModel.insertar(conn, datos)` (registroEjercicioModel.js:28-36) →
     ```sql
     INSERT INTO REGISTRO_EJERCICIO
       (id_usuario, id_ciclo, id_rutina, orden, fecha, series, repeticiones, peso_utilizado_kg, notas)
     VALUES (?,?,?,?,?,?,?,?,?)
     ```
   - `ProgresoDiarioModel.sincronizar(conn, id_usuario, fecha)` (progresoDiarioModel.js:12-45): en la **misma transacción** recalcula el resumen del día — `SUM(calorias)` desde `CONSUMO_ALIMENTO_REAL`, `COUNT(vasos)` de `REGISTRO_AGUA`, `COUNT(REGISTRO_EJERCICIO)` — y hace UPSERT en `PROGRESO_DIARIO`.
   - `commit` (o `rollback` si algo falla, líneas 66-72).
6. **Volumen:** se calcula en SQL (no en JS) con `ROUND(series * repeticiones * COALESCE(peso_utilizado_kg,0), 2)` (registroEjercicioModel.js:58 y 86). La app móvil lo muestra en `MiProgresoScreen.js` (línea 273: `totalVolumen = registrosEjercicio.reduce(... + Number(r.volumen))`; display en línea 546).

### 4.7 Diagrama de consulta de rutina

```text
MiRutinaScreen (montaje)                          Backend
   │
   ├─► GET /afiliados/me/ciclos ─────────────────► CicloModel.findByAfiliado
   │        ciclo = seleccionarCicloActivo
   ├─► GET /planes/entrenamiento/:id_ciclo ─────► PlanModel.getEntrenamientoByCiclo
   │        aplanar ejercicios del plan
   ├─► GET /planes/entrenamiento/:id_ciclo/rutina/:dia_numero ► PlanModel.getRutinaDiaria
   ├─► GET /afiliados/me/progreso-ejercicio/:idCiclo/:fecha ► SeguimientoDiarioModel.getProgresoEjercicio
   └─► GET /afiliados/me/notas-ejercicio?ciclo ─► NotaEjercicioModel.findByUsuarioYCiclo
         └──► render: DiasData + DiaCard (checkbox, registrar, nota)

Guardar (checkbox)  ► POST /afiliados/me/progreso-ejercicio ► SeguimientoDiarioModel.saveProgresoEjercicio
                            (INSERT ... ON DUPLICATE KEY UPDATE en PROGRESO_EJERCICIO_DIARIO)

Registrar (real)    ► RegistroEjercicioScreen ► POST /afiliados/me/registro-ejercicio
                            └─► RegistroService.registerEjercicio (transacción)
                                  ├─► RegistroEjercicioModel.insertar  -> REGISTRO_EJERCICIO
                                  └─► ProgresoDiarioModel.sincronizar  -> PROGRESO_DIARIO
```

---

## 5. Detalle de tablas de la base de datos

> Los nombres de columnas en mayúsculas siguen la convención de `database/*.sql`. No se inventó ninguna columna; el detalle fino está en el SQL.

| Tabla | Columnas clave (PK/FK señaladas) | Notas |
|---|---|---|
| **CICLO** | `id_ciclo` (PK, auto), `id_usuario` (FK a USUARIO), `fecha_inicio`, `fecha_fin`, `objetivo_fisico`, `nivel_experiencia`, `disponibilidad_dias`, `registrado_por`, `activo` | FIX 2: usa `id_usuario` (antes `id_afiliado`); `objetivo_fisico`, `nivel_experiencia`, `disponibilidad_dias`, `registrado_por` son `NOT NULL`. `numero_ciclo` se calcula con subconsulta en `findByAfiliado` (no es columna física). |
| **PLAN_ENTRENAMIENTO** | `id_ciclo` (PK + FK → CICLO), `modificado_por`, `observaciones` | 1:1 con ciclo; si ya existe para ese ciclo, el INSERT da `ER_DUP_ENTRY`. |
| **RUTINA** | `id_rutina` (PK), `id_ciclo` (FK → CICLO), `nombre_rutina`, `enfoque_muscular`, `dia_numero` | Cuelga del ciclo (NO de PLAN_ENTRENAMIENTO). |
| **RUTINA_EJERCICIO** | `id_rutina_ejercicio` (PK), `id_rutina` (FK → RUTINA), `id_ejercicio` (FK → EJERCICIO), `orden`, `series`, `repeticiones` | Se limpia con la rutina en `deleteRutina`. |
| **EJERCICIO** | `id_ejercicio` (PK), `nombre`, `grupo_muscular`, `peso_utilizado_kg` (opcional) | Catálogo; expuesto por `GET /catalogo/ejercicios` y `getEjerciciosDisponibles` (catalogoModel.js:233). |
| **PROGRESO_EJERCICIO_DIARIO** | `id_progreso_ejercicio` (PK), `id_usuario`, `id_ciclo`, `id_ejercicio`, `fecha`, `completado` (BOOL), `updated_at` | UPSERT por `(id_usuario, id_ciclo, id_ejercicio, fecha)`. Guarda "marcado/desmarcado del día". |
| **REGISTRO_EJERCICIO** | `id_registro_ejercicio` (PK), `id_usuario`, `id_ciclo`, `id_rutina`, `orden`, `fecha`, `series`, `repeticiones`, `peso_utilizado_kg`, `notas` | Registro real de cada ejecución; `volumen` calculado en la query (`ROUND(series*repeticiones*COALESCE(peso,0),2)`). |
| **NOTA_EJERCICIO** | `id_nota` (PK), `id_usuario`, `id_ejercicio`, `id_ciclo`, `nota`, `fecha_nota` | Upsert por (usuario, ejercicio) en el contexto de un ciclo. |
| **PROGRESO_DIARIO** | `id_progreso_diario`, `id_usuario`, `fecha`, `calorias_consumidas`, `agua_ml`/`vasos`, `ejercicios_completados`, `updated_at` | Resumen diario recalculado por `sincronizar` (misma transacción del registro real). |
| **REGISTRO_AGUA / CONSUMO_ALIMENTO_REAL** | favorecen la agregación en `sincronizar` (vasos/calorías) | Soportan el bloque de progreso alimentario/agua. |
| **PROGRESO_FISICO** | `peso`, `estatura`/IMC, `fecha_registro` | Usado por el progreso del afiliado: web `GET /afiliados/:id/progreso` y móvil `GET /afiliados/me/progreso` → `CatalogoModel.getProgresoByAfiliado` (catalogoModel.js:343). |

---

## 6. Respuestas a las preguntas planteadas

**¿Por qué la app arranca sin `index.js` y dónde está el entry real?**
Porque `movil/package.json:3` define `"main": "node_modules/expo/AppEntry.js"`. Expo SDK 55 trae ese archivo y hace `registerRootComponent(App)` desde `../../App` (verificado en `movil/node_modules/expo/AppEntry.js:1-5`). El componente raíz del proyecto es `movil/App.js`.

**¿Qué se monta primero: providers, tema o navegación?**
`App.js:18-26` monta `ThemeProvider → AuthProvider → Root`. El tema se aplica vía `ThemeContext.jsx` (muta el objeto `COLORS` con `swapPalette`). El guard de navegación (`AppNavigator.js:127-150`) espera a que `AuthContext` termine `restoreSession` (muestra spinner) antes de decidir stack público vs autenticado.

**¿Cómo la app sabe que el usuario ya se logueó y muestra "Mi Rutina"?**
1. `LoginScreen` ejecuta `login(correo, contrasena)` → `AuthContext.login` → `POST /login` y guarda `metafit_token`, `metafit_user`, `metafit_role` en AsyncStorage.
2. Como el token ya está en el contexto, `AppNavigator` re-renderiza y muestra `RootStack`.
3. El bottom-tab tiene la pestaña **Rutina** → `MiRutinaScreen`.
4. En la próxima apertura, `restoreSession` (AuthContext) rehidrata la sesión desde AsyncStorage.

**¿Qué tan segura es la sesión y dónde está el token?**
En AsyncStorage bajo las 3 claves (api.js:12-14). El request interceptor lo inyecta como Bearer en todas las peticiones (api.js:32-41); si el backend responde 401 (y no fue `/login`), se limpia la sesión (api.js:50-59). En las rutas protegidas el backend valida el JWT en `requireAuth` (auth.js:43).

**¿Cómo se asigna una rutina y a qué tablas llega?**
Flujo completo en la sección 3. El orden real es: (1) garantizar `CICLO`, (2) `PLAN_ENTRENAMIENTO` (GET de verificación + POST si 404, o PATCH si existe), (3) por cada día `RUTINA` + `RUTINA_EJERCICIO`, habiendo limpiado antes la rutina del día que se reemplaza.

**¿Cómo la app móvil consulta la rutina asignada y sabe qué mostrar?**
En `MiRutinaScreen.fetchData()` (sección 4.1): obtiene ciclos, elige el ciclo activo, trae el plan y la rutina del día, más el progreso del día y las notas. `getPlanRutinaDia` tiene fallback si el día actual no tiene rutina definida.

**¿Dónde se guarda el registro real y cómo se calcula el volumen?**
`RegistroService.registerEjercicio` (registroService.js:43) valida el ciclo, y en **una transacción** inserta en `REGISTRO_EJERCICIO` y recalcula `PROGRESO_DIARIO` con `ProgresoDiarioModel.sincronizar`. El volumen se calcula en SQL: `ROUND(series*repeticiones*COALESCE(peso,0),2)` (registroEjercicioModel.js:58/86). La app lo suma en `MiProgresoScreen.js:273`.

**¿Cómo se actualiza el progreso?**
Hay dos rutas: (a) checkbox de completado → `PROGRESO_EJERCICIO_DIARIO` (upsert); (b) registro real → recalcula `PROGRESO_DIARIO` (calorías, agua, ejercicios del día). El progreso físico (peso/IMC) vive en `PROGRESO_FISICO` (catalogoModel.js:343).

---

## 7. Notas, hallazgos y cosas que NO existen

1. **No hay `index.js`** en `movil/`; el entry es `expo/AppEntry.js` → `App.js` (verificado).
2. **No hay prefijo `/api`** en el backend; las rutas son `/login`, `/planes/...`, `/afiliados/...`, `/catalogo/...`.
3. **`RUTINA` no tiene FK a `PLAN_ENTRENAMIENTO`**: cuelga directo de `CICLO.id_ciclo`.
4. **Dos mecanismos de "progreso del ejercicio"** que nunca mezclar en la sustentación:
   - `PROGRESO_EJERCICIO_DIARIO` = marcar/desmarcar completado del día (checkbox).
   - `REGISTRO_EJERCICIO` + `PROGRESO_DIARIO` = ejecuciones reales con series/reps/peso (botón "Registrar").
5. **El volumen no se calcula en la app ni en el service**: viene calculado en el SQL del modelo.
6. **El tema "dark" es el predeterminado** (`ThemeContext.jsx:39`) y se persiste en `metafit_theme_movil`; `NavigationContainer` usa `key` por tema para remontar limpio.
7. **`numero_ciclo` no es columnna física**: se deriva con una subconsulta en `CicloModel.findByAfiliado`.
8. Notas y checkboxes comparten el id del ejercicio y el id del ciclo, así que al refrescar `MiRutinaScreen` se re-marcan los completados del día desde `GET /afiliados/me/progreso-ejercicio/:idCiclo/:fecha`.
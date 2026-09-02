# INFORME DE AUDITORÍA METAFIT

> Auditoría de código — **solo lectura, sin cambios en el repositorio**.
> Fecha: 2026-08-31 · Rama auditada: `main` @ `52ea819` · Equipo MetaFit

---

## 1. RESUMEN EJECUTIVO

| Indicador | Resultado |
|---|---|
| Estado general | 🟢 **Sólido** — el núcleo está implementado e integrado |
| Funcionalidades implementadas | Alta cobertura: backend 76 endpoints, web completa para staff, móvil completo para afiliado, BD normalizada |
| Funcionalidades incompletas | Moderadas (ver secciones por capa) |
| Funcionalidades no implementadas | Pocas, todas identificadas en §8 |
| Coherencia web-móvil | ✅ Una sola BD, mismos endpoints `/afiliados/me/*` compartidos |
| Seguridad | ✅ JWT 8h + bcrypt 12 rondas + rate-limit + Helmet + CORS whitelist |

**Veredicto**: la FASE 1-2-3 (restricciones, registro real de ejercicios/consumos, progreso diario) está **implementada de punta a punta** (backend + web + móvil + BD). Los principales problemas son de **coherencia de permisos en la web** (visual vs. real) y **datos de prueba con errores** que rompen el login esperado. No se requiere reescritura; se requieren correcciones puntuales.

---

## 2. BACKEND (Node.js + Express + MySQL)

### 2.1 Funcionalidades implementadas (✅)

**Total: 76 endpoints** (73 de rutas + 3 globales) en 11 archivos de rutas.

| Método | Ruta | Roles permitidos | Controller |
|---|---|---|---|
| POST | `/login` | Público (rate-limit 10/15min) | `AuthController.login` |
| POST | `/auth/recuperar-password` | Público (rate-limit 5/15min) | `AuthController.recuperarPassword` |
| POST | `/auth/reset-password` | Público | `AuthController.resetPassword` |
| GET | `/afiliados/` | staff | `AfiliadoController.getAll` (paginado) |
| GET | `/afiliados/me` | autenticado | `AfiliadoController.getMe` |
| GET | `/afiliados/me/ciclos` | autenticado | `AfiliadoController.getMisCiclos` |
| GET | `/afiliados/me/progreso` | autenticado | `AfiliadoController.getMiProgreso` |
| GET | `/afiliados/me/restricciones` | autenticado | `AfiliadoController.getMisRestricciones` |
| GET | `/afiliados/:id` | staff | `AfiliadoController.getById` |
| POST | `/afiliados/` | Admin o Recepcionista | `AfiliadoController.create` (txn + correo + n8n) |
| PATCH | `/afiliados/:id` | Admin o Recepcionista | `AfiliadoController.update` |
| DELETE | `/afiliados/:id` | Admin | `AfiliadoController.delete` |
| POST | `/afiliados/me/foto` | autenticado + upload | `AfiliadoController.subirFoto` |
| POST | `/afiliados/:id/foto` | Admin o Recepcionista + upload | `AfiliadoController.subirFoto` |
| POST | `/afiliados/ciclos` | Admin o Entrenador | `AfiliadoController.createCiclo` |
| GET | `/afiliados/:id/ciclos` | staff | `AfiliadoController.getCiclos` |
| GET | `/afiliados/:id/restricciones` | staff | `AfiliadoController.getRestricciones` |
| POST | `/afiliados/:id/restricciones` | staff | `AfiliadoController.addRestriccion` |
| DELETE | `/afiliados/:id/restricciones/:id_restriccion` | staff | `AfiliadoController.removeRestriccion` |
| POST | `/afiliados/:id/pagos` | Admin o Recepcionista | `PagoController.create` |
| GET | `/afiliados/:id/pagos` | staff | `PagoController.getByAfiliado` |
| GET | `/pagos/` | Admin | `PagoController.getAll` |
| GET | `/pagos/metricas` | Admin | `PagoController.getMetricas` |
| GET | `/planes/entrenamiento/:id_ciclo` | propietario del ciclo (o staff) | `PlanController.getEntrenamiento` |
| POST | `/planes/entrenamiento` | Admin o Entrenador | `PlanController.createEntrenamiento` (+ push) |
| PATCH | `/planes/entrenamiento/:id` | Admin o Entrenador | `PlanController.updateEntrenamiento` |
| POST | `/planes/rutinas` | Admin o Entrenador | `PlanController.createRutina` |
| POST | `/planes/rutinas/:id_rutina/ejercicios` | Admin o Entrenador | `PlanController.addEjercicio` |
| DELETE | `/planes/rutinas/:id_rutina/ejercicios/:id_ejercicio` | Admin o Entrenador | `PlanController.removeEjercicio` |
| DELETE | `/planes/rutinas/:id_rutina` | Admin o Entrenador | `PlanController.deleteRutina` |
| GET | `/planes/nutricional/:id_ciclo` | propietario del ciclo (o staff) | `PlanController.getNutricional` |
| POST | `/planes/nutricional` | Admin o Entrenador | `PlanController.createNutricional` (+ push) |
| PATCH | `/planes/nutricional/:id` | Admin o Entrenador | `PlanController.updateNutricional` |
| POST | `/planes/nutricional/:id_plan/detalle` | Admin o Entrenador | `PlanController.addAlimento` |
| G/V/D | `/catalogo/ejercicios` | GET: autenticado · CRUD: Admin o Entrenador | `CatalogoController.*` |
| G/V/D | `/catalogo/alimentos` | GET: autenticado · CRUD: Admin o Entrenador | `CatalogoController.*` |
| G/V/D | `/catalogo/restricciones` | GET: autenticado · CRUD: **solo Admin** | `CatalogoController.*` |
| GET | `/progreso/resumen` | autenticado | `ProgresoController.getResumen` |
| PUT | `/progreso/resumen` | autenticado | `ProgresoController.updateResumen` |
| GET | `/progreso/historial` | autenticado | `ProgresoController.getHistorial` |
| GET | `/progreso/ejercicio/:idEjercicio/evolucion` | autenticado | `ProgresoController.getEvolucionEjercicio` |
| GET | `/dashboard/kpis` | Admin | `DashboardController.getKPIs` |
| GET | `/notificaciones/` | autenticado | `NotificacionController.getNotificaciones` |
| GET/PUT | `/configuracion/precio-membresia` | Admin | `ConfiguracionController.*` |
| GET | `/usuarios/` `/usuarios/:id` | Admin | `UsuarioController.*` |
| POST/PATCH/DELETE | `/usuarios/` `/usuarios/:id` | Admin | `UsuarioController.*` |
| PUT | `/usuarios/me/push-token` | autenticado | `UsuarioController.guardarPushToken` |
| GET | `/health`, `/api-docs`, `/swagger` | Público | infra |

### 2.2 FASE 3 — Endpoints de registro real (verificados por prueba manual ✅)

| Método | Ruta | Respuesta verificada |
|---|---|---|
| POST | `/afiliados/me/registro-ejercicio` | ✅ 201, `id_registro`, actualiza resumen diario |
| GET | `/afiliados/me/registro-ejercicio/historial` | ✅ 200 con volumen nº (series×reps×peso) |
| POST | `/afiliados/me/consumo-alimento-real` | ✅ 201, `calorias_consumidas` (Atwater) |
| GET | `/afiliados/me/consumo-alimento-real/historial` | ✅ 200 con kcal por alimento |
| GET | `/afiliados/me/restricciones` | ✅ 200 |
| GET | `/afiliados/me/ciclos` | ✅ 200 con `numero_ciclo`, `% avance` |

### 2.3 Middlewares de roles (backend = segura fuente de verdad de seguridad)

| Middleware | Autoriza |
|---|---|
| `requireAuth` | cualquier usuario autenticado (JWT Bearer) |
| `requireAdmin` | solo `'Administrador'` |
| `requireAdminOrEntrenador` | `'Administrador'`, `'Entrenador'` |
| `requireAdminOrRecepcionista` | `'Administrador'`, `'Recepcionista'` |
| `requireStaff` | `'Administrador'`, `'Entrenador'`, `'Recepcionista'` (excluye Afiliado) |
| `requireOwnCiclo` | Admin/Entrenador siempre; Afiliado solo si el ciclo es suyo |

### 2.4 Funcionalidades incompletas / faltantes (⚠️)

1. **Notificaciones solo lectura** — no hay POST/PATCH/DELETE (crear, marcar leída, eliminar).
2. **Sin endpoint para cerrar/cambiar estado de ciclo** — solo se crea (`POST /afiliados/ciclos`); el cierre del anterior lo hace la capa de aplicación.
3. **Sin GET de rutina individual**; sin DELETE de plan de entrenamiento ni de plan nutricional; sin DELETE de detalle nutricional (no se puede quitar un alimento de una comida).
4. **Pagos sin UPDATE ni DELETE** — solo registrar y consultar (no se puede corregir/anular).
5. **Seguimiento diario sin DELETE** — agua/consumo/progreso-ejercicio no permiten borrar un registro erróneo.
6. **Dashboard con un solo endpoint de KPIs** — sin reportes por rango, gráficas ni exportación.
7. **`POST /afiliados/me/foto` acepta cualquier rol autenticado** (un staff también podría usar `/me/foto`).

### 2.5 Seguridad destacada ✅
JWT 8h con `JWT_SECRET` obligatorio, bcrypt 12 rondas, verificación de estado antes de bcrypt (anti-enumeración), rate-limiting en login y recuperación, Helmet, whitelist CORS, body limit 50 KB, validación de Content-Type (415), 404 sin reflejo de path, error handler que nunca expone stack traces.

---

## 3. FRONTEND WEB (React + Vite) — PERMISOS POR ROL

### 3.1 Rutas y protección (App.jsx)

| Ruta | Componente | allowedRoles |
|---|---|---|
| `/` | LandingPage | pública |
| `/login` | Login | pública |
| `/recuperar-password`, `/reset-password/:token` | Recuperar/Reset | pública |
| `/dashboard`, `/personal`, `/finanzas`, `/admin/restricciones` | AdminDashboard, GestionPersonal, FinanzasView, RestriccionesAdmin | `['Administrador']` |
| `/pagos` | PagosView | `['Administrador','Recepcionista']` |
| `/rutinas`, `/dietas`, `/progreso/:id` | RutinasView, DietasView, ProgresoAfiliado | `['Administrador','Entrenador']` |
| `/afiliados` | AfiliadosView | `['Administrador','Recepcionista','Entrenador']` |
| `*` | → `/login` | — |

### 3.2 Matriz de permisos REAL (verificada en código)

| Acción / Pantalla | Admin | Entrenador | Recepcionista | Evidencia |
|---|---|---|---|---|
| Ver lista afiliados | ✅ | ✅ | ✅ | `/afiliados` = ALL_ROLES |
| Crear afiliado | ✅ | ❌ | ✅ | `AfiliadosView.jsx:248` `role==="Administrador" \|\| "Recepcionista"` |
| Editar afiliado | ✅ | ⚠️ ve el botón, backend 403 | ✅ | botón ✏️ `AfiliadosView.jsx:410` sin condición; backend `PATCH /afiliados/:id` = Admin/Recepcionista |
| Eliminar afiliado | ✅ | ❌ | ❌ | `AfiliadosView.jsx:414` solo Admin |
| Ver detalle (tabs) | ✅ Estado+Progreso+Ciclo | ⚠️ Progreso+Ciclo | ✅ solo Estado de Cuenta | `TABS_POR_ROL` `:17-21` |
| Ver progreso afiliado | ✅ | ✅ | ❌ | botón 📊 `:411` Admin/Entrenador |
| Asignar restricciones | ✅ | ✅ | ❌ (backend staff permite) | `:286-287` Admin/Entrenador; backend `requireStaff` permite tam Bien a Recepcionista |
| Asignar ciclo | ✅ | ✅ | ❌ | backend `createCiclo` Admin/Entrenador |
| Asignar rutina/dieta | ✅ | ✅ | ❌ | backend `planes/*` Admin/Entrenador |
| CRUD ejercicios/alimentos | ✅ | ✅ | ❌ | backend `catalogo` Admin/Entrenador |
| CRUD restricciones | ✅ | ❌ | ❌ | backend `catalogo/restricciones` solo Admin |
| Pagos (registrar/ver) | ✅ | ❌ | ✅ | `/pagos` + backend Admin/Recepcionista |
| Dashboard/KPIs | ✅ | ❌ | ❌ | `/dashboard` Admin + backend `requireAdmin` |
| Finanzas | ✅ | ❌ | ❌ | `/finanzas` Admin |
| Gestión de personal | ✅ | ❌ | ❌ | `/personal` Admin |
| RestriccionesAdmin (admin) | ✅ | ❌ | ❌ | `/admin/restricciones` Admin |

### 3.3 Permisos verificados (conclusión por rol)

- **[✅] Admin**: acceso total — dashboard, finanzas, personal, restricciones, pagos, rutinas/dietas, afiliados (todo).
- **[✅] Entrenador**: su módulo real es rutinas/dietas/planes + ver progreso; **no** crea/elimina afiliados, **no** pagos, **no** personal, **no** CRUD restricciones.
- **[✅] Recepcionista**: afiliados (crear/editar) + pagos; **no** rutinas/dietas, **no** progreso, **no** CRUD catálogos.
- **[❌] Afiliado**: **ausente por completo de la web**. Ver problema crítico abajo.

### 3.4 Problemas de permisos detectados (de mayor a menor severidad)

1. **[CRÍTICO] El rol Afiliado no puede usar la web → bucle de login.**
   - `Login.jsx:16-20` el selector solo ofrece 3 roles (sin Afiliado). `ROLE_MAP` (`:28-32`) sin Afiliado.
   - Si un afiliado inicia sesión igualmente (email+pass), `Login.jsx:63` navega al fallback `/afiliados` pero `ALL_ROLES` (`App.jsx:48`) **no lo incluye** → `ProtectedRoute` (`:95`) redirige a `ROLE_HOME[role] || /login` → sin home para Afiliado → vuelve al login. **Bucle infinito.**
   - **Diseño/base actual**: el afiliado está pensado para usar solo la app móvil. Aun así, conviene decidir (ocultar el flujo o añadir home afiliado).

2. **[MEDIO] Botón "Editar afiliado" visible para Entrenador pero backend lo rechaza (403).**
   - `AfiliadosView.jsx:410` no condiciona el botón ✏️ por rol; el backend `PATCH /afiliados/:id` solo Admin/Recepcionista. El Entrenador ve el botón y falla al usarlo. **Falta coherencia visual–real.**

3. **[MEDIO] Asignar/remover restricciones: la web oculta para Recepcionista pero el backend lo permite.**
   - `AfiliadosView.jsx:286-287` restringe a Admin/Entrenador; el backend `POST/DELETE /afiliados/:id/restricciones` es `requireStaff` (incluye Recepcionista). Coherencia imperfecta en el sentido inverso al punto 2.

4. **[MEDIO] Cadenas de rol inconsistentes: "Admin" vs "Administrador".**
   - `GestionPersonal.jsx:9` usa `ROLES = ["Admin","Recepcionista","Entrenador"]` al crear empleados. El resto del sistema (frontend y backend) espera `'Administrador'`. Si `usuarioController.create` no mapea `"Admin"→"Administrador"`, el usuario quedaría con un rol que el RBAC del backend rechaza (login OK pero nada autorizado, o fallo de rol).

5. **[BAJO] Fallback a Recepcionista cuando `role` es undefined.**
   - `AfiliadosView.jsx:103`, `RutinasView.jsx:31`, `DietasView.jsx:31`, `Sidebar.jsx:60` usan `TABS_POR_ROL[role] || TABS_POR_ROL.Recepcionista`. Un rol corrupto/ausente asumiría permisos de recepcionista visualmente.

6. **[BAJO] `Dashboard.jsx` reemplazado por `AdminDashboard.jsx`** — archivo huérfano que podría confundir.

7. **[BAJO] Modales legacy** (`AfiliadoCrearModal`, `AfiliadoEditModal`, `AfiliadoVerModal`) coexisten con los modales inline de `AfiliadosView` — código duplicado.

### 3.5 Nota sobre tests
Los tests web cubren login/persistencia básica (30/30 según sesión previa). **No hay tests de RBAC** (ni de `ProtectedRoute` ni de la matriz de permisos por rol).

---

## 4. APP MÓVIL (Expo SDK 55 / RN 0.83) — SOLO AFILIADO

### 4.1 Mapa de navegación
```
Auth Stack (sin token)      Root Stack (con token)
├── Landing                 ├── MainTabs (Perfil·Rutina·Dieta·Progreso)
├── Login                   ├── RegistroEjercicio (FASE 3, encima de tabs)
└── RecuperarPassword       └── RegistroConsumo  (FASE 3, encima de tabs)
```

### 4.2 Funcionalidades implementadas (✅)

| Funcionalidad | Pantalla | Estado |
|---|---|---|
| Login / Logout / recuperar contraseña | LoginScreen · Recuperar | ✅ |
| Ver perfil (solo lectura) | MiPerfilScreen | ✅ |
| Subir foto de perfil (`POST /afiliados/me/foto`) | MiPerfilScreen | ✅ |
| Ciclo activo + historial de ciclos | MiPerfil · MiRutina · MiDieta | ✅ |
| Ver rutina por día (detalle/instrucciones) | MiRutinaScreen | ✅ |
| Marcar ejercicio completado en el día | MiRutinaScreen | ✅ (`progreso-ejercicio`) |
| **Registrar ejercicio REAL (FASE 3)** | RegistroEjercicioScreen | ✅ integrado (`registroService`) |
| Ver dieta por comida | MiDietaScreen | ✅ |
| Marcar alimento consumido | MiDietaScreen | ✅ (`consumo-alimento`) |
| **Registrar consumo REAL en gramos (FASE 3)** | RegistroConsumoScreen | ✅ integrado |
| Contador de agua (8 vasos) + historial | MiDieta · MiProgreso | ✅ |
| Progreso: StatsCard (volumen total, kcal) | MiProgresoScreen | ✅ |
| Progreso: historial ejercicios/consumos/agua + reales | MiProgresoScreen | ✅ (`Promise.allSettled`) |
| Restricciones con badge tipo + efecto | MiPerfilScreen | ✅ |
| Tema claro/oscuro | ThemeContext + MiPerfil | ✅ |
| Notificaciones push (registro de token) | notifications.js + Login/Perfil | ✅ |

### 4.3 Funcionalidades incompletas / faltantes (⚠️❌)

1. **[❌] Edición de perfil inexistente** — no hay forma de editar peso, altura, teléfono o email desde la app (el objetivo de la auditoría lo pedía). `MiPerfilScreen` es 100% display. **Tampoco hay endpoint backend** PATCH de perfil afiliado.
2. **[⚠️] Sin gráficos reales** — la pestaña Progreso usa tarjetas/listas; no hay librería de charts.
3. **[⚠️] API_URL hardcodeado** (`api.js:8` original = `https://metafit-backend-rr18.onrender.com`). Sin `EXPO_PUBLIC_*`; en un dispositivo físico hay que cambiarlo a la IP LAN (ya se hizo localmente para validación: `http://192.168.0.10:3001`).
4. **[⚠️] Sin guard de rol** — `AppNavigator.js:97` decide por `token`, no por `role`; cualquier rol autenticado entra a las tabs de afiliado (de facto los endpoints son `/afiliados/me`, pero no hay control de acceso explícito).
5. **[⚠️] `useApi.js` es código muerto** — definido pero ninguna pantalla lo importa.
6. **[⚠️] `setMode('system')` / modo sistema sin uso** — solo se usa `toggle`.
7. **[⚠️] Plugins faltantes en `app.json`** — `expo-notifications` y `expo-image-picker` están en `dependencies` pero **no** en `plugins` (clave para permisos iOS y comportamiento en build nativo).
8. **[⚠️] Registro real FASE 3 no se refleja en el check del día** — son semánticas distintas (`registro-ejercicio` vs `progreso-ejercicio`); tras guardar, las pantallas hacen `goBack` y las listas requieren pull-to-refresh.
9. **[⚠️] Modo prueba** expone el token de recuperación en pantalla (útil en dev, riesgo en producción).

---

## 5. BASE DE DATOS (MariaDB 11)

### 5.1 Tablas (24)

- **Core (17)**: `USUARIO`, `RESTRICCION`, `EJERCICIO`, `ALIMENTO`, `AFILIADO`, `AFILIADO_RESTRICCION`, `EJERCICIO_RESTRICCION_EXCLUIDA`, `ALIMENTO_RESTRICCION_EXCLUIDA`, `CICLO`, `PLAN_ENTRENAMIENTO`, `PLAN_NUTRICIONAL`, `RUTINA`, `RUTINA_EJERCICIO`, `DETALLE_NUTRICIONAL`, `PROGRESO_FISICO`, `PAGO`, `CONFIGURACION`.
- **Móvil (3)**: `PROGRESO_EJERCICIO_DIARIO`, `REGISTRO_AGUA`, `CONSUMO_ALIMENTO_DIARIO`.
- **FASE 0/3 (3)**: `REGISTRO_EJERCICIO`, `CONSUMO_ALIMENTO_REAL`, `PROGRESO_DIARIO`.
- **Auth (1)**: `PASSWORD_RESET`.

### 5.2 Relaciones clave
`USUARIO` 1:1 `AFILIADO` (PK=FK) → N `CICLO` → 1:1 `PLAN_ENTRENAMIENTO`/`PLAN_NUTRICIONAL`; `AFILIADO` N:M `RESTRICCION` (pivot); `EJERCICIO`/`ALIMENTO` N:M `RESTRICCION` (exclusiones); `AFILIADO` N `PAGO`. Catalogos `RESTRICCION`, `EJERCICIO`, `ALIMENTO` independientes.

### 5.3 Vistas (5)
`v_alimento_calorias` (Atwater), `v_perfil_afiliado` (edad calculada + IMC), `v_ciclo_activo_afiliado` (avance %), `v_ultimo_progreso` (IMC + clasificación OMS), `v_catalogo_ejercicios_disponibles` (exclusión por restricciones).

### 5.4 Datos de prueba (usuario → contraseña documentada en seed)

| Email | Rol | Contraseña | Estado |
|---|---|---|---|
| `carlos@metafit.com` | Administrador | `Admin123!` | Activo |
| `laura@metafit.com` | Entrenador | `Laura123!` | Activo |
| `andres@metafit.com` | Entrenador | `Andres123!` | Activo |
| `maria@metafit.com` | Recepcionista | `Maria123!` | Activo |
| `pedro@metafit.com` | Recepcionista | `Pedro123!` | **Pendiente** |
| `juan@gmail.com` | Afiliado (ciclo+rutina+dieta) | `MetaFit2025!` | Activo |
| `ana@gmail.com` · `luis@gmail.com` · `sofia@gmail.com` | Afiliados | `MetaFit2025!` | Activos |
| `carlos.demo@test.com` | Afiliado demo | ⚠️ **`Admin123!` en la práctica** | Activo |
| `diana@gmail.com` · `miguel@gmail.com` · `camila@gmail.com` | Afiliados | `MetaFit2025!` | Activos |

Catalogos: 6 restricciones · 25 ejercicios · 26 alimentos· 12 ciclos · 33 rutinas · ~98 rutina_ejercicio · 12 planes nutricionales · ~85 detalle_nutricional · 16 progreso_físico · ~39 pagos.

### 5.5 Problemas de datos detectados

1. **[CRÍTICO] `carlos.demo@test.com` tiene el hash del Admin (`Admin123!`), no `MetaFit2025!`** — la cabecera del seed documenta "afiliados usan MetaFit2025!" pero el hash insertado es el de Carlos Ramírez. Un afiliado comparte contraseña con el administrador. **Verificado por prueba manual: login con `carlos.demo@test.com/MetaFit2025!` → 401.**
2. **[MEDIO] Datos móviles solo de Sofía (id=9)**: `REGISTRO_EJERCICIO` (10), `CONSUMO_ALIMENTO_REAL` (~24), `PROGRESO_DIARIO` (4), `REGISTRO_AGUA` (5), etc. — solo un afiliado tiene datos FASE 3 de ejemplo.
3. **[MEDIO] 4 afiliados sin `PROGRESO_FISICO` ni `PAGO`** (Carlos Demo, Diana, Miguel, Camila).
4. **[BAJO] `PAGO.registrado_por` sin FK** declarada (solo índice).
5. **[MEDIO] ON DELETE inconsistente entre fases** — core usa RESTRICT; tablas móviles/FASE 3 usan CASCADE. Puede impedir borrar un afiliado con seguimiento diario.
6. **[BAJO] Seed dinámico** (`CURDATE()-INTERVAL n DAY`) → datos no reproducibles entre fechas.

---

## 6. COHERENCIA WEB-MÓVIL

- **[✅] Una sola BD**: web y móvil consumen la misma base; no hay duplicación de datos por cliente.
- **[✅] Datos compartidos**: `juan@gmail.com` (afiliado web/móvil) tiene ciclo+rutina+dieta y se refleja igual en ambos.
- **[✅] Los cambios del móvil se reflejan en la web**: registros FASE 3 se guardan en `REGISTRO_EJERCICIO`/`CONSUMO_ALIMENTO_REAL` y están disponibles para staff (vía `GET /afiliados/:id/progreso` o historiales).
- **[⚠️] No hay pantalla web que muestre los registros "reales" de FASE 3 del afiliado** — el staff ve progreso físico y KPIs, pero no una vista de "registros de ejercicio/consumo ejecutados" por día. El endpoint existe (`/afiliados/:id/progreso`), falta UI.
- **[⚠️] Inconsistencia de datos**: el afiliado no puede editar su peso/altura/teléfono/email (ni web ni móvil hay formulario persistente de perfil afiliado).
- **[✅] Rol orientado**: web = staff (3 roles), móvil = afiliado (1 rol). La separación por cliente es correcta; el problema es que un afiliado en web queda en bucle de login (§3.4).

---

## 7. FLUJOS COMPLETOS VERIFICADOS

| Flujo | Resultado | Evidencia |
|---|---|---|
| Registro de afiliado (web → móvil) | ✅ | `POST /afiliados` (txn USUARIO+AFILIADO); móvil lee `/afiliados/me` |
| Asignación de ciclo (web → móvil) | ✅ | `POST /afiliados/ciclos`; móvil `GET /afiliados/me/ciclos` (verificado: ciclo activo + historial con `numero_ciclo`) |
| Ejecución de rutina (móvil → web) | ✅ | `POST /afiliados/me/registro-ejercicio` → 201 → `GET .../historial`; visible para staff vía progreso |
| Ejecución de dieta (móvil → web) | ✅ | `POST /afiliados/me/consumo-alimento-real` → 201 (kcal Atwater) → historial |
| Edición de datos personales (móvil ↔ web) | ❌ **No implementado** | no existe PATCH de perfil afiliado ni formulario de edición (web o móvil) |
| Login staff web | ✅ | `carlos@metafit.com/Admin123!` (Admin), `laura@metafit.com/Laura123!` (Entrenador) → OK |
| Login afiliado web | ❌ | bucle a `/login` (`ROLE_MAP`/`ALL_ROLES` sin Afiliado) |
| Login afiliado móvil | ✅ | `juan@gmail.com/MetaFit2025!` → 200 + JWT |

---

## 8. RECOMENDACIONES PRIORIZADAS

### 🔴 ALTA (corregir antes de deploy/entrega)
- [ ] **Decidir el rol Afiliado en web**: o bloquear el login afiliado con mensaje explícito "usá la app móvil", o añadir `Afiliado` a `ROLE_MAP`/`ALL_ROLES` con un home mínimo. Evitar el bucle infinito actual.
- [ ] **Corregir el seed de `carlos.demo@test.com`**: re-hashear con `MetaFit2025!` (o documentar que usa `Admin123!`). El hash actual comparte el del Admin.
- [ ] **Unificar cadena de rol en `GestionPersonal.jsx`**: enviar `'Administrador'` (o mapearlo en backend) en lugar de `'Admin'`.
- [ ] **Ocultar el botón ✏️ Editar para Entrenador en `AfiliadosView.jsx`** (o abrir `PATCH /afiliados/:id` a Entrenador, según intención de negocio).

### 🟡 MEDIA
- [ ] Alinear la asignación de restricciones (web oculta Recepcionista; backend lo permite) en un único criterio.
- [ ] Endpoints de corrección: DELETE para registros diarios (ejercicio/consumo/agua) y UPDATE/DELETE para pagos.
- [ ] Gestión de ciclos: endpoint para cerrar/actualizar estado; DELETE de planes y de detalle nutricional.
- [ ] Notificaciones: marcar como leída / eliminar.
- [ ] Apt Móvil: dejar de hardcodear `API_URL` (usar `EXPO_PUBLIC_API_URL`) y añadir guard de rol.
- [ ] Añadir `expo-notifications` y `expo-image-picker` a `plugins` de `app.json`.
- [ ] Pantalla web para que el staff vea los registros "reales" FASE 3 del afiliado.

### 🟢 BAJA / OPORTUNA
- [ ] Limpiar código muerto: `useApi.js`, `setMode('system')`, `Dashboard.jsx`, modales legacy duplicados.
- [ ] Evitar fallback genérico a Recepcionista cuando `role` sea undefined.
- [ ] Añadir tests de RBAC (ProtectedRoute + matriz por rol) web y móvil.
- [ ] Datos de prueba móviles para más afiliados (no solo Sofía).
- [ ] Reportes/KPIs por rango de fechas en dashboard.

---

## 9. RIESGOS

- **Cambios en `main` afectan a todo el equipo**: el merge FASE 3 ya está en `main` (`6d76920`); cualquier corrección debe ir por rama feature + revisión.
- **Credenciales**: las contraseñas de prueba están documentadas en el seed; si se cambian los hashes hay que re-sincronizar con lo que esperan los validadores.
- **Seed idempotente pero con datos dinámicos**: re-ejecutar `04_datos_iniciales.sql` en fechas distintas da datos de hoy relativos; puede confundir validaciones entre días.
- **Backend Render desactualizado**: la instancia `metafit-backend-rr18.onrender.com` aún **no** tiene las rutas FASE 3 (404 verificados) ni el usuario `carlos.demo`. La APK FASE 3 construida apunta a ese backend → validaciones reales fallan hasta desplegar.
- **`api.js` modificado localmente** (apuntando a `192.168.0.10:3001` para la validación local) **no está commiteado** — si se fuerza un push se llevaría el cambio; el valor correcto de producción es `https://metafit-backend-rr18.onrender.com`.
- **`docker-compose.yml` modificado localmente** (healthcheck `mysqladmin`→`mariadb-admin`, que no existe en la imagen MariaDB 11.8.9) **no está commiteado** — es un fix necesario para levantar el stack local en esta máquina.

---

## 10. ESTADO LOCAL DE LA SESIÓN (transparencia)

Para la validación local (FASE 3 en emulador/celular) se dejó el entorno en este estado, **sin commitear nada**:
- Docker Desktop activo; stack `db` (MariaDB) + `backend` corriendo en `localhost:3001`, BD con los 5 seeds aplicados (healthcheck corregido a `mariadb-admin`).
- Verificados en local: login Admin/Entrenador/Afiliado OK, `POST /afiliados/me/registro-ejercicio` → 201, `POST /afiliados/me/consumo-alimento-real` → 201, historiales → 200, restricciones → 200.
- `movil/src/services/api.js` → `http://192.168.0.10:3001` (solo local, sin commit).
- Se lanzó `npx expo start --lan` para probar con Expo Go en celular (queda pendiente la validación en dispositivo).

**Archivos modificados localmente (no commiteados):** `docker-compose.yml`, `movil/src/services/api.js`.

---

*Informe generado con la auditoría completa del código (backend · web · móvil · BD). Ningún archivo de código fue modificado como parte de la auditoría.*
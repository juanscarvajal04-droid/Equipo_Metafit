# ANÁLISIS DE FLUJOS COMPLETOS - METAFIT

> **Alcance:** auditoría real contra el código actual del repo (`feature/sofia-astudillo`, commit `b693500`).
> **Fecha:** 2026-08-30. Cada afirmación cita `archivo:línea` real.
> **Criterio de estado:** 🟢 COMPLETO ≥ 85% · 🟡 PARCIAL 40–84% · 🔴 NO FUNCIONAL < 40%.
> Los nombres de tablas/endpoints del enunciado se contrastaron con los reales del sistema (ver apéndice).

---

## 📌 RESUMEN EJECUTIVO

**Flujos completamente funcionales:** 0/5
**Flujos parcialmente funcionales:** 3/5
**Flujos no funcionales:** 2/5

| Flujo | Estado | Cumplimiento |
|-------|--------|--------------|
| FLUJO 1 — Registro y Asignación (Web → Móvil) | 🟡 PARCIAL | **79%** |
| FLUJO 2 — Ejecución de Rutina (Móvil → Progreso) | 🔴 NO FUNCIONAL | **35%** |
| FLUJO 3 — Ejecución de Plan Nutricional | 🟡 PARCIAL | **45%** |
| FLUJO 4 — Progreso y Estadísticas (Móvil ↔ Web) | 🔴 NO FUNCIONAL | **28%** |
| FLUJO 5 — Actualización de Datos (Web ↔ Móvil) | 🟡 PARCIAL | **50%** |

**Hallazgos transversales (el detalle está en cada flujo):**
1. [CRÍTICO] El Entrenador **no tiene pantalla de progreso/cumplimiento** del afiliado en web: solo ve pesos históricos y el detalle del plan. Nada de progreso diario, consumo, agua ni cumplimiento.
2. [CRÍTICO] El registro de entrenamiento móvil **solo guarda un booleano** `completado`. No se capturan peso real, repeticiones, series ni notas, y **no se calcula volumen total**.
3. [IMPORTANTE] El formulario de registro captura objetivo/nivel/disponibilidad/restricciones, pero **esos valores no se persisten** (la tabla `AFILIADO` es solo datos estáticos, por 3FN). Al asignar plan a un afiliado sin ciclo se usan fallbacks hardcodeados.
4. [IMPORTANTE] El ciclo **no se gestiona manualmente**: se crea en segundo plano con fechas automáticas al asignar rutina/dieta. No hay activar/desactivar ni fechas editables.
5. [IMPORTANTE] Sin tiempo real: no hay WebSocket ni polling de datos; todo se actualiza bajo demanda o con pull-to-refresh.

---

### FLUJO 1: Registro y Asignación (Web → Móvil)
**Estado:** 🟡 PARCIAL
**Cumplimiento:** 79%

**Verificación:**
- [✅] Recepcionista registra afiliado en web → `POST /afiliados` (solo Admin/Recepcionista; `AfiliadosView.jsx:234,259-263`; `afiliadosService.js:143-147`)
- [⚠️] Datos guardados en BD → USUARIO + AFILIADO en transacción (`afiliadoModel.js:356-385`), pero **objetivo_fisico, nivel, disponibilidad y restricciones del formulario se descartan** (`afiliadoModel.js:325-393` no los inserta; `AFILIADO` solo tiene datos estáticos: `01_schema.sql:153-180`)
- [✅] Entrenador ve perfil del afiliado en web → modal de detalle con datos personales, objetivo/nivel/días, restricciones y tabs (`AfiliadosView.jsx` ver modal; por rol: `afiliadosService.js:32-36`)
- [⚠️] Entrenador crea ciclo → solo **implícito** al asignar plan/dieta con fechas automáticas (hoy / hoy+90 en rutinas: `RutinasView.jsx:166-175`; hoy+30 en dietas: `DietasView.jsx:154-163`). No hay formulario manual de fechas ni gestión activo/inactivo
- [⚠️] Ciclo considera objetivo, disponibilidad, restricciones → objetivo/nivel/disponibilidad usan **fallbacks** `"Mantenimiento"/"Principiante"/3` (`RutinasView.jsx:172-174`) porque no se guardaron al registrar; las restricciones solo filtran si ya existen y **no hay UI para asignarlas** (endpoints `POST/DELETE /afiliados/:id/restricciones` existen: `afiliadoRoutes.js:509,536`, pero ninguna vista los usa)
- [✅] Entrenador asigna plan de entrenamiento → `POST /planes/entrenamiento` + `POST /planes/rutinas` + `POST /planes/rutinas/:id/ejercicios` (`RutinasView.jsx:190,221-234`)
- [⚠️] Plan con ejercicios, series, repeticiones, descanso → web solo captura **series, repeticiones y día**; **no hay peso_kg ni descanso_seg** editables (`RutinasView.jsx` UI de ejercicio). El móvil solo los muestra si existen (el seed los provee)
- [✅] Asigna plan nutricional → `POST /planes/nutricional` + `POST /planes/nutricional/:id/detalle` (`DietasView.jsx:182-197`)
- [⚠️] Plan nutricional con comidas, alimentos, porciones, horarios → comidas (`num_comida`), alimentos y `cantidad_g` sí (`DietasView.jsx:513-519`); **no existe el concepto "horario"** en el modelo
- [✅] Ciclo se activa → `CICLO.activo = 1` al crearlo; se reutiliza el activo existente (`RutinasView.jsx:162-176`)
- [✅] Afiliado en móvil ve su ciclo activo → `MiPerfilScreen.js` (`seleccionarCicloActivo`, `cicloUtils.js:10-13`)
- [✅] Datos en móvil coinciden con los asignados en web → series/reps/gramos viajan por los endpoints reales (`api.js:54-55`; móvil `MiRutinaScreen`/`MiDietaScreen` leen el contrato real)

**Hallazgos:**
1. [CRÍTICO] Objetivo/nivel/disponibilidad/restricciones capturados en el registro **nunca llegan a la BD** (contradicción WEB→BD→MÓVIL: el afiliado nuevo llega sin datos deportivos). El ciclo resultante usa valores por defecto hardcodeados.
2. [IMPORTANTE] No hay formación de restricciones médicas desde web: el filto de `ejercicios-disponibles`/`alimentos-disponibles` (`RutinasView.jsx:126`, `DietasView.jsx:117`) solo funciona si la restricción ya existe en la BD (solo las del seed).
3. [IMPORTANTE] No se puede planificar con peso/descanso desde web, ni editar fechas del ciclo ni activarlo/desactivarlo manualmente.
4. [MEDIO] Brecha RBAC: el Entrenador puede **editar** afiliados (botón ✏️ sin gate en `AfiliadosView.jsx:319`), contradiciendo "Afiliados (Ver)" (`Sidebar.jsx:27`).

**Recomendaciones:**
1. Persistir objetivo/nivel/disponibilidad al crear el ciclo (o crearlo con esos valores en el registro).
2. Crear UI de gestión de restricciones del afiliado (usar `POST/DELETE /afiliados/:id/restricciones`).
3. Agregar pantalla/fábrica de ciclo con fechas manuales + toggle activo.
4. Agregar campos peso_kg y descanso_seg al formulario de ejercicio en RutinasView.
5. Restringir edición de afiliados a Admin/Recepcionista.

---

### FLUJO 2: Ejecución de Rutina (Móvil → Progreso)
**Estado:** 🔴 NO FUNCIONAL
**Cumplimiento:** 35%

**Verificación:**
- [✅] Afiliado ve rutina de hoy en móvil → `MiRutinaScreen.js` (día calculado con `getDay()`, días sin rutina informados)
- [✅] Cada ejercicio tiene descripción/instrucciones → `descripcion`/`EJERCICIO` entregada en el plan (`planModel.js:37,52`)
- [✅] Se muestran series/repeticiones sugeridas → `MiRutinaScreen.js:155-162` (también peso/descanso si existen)
- [✅] Marcar ejercicio como completado → toggle booleano + guardado (`MiRutinaScreen.js` handleSave; `seguimientoDiarioModel.js:5-26` con `ON DUPLICATE KEY UPDATE`)
- [❌] Registrar peso usado → NO (no hay input; solo se muestra el `peso_kg` planificado)
- [❌] Registrar repeticiones reales → NO
- [❌] Registrar series realizadas → NO
- [❌] Agregar notas/comentarios → NO
- [❌] Marcar día como completado → NO (solo hay % por ejercicio)
- [⚠️] Guardar en REGISTRO_EJERCICIO → la tabla real es **PROGRESO_EJERCICIO_DIARIO** y solo guarda `completado` booleano (`04_migracion_app_movil.sql:4-17`). No existe tabla de detalle de ejecución
- [❌] Progreso se actualiza en PROGRESO_FISICO → NO. `PROGRESO_FISICO` solo guarda peso/medidas registrados por el entrenador (`01_schema.sql:450-477`); los completados no la tocan
- [❌] Entrenador en web ve el progreso → NO (solo pesos en modal `AfiliadosView.jsx` tab "Progreso Físico")
- [❌] Entrenador ve estadísticas detalladas → NO (sin volumen, sin series/reps reales, sin cumplimiento)

**Hallazgos:**
1. [CRÍTICO] El sistema captura solo "completado/no completado". **No existe registro de ejecución real** (peso, reps, series, notas), por lo que no se puede calcular volumen total ni progreso por ejercicio.
2. [CRÍTICO] El Entrenador no ve el progreso diario del afiliado en ningún lugar de la web.
3. [IMPORTANTE] `PROGRESO_FISICO` (peso/medidas) y `PROGRESO_EJERCICIO_DIARIO` (completados) son tablas desconectadas entre sí.
4. [MEJORABLE] No hay "día completado": la app muestra avance por ejercicio, no por jornada cerrada.

**Recomendaciones:**
1. Migración: ampliar `PROGRESO_EJERCICIO_DIARIO` (o nueva tabla `REGISTRO_EJERCICIO`) con `peso_usado_kg`, `repeticiones`, `series`, `notas` y `fecha`.
2. Móvil: agregar inputs por ejercicio en `MiRutinaScreen` al marcarlo; calcular/guardar volumen (`peso*reps*series`).
3. Web: crear pantalla "Progreso del Afiliado" (endpoint de estadísticas por ciclo: días completados, ejercicios completados, volumen, rachas).
4. Conectar los completados con el historial del ciclo (el afiliado ya tiene resúmenes en `MiProgresoScreen.js:287-320`).

---

### FLUJO 3: Ejecución de Plan Nutricional (Móvil → Progreso)
**Estado:** 🟡 PARCIAL
**Cumplimiento:** 45%

**Verificación:**
- [✅] Afiliado ve plan nutricional de hoy → `MiDietaScreen.js` (`getPlanNutricional`, `api.js:55`)
- [✅] Comidas con alimentos y porciones → tarjetas por `num_comida`, `nombre_alimento`, `cantidad_g` (`MiDietaScreen.js:87-138`)
- [⚠️] Calorías y macronutrientes → la API entrega macro y `calorias_por_100g` (`planModel.js:131-139`), el móvil muestra **kcal por 100 g junto al gramaje** (`MiDietaScreen.js:184,127-133`) pero no suma calorías diarias ni muestra macros
- [✅] Marcar comida como consumida → toggle por alimento + guardado (`MiDietaScreen.js:223-243`)
- [❌] Registrar cantidades reales consumidas → NO (solo booleano consumido)
- [❌] Agregar notas/comentarios → NO
- [❌] Marcar día como completado → NO (solo barras por comida)
- [✅] Guardar en CONSUMO_ALIMENTO → tabla real **CONSUMO_ALIMENTO_DIARIO**, booleano `consumido` (`04_migracion_app_movil.sql:30-44`; `guardarConsumoAlimento` en `MiDietaScreen.js:227-243`)
- [❌] Progreso nutricional se actualiza → NO hay cálculo de calorías totales, macros ni % de cumplimiento
- [❌] Entrenador ve cumplimiento en web → NO (DietasView no muestra consumo del afiliado)

**Hallazgos:**
1. [CRÍTICO] No hay registro de cantidades reales ni cálculo de calorías/macros consumidos (la BD solo guarda un flag).
2. [IMPORTANTE] El móvil muestra "kcal por 100 g" como si fuera el total de la porción (`MiDietaScreen.js:130-131`), lo cual es engañoso para el usuario.
3. [IMPORTANTE] El Entrenador no ve cuánto cumplió el afiliado con su dieta.
4. [INFORMATIVO] El plan nutricional no tiene "horarios" en el modelo (solo número de comida), así que el móvil no puede mostrar a qué hora comer.

**Recomendaciones:**
1. Registrar cantidad real consumida (ampliar `CONSUMO_ALIMENTO_DIARIO` con `cantidad_consumida_g` y `notas`).
2. Calcular calorías/macros por porción (multiplicar por `cantidad_g/100`) y mostrar totales diarios y % vs `calorias_objetivo`.
3. Endpoint de cumplimiento nutricional y pantalla web para el Entrenador.
4. Corregir el rótulo "kcal" en móvil para no confundir kcal/100g con kcal de la porción.

---

### FLUJO 4: Progreso y Estadísticas (Móvil ↔ Web)
**Estado:** 🔴 NO FUNCIONAL
**Cumplimiento:** 28%

**Verificación:**
- [⚠️] Resumen del ciclo actual en móvil → existe "Mi Progreso" (`MiProgresoScreen.js`) pero muestra **registros físicos** (peso/IMC/grasa/medidas) y listas de completados; **no muestra** días de rutina completados/total ni comidas completadas/total
- [⚠️] Muestra días/ejercicios/comidas → ejercicios por fecha (completados/total: `MiProgresoScreen.js:287-320`), agua (`:322-347`), consumo (`:349-384`). Falta "días de rutina completados"
- [⚠️] Peso actual vs inicial → compara último vs anterior registro (`MiProgresoScreen.js:192-196`), no vs inicio del ciclo
- [❌] Volumen total → NO se calcula en ninguna parte
- [❌] Gráficos de evolución → NO (solo tarjetas y listas)
- [✅] Historial de ciclos anteriores → `MiPerfilScreen.js:219-221,310-325`
- [❌] Al abrir un ciclo histórico se ve su resumen → NO (solo lista con fechas/objetivo)
- [❌] Entrenador en web ve el mismo progreso → NO (solo pesos en modal; sin endpoint de progreso diario en la web)
- [❌] Reportes detallados / exportar → NO

**Hallazgos:**
1. [CRÍTICO] No hay endpoints de estadísticas agregadas (resumen del ciclo, cumplimiento, volumen) ni gráficos.
2. [CRÍTICO] El Entrenador no tiene forma de ver el avance del afiliado en la web (nada más que peso histórico).
3. [IMPORTANTE] Los datos que SÍ se muestran son **reales** (de `PROGRESO_FISICO`, `PROGRESO_EJERCICIO_DIARIO`, `REGISTRO_AGUA` y `CONSUMO_ALIMENTO_DIARIO`), no dummy.
4. [MEJORABLE] El historial de ciclos del móvil no permite profundizar en cada ciclo.

**Recomendaciones:**
1. Crear endpoint `GET /afiliados/me/progreso/resumen` (último peso, peso inicial del ciclo, días/ejercicios/comidas cumplidos, volúmenes).
2. Crear pantalla web de progreso del afiliado con los mismos datos que el móvil (o más).
3. Móvil: gráficos simples (línea de peso) y drill-down por ciclo histórico.
4. Conectar el módulo con el plan de ajustes del Entrenador.

---

### FLUJO 5: Actualización de Datos (Web ↔ Móvil)
**Estado:** 🟡 PARCIAL
**Cumplimiento:** 50%

**Verificación:**
- [❌] Web → Móvil en tiempo real → NO. Sin WebSocket/SSE; el móvil carga bajo demanda y con pull-to-refresh (todo `useEffect`/`fetchData` en cada pantalla)
- [❌] Móvil → Web en tiempo real → NO. La web re-fetch al montar/refrescar; solo el Header hace polling de notificaciones cada 60 s (`Header.jsx:72-78`) y los dashboards se refrescan por eventos entre pestañas del **mismo navegador** (`pago-registrado`, `afiliado-modificado`)
- [✅] No hay pérdida de datos → ✓ (misma BD única; POST/GET correctos; la persitencia es idempotente: `ON DUPLICATE KEY UPDATE` en `seguimientoDiarioModel.js:5-26`)
- [✅] Datos consistentes entre plataformas → ✓ (ambas consumen la misma API REST; los contratos reales se respetan)

**Hallazgos:**
1. [IMPORTANTE] Un cambio del Entrenador (plan/ejercicio/dieta) **solo aparece en el móvil tras recargar**; no hay aviso ni "tiempo real".
2. [IMPORTANTE] El afiliado actualiza su progreso y el Entrenador no se entera (ni en tiempo real ni en pantalla).
3. [MEJORABLE] La consistencia es buena (API única + upserts), falta solo la capa de sincronización proactiva.

**Recomendaciones:**
1. Polling ligero en móvil (30-60 s) al estar en primer plano, o usar notificaciones push (ya existe infraestructura: `notifications.js` + `POST /usuario/me/push-token`).
2. Web: polling del modal de plan/progreso abierto (o SSE).
3. Aviso visual de cambios (badge/número de versión del plan).

---

## 🔍 ANÁLISIS POR MODALIDAD DE USUARIO

### ENTRENADOR (WEB)
- [✅] Ver listado de afiliados → `/afiliados` (App.jsx:130; Sidebar.jsx:24-28)
- [✅] Ver perfil detallado (datos, restricciones, objetivo) → modal de AfiliadosView (objetivo solo si tiene ciclo activo)
- [⚠️] Crear ciclo → solo implícito al asignar plan/dieta, fechas automáticas (`RutinasView.jsx:166-175`)
- [⚠️] Asignar plan de entrenamiento → series/reps/día; **sin peso ni descanso** (`RutinasView.jsx`)
- [⚠️] Asignar plan nutricional → comidas/alimentos/gramos; **sin horarios**
- [❌] Ver progreso del afiliado (tiempo real) → NO hay pantalla (solo pesos históricos en modal)
- [❌] Ver estadísticas del afiliado → NO
- [✅] Ajustar planes basado en datos → sí (reasignar rutina/dieta) pero sin los datos de progreso
- [⚠️] Editar afiliados → PUEDE (brecha RBAC, `AfiliadosView.jsx:319`)

### RECEPCIONISTA (WEB)
- [✅] Registrar nuevos afiliados → `POST /afiliados` (`AfiliadosView.jsx:234,259-263`)
- [✅] Ver listado de afiliados → `/afiliados`
- [✅] Actualizar datos de afiliados → PATCH (`afiliadosService.js:158-160`)
- [✅] Gestionar pagos → `/pagos` (semáforo, registro con valor fijo $80.000: `PagosView.jsx:86`, historial: `:103`)

### AFILIADO (MÓVIL)
- [✅] Iniciar sesión → `POST /login` (`api.js:41-42`)
- [✅] Cerrar sesión → `MiPerfilScreen`
- [✅] Recuperar contraseña → `RecuperarPasswordScreen` + `POST /auth/recuperar-password` y `POST /auth/reset-password`
- [✅] Ver perfil (datos personales, foto) → `MiPerfilScreen`
- [✅] Subir foto de perfil → `POST /afiliados/me/foto` (`api.js` / `MiPerfilScreen.js:176-202`)
- [✅] Ver ciclo activo → `MiPerfilScreen` + `cicloUtils.js`
- [✅] Ver plan de entrenamiento (rutina diaria) → `MiRutinaScreen`
- [✅] Ver descripción de ejercicios → `planModel.js:37`
- [⚠️] Registrar ejercicio completado → sí (booleano); **NO peso/repeticiones/series reales ni notas**
- [✅] Ver plan nutricional (comidas del día) → `MiDietaScreen`
- [⚠️] Registrar consumo de alimentos → sí (booleano consumido); **NO cantidades reales ni notas**
- [✅] Registrar consumo de agua → `MiDietaScreen.js:210-221` (`POST /afiliados/me/agua`)
- [⚠️] Ver progreso → resumen real (peso, completados, agua, consumo) **sin gráficos ni volumen**
- [✅] Ver historial de ciclos → `MiPerfilScreen.js:310-325`

---

## 🎯 PLAN DE ACCIÓN POR FLUJO

### PRIORIDAD 🔴 (Esta semana - Crítico)
1. **FLUJO 2 — Registro de ejecución real**
   - [ ] Migración: ampliar `PROGRESO_EJERCICIO_DIARIO` con `peso_usado_kg`, `repeticiones_realizadas`, `series_realizadas`, `notas` (o crear `REGISTRO_EJERCICIO`)
   - [ ] Móvil: inputs de registro al marcar ejercicios (`MiRutinaScreen`)
   - [ ] Calcular y guardar volumen total (`peso×reps×series`)
2. **FLUJO 4 — Módulo de progreso/estadísticas**
   - [ ] Endpoint `GET /afiliados/me/progreso/resumen` (peso actual vs inicial, días/ejercicios/comidas cumplidos)
   - [ ] Pantalla web de progreso del afiliado para el Entrenador
   - [ ] Gráficos de evolución en móvil + drill-down por ciclo histórico
3. **FLUJO 3 — Consumo nutricional real**
   - [ ] Guardar `cantidad_consumida_g` y notas en `CONSUMO_ALIMENTO_DIARIO`
   - [ ] Calcular calorías/macros por porción y % vs `calorias_objetivo`
   - [ ] Endpoint de cumplimiento nutricional + vista web
4. **FLUJO 1 — Coherencia de registro**
   - [ ] Persistir objetivo/nivel/disponibilidad al ciclo del afiliado (no default hardcodeado)
   - [ ] UI de restricciones médicas (usar `afiliadoRoutes.js:509,536`)
   - [ ] UI de ciclo (fechas manuales + activo/inactivo)

### PRIORIDAD 🟡 (Próxima semana - Importante)
1. **FLUJO 5 — Sincronización**
   - [ ] Polling 30-60 s en pantallas móviles activas, o push (ya existe `notifications.js` + `POST /usuario/me/push-token`)
   - [ ] Aviso de plan actualizado
2. **FLUJO 1 — Planificación completa**
   - [ ] Formulario de ejercicios con `peso_kg` y `descanso_seg`
   - [ ] Horarios en el plan nutricional (hoy inexistentes en el modelo)
3. **FLUJO 2 — Gamificación/contexto**
   - [ ] Mostrar en cada ejercicio la última ejecución (peso/reps) para sugerir carga
4. **RBAC web**
   - [ ] Restringir edición de afiliados a Admin/Recepcionista (`AfiliadosView.jsx:319`)
   - [ ] Conectar `PagosView` al precio configurable (`CONFIGURACION.precio_membresia`) en vez de $80.000 fijo

### PRIORIDAD 🟢 (Dos semanas - Mejorable)
1. **FLUJO 4 — Reportes**
   - [ ] Más gráficos (peso en el tiempo, cumplimiento semanal, calorías vs consumo)
   - [ ] Exportar reportes (CSV/PDF)
   - [ ] Comparativa entre ciclos
2. **FLUJO 2 — Gamificación**
   - [ ] Rachas de días completados
   - [ ] Récords personales por ejercicio
3. **FLUJO 3 — Nutrición**
   - [ ] Escáner de código de barras / recetas sugeridas
   - [ ] Mostrar macros correctamente por porción

---

## 📎 EVIDENCIAS REQUERIDAS POR FLUJO

### FLUJO 1: Registro y Asignación
- [ ] Captura: Recepcionista registrando afiliado en web
- [ ] Captura: Entrenador asignando plan de entrenamiento en web (ciclo implícito)
- [ ] Captura: Entrenador asignando plan nutricional en web
- [ ] Captura: Afiliado viendo ciclo activo + historial en móvil
- [ ] Verificación en BD: `USUARIO`, `AFILIADO`, `CICLO`, `PLAN_ENTRENAMIENTO`, `RUTINA`, `RUTINA_EJERCICIO`, `PLAN_NUTRICIONAL`, `DETALLE_NUTRICIONAL`

### FLUJO 2: Ejecución de Rutina
- [ ] Captura: Afiliado viendo rutina de hoy en móvil
- [ ] Captura: Afiliado viendo descripción/instrucciones y peso/descanso
- [ ] Captura: Afiliado marcando ejercicio completado
- [ ] Verificación en BD: `PROGRESO_EJERCICIO_DIARIO`
- [ ] Captura (brecha): no existe registro de peso/reps reales

### FLUJO 3: Ejecución de Plan Nutricional
- [ ] Captura: Afiliado viendo plan nutricional en móvil
- [ ] Captura: Afiliado marcando alimentos consumidos
- [ ] Verificación en BD: `CONSUMO_ALIMENTO_DIARIO`, `REGISTRO_AGUA`

### FLUJO 4: Progreso y Estadísticas
- [ ] Captura: Afiliado viendo Mi Progreso (peso real, completados, agua, consumo)
- [ ] Captura: Afiliado viendo historial de ciclos en móvil
- [ ] Captura (brecha): no hay gráficos ni vista del Entrenador en web

### FLUJO 5: Actualización de Datos
- [ ] Video: cambio en web → se refleja en móvil tras recargar/pull-to-refresh
- [ ] Video: cambio en móvil → se refleja en web tras recargar (sin tiempo real)

---

## APÉNDICE — Nombre de tablas/endpoints del enunciado vs reales

| Enunciado | Real en el sistema |
|-----------|--------------------|
| `REGISTRO_EJERCICIO` | `PROGRESO_EJERCICIO_DIARIO` (solo `completado`) — `04_migracion_app_movil.sql:4-17` |
| `PROGRESO_FISICO` actualizado por completados | `PROGRESO_FISICO` guarda **solo peso/medidas del entrenador** — `01_schema.sql:450-477` |
| `PLAN_ENTRENAMIENTO_EJERCICIO` | `RUTINA_EJERCICIO` (PK `id_rutina, orden`) — `01_schema.sql:382-400` |
| `PLAN_NUTRICIONAL_ALIMENTO` | `DETALLE_NUTRICIONAL` (PK `id_ciclo, num_comida, id_alimento`) — `01_schema.sql:416-436` |
| `CONSUMO_ALIMENTO` | `CONSUMO_ALIMENTO_DIARIO` (solo `consumido`) — `04_migracion_app_movil.sql:30-44` |
| `REGISTRO agua` | `REGISTRO_AGUA` (vasos) — `04_migracion_app_movil.sql:19-28` |
| `POST /api/ejercicios/registrar` | `POST /afiliados/me/progreso-ejercicio` (booleano) — `afiliadoRoutes.js:728` |
| `POST /api/nutricion/consumo` | `POST /afiliados/me/consumo-alimento` (booleano) — `afiliadoRoutes.js:852` |
| `GET /api/progreso/resumen`, `/graficos` | **No existen** |
| `GET /api/ciclos/historial` | Derivado: `GET /afiliados/me/ciclos` + filtro local — `cicloModel.js:13-27` |
| Estado del ciclo "Activo/Inactivo" | Columna `CICLO.activo` TINYINT — `01_schema.sql:266`, sin UI de gestión |
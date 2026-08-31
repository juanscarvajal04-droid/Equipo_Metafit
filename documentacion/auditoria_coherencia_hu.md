# Auditoría de Coherencia — MetaFit

**Fecha:** 2026-08-27  
**Alcance:** Frontend web (React/Vite), App móvil (React Native/Express), Backend (Node.js/Express), BD (MySQL 8), Postman  
**Rama:** `feature/juan-carvajal`

---

## Resumen Ejecutivo

| Aspecto | Resultado |
|---|---|
| Total tablas BD | 21 (17 core + 4 móviles) |
| Total endpoints backend | 63 API |
| Total pantallas móvil | 6 (Login, Recuperar, Perfil, Rutina, Dieta, Progreso) |
| Total vistas web | 9 (Landing, Login, Dashboard, Afiliados, Rutinas, Dietas, Pagos, Finanzas, Personal) |
| Bugs críticos corregidos | 2 |
| Bugs menores detectados | 4 |
| HU con cumplimiento total | 8/10 |
| HU con cumplimiento parcial | 2/10 |

---

## PARTE 1 — AUDITAR CICLO ACTIVO Y PLAN DE ENTRENAMIENTO

### 1.1 Pantalla "Mi Rutina" (app móvil)

| Criterio | Estado | Evidencia |
|---|---|---|
| Ciclo activo con fechas de inicio/fin y días restantes | ✅ | `MiRutinaScreen.js:21` usa `seleccionarCicloActivo()` → `GET /afiliados/me/ciclos` → `cicloUtils.js` filtra `activo===1`. Fechas se muestran en header. |
| Plan de entrenamiento con rutinas por día | ✅ | `GET /planes/entrenamiento/{idCiclo}` → `planController.getEntrenamiento` → SQL con `JSON_ARRAYAGG` agrupado por `dia_numero`. Chips horizontales Lunes-Domingo. |
| Ejercicios con series, repeticiones y descripciones | ✅ | `MiRutinaScreen.js:155-161` muestra `series × reps · peso kg · descanso`. Instrucciones vía botón info (`ej.instrucciones`). |
| Checkboxes para marcar ejercicios completados | ✅ | `MiRutinaScreen.js:126` toggle local `completados[id_ejercicio]`, guardado vía `POST /afiliados/me/progreso-ejercicio`. |

### 1.2 Guardado de progreso diario

| Criterio | Estado | Evidencia |
|---|---|---|
| POST al backend al guardar | ✅ | `guardarProgresoEjercicio(idCiclo, fecha, ejercicios)` → `POST /afiliados/me/progreso-ejercicio` |
| Guardado en tabla de BD | ✅ | `PROGRESO_EJERCICIO_DIARIO` (tabla del migración `04_migracion_app_movil.sql`). SQL: `INSERT ... ON DUPLICATE KEY UPDATE completado`. |
| Reflejado en "Mi Progreso" | ⚠️ | `MiProgresoScreen` muestra solo progreso físico (peso/IMC/grasa). NO muestra ejercicios completados por día. El endpoint `GET /afiliados/me/progreso` solo retorna `PROGRESO_FISICO`, no `PROGRESO_EJERCICIO_DIARIO`. |

### 1.3 Sin plan asignado

| Criterio | Estado | Evidencia |
|---|---|---|
| Mensaje amigable | ✅ | `MiRutinaScreen.js` línea ~230: `"No tenés un ciclo asignado."` / `MiPerfilScreen.js:304`: `"No tienes un ciclo asignado. Consulta con tu entrenador."` |

---

## PARTE 2 — AUDITAR PLAN NUTRICIONAL Y COMIDAS

### 2.1 Pantalla "Mi Dieta" (app móvil)

| Criterio | Estado | Evidencia |
|---|---|---|
| Calorías objetivo y número de comidas | ✅ | `GET /planes/nutricional/{idCiclo}` → `planController.getNutricional` → `calorias_objetivo`, `num_comidas`. |
| Lista de comidas agrupadas | ✅ | `MiDietaScreen.js:40` `ComidaCard` agrupa por `num_comida`. Cada card muestra progreso. |
| Alimentos con cantidades y macros | ✅ | Backend retorna `nombre_alimento, cantidad_g, calorias_por_100g, proteinas, carbohidratos, grasas`. UI muestra gramos y kcal. |
| Checkboxes para alimentos consumidos | ✅ | Toggle local `consumidos[id_alimento]`, guardado vía `POST /afiliados/me/consumo-alimento`. |
| Registro de vasos de agua | ✅ | 8 vasos interactivos. Guardado inmediato vía `POST /afiliados/me/agua`. `GET /afiliados/me/agua/{fecha}` carga estado. |

### 2.2 Guardado de progreso nutricional

| Criterio | Estado | Evidencia |
|---|---|---|
| POST al backend | ✅ | `guardarConsumoAlimento(idCiclo, fecha, alimentos)` → `POST /afiliados/me/consumo-alimento` |
| Guardado en BD | ✅ | `CONSUMO_ALIMENTO_DIARIO` (tabla migración `04_migracion_app_movil.sql`). SQL: `INSERT ... ON DUPLICATE KEY UPDATE consumido`. |
| Agua en BD | ✅ | `REGISTRO_AGUA` (tabla migración). SQL: `INSERT ... ON DUPLICATE KEY UPDATE vasos`. |

---

## PARTE 3 — AUDITAR CICLOS ANTERIORES

### 3.1 Visualización de ciclos anteriores

| Criterio | Estado | Evidencia |
|---|---|---|
| Ciclos anteriores visibles | ✅ | `MiPerfilScreen.js:310-325` sección "Historial de Ciclos" muestra todos los no-activos. |
| Planes de ciclos pasados | ❌ | **No hay navegación para ver planes históricos.** `MiRutinaScreen` y `MiDietaScreen` usan `seleccionarCicloActivo()` que solo selecciona el ciclo `activo===1`. No hay selector de ciclo. |
| Diferenciación visual activo/inactivo | ✅ | `MiPerfilScreen.js:300` muestra `"Activo"` o `"Inactivo"`. Ciclos historial se listan aparte con fecha rango. |

### 3.2 Endpoint /afiliados/me/ciclos

| Criterio | Estado | Evidencia |
|---|---|---|
| Devuelve todos los ciclos | ✅ | `cicloModel.findByAfiliado`: `SELECT c.* ... WHERE c.id_usuario = ? ORDER BY c.fecha_inicio DESC` — sin filtro de `activo`. Retorna todos. |

### 3.3 Selector de ciclo en rutina/dieta

| Criterio | Estado | Evidencia |
|---|---|---|
| Seleccionar ciclo anterior | ❌ | **No implementado.** `MiRutinaScreen.js:21` y `MiDietaScreen.js:22` importan `seleccionarCicloActivo` que filtra por `activo===1`. No hay UI para seleccionar otro ciclo. |

---

## PARTE 4 — AUDITAR PROGRESO DEL AFILIADO

### 4.1 Pantalla "Mi Progreso" (app móvil)

| Criterio | Estado | Evidencia |
|---|---|---|
| Historial de mediciones (peso, % grasa, medidas, IMC) | ✅ | `MiProgresoScreen.js:48-60` `ProgresoItem` muestra peso, IMC, grasa_corporal, masa_muscular, cintura. Cards resumen con peso actual, cambio, registros. |
| Ejercicios completados por día | ❌ | **No se muestra.** `MiProgresoScreen` solo llama `GET /afiliados/me/progreso` (PROGRESO_FISICO). No llama `GET /afiliados/me/progreso-ejercicio/{id}/{fecha}`. |
| Alimentos consumidos | ❌ | **No se muestra.** No hay endpoint GET para historial de consumo de alimentos. Solo existe `POST /afiliados/me/consumo-alimento` (escritura). |
| Vasos de agua | ❌ | **No se muestra.** Solo existe `GET /afiliados/me/agua/{fecha}` (un día específico). No hay endpoint de historial de agua. |

### 4.2 Datos del backend

| Criterio | Estado | Evidencia |
|---|---|---|
| Datos reales (no mockeados) | ✅ | Todos los endpoints retornan queries SQL reales contra tablas `PROGRESO_FISICO`, `PROGRESO_EJERCICIO_DIARIO`, `REGISTRO_AGUA`, `CONSUMO_ALIMENTO_DIARIO`. |
| Tablas con datos de prueba | ⚠️ | `PROGRESO_FISICO`: 14 registros de seed. `PROGRESO_EJERCICIO_DIARIO`, `REGISTRO_AGUA`, `CONSUMO_ALIMENTO_DIARIO`: 0 registros (tablas vacías, solo schema). |

---

## PARTE 5 — AUDITORÍA HU POR HU

### HU1: Login y Autenticación

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Login con email/password | `POST /login` | USUARIO | ✅ |
| JWT de 8h | `authController.login` | — | ✅ |
| Roles: Admin, Recepcionista, Entrenador, Afiliado | `USUARIO.rol` ENUM | USUARIO | ✅ |
| Login móvil | `POST /login` (api.js) | USUARIO | ✅ |
| Login web | `POST /login` (api.js) | USUARIO | ✅ |

### HU2: CRUD de Afiliados (web staff)

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Listar afiliados | `GET /afiliados` | AFILIADO + USUARIO | ✅ |
| Crear afiliado | `POST /afiliados` | USUARIO + AFILIADO | ✅ |
| Editar afiliado | `PATCH /afiliados/:id` | AFILIADO + USUARIO | ✅ |
| Eliminar afiliado | `DELETE /afiliados/:id` | AFILIADO + USUARIO | ✅ |
| Subir foto | `POST /afiliados/:id/foto` | AFILIADO.foto | ✅ |
| Perfil propio (móvil) | `GET /afiliados/me` | AFILIADO + USUARIO | ✅ |

### HU3: Gestión de Ciclos

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Crear ciclo | `POST /afiliados/ciclos` | CICLO | ✅ |
| Ciclo activo por afiliado | `GET /afiliados/me/ciclos` | CICLO | ✅ |
| Todos los ciclos | `GET /afiliados/me/ciclos` | CICLO | ✅ |
| Cerrar ciclo anterior automáticamente | `cicloModel.create` (UPDATE activo=0) | CICLO | ✅ |
| Validar solapamiento de fechas | `cicloModel.create` | CICLO | ✅ |
| Ver planes de ciclos anteriores (móvil) | — | — | ❌ |

### HU4: Plan de Entrenamiento

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Crear plan | `POST /planes/entrenamiento` | PLAN_ENTRENAMIENTO | ✅ |
| Crear rutina | `POST /planes/rutinas` | RUTINA | ✅ |
| Agregar ejercicio a rutina | `POST /planes/rutinas/:id/ejercicios` | RUTINA_EJERCICIO | ✅ |
| Ver plan (móvil) | `GET /planes/entrenamiento/:id_ciclo` | RUTINA + RUTINA_EJERCICIO | ✅ |
| Ejercicios con series/reps/peso | `RUTINA_EJERCICIO` | RUTINA_EJERCICIO | ✅ |
| Marcar ejercicio completado | `POST /afiliados/me/progreso-ejercicio` | PROGRESO_EJERCICIO_DIARIO | ✅ |

### HU5: Plan Nutricional

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Crear plan | `POST /planes/nutricional` | PLAN_NUTRICIONAL | ✅ |
| Agregar alimentos | `POST /planes/nutricional/:id/detalle` | DETALLE_NUTRICIONAL | ✅ |
| Ver plan (móvil) | `GET /planes/nutricional/:id_ciclo` | DETALLE_NUTRICIONAL + ALIMENTO | ✅ |
| Calorías objetivo | `PLAN_NUTRICIONAL.calorias_objetivo` | PLAN_NUTRICIONAL | ✅ |
| Macros por alimento | `v_alimento_calorias` (VIEW) | ALIMENTO | ✅ |
| Marcar alimento consumido | `POST /afiliados/me/consumo-alimento` | CONSUMO_ALIMENTO_DIARIO | ✅ |
| **⚠️ BUG: updateNutricional borra detalle** | `planController.updateNutricional` | DETALLE_NUTRICIONAL | ✅ CORREGIDO |

### HU6: Seguimiento Diario (app móvil)

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Registro de agua | `POST /afiliados/me/agua` | REGISTRO_AGUA | ✅ |
| Consulta de agua | `GET /afiliados/me/agua/:fecha` | REGISTRO_AGUA | ✅ |
| Progreso de ejercicios | `POST /afiliados/me/progreso-ejercicio` | PROGRESO_EJERCICIO_DIARIO | ✅ |
| Consulta progreso ejercicios | `GET /afiliados/me/progreso-ejercicio/:id/:fecha` | PROGRESO_EJERCICIO_DIARIO | ✅ |
| Consumo de alimentos | `POST /afiliados/me/consumo-alimento` | CONSUMO_ALIMENTO_DIARIO | ✅ |
| Historial de agua (múltiples días) | — | — | ❌ |
| Historial de consumo alimentos | — | — | ❌ |

### HU7: Progreso Físico

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Registrar medición (staff) | `POST /afiliados/progreso` | PROGRESO_FISICO | ✅ |
| Ver historial (móvil) | `GET /afiliados/me/progreso` | PROGRESO_FISICO | ✅ |
| IMC calculado | `ROUND(peso_kg / POW(estatura/100, 2), 2)` | PROGRESO_FISICO | ✅ |
| **⚠️ BUG: validación peso vs peso_kg** | `afiliadoService.createProgreso` | — | ✅ CORREGIDO |

### HU8: Pagos y Membresías

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Registrar pago (admin/recep) | `POST /afiliados/:id/pagos` | PAGO | ✅ |
| Historial de pagos | `GET /afiliados/:id/pagos` | PAGO | ✅ |
| Métricas admin | `GET /pagos/metricas` | PAGO | ✅ |
| Precio membresía configurable | `GET/PUT /configuracion/precio-membresia` | CONFIGURACION | ✅ |
| Recordatorio de pagos vencidos | `cron/recordatorioPagos.js` | PAGO_RECORDATORIO | ✅ |

### HU9: Dashboard y Notificaciones

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| KPIs del gimnasio | `GET /dashboard/kpis` | Múltiples tablas | ✅ |
| Notificaciones por rol | `GET /notificaciones` | Compute dinámico | ✅ |
| Gráficas de distribución | Frontend calcula | — | ✅ |

### HU10: Catálogos (Ejercicios, Alimentos, Restricciones)

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| CRUD ejercicios | `GET/POST/PUT/DELETE /catalogo/ejercicios` | EJERCICIO | ✅ |
| CRUD alimentos | `GET/POST/PUT/DELETE /catalogo/alimentos` | ALIMENTO | ✅ |
| Restricciones médicas | `GET /catalogo/restricciones` | RESTRICCION | ✅ |
| Ejercicios filtrados por restricción | `GET /afiliados/:id/ejercicios-disponibles` | EJERCICIO_RESTRICCION_EXCLUIDA | ✅ |
| Alimentos filtrados por restricción | `GET /afiliados/:id/alimentos-disponibles` | ALIMENTO_RESTRICCION_EXCLUIDA | ✅ |

---

## PROBLEMAS ENCONTRADOS Y CORREGIDOS

### Bugs Críticos Corregidos

| # | Problema | Archivo | Línea | Corrección |
|---|---|---|---|---|
| 1 | `updateNutricional` borraba todo el detalle de alimentos al actualizar solo calorias/comidas | `backend/controllers/planController.js` | 158 | Eliminada llamada a `PlanModel.clearDetalleNutricional()` |
| 2 | `createProgreso` validaba `datos.peso` pero el frontend envía `peso_kg` | `backend/services/afiliadoService.js` | 120 | Validación cambiada a `!datos.peso_kg && !datos.peso` |

### Bugs Menores Detectados (sin corrección automática)

| # | Problema | Archivo | Impacto |
|---|---|---|---|
| 3 | `getRecepcionistas` carga TODOS los usuarios y filtra en JS | `usuarioController.js:13` | Rendimiento innecesario |
| 4 | `pagoController.create` no pasa `req.user.sub` como `registrado_por` | `pagoController.js:54` | Pago se registra sin saber quién lo creó |
| 5 | Sin validación server-side de `dia_numero` (1-7) en `createRutina` | `planController.js` | Dato inválido podría llegar a la BD |
| 6 | `MiProgresoScreen` no muestra ejercicios completados ni alimentos consumidos | `MiProgresoScreen.js` | UX incompleta |

### Gaps Funcionales (sin implementar)

| # | Funcionalidad | Dónde aplicaría | Estado |
|---|---|---|---|
| 7 | Selector de ciclo en "Mi Rutina" para ver planes históricos | `MiRutinaScreen.js` | No implementado |
| 8 | Selector de ciclo en "Mi Dieta" para ver planes históricos | `MiDietaScreen.js` | No implementado |
| 9 | Endpoint GET de historial de agua (múltiples días) | Backend nuevo | No existe |
| 10 | Endpoint GET de historial de consumo de alimentos | Backend nuevo | No existe |
| 11 | Mostrar progreso de ejercicios completados en "Mi Progreso" | `MiProgresoScreen.js` | No implementado |

---

## PRUEBAS DE TRAZABILIDAD

### Trazabilidad: Ciclo Activo → Plan → Ejercicios

**Query SQL (ciclo activo):**
```sql
SELECT c.*, (SELECT COUNT(*)+1 FROM CICLO c2 WHERE c2.id_usuario=c.id_usuario AND c2.fecha_inicio<c.fecha_inicio) AS numero_ciclo
FROM CICLO c WHERE c.id_usuario=6 AND c.activo=1;
```
**Ejemplo respuesta endpoint `GET /afiliados/me/ciclos`:**
```json
[{ "id_ciclo": 2, "activo": 1, "objetivo_fisico": "Perdida de grasa", "numero_ciclo": 2, "fecha_inicio": "2024-04-04", "fecha_fin": "2024-05-31" }]
```

**Query SQL (plan de entrenamiento):**
```sql
SELECT r.id_rutina, r.nombre_rutina, r.dia_numero,
  JSON_ARRAYAGG(JSON_OBJECT('nombre_ejercicio', e.nombre_ejercicio, 'series', re.series, 'repeticiones', re.repeticiones))
FROM RUTINA r
LEFT JOIN RUTINA_EJERCICIO re ON r.id_rutina = re.id_rutina
LEFT JOIN EJERCICIO e ON re.id_ejercicio = e.id_ejercicio
WHERE r.id_ciclo = 2 GROUP BY r.id_rutina ORDER BY r.dia_numero;
```

### Trazabilidad: Progreso de Ejercicios

**Query SQL:**
```sql
INSERT INTO PROGRESO_EJERCICIO_DIARIO (id_usuario, id_ciclo, id_ejercicio, fecha, completado)
VALUES (6, 2, 1, '2026-08-27', 1)
ON DUPLICATE KEY UPDATE completado=1, updated_at=NOW();
```

**Lectura:**
```sql
SELECT id_ejercicio, completado FROM PROGRESO_EJERCICIO_DIARIO
WHERE id_usuario=6 AND id_ciclo=2 AND fecha='2026-08-27';
```

### Trazabilidad: Consumo de Alimentos

**Query SQL:**
```sql
INSERT INTO CONSUMO_ALIMENTO_DIARIO (id_usuario, id_ciclo, id_alimento, num_comida, fecha, consumido)
VALUES (6, 2, 1, 1, '2026-08-27', 1)
ON DUPLICATE KEY UPDATE consumido=1, updated_at=NOW();
```

---

## RECOMENDACIONES FINALES

### Prioridad Alta
1. ~~**Implementar selector de ciclo en MiRutinaScreen y MiDietaScreen**~~ ✅ `MiRutinaScreen.js` y `MiDietaScreen.js` ahora muestran picker de ciclo cuando hay más de 1 ciclo.
2. ~~**Crear endpoints de historial**~~ ✅ `GET /afiliados/me/agua/historial`, `GET /afiliados/me/consumo/historial`, `GET /afiliados/me/progreso-ejercicio/historial` — implementados en backend + service + controller + routes.
3. ~~**Mostrar progreso de ejercicios en MiProgresoScreen**~~ ✅ `MiProgresoScreen.js` ahora muestra ejercicios completados por día, consumo de agua y consumo de alimentos desde los endpoints de historial.

### Prioridad Media
4. ~~**Fix `pagoController.create`**~~ ✅ `pagoController.js:32` ahora pasa `req.user.sub` como `registrado_por`.
5. ~~**Fix `getRecepcionistas`**~~ ✅ `usuarioModel.js` ahora tiene `findRecepcionistas()` con `WHERE rol = 'Recepcionista'` en SQL.
6. ~~**Validar `dia_numero` 1-7**~~ ✅ `planController.js:createRutina` ahora valida `dia_numero >= 1 && <= 7`.
7. ~~**Agregar datos de prueba**~~ ✅ `02_seed.sql` ya contiene 2 ciclos + 6 rutinas + planes nutricionales + 4 registros de progreso para Juan (id=6).

### Prioridad Baja
8. **Optimizar `pagoModel.getMetricas`** — Unificar las 4 queries en una sola con subconsultas.
9. **Dashboard.jsx (legacy)** — Eliminar o redirigir, ya que `AdminDashboard.jsx` lo reemplazó.
10. **Documentar API en Postman** — Las colecciones Postman ya están sincronizadas con los endpoints reales (verificar tras este cambio).

---

## ARCHIVOS MODIFICADOS EN ESTA AUDITORÍA

| Archivo | Cambio |
|---|---|
| `backend/controllers/planController.js:158` | Eliminada línea `await PlanModel.clearDetalleNutricional(req.params.id)` |
| `backend/services/afiliadoService.js:120` | Corregida validación: `!datos.peso` → `!datos.peso_kg && !datos.peso` |
| `backend/controllers/usuarioController.js` | `getRecepcionistas` ahora llama `UsuarioService.getRecepcionistas()` en lugar de filtrar en JS |
| `backend/services/usuarioService.js` | Agregado método `getRecepcionistas()` |
| `backend/models/usuarioModel.js` | Agregado método `findRecepcionistas()` con SQL `WHERE rol='Recepcionista'` |
| `backend/controllers/pagoController.js` | `create` ahora incluye `registrado_por: req.user.sub` |
| `backend/controllers/planController.js` | `createRutina` valida `dia_numero` entre 1 y 7 |
| `backend/models/seguimientoDiarioModel.js` | Agregados métodos `getAguaHistorial`, `getConsumoHistorial`, `getProgresoEjercicioHistorial` |
| `backend/services/afiliadoService.js` | Agregados métodos de historial |
| `backend/controllers/afiliadoController.js` | Agregados controllers de historial |
| `backend/routes/afiliadoRoutes.js` | Agregadas 3 rutas de historial (GET) |
| `movil/src/services/api.js` | Agregadas funciones `getAguaHistorial`, `getConsumoHistorial`, `getProgresoEjercicioHistorial` |
| `movil/src/screens/MiRutinaScreen.js` | Agregado selector de ciclo con picker |
| `movil/src/screens/MiDietaScreen.js` | Agregado selector de ciclo con picker |
| `movil/src/screens/MiProgresoScreen.js` | Agregadas secciones de historial: ejercicios, agua y alimentos |

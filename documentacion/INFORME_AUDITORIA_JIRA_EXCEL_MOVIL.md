# INFORME — AUDITORÍA Y ACTUALIZACIÓN DE JIRA + EXCEL (SOLO MÓVIL)

**Fecha:** 2026-09-02
**Alcance:** Historias de usuario móviles (afiliado) · Proyecto METAFIT
**Estado de estados:** NO se cambió ningún estado en Jira (los valida el instructor).

---

## 1. RESUMEN EJECUTIVO

- **17 HUs móviles** auditadas (HU01, HU02, HU14, HU17, HU21, HU24, HU43, HU48, HU59–HU67).
- **Jira actualizado ✅:** las 17 HUs móviles existen en Jira; 13 ya tenían criterios de aceptación completos; se **completaron/ampliaron criterios** en HU24, HU59 y HU63, y se **crearon desde cero** las HUs sin criterios (HU64, HU65, HU66, HU67). Sin cambios de estado.
- **Excel actualizado ✅:** criterios de aceptación completos + columna **Móvil = ✅** en el archivo canónico; en el secundario se **agregaron las 4 HUs faltantes** (HU64–HU67).

---

## 2. JIRA — ACTUALIZADO ✅

### 2.1 Verificación de las 17 HUs móviles

Todas las historias móviles existen en el proyecto METAFIT (tablero 67). Mapeo HU ↔ clave Jira:

| HU | Clave Jira |
|---|---|
| HU01 Iniciar Sesión | METAFIT-6 |
| HU02 Cerrar Sesión | METAFIT-267 |
| HU14 Consultar Perfil | METAFIT-7 |
| HU17 Consultar Mis Ciclos | METAFIT-269 |
| HU21 Consultar Restricciones | METAFIT-268 |
| HU24 Consultar Progreso Físico | METAFIT-10 |
| HU43 Consultar Rutina Diaria | METAFIT-8 |
| HU48 Consultar Plan Nutricional | METAFIT-9 |
| HU59 Registrar Ejercicios Completados | METAFIT-270 |
| HU60 Consultar Ejercicios Completados | METAFIT-271 |
| HU61 Registrar Consumo de Agua | METAFIT-272 |
| HU62 Consultar Consumo de Agua | METAFIT-273 |
| HU63 Registrar Consumo de Alimentos | METAFIT-274 |
| HU64 Recuperar contraseña | METAFIT-356 |
| HU65 Subir foto de perfil | METAFIT-360 |
| HU66 Tema claro/oscuro | METAFIT-364 |
| HU67 Notificaciones push | METAFIT-368 |

### 2.2 Criterios de aceptación en Jira

- **13 HUs ya tenían criterios completos:** HU01, HU02, HU14, HU17, HU21, HU43, HU48, HU59, HU60, HU61, HU62, HU63 (los existentes se conservaron).
- **Criterios ampliados (append vía API PUT `/rest/api/3/issue/{key}`):**
  - **HU24** (METAFIT-10): +3 criterios → gráfico de evolución de peso, gráfico de volumen por semana, gráfico de cumplimiento nutricional (dona).
  - **HU59** (METAFIT-270): +4 criterios → registro de peso REAL (kg), repeticiones REALES, series REALES y cálculo de volumen total (peso × reps × series).
  - **HU63** (METAFIT-274): +3 criterios → registro de cantidad REAL en gramos, cálculo automático de calorías, y cálculo de proteínas/carbohidratos/grasas.
- **Criterios creados desde cero (HUs sin descripción/criterios):**
  - **HU64** (METAFIT-356): recuperación de contraseña — 4 criterios.
  - **HU65** (METAFIT-360): subir foto de perfil — 4 criterios.
  - **HU66** (METAFIT-364): tema claro/oscuro — 3 criterios.
  - **HU67** (METAFIT-368): notificaciones push — 4 criterios.

> **Estados intactos:** ninguna historia cambió de estado o se creó de nuevo; solo se editó el campo `description` (criterios de aceptación).

---

## 3. EXCEL — ACTUALIZADO ✅

### 3.1 Archivo canónico: `exceldoc/ESTRATEGIA DE REQUISITOS - METAFIT.xlsx`
- **Añadida columna "CRITERIOS DE ACEPTACIÓN"** (columna AB) con criterios textuales enumerados (multi-línea) para **las 17 HUs móviles**.
- **Columna Móvil (K) = ✅ (True)** confirmada en las 17 HUs móviles.
- Las 17 HUs móviles ya existían en este archivo → no fue necesario agregar HUs.

### 3.2 Archivo secundario: `exceldoc/ESTRATEGIA REQUISITOS.xlsx`
- **Agregadas las 4 HUs móviles faltantes:** **HU64**, **HU65**, **HU66**, **HU67**.
- Columna **Móvil = ✅** en las 4 agregadas (y en las 13 preexistentes: HU01, HU02, HU14, HU17, HU21, HU24, HU43, HU48, HU59–HU63).
- Mantienen el formato del bloque móvil existente (bordes, celdas combinadas de módulo, alineación).

### 3.3 Criterios de aceptación definidos por HU (resumen)

| HU | Criterios clave (resumen) |
|---|---|
| **HU01** Login | Formulario correo/contraseña; acceso con credenciales válidas; error claro con inválidas; sesión persistida. |
| **HU02** Logout | Opción de cerrar sesión en menú; limpia token/datos; redirige a Login; pantallas privadas protegidas. |
| **HU14** Perfil | Ver datos personales; peso/altura/IMC reales (BD); editar peso, altura, teléfono y correo; persisten cambios. |
| **HU17** Ciclos | Lista de ciclos; cada uno con nº, objetivo, fechas y días de disponibilidad; ciclo activo; historial/resumen. |
| **HU21** Restricciones | Ver restricciones (nombre, tipo, efecto); badges/píldoras; descripción del efecto. |
| **HU24** Progreso físico | Historial físico (peso, IMC, grasa, músculo); **gráfico evolución de peso**; **gráfico volumen por semana**; **gráfico cumplimiento nutricional (dona)**; fechas DD/MM/YYYY. |
| **HU43** Rutina diaria | Rutina del día; ejercicios coherentes con el grupo muscular; serie/reps/peso/descanso; seleccionar otro día. |
| **HU48** Plan nutricional | Plan diario; comidas por horario (Desayuno/Almuerzo/Cena/Snack); macros por alimento; meta de agua 2L/8 vasos con barra. |
| **HU59** Registrar ejercicios completados | Marcar como completados; **registrar peso REAL (kg)**; **repeticiones REALES**; **series REALES**; **cálculo de volumen total (peso × reps × series)**. |
| **HU60** Consultar ejercicios completados | Listar completados; fecha, ejercicio, series×reps, peso, volumen; fechas legibles. |
| **HU61** Registrar consumo de agua | Registrar vasos del día; meta 2L (8 vasos) con barra de progreso; persiste. |
| **HU62** Consultar consumo de agua | Ver el historial con fecha y cantidad (x/8); indicar si se cumplió la meta. |
| **HU63** Registrar consumo de alimentos | Registrar por comida/horario; **cantidad REAL en gramos**; **cálculo automático de calorías**; **cálculo de proteínas, carbohidratos y grasas**; nutrientes visibles y guardados. |
| **HU64** Recuperar contraseña | Solicitar enlace de recuperación; envío de enlace/token; restablecer con token; iniciar sesión con la nueva contraseña. |
| **HU65** Subir foto de perfil | Subir foto desde la app; cámara o galería; se muestra y conserva; se sube al backend. |
| **HU66** Cambiar tema | Alternar claro/oscuro; preferencia persistida; aplica a todas las pantallas. |
| **HU67** Notificaciones push | Solicitar permiso; recibir notificaciones; gestión del token push; abrir pantalla al tocar. |

---

## 4. REPORTE DE CAMBIOS

### 4.1 HUs cuyos criterios se ampliaron en Jira + Excel
- **HU24** — agregados: gráfico evolución de peso, gráfico volumen por semana, gráfico cumplimiento nutricional.
- **HU59** — agregados: registro de peso/reps/series reales y cálculo de volumen total.
- **HU63** — agregados: registro de gramos reales, cálculo de calorías/proteínas/carbohidratos/grasas.

### 4.2 HUs con criterios creados en Jira (antes sin descripción)
**HU64, HU65, HU66, HU67** — se creó la historia de usuario + criterios de aceptación desde cero.

### 4.3 HUs agregadas al Excel
- Archivo secundario (`ESTRATEGIA REQUISITOS.xlsx`): **HU64, HU65, HU66, HU67** (4 HUs).
- Archivo canónico: ninguna (ya contenía las 17).

---

## 5. ENTREGABLES

| Entregable | Estado |
|---|---|
| Jira actualizado (criterios completos) | ✅ 17/17 HUs verificadas; criterios completos/ampliados (HU24, HU59, HU63) y creados (HU64–HU67); estados intactos |
| Excel actualizado | ✅ Canónico (17 HUs con criterios) + secundario (4 HUs agregadas) |
| Reporte de cambios | ✅ Este documento |

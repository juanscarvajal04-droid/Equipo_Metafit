# MANUAL DE USUARIO — MetaFit

**Versión:** 2.0.0  
**Fecha:** Junio 2026  
**Cliente:** Sport Gym Sede 80 — Bogotá, Colombia

---

> **Nota sobre capturas.** Cada procedimiento incluye un marcador `![...]` que indica **qué pantalla capturar y con qué nombre de archivo** (carpeta `capturas/manual_usuario/`). Mientras no se adjunten las capturas definitivas, los marcadores sirven de guía; ver la **Guía de captura** en la sección 2.11.


## 2.2 Introducción

**MetaFit** es un sistema de gestión deportiva integral diseñado para el gimnasio **Sport Gym Sede 80**. Permite administrar afiliados, personal, rutinas de entrenamiento, planes nutricionales, pagos, finanzas y progreso físico desde una plataforma web y una aplicación móvil.

**¿Para quién es este manual?**
- **Administradores** del gimnasio
- **Recepcionistas** encargados de atención al cliente
- **Entrenadores** que asignan rutinas y dietas
- **Afiliados** que consultan su progreso desde el móvil

---

## 2.3 Roles del Sistema

### Administrador
- Acceso completo a todas las funcionalidades
- Dashboard con KPIs del gimnasio (ingresos, afiliados activos, ciclos en curso)
- Gestión de personal (crear, editar, eliminar empleados)
- Cambio de precio de membresía
- CRUD completo de afiliados, rutinas, dietas y pagos
- **Panel de Finanzas** con gráficos y exportación PDF
- **Notificaciones** en el Header con badge numérico y enlace a acciones

### Recepcionista
- Gestión de afiliados (crear, editar, cambiar estado)
- Registro de pagos de membresía
- Consulta de información de afiliados
- **Notificaciones** sobre pagos vencidos y afiliados sin ciclo
- **No puede** asignar rutinas/dietas ni ver dashboard

### Entrenador
- Asignación de rutinas de entrenamiento personalizadas
- Asignación de planes nutricionales
- Visualización de restricciones médicas de afiliados
- Filtrado automático de ejercicios y alimentos prohibidos
- **CRUD completo** del catálogo de ejercicios y alimentos
- **Notificaciones** sobre afiliados sin ciclo o plan asignado
- **No puede** gestionar personal ni ver panel financiero

### Afiliado (App Móvil)
- Landing page informativa con KPIs y features del gimnasio
- Consulta de perfil personal
- Visualización de rutina asignada
- Visualización de plan nutricional
- Historial de progreso físico
- **Solo ve sus propios datos**

---

## 2.4 Guía para Administrador

### Iniciar Sesión

![Captura 2.4.1 — Iniciar Sesión](capturas/manual_usuario/2_4_1_iniciar_sesion.png)

> 📸 **Captura 2.4.1:** pantalla de *Iniciar Sesión*. Guardar en `capturas/manual_usuario/2_4_1_iniciar_sesion.png`.

1. Abrir el navegador en `http://localhost:5173`
2. Hacer clic en **"Iniciar Sesión"** en la página principal
3. Seleccionar **"Administrador"** en el selector de rol
4. Ingresar:
   - **Correo:** `carlos@metafit.com`
   - **Contraseña:** `Admin123!`
5. Hacer clic en **"Ingresar al Sistema"**

### Ver Dashboard y KPIs

![Captura 2.4.2 — Ver Dashboard y KPIs](capturas/manual_usuario/2_4_2_ver_dashboard_y_kpis.png)

> 📸 **Captura 2.4.2:** pantalla de *Ver Dashboard y KPIs*. Guardar en `capturas/manual_usuario/2_4_2_ver_dashboard_y_kpis.png`.

1. Al iniciar sesión, será redirigido al Dashboard
2. Verá las siguientes métricas:
   - **KPIs principales**: Total afiliados, activos, ciclos activos, con restricciones, ingresos, pagos registrados
   - **Distribución por objetivo**: Gráfico de barras con los objetivos físicos de los ciclos activos
   - **Evolución de afiliados**: Gráfico de línea con los últimos 6 meses
   - **Afiliados con restricciones vs sin restricciones**: Gráfico doughnut
   - **Ciclos por nivel de experiencia**: Gráfico de barras horizontal
   - **Tabla de afiliados**: Buscable con avatar, objetivo, nivel, ciclo, estado
3. Para actualizar los datos, cambiar de pestaña o hacer clic en **"Actualizar datos"**

### Cambiar Precio de Membresía

![Captura 2.4.3 — Cambiar Precio de Membresía](capturas/manual_usuario/2_4_3_cambiar_precio_de_membresia.png)

> 📸 **Captura 2.4.3:** pantalla de *Cambiar Precio de Membresía*. Guardar en `capturas/manual_usuario/2_4_3_cambiar_precio_de_membresia.png`.

1. Ir al **Dashboard**
2. En la sección "Precio de Membresía" (parte superior), verá el valor actual
3. Hacer clic en **"Editar"** (icono de lápiz)
4. Ingresar el nuevo valor en COP (ej: `90000`)
5. Hacer clic en **"Guardar"** o **"Cancelar"** para descartar
6. El cambio se refleja inmediatamente en:
   - El precio mostrado en Pantalla de Pagos
   - El cálculo de ingreso proyectado (`precio × afiliados activos`)

### Ver Panel de Finanzas

![Captura 2.4.4 — Ver Panel de Finanzas](capturas/manual_usuario/2_4_4_ver_panel_de_finanzas.png)

> 📸 **Captura 2.4.4:** pantalla de *Ver Panel de Finanzas*. Guardar en `capturas/manual_usuario/2_4_4_ver_panel_de_finanzas.png`.

1. En el menú lateral, hacer clic en **"Finanzas"**
2. Verá los siguientes indicadores:
   - **KPIs**: Total recaudado, recaudado este mes, mes anterior, promedio mensual, mejor recepcionista
3. **Filtros**: Seleccionar rango de fechas y/o recepcionista para filtrar
4. **Gráfico de barras**: Ingresos por mes (los últimos 6 meses)
5. **Gráfico doughnut**: Recaudación por recepcionista
6. **Últimos pagos**: Tarjetas con los pagos más recientes

### Exportar Reporte Financiero a PDF

![Captura 2.4.5 — Exportar Reporte Financiero a PDF](capturas/manual_usuario/2_4_5_exportar_reporte_financiero_a_pdf.png)

> 📸 **Captura 2.4.5:** pantalla de *Exportar Reporte Financiero a PDF*. Guardar en `capturas/manual_usuario/2_4_5_exportar_reporte_financiero_a_pdf.png`.

1. En el **Panel de Finanzas**, hacer clic en el botón **"Descargar PDF"**
2. El sistema genera automáticamente un PDF con:
   - Período del reporte (según filtros aplicados)
   - Tabla detallada de pagos con fecha, afiliado, valor, estado, recepcionista
   - Totales por columna
   - Fecha de generación y footer institucional
3. El PDF se descarga automáticamente en el navegador

### Interpretar Notificaciones

![Captura 2.4.6 — Interpretar Notificaciones](capturas/manual_usuario/2_4_6_interpretar_notificaciones.png)

> 📸 **Captura 2.4.6:** pantalla de *Interpretar Notificaciones*. Guardar en `capturas/manual_usuario/2_4_6_interpretar_notificaciones.png`.

1. En el **Header** (barra superior), verá un icono de **campana 🔔**
2. Si hay un número rojo (badge), significa que hay notificaciones pendientes
3. Hacer clic en la campana para abrir el dropdown de notificaciones
4. Cada notificación muestra:
   - **Mensaje**: Descripción del evento (ej: "3 afiliados tienen pago vencido")
   - **Enlace**: Al hacer clic, navega a la sección correspondiente
5. Tipos de notificaciones para Admin:
   - **Pagos vencidos** → Redirige a `/pagos`
   - **Afiliados sin ciclo activo** → Redirige a `/rutinas`
   - **Afiliados sin plan asignado** → Redirige a `/dietas`
6. Las notificaciones se actualizan automáticamente cada 60 segundos

### Gestionar Personal (Crear Empleado)

![Captura 2.4.7 — Gestionar Personal (Crear Empleado)](capturas/manual_usuario/2_4_7_gestionar_personal_crear_empleado.png)

> 📸 **Captura 2.4.7:** pantalla de *Gestionar Personal (Crear Empleado)*. Guardar en `capturas/manual_usuario/2_4_7_gestionar_personal_crear_empleado.png`.

1. En el menú lateral, hacer clic en **"Gestión de Personal"**
2. Hacer clic en **"Nuevo Empleado"**
3. Completar los campos:
   - Nombres, Apellidos, Correo Electrónico
   - Contraseña temporal (se puede mostrar/ocultar con el icono de ojo)
   - Rol (Recepcionista o Entrenador — no se puede asignar Administrador)
   - Estado (Activo por defecto)
4. Hacer clic en **"Guardar"**
5. El nuevo empleado aparecerá en la tabla

### Gestionar Personal (Editar/Eliminar)

![Captura 2.4.8 — Gestionar Personal (Editar/Eliminar)](capturas/manual_usuario/2_4_8_gestionar_personal_editar_eliminar.png)

> 📸 **Captura 2.4.8:** pantalla de *Gestionar Personal (Editar/Eliminar)*. Guardar en `capturas/manual_usuario/2_4_8_gestionar_personal_editar_eliminar.png`.

- **Editar**: Clic en el icono de lápiz → modificar campos → Guardar
- **Cambiar estado**: Clic en el badge de estado (Activo/Inactivo/Pendiente) para alternar
- **Eliminar**: Clic en el icono de papelera → confirmar
- **Nota**: No se puede eliminar a sí mismo ni a usuarios que hayan registrado afiliados

---

## 2.5 Guía para Recepcionista

### Iniciar Sesión

![Captura 2.5.1 — Iniciar Sesión](capturas/manual_usuario/2_5_1_iniciar_sesion.png)

> 📸 **Captura 2.5.1:** pantalla de *Iniciar Sesión*. Guardar en `capturas/manual_usuario/2_5_1_iniciar_sesion.png`.

1. Abrir el navegador en `http://localhost:5173`
2. Hacer clic en **"Iniciar Sesión"**
3. Seleccionar **"Recepcionista"**
4. Ingresar:
   - **Correo:** `maria@metafit.com`
   - **Contraseña:** `Maria123!`
5. Hacer clic en **"Ingresar al Sistema"**

### Crear un Nuevo Afiliado

![Captura 2.5.2 — Crear un Nuevo Afiliado](capturas/manual_usuario/2_5_2_crear_un_nuevo_afiliado.png)

> 📸 **Captura 2.5.2:** pantalla de *Crear un Nuevo Afiliado*. Guardar en `capturas/manual_usuario/2_5_2_crear_un_nuevo_afiliado.png`.

1. En el menú lateral, hacer clic en **"Afiliados"**
2. Hacer clic en **"Nuevo Afiliado"** (botón superior derecho)
3. Completar el formulario:
   - **Datos personales**: Nombres, Apellidos, Correo, Documento de identidad
   - **Datos físicos**: Fecha de nacimiento, Sexo, Teléfono, Dirección, Estatura (cm)
   - **Foto de perfil** (opcional): Seleccionar una imagen (JPG, PNG, WEBP o GIF, máx. 5 MB) — se verá en la tabla, en el detalle y en la app del afiliado
   - **Restricciones médicas** (opcional): Escribir condiciones separadas por coma
4. Hacer clic en **"Guardar"**
5. El sistema genera automáticamente:
   - Contraseña inicial: `MF_{documento}@2025`
   - Ciclo inactivo (el entrenador lo activará)

> 💡 **Foto de perfil**: el recepcionista o administrador puede subir o cambiar la foto de un afiliado en cualquier momento desde el modal **"Editar"** (campo "Foto de perfil"). Si no hay foto, se muestra un avatar circular con la inicial del nombre.

### Editar Datos de Afiliado

![Captura 2.5.3 — Editar Datos de Afiliado](capturas/manual_usuario/2_5_3_editar_datos_de_afiliado.png)

> 📸 **Captura 2.5.3:** pantalla de *Editar Datos de Afiliado*. Guardar en `capturas/manual_usuario/2_5_3_editar_datos_de_afiliado.png`.

1. En la tabla de afiliados, hacer clic en **"Ver"** (icono de ojo) del afiliado deseado
2. Se abrirá un modal con pestañas:
   - **Estado de Cuenta**: Información general, estado de afiliación y último pago
   - **Progreso Físico**: Mediciones registradas por los entrenadores
   - **Ciclo Activo**: Rutina y dieta actual (si tiene)
3. Para editar campos: el recepcionista ve la pestaña por defecto con opción de editar

### Cambiar Estado de Afiliación

![Captura 2.5.4 — Cambiar Estado de Afiliación](capturas/manual_usuario/2_5_4_cambiar_estado_de_afiliacion.png)

> 📸 **Captura 2.5.4:** pantalla de *Cambiar Estado de Afiliación*. Guardar en `capturas/manual_usuario/2_5_4_cambiar_estado_de_afiliacion.png`.

1. En la tabla de afiliados, localizar al afiliado
2. Hacer clic en el badge de estado (Activo/Inactivo/Suspendido)
3. Confirmar el cambio
4. **Estados disponibles:**
   - **Activo**: Puede entrenar normalmente
   - **Inactivo**: No puede entrenar (membresía vencida)
   - **Suspendido**: Bloqueado temporalmente

### Registrar Pagos

![Captura 2.5.5 — Registrar Pagos](capturas/manual_usuario/2_5_5_registrar_pagos.png)

> 📸 **Captura 2.5.5:** pantalla de *Registrar Pagos*. Guardar en `capturas/manual_usuario/2_5_5_registrar_pagos.png`.

1. En el menú lateral, hacer clic en **"Pagos"**
2. En la tabla de afiliados, localizar al afiliado
3. Verá el estado de membresía con semáforo:
   - **🟢 Al día**: Membresía vigente
   - **🟡 Por vencer**: Vence en 10 días o menos
   - **🔴 Vencido**: Membresía vencida
4. Hacer clic en **"Pagar"** → se abre modal de confirmación
5. El modal muestra:
   - Avatar y nombre del afiliado
   - Estado actual de membresía
   - Fecha de vencimiento actual
   - Monto a pagar: **$80,000 COP**
   - Nueva fecha de vencimiento calculada automáticamente
6. Hacer clic en **"Confirmar Pago"**
7. El sistema registra el pago con:
   - Fecha actual
   - Nueva fecha de vencimiento: +30 días desde hoy
   - Si ya tenía membresía vigente: se extiende desde el vencimiento actual
8. Para ver el historial, hacer clic en **"Historial"** del afiliado

> 💡 **Factura automática**: al registrar un pago, el afiliado recibirá automáticamente una **factura por correo electrónico** con el logo de MetaFit, los datos del afiliado, el valor pagado, la fecha y el número de factura (formato `FAC-año-número`). El remitente es **"MetaFit"** y el asunto **"Factura de pago - MetaFit - {nombre}"**; si no llega, revisá Spam/Promociones.

### Interpretar Notificaciones

![Captura 2.5.6 — Interpretar Notificaciones](capturas/manual_usuario/2_5_6_interpretar_notificaciones.png)

> 📸 **Captura 2.5.6:** pantalla de *Interpretar Notificaciones*. Guardar en `capturas/manual_usuario/2_5_6_interpretar_notificaciones.png`.

1. En el **Header** (barra superior), verá un icono de **campana 🔔**
2. Si hay un número rojo (badge), significa que hay notificaciones pendientes
3. Las notificaciones para Recepcionista incluyen:
   - **Pagos vencidos**: Afiliados con membresía vencida → Redirige a `/pagos` para registrar pagos
   - **Afiliados sin ciclo**: Afiliados sin ciclo asignado → Redirige a `/afiliados` para coordinar con entrenador
4. Las notificaciones se actualizan automáticamente cada 60 segundos

---

## 2.6 Guía para Entrenador

### Iniciar Sesión

![Captura 2.6.1 — Iniciar Sesión](capturas/manual_usuario/2_6_1_iniciar_sesion.png)

> 📸 **Captura 2.6.1:** pantalla de *Iniciar Sesión*. Guardar en `capturas/manual_usuario/2_6_1_iniciar_sesion.png`.

1. Abrir el navegador en `http://localhost:5173`
2. Hacer clic en **"Iniciar Sesión"**
3. Seleccionar **"Entrenador"**
4. Ingresar:
   - **Correo:** `laura@metafit.com`
   - **Contraseña:** `Laura123!`
5. Hacer clic en **"Ingresar al Sistema"**

### Seleccionar un Afiliado

![Captura 2.6.2 — Seleccionar un Afiliado](capturas/manual_usuario/2_6_2_seleccionar_un_afiliado.png)

> 📸 **Captura 2.6.2:** pantalla de *Seleccionar un Afiliado*. Guardar en `capturas/manual_usuario/2_6_2_seleccionar_un_afiliado.png`.

1. En el menú lateral, hacer clic en **"Afiliados"**
2. Usar la barra de búsqueda para encontrar al afiliado
3. Hacer clic en **"Ver"** para ver su información completa
4. El entrenador puede ver: datos personales, restricciones médicas, ciclo activo

### Ver Restricciones Médicas

![Captura 2.6.3 — Ver Restricciones Médicas](capturas/manual_usuario/2_6_3_ver_restricciones_medicas.png)

> 📸 **Captura 2.6.3:** pantalla de *Ver Restricciones Médicas*. Guardar en `capturas/manual_usuario/2_6_3_ver_restricciones_medicas.png`.

1. En la vista del afiliado, ir a la pestaña **"Ciclo Activo"**
2. Las restricciones médicas se muestran con:
   - Nombre de la condición
   - Tipo (Enfermedad, Lesión, Alergia, Medicamento, Otra)
   - Efecto relevante
3. Estas restricciones afectan automáticamente qué ejercicios y alimentos están disponibles

### Ver el Catálogo de Ejercicios

![Captura 2.6.4 — Ver el Catálogo de Ejercicios](capturas/manual_usuario/2_6_4_ver_el_catalogo_de_ejercicios.png)

> 📸 **Captura 2.6.4:** pantalla de *Ver el Catálogo de Ejercicios*. Guardar en `capturas/manual_usuario/2_6_4_ver_el_catalogo_de_ejercicios.png`.

1. En el menú lateral, hacer clic en **"Rutinas"**
2. En la parte superior, verá el KPI con la cantidad de ejercicios en el catálogo
3. Hacer clic en **"Ver Catálogo"**
4. Se abrirá un modal con la tabla completa de ejercicios:
   - Nombre, grupo muscular, nivel mínimo, descripción
   - Botones de editar (✏️) y eliminar (🗑️)
5. Puede buscar ejercicios por nombre

### Agregar un Nuevo Ejercicio

![Captura 2.6.5 — Agregar un Nuevo Ejercicio](capturas/manual_usuario/2_6_5_agregar_un_nuevo_ejercicio.png)

> 📸 **Captura 2.6.5:** pantalla de *Agregar un Nuevo Ejercicio*. Guardar en `capturas/manual_usuario/2_6_5_agregar_un_nuevo_ejercicio.png`.

1. En el modal **"Ver Catálogo"** de la pantalla de Rutinas, hacer clic en **"Nuevo Ejercicio"**
2. Completar el formulario:
   - **Nombre del ejercicio** (obligatorio)
   - **Grupo muscular**: Pecho, Espalda, Hombros, Bíceps, Tríceps, Piernas, Glúteos, Abdomen, Cardio, Full Body
   - **Nivel mínimo**: Principiante, Intermedio, Avanzado
   - **Descripción** (opcional)
3. Hacer clic en **"Guardar"**
4. El nuevo ejercicio aparecerá en el catálogo y estará disponible para asignar en rutinas

### Editar un Ejercicio

![Captura 2.6.6 — Editar un Ejercicio](capturas/manual_usuario/2_6_6_editar_un_ejercicio.png)

> 📸 **Captura 2.6.6:** pantalla de *Editar un Ejercicio*. Guardar en `capturas/manual_usuario/2_6_6_editar_un_ejercicio.png`.

1. En el modal **"Ver Catálogo"**, hacer clic en el icono de **lápiz (✏️)** del ejercicio
2. Modificar los campos necesarios
3. Hacer clic en **"Guardar"**

### Eliminar un Ejercicio

![Captura 2.6.7 — Eliminar un Ejercicio](capturas/manual_usuario/2_6_7_eliminar_un_ejercicio.png)

> 📸 **Captura 2.6.7:** pantalla de *Eliminar un Ejercicio*. Guardar en `capturas/manual_usuario/2_6_7_eliminar_un_ejercicio.png`.

1. En el modal **"Ver Catálogo"**, hacer clic en el icono de **papelera (🗑️)** del ejercicio
2. Si el ejercicio no está siendo usado en ninguna rutina activa, se eliminará inmediatamente
3. Si el ejercicio está siendo usado, el sistema mostrará un mensaje de error:
   - *"No se puede eliminar: el ejercicio está siendo usado en planes activos"*
   - En ese caso, primero debe reasignar las rutinas que lo contienen

### Ver el Catálogo de Alimentos

![Captura 2.6.8 — Ver el Catálogo de Alimentos](capturas/manual_usuario/2_6_8_ver_el_catalogo_de_alimentos.png)

> 📸 **Captura 2.6.8:** pantalla de *Ver el Catálogo de Alimentos*. Guardar en `capturas/manual_usuario/2_6_8_ver_el_catalogo_de_alimentos.png`.

1. En el menú lateral, hacer clic en **"Dietas"**
2. En la parte superior, verá el KPI con la cantidad de alimentos en el catálogo
3. Hacer clic en **"Ver Catálogo"**
4. Se abrirá un modal con la tabla completa de alimentos:
   - Nombre, proteínas (g), carbohidratos (g), grasas (g), kcal/100g
   - Botones de editar (✏️) y eliminar (🗑️)

### Agregar un Nuevo Alimento

![Captura 2.6.9 — Agregar un Nuevo Alimento](capturas/manual_usuario/2_6_9_agregar_un_nuevo_alimento.png)

> 📸 **Captura 2.6.9:** pantalla de *Agregar un Nuevo Alimento*. Guardar en `capturas/manual_usuario/2_6_9_agregar_un_nuevo_alimento.png`.

1. En el modal **"Ver Catálogo"** de la pantalla de Dietas, hacer clic en **"Nuevo Alimento"**
2. Completar el formulario:
   - **Nombre del alimento** (obligatorio)
   - **Proteínas** (g por 100g)
   - **Carbohidratos** (g por 100g)
   - **Grasas** (g por 100g)
3. Hacer clic en **"Guardar"**
4. El nuevo alimento aparecerá en el catálogo y estará disponible para asignar en dietas

### Editar un Alimento

![Captura 2.6.10 — Editar un Alimento](capturas/manual_usuario/2_6_10_editar_un_alimento.png)

> 📸 **Captura 2.6.10:** pantalla de *Editar un Alimento*. Guardar en `capturas/manual_usuario/2_6_10_editar_un_alimento.png`.

1. En el modal **"Ver Catálogo"**, hacer clic en el icono de **lápiz (✏️)** del alimento
2. Modificar los campos necesarios
3. Hacer clic en **"Guardar"**

### Eliminar un Alimento

![Captura 2.6.11 — Eliminar un Alimento](capturas/manual_usuario/2_6_11_eliminar_un_alimento.png)

> 📸 **Captura 2.6.11:** pantalla de *Eliminar un Alimento*. Guardar en `capturas/manual_usuario/2_6_11_eliminar_un_alimento.png`.

1. En el modal **"Ver Catálogo"**, hacer clic en el icono de **papelera (🗑️)** del alimento
2. Si el alimento no está siendo usado en ningún plan nutricional activo, se eliminará
3. Si está siendo usado, el sistema mostrará un error y deberá reasignar los planes primero

### Asignar Rutina Personalizada

![Captura 2.6.12 — Asignar Rutina Personalizada](capturas/manual_usuario/2_6_12_asignar_rutina_personalizada.png)

> 📸 **Captura 2.6.12:** pantalla de *Asignar Rutina Personalizada*. Guardar en `capturas/manual_usuario/2_6_12_asignar_rutina_personalizada.png`.

1. En el menú lateral, hacer clic en **"Rutinas"**
2. Encontrar al afiliado en la tabla (los que no tienen rutina aparecen primero)
3. Hacer clic en **"Asignar Rutina"**
4. Configurar el ciclo:
   - **Objetivo físico**: Pérdida de grasa, Aumento de masa, Mantenimiento, Rehabilitación
   - **Nivel de experiencia**: Principiante, Intermedio, Avanzado
   - **Disponibilidad**: Días por semana (1-7)
   - **Grupo muscular prioritario** (opcional)
   - **Fechas**: Inicio y fin del ciclo
5. Agregar ejercicios por día:
   - Seleccionar el día de la semana (Lunes a Domingo)
   - Elegir ejercicios del catálogo (el sistema filtra automáticamente los prohibidos por restricciones)
   - Configurar series y repeticiones
6. Hacer clic en **"Guardar Rutina"**
7. El afiliado podrá ver su rutina en la app móvil

### Asignar Plan Nutricional

![Captura 2.6.13 — Asignar Plan Nutricional](capturas/manual_usuario/2_6_13_asignar_plan_nutricional.png)

> 📸 **Captura 2.6.13:** pantalla de *Asignar Plan Nutricional*. Guardar en `capturas/manual_usuario/2_6_13_asignar_plan_nutricional.png`.

1. En el menú lateral, hacer clic en **"Dietas"**
2. Encontrar al afiliado en la tabla
3. Hacer clic en **"Asignar Dieta"**
4. Configurar el plan:
   - **Calorías objetivo**: Meta calórica diaria
   - **Número de comidas**: Distribución diaria (1-6)
   - **Observaciones** (opcional)
5. Agregar alimentos por comida:
   - Seleccionar el número de comida
   - Elegir alimentos del catálogo (el sistema filtra prohibidos por restricciones)
   - Especificar cantidad en gramos
   - El sistema muestra las macros (proteinas, carbohidratos, grasas) automáticamente
6. Hacer clic en **"Guardar Dieta"**
7. El afiliado podrá ver su plan nutricional en la app móvil

### Interpretar Notificaciones

![Captura 2.6.14 — Interpretar Notificaciones](capturas/manual_usuario/2_6_14_interpretar_notificaciones.png)

> 📸 **Captura 2.6.14:** pantalla de *Interpretar Notificaciones*. Guardar en `capturas/manual_usuario/2_6_14_interpretar_notificaciones.png`.

1. En el **Header** (barra superior), verá un icono de **campana 🔔**
2. Las notificaciones para Entrenador incluyen:
   - **Afiliados sin ciclo activo** → Redirige a `/rutinas` para asignar rutina
   - **Afiliados sin plan asignado** → Redirige a `/dietas` para asignar dieta
3. Las notificaciones se actualizan automáticamente cada 60 segundos

---

## 2.7 Guía para Afiliado (App Móvil)

### Abrir la App

![Captura 2.7.1 — Abrir la App](capturas/manual_usuario/2_7_1_abrir_la_app.png)

> 📸 **Captura 2.7.1:** pantalla de *Abrir la App*. Guardar en `capturas/manual_usuario/2_7_1_abrir_la_app.png`.

1. Asegurarse de tener instalado **Expo Go** en el dispositivo
2. Escanear el QR generado por `npx expo start` en la terminal
3. La app muestra la **Landing Page** con información del gimnasio

### Navegar por la Landing Page

![Captura 2.7.2 — Navegar por la Landing Page](capturas/manual_usuario/2_7_2_navegar_por_la_landing_page.png)

> 📸 **Captura 2.7.2:** pantalla de *Navegar por la Landing Page*. Guardar en `capturas/manual_usuario/2_7_2_navegar_por_la_landing_page.png`.

La pantalla de bienvenida incluye las siguientes secciones (desplazar hacia abajo):

1. **Hero**: Logo MetaFit, tagline "Transforma tu cuerpo, transforma tu vida", botón "Ingresar al Sistema"
2. **KPIs**: Estadísticas del gimnasio (afiliados activos, planes nutricionales, entrenadores, satisfacción)
3. **Funciones**: Tarjetas con las principales características (Rutinas, Dietas, Progreso, Seguridad)
4. **Cómo funciona**: 3 pasos para empezar (visitar el gym, crear perfil, acceder desde la app)
5. **Sede**: Información de Sport Gym Sede 80 (área, horario, ubicación)
6. **CTA Final**: "¿Ya sos miembro?" con botón de inicio de sesión

### Iniciar Sesión

![Captura 2.7.3 — Iniciar Sesión](capturas/manual_usuario/2_7_3_iniciar_sesion.png)

> 📸 **Captura 2.7.3:** pantalla de *Iniciar Sesión*. Guardar en `capturas/manual_usuario/2_7_3_iniciar_sesion.png`.

1. En la pantalla de bienvenida, hacer clic en **"Ingresar al Sistema"** o **"Iniciar Sesión"**
2. Ingresar credenciales:
   - **Correo:** El proporcionado al registrarse (ej: `juan@gmail.com`)
   - **Contraseña:** La establecida por el recepcionista (por defecto: `MF_{documento}@2025`)
3. Si las credenciales son correctas, la app lo llevará automáticamente al panel principal con 4 pestañas
4. Si hay error de conexión, verá el mensaje: *"Error de conexión. Verificá que el servidor esté activo."*
5. Si las credenciales son incorrectas, verá: *"Correo o contraseña incorrectos"*

### Ver Perfil Personal

![Captura 2.7.4 — Ver Perfil Personal](capturas/manual_usuario/2_7_4_ver_perfil_personal.png)

> 📸 **Captura 2.7.4:** pantalla de *Ver Perfil Personal*. Guardar en `capturas/manual_usuario/2_7_4_ver_perfil_personal.png`.

1. Pestaña **"Perfil"** (icono 👤)
2. Verá:
   - **Avatar** con foto de perfil (si no tiene foto, se muestra la inicial) y badge de estado (Activo/Inactivo)
   - **Datos personales**: Correo, documento, fecha de nacimiento, sexo, teléfono
   - **Información física**: Estatura, objetivo físico actual, nivel de experiencia
   - **Restricciones médicas** (si tiene)
3. Para **cambiar la foto de perfil**: tocar el avatar → elegir una imagen de la galería → se sube automáticamente y el perfil se actualiza
4. Para cerrar sesión: hacer clic en **"Cerrar sesión"** al final de la página

### Consultar Rutina Asignada

![Captura 2.7.5 — Consultar Rutina Asignada](capturas/manual_usuario/2_7_5_consultar_rutina_asignada.png)

> 📸 **Captura 2.7.5:** pantalla de *Consultar Rutina Asignada*. Guardar en `capturas/manual_usuario/2_7_5_consultar_rutina_asignada.png`.

1. Pestaña **"Rutina"** (icono 💪)
2. Verá:
   - Resumen del ciclo activo: objetivo físico, fechas de inicio y fin
   - Lista de rutinas organizadas por día
   - Cada rutina muestra: nombre, enfoque muscular, ejercicios con series y repeticiones
3. Las tarjetas de rutina se expanden al hacer clic para ver los detalles
4. Si no tiene rutina asignada, verá el mensaje: *"Sin rutina asignada. Habla con tu entrenador."*

### Consultar Plan Nutricional

![Captura 2.7.6 — Consultar Plan Nutricional](capturas/manual_usuario/2_7_6_consultar_plan_nutricional.png)

> 📸 **Captura 2.7.6:** pantalla de *Consultar Plan Nutricional*. Guardar en `capturas/manual_usuario/2_7_6_consultar_plan_nutricional.png`.

1. Pestaña **"Dieta"** (icono 🥗)
2. Verá:
   - Resumen del plan: calorías objetivo, número de comidas por día
   - Lista de comidas expandibles
   - Cada comida muestra: alimentos, cantidad en gramos, macros (proteinas, carbohidratos, grasas)
3. Las tarjetas de comida se expanden al hacer clic
4. Si no tiene plan asignado, verá: *"Sin plan nutricional"*

### Ver Historial de Progreso Físico

![Captura 2.7.7 — Ver Historial de Progreso Físico](capturas/manual_usuario/2_7_7_ver_historial_de_progreso_fisico.png)

> 📸 **Captura 2.7.7:** pantalla de *Ver Historial de Progreso Físico*. Guardar en `capturas/manual_usuario/2_7_7_ver_historial_de_progreso_fisico.png`.

1. Pestaña **"Progreso"** (icono 📊)
2. Verá una lista cronológica de mediciones (de la más reciente a la más antigua)
3. Cada registro muestra:
   - **Fecha** de medición
   - **Peso** (kg)
   - **IMC** calculado automáticamente
   - **% Grasa corporal**
   - **Medidas**: Cintura, brazo, pierna (cm)
4. Si no tiene registros, verá: *"Sin registros. Aún no tienes registros de progreso."*

---

## 2.8 Preguntas Frecuentes

### ¿Por qué no puedo ver ciertos ejercicios o alimentos?

El sistema filtra automáticamente según las **restricciones médicas** del afiliado:

- **Ejercicios**: Si tienes una lesión de rodilla, los ejercicios que la agraven (ej: sentadilla con barra) serán excluidos automáticamente
- **Alimentos**: Si tienes alergia al gluten, todos los alimentos que lo contengan serán excluidos
- Cuando el entrenador te asigna una rutina o dieta, solo ve los ejercicios/alimentos compatibles
- En la app móvil, los ejercicios y alimentos visibles en tu plan ya están filtrados

### ¿Cómo sé si tengo un plan asignado?

- **App Móvil**: Al iniciar sesión, las pestañas "Rutina" y "Dieta" mostrarán tu plan si tienes uno asignado
- Si no tienes plan, verás un mensaje indicando que aún no se te ha asignado nada
- **Consulta con tu entrenador** para que te asigne un plan personalizado

### ¿Qué hago si olvidé mi contraseña?

Podés recuperarla por correo electrónico (envío real vía Brevo):

1. En la pantalla de **Iniciar sesión** toca **"¿Olvidaste tu contraseña?"**
2. Escribí el correo con el que te registraste y confirmá el envío
3. Revisá tu casilla (si no aparece, mirá en **Spam** o **Promociones**)
4. Abrí el enlace que llegó y creá una contraseña nueva (válido por **15 minutos**)

> ✅ Probado en producción: el correo de recuperación llega real desde **MetaFit** con el diseño corporativo (fondo oscuro, mancuerna roja y botón púrpura "Restablecer contraseña"). Revisá **Spam/Promociones** si no aparece en la bandeja principal, y fijate que llegue del remitente **"MetaFit" &lt;metafit.sistema@gmail.com&gt;**. El enlace lleva directo a la pantalla para restablecer la contraseña.

Si el correo no llegó, el soporte/administrador puede restablecerla de forma presencial:
1. **Afiliados**: Solicitar al recepcionista un restablecimiento
2. **Personal (staff)**: Solicitar al administrador un cambio de contraseña
3. El administrador puede cambiar la contraseña desde **Gestión de Personal** → Editar empleado
4. El recepcionista puede cambiar la contraseña de un afiliado desde **Afiliados** → Ver → Editar

### ¿Cómo actualizo mis datos personales?

- **Afiliados**: Solicitar cambios al recepcionista (presencial o a través del sistema)
- **Personal (staff)**: El administrador puede actualizar desde Gestión de Personal
- **Datos físicos**: Solo los entrenadores pueden registrar mediciones de progreso

### ¿Qué significa cada estado de afiliación?

| Estado | Significado |
|---|---|
| **Activo** | Membresía al día, puede entrenar normalmente |
| **Inactivo** | Membresía vencida, no puede entrenar hasta pagar |
| **Suspendido** | Bloqueado por el administrador (razones disciplinarias) |
| **Pendiente** | Usuario creado pero no activado (solo aplica a personal/staff) |

### ¿Puedo tener más de un ciclo a la vez?

No. Cada afiliado tiene **un solo ciclo activo** a la vez. Cuando el entrenador crea un nuevo ciclo, el anterior se desactiva automáticamente.

### ¿Qué significan los números en la campana de notificaciones?

El badge rojo en el icono de campana 🔔 indica la cantidad de acciones pendientes:
- **Admin**: Pagos vencidos, afiliados sin ciclo, afiliados sin plan
- **Recepcionista**: Pagos vencidos, afiliados sin ciclo
- **Entrenador**: Afiliados sin ciclo, afiliados sin plan

Hacé clic en cada notificación para ir directamente a la sección donde podés tomar acción.

### ¿Puedo exportar los datos financieros?

Sí, solo el **Administrador** puede exportar el reporte financiero a PDF desde el Panel de Finanzas. El PDF incluye: período del reporte, tabla de pagos detallada, totales y fecha de generación.

### ¿Cuánto cuesta la membresía?

El precio de la membresía es configurable por el Administrador desde el Dashboard. El valor por defecto es **$80,000 COP** mensuales.

---

## 2.9 Glosario de Términos

| Término | Definición |
|---|---|
| **Afiliado** | Cliente del gimnasio con membresía activa |
| **Ciclo** | Período de entrenamiento con objetivo, nivel y disponibilidad definidos |
| **Rutina** | Conjunto de ejercicios organizados por día de la semana |
| **Plan Nutricional** | Distribución de alimentos y calorías por comida |
| **Plan de Entrenamiento** | Conjunto de rutinas asignadas para un ciclo |
| **Restricción Médica** | Condición de salud que limita ciertos ejercicios o alimentos |
| **Membresía** | Derecho a usar las instalaciones del gimnasio, pagada mensualmente |
| **KPIs** | Indicadores clave de rendimiento del gimnasio |
| **MACROS** | Macronutrientes: proteínas, carbohidratos y grasas |
| **IMC** | Índice de Masa Corporal (peso / altura²) |
| **Notificación** | Alerta contextual visible en el Header con badge numérico |
| **Semáforo de Membresía** | Indicador visual del estado de pago (🟢 al día, 🟡 por vencer, 🔴 vencido) |
| **3FN** | Tercera Forma Normal (diseño de base de datos sin redundancias) |
| **JWT** | JSON Web Token (método de autenticación seguro) |
| **bcrypt** | Algoritmo de hash para contraseñas |

---

## 2.10 Novedades "1000/10" para el usuario

### ¿Cómo cambio entre modo claro y oscuro?

- **En la web**: botón **☀️/🌙** en la barra superior (junto a la campana de notificaciones). La preferencia queda guardada para tus próximas visitas.
- **En la app móvil**: botón **☀️/🌙** en la esquina superior derecha de la pantalla de **Perfil**. Por defecto sigue el tema del teléfono.

### ¿Llegan notificaciones push al celular?

Sí. Al iniciar sesión en la app se pide permiso para notificaciones. Cuando tu entrenador te asigne una **rutina** o una **dieta**, la app te avisa al instante ("🏋️ Nueva rutina asignada" / "🥗 Nueva dieta asignada"). Si denegaste el permiso, puedes activarlo en los ajustes del teléfono y volver a entrar a la app.

### ¿Qué correos automáticos recibo?

- **Bienvenida**: al ser registrado como afiliado te llega tu correo de bienvenida con tus credenciales de acceso (correo y contraseña temporal).
- **Factura**: al pagar la mensualidad recibes tu factura.
- **Recordatorio de pago**: si tu mensualidad vence en los próximos 3 días, recibes un recordatorio automático para que pases a renovarla.

### ¿Dónde se guardan mis datos?

Las fotos de perfil, tus planes y tu historial se sincronizan con el servidor de MetaFit. Foto de perfil: súbela desde el portal web o desde la app (Perfil → tocar la foto → galería). El sistema cuida que solo se acepten imágenes de hasta 5 MB.

---

## 2.11 Guía de captura de pantallazos

Las capturas se guardan en `documentacion/capturas/manual_usuario/` con el nombre indicado en cada marcador
(`<sección>_<paso>_<slug>.png`, p. ej. `2_4_1_iniciar_sesion.png`). Recomendaciones:

| Aspecto | Recomendación |
|---|---|
| Web | Ventana de escritorio, ancho ≥ 1440 px; capturar la pantalla completa del navegador (sin barras del sistema si es posible). |
| Móvil | Emulador o dispositivo con resolución 1080×(1920-2400); usar la app con un usuario de prueba por rol. |
| Formato | PNG; recortar solo la app (evitar datos personales reales; usar los usuarios demo del manual). |
| Tema | Capturar en modo claro (por defecto) y, si aplica, una versión en modo oscuro marcada como "(oscuro)". |
| Nombres | Respetar el nombre indicado en cada marcador para que las imágenes enlacen automáticamente. |

**Usuarios demo para las capturas:** Administrador `carlos@metafit.com` / `Admin123!` · Recepcionista `maria@metafit.com` / `Maria123!` · Entrenador `laura@metafit.com` / `Laura123!` · Afiliado (móvil) un afiliado con ciclo, rutina y dieta asignados.

**Checklist por rol:** (2.4) login, dashboard, cambio de precio, finanzas, exportar PDF, notificaciones, crear/editar personal.
(2.5) login, crear afiliado, editar/ver, cambiar estado, registrar pago, notificaciones.
(2.6) login, seleccionar afiliado, restricciones, catálogo/CRUD de ejercicios, catálogo/CRUD de alimentos, asignar rutina, asignar dieta, notificaciones.
(2.7) landing, login, perfil, rutina, dieta, progreso.

# MANUAL DE USUARIO — MetaFit

**Versión:** 2.0.0  
**Fecha:** Junio 2026  
**Cliente:** Sport Gym Sede 80 — Bogotá, Colombia

---

## 2.2 Introducción

**MetaFit** es un sistema de gestión deportiva integral diseñado para el gimnasio **Sport Gym Sede 80**. Permite administrar afiliados, personal, rutinas de entrenamiento, planes nutricionales, pagos y progreso físico desde una plataforma web y una aplicación móvil.

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

### Recepcionista
- Gestión de afiliados (crear, editar, cambiar estado)
- Registro de pagos de membresía
- Consulta de información de afiliados
- **No puede** asignar rutinas/dietas ni ver dashboard

### Entrenador
- Asignación de rutinas de entrenamiento personalizadas
- Asignación de planes nutricionales
- Visualización de restricciones médicas de afiliados
- Filtrado automático de ejercicios y alimentos prohibidos
- **No puede** gestionar personal ni ver dashboard financiero

### Afiliado (App Móvil)
- Consulta de perfil personal
- Visualización de rutina asignada
- Visualización de plan nutricional
- Historial de progreso físico
- **Solo ve sus propios datos**

---

## 2.4 Guía para Administrador

### Iniciar Sesión

1. Abrir el navegador en `http://localhost:5173`
2. Hacer clic en **"Iniciar Sesión"** en la página principal
3. Seleccionar **"Administrador"** en el selector de rol
4. Ingresar:
   - **Correo:** `carlos@metafit.com`
   - **Contraseña:** `Admin123!`
5. Hacer clic en **"Ingresar al Sistema"**

### Ver Dashboard y KPIs

1. Al iniciar sesión, será redirigido al Dashboard
2. Verá las siguientes métricas:
   - **Rendimiento y Finanzas**: Ingresos totales, pagos registrados, próximos vencimientos
   - **Control de Afiliados y Staff**: Total afiliados, activos/inactivos, entrenadores, recepcionistas, ciclos activos, afiliados con restricciones
   - **Distribución por Objetivo**: Gráfico de barras con los objetivos físicos de los ciclos activos
3. Para actualizar los datos, hacer clic en **"Actualizar datos"**

### Gestionar Personal (Crear Empleado)

1. En el menú lateral, hacer clic en **"Gestión de Personal"**
2. Hacer clic en **"Nuevo Empleado"**
3. Completar los campos:
   - Nombres, Apellidos, Correo Electrónico
   - Contraseña temporal
   - Rol (Recepcionista o Entrenador — no se puede asignar Administrador desde esta pantalla)
   - Estado (Activo por defecto)
4. Hacer clic en **"Guardar"**
5. El nuevo empleado aparecerá en la tabla

### Gestionar Personal (Editar/Eliminar)

- **Editar**: Clic en el icono de lápiz → modificar campos → Guardar
- **Cambiar estado**: Clic en el badge de estado (Activo/Inactivo/Pendiente) para alternar
- **Eliminar**: Clic en el icono de papelera → confirmar
- **Nota**: No se puede eliminar a sí mismo ni a usuarios que hayan registrado afiliados

### Cambiar Precio de Membresía

1. Ir al **Dashboard**
2. En la sección "Precio de Membresía", hacer clic en **"Editar"**
3. Ingresar el nuevo valor en COP
4. Hacer clic en **"Guardar"**
5. El cambio se refleja inmediatamente en los cálculos de ingresos

---

## 2.5 Guía para Recepcionista

### Iniciar Sesión

1. Abrir el navegador en `http://localhost:5173`
2. Hacer clic en **"Iniciar Sesión"**
3. Seleccionar **"Recepcionista"**
4. Ingresar:
   - **Correo:** `maria@metafit.com`
   - **Contraseña:** `Maria123!`
5. Hacer clic en **"Ingresar al Sistema"`

### Crear un Nuevo Afiliado

1. En el menú lateral, hacer clic en **"Afiliados"**
2. Hacer clic en **"Nuevo Afiliado"** (botón superior derecho)
3. Completar el formulario:
   - **Datos personales**: Nombres, Apellidos, Correo, Documento de identidad
   - **Datos físicos**: Fecha de nacimiento, Sexo, Teléfono, Dirección, Estatura (cm)
   - **Restricciones médicas** (opcional): Escribir condiciones separadas por coma
4. Hacer clic en **"Guardar"**
5. El sistema genera automáticamente:
   - Contraseña inicial: `MF_{documento}@2025`
   - Ciclo inactivo (el entrenador lo activará)

### Editar Datos de Afiliado

1. En la tabla de afiliados, hacer clic en **"Ver"** (icono de ojo) del afiliado deseado
2. Se abrirá un modal con pestañas:
   - **Estado de Cuenta**: Información general y estado de afiliación
   - **Progreso Físico**: Mediciones registradas por los entrenadores
   - **Ciclo Activo**: Rutina y dieta actual (si tiene)
3. Para editar campos: el recepcionista ve la pestaña por defecto con opción de editar

### Cambiar Estado de Afiliación

1. En la tabla de afiliados, localizar al afiliado
2. Hacer clic en el badge de estado (Activo/Inactivo/Suspendido)
3. Confirmar el cambio
4. **Estados disponibles:**
   - **Activo**: Puede entrenar normalmente
   - **Inactivo**: No puede entrenar (membresía vencida)
   - **Suspendido**: Bloqueado temporalmente

### Registrar Pagos

1. En el menú lateral, hacer clic en **"Pagos"**
2. En la tabla de afiliados, localizar al afiliado
3. Hacer clic en **"Pagar"** → se abre modal de confirmación
4. Confirmar el pago de **$80.000 COP** (efectivo)
5. El sistema calcula automáticamente:
   - Nueva fecha de vencimiento: +30 días desde hoy
   - Si ya tiene membresía vigente: se extiende desde la fecha actual de vencimiento
6. Para ver el historial, hacer clic en **"Historial"** del afiliado

---

## 2.6 Guía para Entrenador

### Iniciar Sesión

1. Abrir el navegador en `http://localhost:5173`
2. Hacer clic en **"Iniciar Sesión"**
3. Seleccionar **"Entrenador"**
4. Ingresar:
   - **Correo:** `laura@metafit.com`
   - **Contraseña:** `Laura123!`
5. Hacer clic en **"Ingresar al Sistema"**

### Seleccionar un Afiliado

1. En el menú lateral, hacer clic en **"Afiliados"**
2. Usar la barra de búsqueda para encontrar al afiliado
3. Hacer clic en **"Ver"** para ver su información completa
4. El entrenador puede ver: datos personales, restricciones médicas, ciclo activo

### Ver Restricciones Médicas

1. En la vista del afiliado, ir a la pestaña **"Ciclo Activo"**
2. Las restricciones médicas se muestran con:
   - Nombre de la condición
   - Tipo (Enfermedad, Lesión, Alergia, Medicamento, Otra)
   - Efecto relevante
3. Estas restricciones afectan automáticamente qué ejercicios y alimentos están disponibles

### Asignar Rutina Personalizada

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
   - Seleccionar el día de la semana
   - Elegir ejercicios del catálogo (el sistema filtra automáticamente los prohibidos por restricciones)
   - Configurar series y repeticiones
6. Hacer clic en **"Guardar Rutina"**
7. El afiliado podrá ver su rutina en la app móvil

### Asignar Plan Nutricional

1. En el menú lateral, hacer clic en **"Dietas"**
2. Encontrar al afiliado en la tabla
3. Hacer clic en **"Asignar Dieta"**
4. Configurar el plan:
   - **Calorías objetivo**: Meta calórica diaria
   - **Número de comidas**: Distribución diaria (1-10)
   - **Observaciones** (opcional)
5. Agregar alimentos por comida:
   - Seleccionar el número de comida
   - Elegir alimentos del catálogo (el sistema filtra prohibidos por restricciones)
   - Especificar cantidad en gramos
   - El sistema muestra las macros (proteinas, carbohidratos, grasas) automáticamente
6. Hacer clic en **"Guardar Dieta"**
7. El afiliado podrá ver su plan nutricional en la app móvil

---

## 2.7 Guía para Afiliado (App Móvil)

### Abrir la App

1. Asegurarse de tener instalado **Expo Go** en el dispositivo
2. Escanear el QR generado por `npx expo start` en la terminal
3. La app muestra la **página de bienvenida** con información del gimnasio

### Iniciar Sesión

1. En la pantalla de bienvenida, hacer clic en **"Iniciar Sesión"**
2. Ingresar credenciales:
   - **Correo:** (el proporcionado al registrarse, ej: `ana.lopez@example.com`)
   - **Contraseña:** `Afiliado123!` (por defecto: `MF_{documento}@2025`)
3. Hacer clic en **"Ingresar"**
4. La app lo llevará automáticamente al panel principal con 4 pestañas

### Ver Perfil Personal

1. Pestaña **"Perfil"** (icono 👤)
2. Verá:
   - **Nombre completo** y badge de estado (Activo/Inactivo)
   - **Datos personales**: Correo, documento, fecha de nacimiento, sexo, teléfono
   - **Información física**: Estatura, objetivo físico actual, nivel de experiencia
   - **Restricciones médicas** (si tiene)
3. Para cerrar sesión: hacer clic en **"Cerrar Sesión"**

### Consultar Rutina Asignada

1. Pestaña **"Rutina"** (icono 💪)
2. Verá:
   - Resumen del ciclo activo: objetivo físico, fechas de inicio y fin
   - Lista de rutinas organizadas por día
   - Cada rutina muestra: nombre, enfoque muscular, ejercicios con series y repeticiones
3. Las tarjetas de rutina se expanden al hacer clic para ver los detalles

### Consultar Plan Nutricional

1. Pestaña **"Dieta"** (icono 🥗)
2. Verá:
   - Resumen del plan: calorías objetivo, número de comidas por día
   - Lista de comidas expandibles
   - Cada comida muestra: alimentos, cantidad en gramos, macros (proteinas, carbohidratos, grasas)
3. Las tarjetas de comida se expanden al hacer clic

### Ver Historial de Progreso Físico

1. Pestaña **"Progreso"** (icono 📊)
2. Verá una lista cronológica de mediciones (de la más reciente a la más antigua)
3. Cada registro muestra:
   - **Fecha** de medición
   - **Peso** (kg)
   - **IMC** calculado automáticamente
   - **% Grasa corporal**
   - **Medidas**: Cintura, brazo, pierna (cm)

---

## 2.8 Preguntas Frecuentes

### ¿Qué hacer si olvidé mi contraseña?

Actualmente, la recuperación de contraseña debe hacerse de forma presencial:
1. **Afiliados**: Solicitar al recepcionista un restablecimiento
2. **Personal**: Solicitar al administrador un cambio de contraseña
3. El administrador puede cambiar la contraseña desde **Gestión de Personal** → Editar empleado

### ¿Cómo sé qué ejercicios puedo hacer?

El sistema filtra automáticamente los ejercicios según tus restricciones médicas:
1. Cuando el entrenador te asigna una rutina, solo ve ejercicios compatibles
2. En la app móvil, los ejercicios visibles en tu rutina ya están filtrados
3. Si tienes una lesión de rodilla, no aparecerán ejercicios que la agraven

### ¿Por qué no veo ciertos alimentos en mi dieta?

Los alimentos se filtran según tus restricciones médicas:
- **Alergias**: Alimentos que contienen el alérgeno son excluidos automáticamente
- **Enfermedades**: Si tienes diabetes, alimentos con alto índice glucémico pueden ser limitados
- **Medicamentos**: Ciertos alimentos que interactúan con medicamentos son excluidos

### ¿Cómo actualizo mis datos personales?

- **Afiliados**: Solicitar cambios al recepcionista (presencial)
- **Personal**: El administrador puede actualizar desde Gestión de Personal

### ¿Qué significa cada estado de afiliación?

| Estado | Significado |
|---|---|
| **Activo** | Membresía al día, puede entrenar normalmente |
| **Inactivo** | Membresía vencida, no puede entrenar hasta pagar |
| **Suspendido** | Bloqueado por el administrador (razones disciplinarias) |

### ¿Puedo tener más de un ciclo a la vez?

No. Cada afiliado tiene **un solo ciclo activo** a la vez. Cuando el entrenador crea un nuevo ciclo, el anterior se desactiva automáticamente.

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
| **3FN** | Tercera Forma Normal (diseño de base de datos sin redundancias) |
| **JWT** | JSON Web Token (método de autenticación seguro) |
| **bcrypt** | Algoritmo de hash para contraseñas |

# 📝 Historias de Usuario

> Funcionalidades del sistema por rol y flujos principales

---

## 🔐 Autenticación (todos los roles)

| ID | Historia | Estado |
|---|---|---|
| AU-01 | Como usuario, quiero iniciar sesión con correo y contraseña para acceder al sistema | ✅ |
| AU-02 | Como usuario, quiero recuperar mi contraseña por correo electrónico | ✅ |
| AU-03 | Como usuario, quiero que mi sesión expire después de 8 horas por seguridad | ✅ |
| AU-04 | Como sistema, quiero bloquear el login después de 10 intentos fallidos en 15 min | ✅ |

---

## 👨‍💼 Administrador

| ID | Historia | Estado |
|---|---|---|
| AD-01 | Ver dashboard con KPIs (total afiliados, activos, ciclos en curso, restricciones) | ✅ |
| AD-02 | Gestionar personal (CRUD de Entrenadores y Recepcionistas) | ✅ |
| AD-03 | Ver finanzas: ingresos por mes, por recepcionista, total recaudado | ✅ |
| AD-04 | Configurar precio de membresía | ✅ |
| AD-05 | Acceder a todos los afiliados, planes y catálogos | ✅ |

---

## 🏋️ Entrenador

| ID | Historia | Estado |
|---|---|---|
| EN-01 | Ver lista de afiliados con perfil, restricciones y ciclo activo | ✅ |
| EN-02 | Crear y gestionar ciclos de entrenamiento para afiliados | ✅ |
| EN-03 | Crear planes de entrenamiento con rutinas y ejercicios | ✅ |
| EN-04 | Crear planes nutricionales con detalle de alimentos por comida | ✅ |
| EN-05 | Registrar progreso físico (peso, % grasa, medidas, IMC) | ✅ |
| EN-06 | Asignar restricciones médicas a afiliados | ✅ |
| EN-07 | Enviar push notification al afiliado al crear un plan | ✅ |

---

## 🖥️ Recepcionista

| ID | Historia | Estado |
|---|---|---|
| RC-01 | Registrar nuevos afiliados (usuario + perfil en transacción) | ✅ |
| RC-02 | Editar datos de afiliados existentes | ✅ |
| RC-03 | Registrar pagos de membresía | ✅ |
| RC-04 | Ver historial de pagos por afiliado | ✅ |
| RC-05 | Subir foto de perfil del afiliado | ✅ |

---

## 📱 Afiliado (App Móvil)

| ID | Historia | Estado |
|---|---|---|
| AF-01 | Ver mi perfil, ciclo activo y restricciones médicas | ✅ |
| AF-02 | Ver mi plan de entrenamiento (rutinas, ejercicios, series, repeticiones) | ✅ |
| AF-03 | Ver mi plan nutricional (alimentos por comida, cantidades) | ✅ |
| AF-04 | Marcar ejercicios como completados/no completados por día | ✅ |
| AF-05 | Registrar consumo de agua (vasos por día) | ✅ |
| AF-06 | Registrar consumo de alimentos del plan | ✅ |
| AF-07 | Ver mi historial de progreso físico con IMC | ✅ |
| AF-08 | Recibir push notifications (nuevos planes, recordatorios) | ✅ |
| AF-09 | Recuperar contraseña desde la app | ✅ |

---

## 🔄 Flujos Principales

### Flujo: Registro de Afiliado
```
Recepcionista → POST /afiliados → Crea usuario + perfil (transacción)
  → Envío correo de bienvenida (fire-and-forget)
  → Afiliado aparece en lista
```

### Flujo: Creación de Plan
```
Entrenador → POST /planes/entrenamiento → Crea plan para ciclo
  → POST /planes/rutinas → Añade rutinas (días)
  → POST /planes/rutinas/:id/ejercicios → Añade ejercicios
  → Push notification al afiliado
```

### Flujo: Seguimiento Diario (Móvil)
```
Afiliado → Abre app → Ve rutina del día
  → Marca ejercicios completados → POST /afiliados/me/progreso-ejercicio
  → Registra agua → POST /afiliados/me/agua
  → Registra alimentos → POST /afiliados/me/consumo-alimento
```

---

## 📎 Notas Relacionadas

- [[Visión general]]
- [[Autenticación]]
- [[Afiliados]]
- [[PlanEntrenamiento y Nutrición|Planes]]
- [[Notificaciones]]
- [[ManualUsuario|Usuario]]

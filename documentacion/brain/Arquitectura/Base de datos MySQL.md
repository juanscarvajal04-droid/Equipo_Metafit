# 🗄️ Base de Datos MySQL

> MySQL 8.0 — 17 tablas + 5 vistas — Sin ORM (mysql2/promise nativo)

---

## 📁 Archivos SQL

```
database/
├── 01_schema.sql              # Esquema completo (672 líneas)
├── 02_seed.sql                # Datos semilla (744 líneas)
├── 03_datos_demo.sql          # Datos de demostración
├── 04_migracion_app_movil.sql # 3 tablas nuevas (móvil)
└── 05_password_reset.sql      # Tabla tokens reset password
```

---

## 📊 Modelo de Datos

### Herencia: Super-tipo / Sub-tipo

```
USUARIO (super-tipo)
├── AFILIADO (sub-tipo)    → PK = FK a USUARIO
├── Administrador          → rol = 'Administrador'
├── Entrenador             → rol = 'Entrenador'
└── Recepcionista          → rol = 'Recepcionista'
```

### Tablas Principales

| Tabla | Descripción | Relaciones |
|---|---|---|
| `USUARIO` | Super-tipo central (id, correo, contraseña, rol, push_token) | — |
| `AFILIADO` | Sub-tipo (PK=FK a USUARIO, datos físicos, foto) | 1:1 USUARIO |
| `RESTRICCION` | Catálogo de condiciones médicas | N:M con AFILIADO |
| `EJERCICIO` | Catálogo de ejercicios (grupo muscular, nivel mínimo) | N:M con RESTRICCION |
| `ALIMENTO` | Catálogo de alimentos (macros: proteínas, carbs, grasas) | N:M con RESTRICCION |
| `AFILIADO_RESTRICCION` | Pivot afiliado ↔ restricción | — |
| `EJERCICIO_RESTRICCION_EXCLUIDA` | Pivot ejercicio ↔ restricción (excluidos) | — |
| `ALIMENTO_RESTRICCION_EXCLUIDA` | Pivot alimento ↔ restricción (excluidos) | — |
| `CICLO` | Macrociclos de entrenamiento (fecha inicio/fin, objetivo) | 1:N AFILIADO |
| `PLAN_ENTRENAMIENTO` | 1:1 con CICLO (PK=FK) | 1:1 CICLO |
| `PLAN_NUTRICIONAL` | 1:1 con CICLO (PK=FK, calorías objetivo, num comidas) | 1:1 CICLO |
| `RUTINA` | Días de entrenamiento dentro de un plan | N:1 PLAN_ENTRENAMIENTO |
| `RUTINA_EJERCICIO` | Pivot rutina ↔ ejercicio (series, repeticiones, orden) | — |
| `DETALLE_NUTRICIONAL` | PK natural triple (plan, alimento, num_comida) | — |
| `PROGRESO_FISICO` | Mediciones: peso, % grasa, medidas, IMC | N:1 AFILIADO+CICLO |
| `PAGO` | Membresías en efectivo (monto, fecha, vencimiento, estado) | N:1 AFILIADO |
| `CONFIGURACION` | Parámetros clave-valor (precio_membresia = 80000) | — |

### Tablas App Móvil (migración v2.0)

| Tabla | Descripción |
|---|---|
| `PROGRESO_EJERCICIO_DIARIO` | Seguimiento diario: ejercicios completados/no |
| `REGISTRO_AGUA` | Consumo de vasos de agua por fecha |
| `CONSUMO_ALIMENTO_DIARIO` | Consumo diario de alimentos del plan |

### Tabla Seguridad

| Tabla | Descripción |
|---|---|
| `PASSWORD_RESET` | Tokens JWT de un solo uso (15 min) para recuperación |

---

## 👁️ Vistas

| Vista | Fórmula |
|---|---|
| `v_alimento_calorias` | Cálculo Atwater: `(prot × 4) + (carbs × 4) + (grasa × 9)` |
| `v_perfil_afiliado` | JOIN USUARIO + AFILIADO con edad calculada |
| `v_ciclo_activo_afiliado` | Ciclo activo con `numero_ciclo` y `dias_restantes` |
| `v_ultimo_progreso` | Última medición + IMC + clasificación OMS |
| `v_catalogo_ejercicios_disponibles` | Ejercicios filtrados por restricciones del afiliado |

---

## 🔐 Integridad Referencial

- **ON DELETE RESTRICT** en todas las FK críticas (MySQL bloquea eliminación si hay datos asociados)
- **3FN estricta** en todas las tablas
- **PKs compuestas** en tablas pivot (AFILIADO_RESTRICCION, RUTINA_EJERCICIO)
- **Triggers** para cierre automático de ciclos anteriores al crear uno nuevo

---

## 🔌 Conexión (config/db.js)

```js
// Pool mysql2/promise — 10 conexiones máximo
// Soporta:
//   - DATABASE_URL (Railway) → parseo de URI
//   - DB_* individuales (desarrollo)
//   - DB_SOCKET (MariaDB embebido en Docker)
//   - DB_SSL=true (producción)
// Validación estricta: process.exit(1) si faltan variables críticas
```

---

## 📊 Datos Semilla (02_seed.sql)

- 9 usuarios (5 personal + 4 afiliados) con passwords bcrypt 12 rondas
- 6 restricciones médicas
- 19 ejercicios
- 20 alimentos con macros
- 8 ciclos, 24 rutinas, 68 ejercicios en rutinas
- 8 planes nutricionales, 54 registros de detalle
- 14 registros de progreso físico
- 39 pagos (Pagado/Vencido)
- Precio membresía: $80.000 COP

---

## 📎 Notas Relacionadas

- [[Backend Node.js]]
- [[Diagrama general]]
- [[Visión general]]
- [[Afiliados]]

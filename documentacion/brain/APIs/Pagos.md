# 💰 API Pagos

> Registro de membresías, facturación por correo, métricas admin

---

## 📋 Endpoints por Afiliado

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 1 | **GET** | `/afiliados/:id/pagos` | Staff | Historial de pagos (más reciente primero) |
| 2 | **POST** | `/afiliados/:id/pagos` | Admin/Recepcionista | Registrar pago nuevo |

---

## 📊 Endpoints Admin (Vista Global)

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 3 | **GET** | `/pagos` | Admin | Todos los pagos con filtros |
| 4 | **GET** | `/pagos/metricas` | Admin | Métricas agregadas |

---

## 💵 Registro de Pago

```js
// POST /afiliados/:id/pagos
// Body: {
//   "monto": 80000,
//   "metodo_pago": "Efectivo",
//   "observaciones": "Pago mensualidad enero"
// }

// Response:
{
  "id_pago": 40,
  "fecha_vencimiento": "2025-02-15",
  "message": "Pago registrado correctamente"
}

// Side effects:
// - Calcula fecha_vencimiento (30 días desde hoy)
// - Envío asíncrono de factura por correo (fire-and-forget)
```

---

## 📊 Métricas Admin

```js
// GET /pagos/metricas
// Query params: ?fecha_inicio=2025-01-01&fecha_fin=2025-12-31

// Response:
{
  "ingresos_por_mes": [...],
  "ingresos_por_recepcionista": [...],
  "total_recaudado": 3200000,
  "ultimos_10_pagos": [...]
}
```

---

## 🔍 Filtros Admin

```js
// GET /pagos
// Query params:
//   fecha_inicio → Fecha inicio del rango
//   fecha_fin    → Fecha fin del rango
//   id_recepcionista → Filtrar por recepcionista
```

---

## 📧 Facturación por Correo

```
Al registrar un pago:
1. Se obtienen los datos del afiliado
2. Se renderiza template HTML (templates/factura-pago.html)
3. Se envía por Brevo API (o SMTP fallback)
4. El envío es asíncrono (no bloquea la respuesta)
```

---

## 📎 Notas Relacionadas

- [[Afiliados]]
- [[Brevo]]
- [[Historial de bugs]]
- [[ManualPostman|Postman]]

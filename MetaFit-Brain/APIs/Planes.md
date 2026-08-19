# 🏋️ API Planes

> Planes de entrenamiento, rutinas, ejercicios, planes nutricionales

---

## 📋 Planes de Entrenamiento

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 1 | **GET** | `/planes/entrenamiento/:id_ciclo` | OwnCiclo | Ver plan con rutinas y ejercicios |
| 2 | **POST** | `/planes/entrenamiento` | Admin/Entrenador | Crear plan + push notification |
| 3 | **PATCH** | `/planes/entrenamiento/:id` | Admin/Entrenador | Actualizar observaciones |

```js
// GET /planes/entrenamiento/5
// Response (JSON_ARRAYAGG, sin N+1):
{
  "id_plan": 1,
  "observaciones": "Enfoque en fuerza",
  "rutinas": [
    {
      "id_rutina": 1,
      "dia": "Lunes",
      "nombre": "Tren Superior",
      "ejercicios": [
        { "nombre": "Press de banca", "grupo_muscular": "Pecho",
          "series": 4, "repeticiones": 12, "orden": 1 }
      ]
    }
  ]
}
```

---

## 🔄 Rutinas

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 4 | **POST** | `/planes/rutinas` | Admin/Entrenador | Crear rutina (día de entrenamiento) |
| 5 | **POST** | `/planes/rutinas/:id_rutina/ejercicios` | Admin/Entrenador | Añadir ejercicio |
| 6 | **DELETE** | `/planes/rutinas/:id_rutina/ejercicios/:id_ejercicio` | Admin/Entrenador | Quitar ejercicio |
| 7 | **DELETE** | `/planes/rutinas/:id_rutina` | Admin/Entrenador | Eliminar rutina completa |

---

## 🥗 Planes Nutricionales

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 8 | **GET** | `/planes/nutricional/:id_ciclo` | OwnCiclo | Ver plan con detalle de alimentos |
| 9 | **POST** | `/planes/nutricional` | Admin/Entrenador | Crear plan + push notification |
| 10 | **PATCH** | `/planes/nutricional/:id` | Admin/Entrenador | Actualizar calorías y num_comidas |
| 11 | **POST** | `/planes/nutricional/:id_plan/detalle` | Admin/Entrenador | Agregar alimento a una comida |

```js
// POST /planes/nutricional
// Body: {
//   "id_ciclo": 5,
//   "calorias_objetivo": 2200,
//   "num_comidas": 5,
//   "observaciones": "Dieta alta en proteína"
// }

// POST /planes/nutricional/3/detalle
// Body: {
//   "id_alimento": 12,
//   "num_comida": 1,        // Comida 1 = desayuno
//   "cantidad_g": 200
// }
```

---

## 🔔 Push Notifications

```js
// Al crear un plan de entrenamiento o nutricional:
enviarPushAUsuarioDelCiclo(id_ciclo, {
  title: 'Nueva rutina asignada',
  body: 'Tu entrenador te asignó un plan de entrenamiento. ¡A darle!',
  data: { screen: 'Rutina' },
});
```

---

## 📎 Notas Relacionadas

- [[Afiliados]]
- [[Base de datos MySQL]]
- [[Notificaciones]]
- [[ManualPostman|Postman]]

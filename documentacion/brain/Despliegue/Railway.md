# 🚂 Despliegue en Railway

> Base de datos MySQL en la nube

---

## 🔧 Configuración

Railway alberga la base de datos MySQL para el entorno de producción. El backend en Render se conecta a ella via `DATABASE_URL`.

---

## 🔗 Conexión

```js
// backend/config/db.js
// Si DATABASE_URL existe → parseo de URI
// Formato: mysql://user:password@host.railway.internal:3306/metafit

// Ejemplo de DATABASE_URL:
// mysql://root:abc123@roundhouse.proxy.rlwy.net:3306/metafit
```

---

## 📋 Pasos de Configuración

1. Crear proyecto en Railway
2. Agregar servicio MySQL
3. Copiar `DATABASE_URL` desde el dashboard
4. Pegar como variable de entorno en Render (`DATABASE_URL`)
5. Los scripts SQL se ejecutan automáticamente via `start.sh`:
   - `01_schema.sql` → Esquema
   - `02_seed.sql` → Datos semilla
   - `04_migracion_app_movil.sql` → Tablas móviles

---

## ⚠️ Notas Importantes

- Railway asigna un dominio interno (`*.railway.internal`) para comunicación entre servicios
- La conexión es via TCP (no Unix socket)
- SSL habilitable con `DB_SSL=true` en el backend
- No hay `railway.json` o `railway.toml` — se configura desde el dashboard

---

## 📎 Notas Relacionadas

- [[Render]]
- [[Base de datos MySQL]]
- [[Backend Node.js]]

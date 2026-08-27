# ☁️ Despliegue Cloudinary

> Almacenamiento de fotos de perfil en la nube

---

## 🔧 Configuración

Cloudinary almacena las fotos de perfil de los afiliados de forma **permanente** (CDN). Configuración centralizada en `backend/config/cloudinary.js`. Si las credenciales no están definidas o fallan la autenticación, el sistema cae a disco local (`backend/uploads/`) con un log claro en el arranque.

- Verificación al arranque: `verificarCredenciales()` hace `api.ping()` y loguea el estado (`cloud_name mismatch`, `api_secret mismatch`, `unknown api_key`, etc.).
- Al probar subidas: un error `cloud_name mismatch` (401) significa que el `cloud_name` NO pertenece a la cuenta de esa API key/secret → revisar el dashboard de Cloudinary.

---

## 🔑 Variables de Entorno

| Variable | Descripción |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud |
| `CLOUDINARY_API_KEY` | API key pública |
| `CLOUDINARY_API_SECRET` | API secret |

---

## 🔄 Lógica de Selección

```js
// config/cloudinary.js + middlewares/uploadFoto.js
const { cloudinary, configurado, FOLDER, publicIdDesdeUrl } = require('../config/cloudinary');

// ¿Las 3 variables de entorno están definidas?
// SÍ → CloudinaryStorage (folder FOLDER = metafit/afiliados)
//      Transformation: max 600x600, crop limit
//      Formatos: png, jpg, jpeg, webp, gif
//      req.file.path devuelve la URL https completa de res.cloudinary.com
//
// NO → Disco local (backend/uploads/)
```

Las variables `CLOUDINARY_*` se pasan al contenedor backend vía `docker-compose.yml` y se configuran en Render (Panel o API).

---

## 📷 Configuración de Upload

```js
const upload = multer({
  storage,           // Cloudinary o disco local
  fileFilter,        // Solo imágenes
  limits: { fileSize: 5 * 1024 * 1024 }  // 5 MB máximo
});
module.exports = {
  uploadFoto: upload.single('foto'),   // Campo "foto" en multipart
  UPLOADS_DIR,                          // Ruta del directorio local
  STORAGE_KIND,                         // 'cloudinary' | 'local'
  eliminarFotoAnterior                  // Borra foto previa al subir nueva
};
```

---

## 🗑️ Eliminación

```js
// Al subir una foto nueva, se elimina la anterior:
// - Cloudinary: API destroy por public_id (extraído con publicIdDesdeUrl)
// - Local: fs.unlinkSync(ruta)
```

El `afiliadoController.subirFoto` además valida: si la foto ya es URL absoluta (https de Cloudinary) la guarda tal cual, sin concatenar el host local.

---

## 📎 Notas Relacionadas

- [[Afiliados]]
- [[Backend Node.js]]
- [[Diseño/Paleta de colores|Paleta de colores]]

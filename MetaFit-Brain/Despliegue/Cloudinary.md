# ☁️ Despliegue Cloudinary

> Almacenamiento de fotos de perfil en la nube

---

## 🔧 Configuración

Cloudinary almacena las fotos de perfil de los afiliados. Si no está configurado, el sistema usa almacenamiento local en `backend/uploads/`.

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
// middlewares/uploadFoto.js

// ¿Las 3 variables de entorno están definidas?
// SÍ → Cloudinary Storage
//      Folder: metafit/afiliados
//      Transformation: max 600x600, crop limit
//      Formatos: png, jpg, jpeg, webp, gif
//
// NO → Disco local (backend/uploads/)
```

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
// - Cloudinary: API destroy por public_id
// - Local: fs.unlinkSync(ruta)
```

---

## 📎 Notas Relacionadas

- [[Afiliados]]
- [[Backend Node.js]]
- [[Diseño/Paleta de colores|Paleta de colores]]

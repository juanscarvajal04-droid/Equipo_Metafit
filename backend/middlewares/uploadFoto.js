// middlewares/uploadFoto.js
// Multer: subida de fotos de perfil de afiliados.
// Storage SELECCIONABLE:
//   1. Cloudinary (si están definidas CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET)
//   2. Disco local backend/uploads/ (fallback por defecto)
// Solo acepta imágenes (PNG, JPG, WEBP, GIF) de hasta 5 MB.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { cloudinary, configurado, FOLDER, publicIdDesdeUrl } = require('../config/cloudinary');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const fileFilter = (req, file, cb) => {
  if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error('Solo se permiten imágenes (PNG, JPG, WEBP, GIF)'));
};

let storage;
let STORAGE_KIND = 'disk';

if (configurado) {
  try {
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: FOLDER,
        allowed_formats: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
        transformation: [{ width: 600, height: 600, crop: 'limit' }],
      },
    });
    STORAGE_KIND = 'cloudinary';
    console.log('📸 Fotos de perfil: storage CLOUDINARY activo');
  } catch (err) {
    console.error('[uploadFoto] no se pudo configurar Cloudinary, usando disco:', err.message);
    storage = null;
  }
}

if (!storage) {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  });
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/** Elimina una foto anterior (Cloudinary o disco). Best effort. */
const eliminarFotoAnterior = (foto) => {
  try {
    if (STORAGE_KIND === 'cloudinary' && /^https:\/\//.test(foto)) {
      const publicId = publicIdDesdeUrl(foto);
      if (publicId) {
        cloudinary.uploader.destroy(publicId, () => {});
      }
      return;
    }
    if (/^\/uploads\//.test(foto)) {
      fs.unlink(path.join(UPLOADS_DIR, path.basename(foto)), () => {});
    }
  } catch (err) {
    console.error('[uploadFoto.eliminarFotoAnterior]', err.message);
  }
};

module.exports = {
  uploadFoto: upload.single('foto'),
  UPLOADS_DIR,
  STORAGE_KIND,
  eliminarFotoAnterior,
};
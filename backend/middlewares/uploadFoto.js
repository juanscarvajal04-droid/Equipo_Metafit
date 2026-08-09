// middlewares/uploadFoto.js
// Multer: subida de fotos de perfil de afiliados.
// Guarda en backend/uploads/ con nombre único (timestamp + hex aleatorio)
// y solo acepta imágenes (PNG, JPG, WEBP, GIF) de hasta 5 MB.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error('Solo se permiten imágenes (PNG, JPG, WEBP, GIF)'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { uploadFoto: upload.single('foto'), UPLOADS_DIR };
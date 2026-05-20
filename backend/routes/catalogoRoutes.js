// routes/catalogoRoutes.js
const express             = require('express');
const router              = express.Router();
const CatalogoController  = require('../controllers/catalogoController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// ── EJERCICIOS ────────────────────────────────────────────────
router.get('/ejercicios',  requireAuth,  CatalogoController.getAllEjercicios);
router.post('/ejercicios', requireAdmin, CatalogoController.createEjercicio);

// ── ALIMENTOS ─────────────────────────────────────────────────
router.get('/alimentos',   requireAuth,  CatalogoController.getAllAlimentos);
router.post('/alimentos',  requireAdmin, CatalogoController.createAlimento);

// ── RESTRICCIONES ─────────────────────────────────────────────
router.get('/restricciones', requireAuth, CatalogoController.getAllRestricciones);

module.exports = router;
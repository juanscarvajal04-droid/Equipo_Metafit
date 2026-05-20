// routes/planRoutes.js
const express         = require('express');
const router          = express.Router();
const PlanController  = require('../controllers/planController');
const { requireAuth, requireAdminOrEntrenador } = require('../middlewares/auth');

// ── PLANES DE ENTRENAMIENTO ───────────────────────────────────
router.get('/entrenamiento/:id_ciclo',    requireAuth,              PlanController.getEntrenamiento);
router.post('/entrenamiento',             requireAdminOrEntrenador, PlanController.createEntrenamiento);
router.patch('/entrenamiento/:id',        requireAdminOrEntrenador, PlanController.updateEntrenamiento);

// ── RUTINAS ───────────────────────────────────────────────────
router.post('/rutinas',                                   requireAdminOrEntrenador, PlanController.createRutina);
router.post('/rutinas/:id_rutina/ejercicios',             requireAdminOrEntrenador, PlanController.addEjercicio);
router.delete('/rutinas/:id_rutina/ejercicios/:id_ejercicio', requireAdminOrEntrenador, PlanController.removeEjercicio);

// ── PLANES NUTRICIONALES ──────────────────────────────────────
router.get('/nutricional/:id_ciclo',      requireAuth,              PlanController.getNutricional);
router.post('/nutricional',               requireAdminOrEntrenador, PlanController.createNutricional);
router.post('/nutricional/:id_plan/detalle', requireAdminOrEntrenador, PlanController.addAlimento);

module.exports = router;
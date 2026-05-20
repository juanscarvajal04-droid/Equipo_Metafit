// routes/afiliadoRoutes.js
const express              = require('express');
const router               = express.Router();
const AfiliadoController   = require('../controllers/afiliadoController');
const { requireAuth, requireAdmin, requireAdminOrEntrenador } = require('../middlewares/auth');

// ── AFILIADOS CRUD ────────────────────────────────────────────
router.get('/',      requireAuth,  AfiliadoController.getAll);
router.get('/:id',   requireAuth,  AfiliadoController.getById);
router.post('/',     requireAuth,  AfiliadoController.create);
router.patch('/:id', requireAuth,  AfiliadoController.update);
router.delete('/:id',requireAdmin, AfiliadoController.delete);

// ── CICLOS ────────────────────────────────────────────────────
router.get('/:id/ciclos',  requireAuth,               AfiliadoController.getCiclos);
router.post('/ciclos',     requireAdminOrEntrenador,   AfiliadoController.createCiclo);

// ── RESTRICCIONES DEL AFILIADO ────────────────────────────────
router.get('/:id/restricciones',                      requireAuth,               AfiliadoController.getRestricciones);
router.post('/:id/restricciones',                     requireAdminOrEntrenador,  AfiliadoController.addRestriccion);
router.delete('/:id/restricciones/:id_restriccion',   requireAdminOrEntrenador,  AfiliadoController.removeRestriccion);

// ── PROGRESO FÍSICO ───────────────────────────────────────────
router.get('/:id/progreso',  requireAuth,              AfiliadoController.getProgreso);
router.post('/progreso',     requireAdminOrEntrenador,  AfiliadoController.createProgreso);

module.exports = router;
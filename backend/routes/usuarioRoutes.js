// routes/usuarioRoutes.js
const express            = require('express');
const router             = express.Router();
const UsuarioController  = require('../controllers/usuarioController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// GET  /usuarios           → todos los roles autenticados
// POST /usuarios           → solo Admin
// PATCH/DELETE /usuarios/:id → solo Admin

router.get('/',     requireAuth,  UsuarioController.getAll);
router.get('/:id',  requireAuth,  UsuarioController.getById);
router.post('/',    requireAdmin, UsuarioController.create);
router.patch('/:id',requireAdmin, UsuarioController.update);
router.delete('/:id',requireAdmin,UsuarioController.delete);

module.exports = router;
// routes/authRoutes.js
const express        = require('express');
const router         = express.Router();
const AuthController = require('../controllers/authController');

// POST /login
router.post('/login', AuthController.login);

module.exports = router;
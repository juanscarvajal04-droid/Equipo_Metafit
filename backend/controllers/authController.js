// backend/controllers/authController.js
// ─── Login con bcrypt + JWT firmado ──────────────────────────
'use strict';

const UsuarioModel              = require('../models/usuarioModel');
const { signJWT, comparePassword } = require('../middlewares/auth');

const AuthController = {

  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });

    try {
      // Busca por correo (sin comparar contraseña aún)
      const user = await UsuarioModel.findByEmail(email);
      if (!user)
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

      // Compara con bcrypt
      const match = await comparePassword(password, user.contrasena);
      if (!match)
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

      if (user.estado !== 'Activo')
        return res.status(403).json({
          error: `Tu cuenta está en estado: ${user.estado}. Contacta al administrador.`,
        });

      const token = signJWT({
        sub  : user.id_usuario,
        email: user.correo,
        role : user.rol,
      });

      res.json({
        accessToken: token,
        user: {
          id       : user.id_usuario,
          email    : user.correo,
          role     : user.rol,
          nombres  : user.nombres,
          apellidos: user.apellidos,
        },
      });
    } catch (err) {
      console.error('login error:', err.message);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = AuthController;
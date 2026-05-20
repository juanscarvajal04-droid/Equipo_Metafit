// controllers/authController.js
const UsuarioModel = require('../models/usuarioModel');
const { signJWT }  = require('../middlewares/auth');

const AuthController = {
  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });

    try {
      const user = await UsuarioModel.findByCredentials(email, password);
      if (!user)
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

      if (user.estado_cuenta_usuario !== 'Activo')
        return res.status(403).json({
          error: `Tu cuenta está en estado: ${user.estado_cuenta_usuario}. Contacta al administrador.`
        });

      const token = signJWT({
        sub  : user.id_usuario,
        email: user.correo_usuario,
        role : user.rol_usuario,
      });

      res.json({
        accessToken: token,
        user: {
          id       : user.id_usuario,
          email    : user.correo_usuario,
          role     : user.rol_usuario,
          nombres  : user.nombres_usuario,
          apellidos: user.apellidos_usuario,
        },
      });
    } catch (err) {
      console.error('login error:', err.message);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = AuthController;
// controllers/afiliadoController.js
// Refactorizado: delegar en afiliadoService para arquitectura limpia MVC
'use strict';

const AfiliadoService = require('../services/afiliadoService');
const { eliminarFotoAnterior } = require('../middlewares/uploadFoto');

const AfiliadoController = {

  getAll: async (req, res) => {
    try {
      const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const afiliados = await AfiliadoService.getAll({ page, limit });
      return res.json(afiliados);
    } catch (err) {
      console.error('[afiliadoController.getAll]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getById: async (req, res) => {
    try {
      const af = await AfiliadoService.getById(req.params.id);
      if (!af) return res.status(404).json({ error: 'Afiliado no encontrado' });
      return res.json(af);
    } catch (err) {
      console.error('[afiliadoController.getById]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  create: async (req, res) => {
    try {
      const result = await AfiliadoService.create(req.body, req.user.sub);
      // Correo de bienvenida + webhook n8n (fire-and-forget: nunca bloquea la respuesta)
      if (result?.id) {
        const passwordTemporal = req.body.contrasena || req.body.password || null;
        AfiliadoService.getById(result.id)
          .then((detalle) => {
            if (!detalle) return null;
            // Correo de bienvenida
            require('../services/bienvenidaService')
              .enviarCorreoBienvenida(detalle, passwordTemporal)
              .catch((err) => console.error('[afiliadoController] bienvenida:', err.message));
            // Webhook n8n (Telegram + Google Sheets)
            require('../services/n8nWebhookService')
              .notificarNuevoAfiliado(detalle, passwordTemporal)
              .catch((err) => console.error('[afiliadoController] webhook n8n:', err.message));
            return null;
          })
          .catch((err) => console.error('[afiliadoController] post-creacion:', err.message));
      }
      return res.status(201).json(result);
    } catch (err) {
      if (err.message === 'Nombre y documento son requeridos' || err.message.includes('contraseña')) {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ya existe un afiliado con ese documento o correo' });
      }
      console.error('[afiliadoController.create]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  update: async (req, res) => {
    try {
      const success = await AfiliadoService.update(req.params.id, req.body);
      if (!success) return res.status(404).json({ error: 'Afiliado no encontrado' });
      return res.json({ message: 'Afiliado actualizado correctamente' });
    } catch (err) {
      console.error('[afiliadoController.update]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  delete: async (req, res) => {
    try {
      const success = await AfiliadoService.delete(req.params.id);
      if (!success) return res.status(404).json({ error: 'Afiliado no encontrado' });
      return res.json({ message: 'Afiliado eliminado correctamente' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ error: 'No se puede eliminar: el afiliado tiene datos asociados' });
      }
      console.error('[afiliadoController.delete]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getCiclos: async (req, res) => {
    try {
      const ciclos = await AfiliadoService.getCiclos(req.params.id);
      return res.json(ciclos);
    } catch (err) {
      console.error('[afiliadoController.getCiclos]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  createCiclo: async (req, res) => {
    try {
      const result = await AfiliadoService.createCiclo(req.body, req.user.sub);
      return res.status(201).json(result);
    } catch (err) {
      if (err.message === 'id_usuario, fecha_inicio y fecha_fin son requeridos') {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ya existe un ciclo con esa fecha de inicio para este afiliado' });
      }
      console.error('[afiliadoController.createCiclo]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getRestricciones: async (req, res) => {
    try {
      const restr = await AfiliadoService.getRestricciones(req.params.id);
      return res.json(restr);
    } catch (err) {
      console.error('[afiliadoController.getRestricciones]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  addRestriccion: async (req, res) => {
    try {
      const result = await AfiliadoService.addRestriccion(req.params.id, req.body.id_restriccion);
      return res.status(201).json(result);
    } catch (err) {
      if (err.message === 'id_restriccion requerido') {
        return res.status(400).json({ error: err.message });
      }
      console.error('[afiliadoController.addRestriccion]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  removeRestriccion: async (req, res) => {
    try {
      const success = await AfiliadoService.removeRestriccion(req.params.id, req.params.id_restriccion);
      if (!success) {
        return res.status(404).json({ error: 'Restricción no encontrada para este afiliado' });
      }
      return res.json({ message: 'Restricción removida' });
    } catch (err) {
      console.error('[afiliadoController.removeRestriccion]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getEjerciciosDisponibles: async (req, res) => {
    try {
      const data = await AfiliadoService.getEjerciciosDisponibles(req.params.id);
      return res.json(data);
    } catch (err) {
      console.error('[afiliadoController.getEjerciciosDisponibles]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getAlimentosDisponibles: async (req, res) => {
    try {
      const data = await AfiliadoService.getAlimentosDisponibles(req.params.id);
      return res.json(data);
    } catch (err) {
      console.error('[afiliadoController.getAlimentosDisponibles]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getProgreso: async (req, res) => {
    try {
      const progreso = await AfiliadoService.getProgreso(req.params.id);
      return res.json(progreso);
    } catch (err) {
      console.error('[afiliadoController.getProgreso]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  createProgreso: async (req, res) => {
    try {
      const result = await AfiliadoService.createProgreso(req.body, req.user.sub);
      return res.status(201).json(result);
    } catch (err) {
      if (err.message === 'id_ciclo, fecha_registro y peso son requeridos') {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ya existe un registro de progreso para ese ciclo en esa fecha' });
      }
      console.error('[afiliadoController.createProgreso]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── ENDPOINTS /me (auto‑usan req.user.sub) ────────────────

  subirFoto: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Debe enviar una imagen en el campo "foto"' });
      }

      // /me/foto usa el id del token; /:id/foto lo toma del parámetro.
      const id = req.params.id || req.user.sub;
      // Cloudinary: req.file.path = URL https completa; disco: ruta /app/..., usar relativa.
      const foto = /^https?:\/\//.test(req.file.path) ? req.file.path : `/uploads/${req.file.filename}`;
      // Si ya es URL absoluta (Cloudinary), no concatenar el host local.
      const url = /^https?:\/\//.test(foto) ? foto : `${req.protocol}://${req.get('host')}${foto}`;

      const fotoAnterior = await AfiliadoService.getFoto(id);
      const ok = await AfiliadoService.setFoto(id, foto);

      if (!ok) {
        // Afiliado inexistente: borrar la foto recién subida
        eliminarFotoAnterior(foto);
        return res.status(404).json({ error: 'Afiliado no encontrado' });
      }

      // Borrar la foto anterior (best effort, si no es la misma)
      if (fotoAnterior && fotoAnterior !== foto) {
        eliminarFotoAnterior(fotoAnterior);
      }

      return res.json({
        message: 'Foto de perfil actualizada',
        foto,
        url,
      });
    } catch (err) {
      console.error('[afiliadoController.subirFoto]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getMe: async (req, res) => {
    try {
      const af = await AfiliadoService.getById(req.user.sub);
      if (!af) return res.status(404).json({ error: 'Afiliado no encontrado' });
      return res.json(af);
    } catch (err) {
      console.error('[afiliadoController.getMe]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getMisCiclos: async (req, res) => {
    try {
      const ciclos = await AfiliadoService.getCiclos(req.user.sub);
      return res.json(ciclos);
    } catch (err) {
      console.error('[afiliadoController.getMisCiclos]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getMiProgreso: async (req, res) => {
    try {
      const progreso = await AfiliadoService.getProgreso(req.user.sub);
      return res.json(progreso);
    } catch (err) {
      console.error('[afiliadoController.getMiProgreso]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getMisRestricciones: async (req, res) => {
    try {
      const restr = await AfiliadoService.getRestricciones(req.user.sub);
      return res.json(restr);
    } catch (err) {
      console.error('[afiliadoController.getMisRestricciones]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  saveProgresoEjercicio: async (req, res) => {
    try {
      const result = await AfiliadoService.saveProgresoEjercicio(req.user.sub, req.body);
      return res.status(201).json(result);
    } catch (err) {
      if (err.message.includes('requeridos')) {
        return res.status(400).json({ error: err.message });
      }
      console.error('[afiliadoController.saveProgresoEjercicio]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getProgresoEjercicio: async (req, res) => {
    try {
      const { idCiclo, fecha } = req.params;
      const result = await AfiliadoService.getProgresoEjercicio(req.user.sub, idCiclo, fecha);
      return res.json({ ejercicios: result });
    } catch (err) {
      console.error('[afiliadoController.getProgresoEjercicio]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  saveAgua: async (req, res) => {
    try {
      const result = await AfiliadoService.saveAgua(req.user.sub, req.body);
      return res.status(201).json(result);
    } catch (err) {
      if (err.message.includes('requeridos')) {
        return res.status(400).json({ error: err.message });
      }
      console.error('[afiliadoController.saveAgua]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getAgua: async (req, res) => {
    try {
      const { fecha } = req.params;
      const result = await AfiliadoService.getAgua(req.user.sub, fecha);
      return res.json(result);
    } catch (err) {
      console.error('[afiliadoController.getAgua]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  saveConsumoAlimento: async (req, res) => {
    try {
      const result = await AfiliadoService.saveConsumoAlimento(req.user.sub, req.body);
      return res.status(201).json(result);
    } catch (err) {
      if (err.message.includes('requeridos')) {
        return res.status(400).json({ error: err.message });
      }
      console.error('[afiliadoController.saveConsumoAlimento]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getAguaHistorial: async (req, res) => {
    try {
      const result = await AfiliadoService.getAguaHistorial(req.user.sub, req.query);
      return res.json(result);
    } catch (err) {
      console.error('[afiliadoController.getAguaHistorial]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getConsumoHistorial: async (req, res) => {
    try {
      const result = await AfiliadoService.getConsumoHistorial(req.user.sub, req.query);
      return res.json(result);
    } catch (err) {
      console.error('[afiliadoController.getConsumoHistorial]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getProgresoEjercicioHistorial: async (req, res) => {
    try {
      const result = await AfiliadoService.getProgresoEjercicioHistorial(req.user.sub, req.query);
      return res.json(result);
    } catch (err) {
      console.error('[afiliadoController.getProgresoEjercicioHistorial]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = AfiliadoController;
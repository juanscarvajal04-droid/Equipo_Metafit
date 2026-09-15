// controllers/afiliadoController.js
// ─── Capa HTTP de gestión de afiliados (CRUD + ciclos + restricciones + progreso) ──
// Recibe los requests, valida errores conocidos y delega TODA la lógica de
// negocio en afiliadoService (arquitectura limpia MVC): los controllers no
// tocan la BD directamente.
// Refactorizado: delegar en afiliadoService para arquitectura limpia MVC
'use strict';

const AfiliadoService = require('../services/afiliadoService');
const RegistroService = require('../services/registroService');
const { eliminarFotoAnterior } = require('../middlewares/uploadFoto');

const AfiliadoController = {

  /**
   * GET /afiliados?page=&limit= — lista afiliados paginados.
   * Los parámetros page/limit se sanean (mínimo 1, tope 200 por página) para
   * evitar paginaciones abusivas o negativas.
   *
   * @param {Object} req - Request de Express (query: page, limit)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con el arreglo de afiliados o 500.
   */
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

  /**
   * GET /afiliados/:id — detalle completo de un afiliado.
   *
   * @param {Object} req - Request de Express (params: id)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con el afiliado enriquecido, 404 si
   *          no existe o 500.
   */
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

  /**
   * POST /afiliados — registra un afiliado nuevo.
   * Tras el alta dispara de forma FIRE-AND-FORGET (nunca bloquea la respuesta,
   * pero se loguea si fallan) el correo de bienvenida y el webhook n8n
   * (Telegram + Google Sheets) para avisar al equipo.
   *
   * @param {Object} req - Request de Express (body: datos del afiliado, req.user.sub = quien registra)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 201 con { id, message }, 400 por datos
   *          inválidos o duplicados, o 500.
   */
  create: async (req, res) => {
    try {
      const result = await AfiliadoService.create(req.body, req.user.sub);
      // Correo de bienvenida + webhook n8n (fire-and-forget: nunca bloquea la respuesta)
      if (result?.id) {
        // Contraseña efectiva: la que genera el backend (MF_{documento}@2025)
        // si el frontend no envía `contrasena`. Fallback documentado.
        const passwordTemporal = result.password_temporal
          || req.body.contrasena || req.body.password
          || 'MetaFit2025!';
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

  /**
   * PATCH /afiliados/:id — actualización parcial del afiliado.
   *
   * @param {Object} req - Request de Express (params: id, body: campos)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200, 404 si no existe o 500.
   */
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

  /**
   * DELETE /afiliados/:id — elimina un afiliado (solo Admin en las rutas).
   * Traduce el error de integridad referencial (ER_ROW_IS_REFERENCED_2) en un
   * 400 amigable: un afiliado con historial no puede borrarse físicamente.
   *
   * @param {Object} req - Request de Express (params: id)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200, 400 (tiene datos asociados), 404 o 500.
   */
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

  /**
   * GET /afiliados/:id/ciclos — historial de ciclos del afiliado.
   *
   * @param {Object} req - Request de Express (params: id)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista de ciclos o 500.
   */
  getCiclos: async (req, res) => {
    try {
      const ciclos = await AfiliadoService.getCiclos(req.params.id);
      return res.json(ciclos);
    } catch (err) {
      console.error('[afiliadoController.getCiclos]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /afiliados/ciclos — crea un ciclo de entrenamiento (Admin/Entrenador).
   * Cierra automáticamente el ciclo activo anterior del mismo afiliado.
   *
   * @param {Object} req - Request de Express (body: id_usuario, fechas, objetivo; req.user.sub = registrado_por)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 201 con { id_ciclo, message }, 400 por
   *          datos faltantes o solapamiento de fechas, o 500.
   */
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

  /**
   * GET /afiliados/:id/restricciones — restricciones médicas del afiliado.
   *
   * @param {Object} req - Request de Express (params: id)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con el listado o 500.
   */
  getRestricciones: async (req, res) => {
    try {
      const restr = await AfiliadoService.getRestricciones(req.params.id);
      return res.json(restr);
    } catch (err) {
      console.error('[afiliadoController.getRestricciones]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /afiliados/:id/restricciones — asigna una restricción médica.
   *
   * @param {Object} req - Request de Express (params: id, body: id_restriccion)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 201, 400 si falta id_restriccion o 500.
   */
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

  /**
   * DELETE /afiliados/:id/restricciones/:id_restriccion — remueve una
   * restricción médica previamente asignada.
   *
   * @param {Object} req - Request de Express (params: id, id_restriccion)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200, 404 si el vínculo no existe o 500.
   */
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

  /**
   * GET /afiliados/:id/ejercicios-disponibles — ejercicios permitidos para el
   * afiliado (excluye los prohibidos por sus restricciones médicas).
   *
   * @param {Object} req - Request de Express (params: id)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista filtrada o 500.
   */
  getEjerciciosDisponibles: async (req, res) => {
    try {
      const data = await AfiliadoService.getEjerciciosDisponibles(req.params.id);
      return res.json(data);
    } catch (err) {
      console.error('[afiliadoController.getEjerciciosDisponibles]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /afiliados/:id/alimentos-disponibles — alimentos permitidos para el
   * afiliado (excluye los prohibidos por sus restricciones médicas).
   *
   * @param {Object} req - Request de Express (params: id)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista filtrada o 500.
   */
  getAlimentosDisponibles: async (req, res) => {
    try {
      const data = await AfiliadoService.getAlimentosDisponibles(req.params.id);
      return res.json(data);
    } catch (err) {
      console.error('[afiliadoController.getAlimentosDisponibles]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /afiliados/:id/progreso — historial de mediciones físicas del afiliado.
   *
   * @param {Object} req - Request de Express (params: id)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista de progresos o 500.
   */
  getProgreso: async (req, res) => {
    try {
      const id = req.params.id;
      const [historial, registros] = await Promise.all([
        AfiliadoService.getProgreso(id),
        // Incluye las notas (REGISTRO_EJERCICIO.notas) que el afiliado digita.
        // Para no romper el formato previo (array), se entregan en un objeto:
        //   { historial: [...], registros: [...] }  → web del entrenador
        RegistroService.getHistorialEjercicios(id, {}),
      ]);
      return res.json({ historial, registros });
    } catch (err) {
      console.error('[afiliadoController.getProgreso]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /afiliados/progreso — registra una medición física (Admin/Entrenador).
   *
   * @param {Object} req - Request de Express (body: id_ciclo, fecha, peso, medidas; req.user.sub = registrado_por)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 201, 400 por datos faltantes o registro
   *          duplicado en esa fecha, o 500.
   */
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

  /**
   * POST /afiliados/me/foto (o /afiliados/:id/foto) — sube la foto de perfil.
   * El middleware uploadFoto ya guardó el archivo (disco o Cloudinary) y
   * dejó la ruta/URL en req.file.path; este handler la persiste en
   * AFILIADO.foto y borra la foto anterior (mejor esfuerzo, no bloquea).
   *
   * @param {Object} req - Request de Express (req.file del multer; req.user.sub o :id)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con { message, foto, url }, 400 si no
   *          vino archivo, 404 si el afiliado no existe o 500.
   */
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

  /**
   * GET /afiliados/me — perfil completo del afiliado autenticado. Usa el ID
   * del token, por lo que no existe riesgo de consultar el perfil de otro.
   *
   * @param {Object} req - Request de Express (req.user.sub)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con el perfil, 404 o 500.
   */
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

  /**
   * GET /afiliados/me/ciclos — ciclos del afiliado autenticado.
   *
   * @param {Object} req - Request de Express (req.user.sub)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista de ciclos o 500.
   */
  getMisCiclos: async (req, res) => {
    try {
      const ciclos = await AfiliadoService.getCiclos(req.user.sub);
      return res.json(ciclos);
    } catch (err) {
      console.error('[afiliadoController.getMisCiclos]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /afiliados/me/progreso — historial de progreso del afiliado autenticado.
   *
   * @param {Object} req - Request de Express (req.user.sub)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con el historial o 500.
   */
  getMiProgreso: async (req, res) => {
    try {
      const progreso = await AfiliadoService.getProgreso(req.user.sub);
      return res.json(progreso);
    } catch (err) {
      console.error('[afiliadoController.getMiProgreso]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // FASE A.1: el afiliado autenticado edita su perfil (PATCH /afiliados/me)
  /**
   * PATCH /afiliados/me — el afiliado actualiza SU PROPIO perfil (teléfono,
   * dirección, estatura, correo y/o peso). Traduce los errores de negocio del
   * service a códigos HTTP específicos: 400 (validación), 409 (correo en uso),
   * 404 (afiliado no encontrado) y los CHECK constraints de MySQL (peso 20-300).
   *
   * @param {Object} req - Request de Express (req.user.sub, body: campos)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con el resultado del service (incluye
   *          IMC recalculado), 400/404/409 o 500.
   */
  updateMe: async (req, res) => {
    try {
      const result = await AfiliadoService.updateMe(req.user.sub, req.body);
      return res.json(result);
    } catch (err) {
      if (err.code === 'DATOS_INVALIDOS' || err.code === 'SIN_CICLO_ACTIVO') {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'CORREO_EN_USO') {
        return res.status(409).json({ error: err.message });
      }
      if (err.code === 'NO_ENCONTRADO') {
        return res.status(404).json({ error: err.message });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ya existe un afiliado con ese correo' });
      }
      if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
        return res.status(400).json({ error: 'El peso debe estar entre 20 y 300 kg' });
      }
      console.error('[afiliadoController.updateMe]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /afiliados/me/restricciones — restricciones del afiliado autenticado.
   *
   * @param {Object} req - Request de Express (req.user.sub)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista o 500.
   */
  getMisRestricciones: async (req, res) => {
    try {
      const restr = await AfiliadoService.getRestricciones(req.user.sub);
      return res.json(restr);
    } catch (err) {
      console.error('[afiliadoController.getMisRestricciones]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /afiliados/me/progreso-ejercicio — guarda el progreso diario de
   * ejercicios (app móvil): marca cada ejercicio como completado/no completado
   * para el ciclo y la fecha indicados.
   *
   * @param {Object} req - Request de Express (req.user.sub, body: id_ciclo, fecha, ejercicios[])
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 201, 400 si faltan campos requeridos o 500.
   */
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

  /**
   * GET /afiliados/me/progreso-ejercicio/:idCiclo/:fecha — estado de
   * completado de los ejercicios de un día específico (app móvil).
   *
   * @param {Object} req - Request de Express (req.user.sub, params: idCiclo, fecha)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con { ejercicios: [...] } o 500.
   */
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

  /**
   * POST /afiliados/me/agua — registra el consumo de agua de una fecha
   * (app móvil). Vasos válidos 0-20 (lo valida el CHECK del schema).
   *
   * @param {Object} req - Request de Express (req.user.sub, body: fecha, vasos)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 201, 400 o 500.
   */
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

  /**
   * GET /afiliados/me/agua/:fecha — vasos de agua registrados en una fecha.
   *
   * @param {Object} req - Request de Express (req.user.sub, params: fecha)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con { vasos } o 500.
   */
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

  /**
   * POST /afiliados/me/consumo-alimento — guarda el consumo diario de
   * alimentos del plan (app móvil). El service valida que los alimentos
   * pertenezcan al plan del ciclo antes de persistir.
   *
   * @param {Object} req - Request de Express (req.user.sub, body: id_ciclo, fecha, alimentos[])
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 201, 400 o 500.
   */
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

  /**
   * GET /afiliados/me/agua/historial — historial de consumo de agua con
   * filtros de rango de fechas vía query params.
   *
   * @param {Object} req - Request de Express (req.user.sub, query: fechaInicio, fechaFin)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista o 500.
   */
  getAguaHistorial: async (req, res) => {
    try {
      const result = await AfiliadoService.getAguaHistorial(req.user.sub, req.query);
      return res.json(result);
    } catch (err) {
      console.error('[afiliadoController.getAguaHistorial]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /afiliados/me/consumo/historial — historial de consumo de alimentos.
   *
   * @param {Object} req - Request de Express (req.user.sub, query: fechaInicio, fechaFin)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista o 500.
   */
  getConsumoHistorial: async (req, res) => {
    try {
      const result = await AfiliadoService.getConsumoHistorial(req.user.sub, req.query);
      return res.json(result);
    } catch (err) {
      console.error('[afiliadoController.getConsumoHistorial]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /afiliados/me/progreso-ejercicio/historial — historial de progreso de
   * ejercicios (filtrable por id_ciclo y rango de fechas).
   *
   * @param {Object} req - Request de Express (req.user.sub, query: id_ciclo, fechaInicio, fechaFin)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista o 500.
   */
  getProgresoEjercicioHistorial: async (req, res) => {
    try {
      const result = await AfiliadoService.getProgresoEjercicioHistorial(req.user.sub, req.query);
      return res.json(result);
    } catch (err) {
      console.error('[afiliadoController.getProgresoEjercicioHistorial]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── PARTE 3: NOTAS DEL AFILIADO SOBRE EJERCICIOS ─────────────
  /**
   * POST /afiliados/me/notas-ejercicio — el afiliado crea/actualiza una nota
   * sobre un ejercicio (upsert por día). Traduce los errores de FK y CHECK
   * constraint a mensajes amigables.
   *
   * @param {Object} req - Request de Express (req.user.sub, body: id_ejercicio, id_ciclo, nota)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 201, 400 (faltan datos, ejercicio/ciclo
   *          no existe o CHECK violado) o 500.
   */
  crearNotaEjercicio: async (req, res) => {
    try {
      const result = await AfiliadoService.guardarNotaEjercicio(req.user.sub, req.body);
      return res.status(201).json(result);
    } catch (err) {
      if (err.message && err.message.includes('requeridos'))
        return res.status(400).json({ error: err.message });
      if (err.code === 'ER_NO_REFERENCED_ROW_2')
        return res.status(400).json({ error: 'El ejercicio o ciclo no existe' });
      if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED')
        return res.status(400).json({ error: 'Datos inválidos para la nota' });
      console.error('[afiliadoController.crearNotaEjercicio]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /afiliados/me/notas-ejercicio — liste las notas del afiliado
   * autenticado, opcionalmente filtradas por id_ciclo (query param).
   *
   * @param {Object} req - Request de Express (req.user.sub, query: id_ciclo)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista o 500.
   */
  getMisNotasEjercicio: async (req, res) => {
    try {
      const result = await AfiliadoService.getMisNotasEjercicio(req.user.sub, req.query.id_ciclo);
      return res.json(result);
    } catch (err) {
      console.error('[afiliadoController.getMisNotasEjercicio]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * PATCH /afiliados/me/notas-ejercicio/:id_nota — edita una de las notas
   * propias del afiliado.
   *
   * @param {Object} req - Request de Express (req.user.sub, params: id_nota, body: nota)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200, 400 (nota requerida), 404 (no
   *          encontrada) o 500.
   */
  actualizarNotaEjercicio: async (req, res) => {
    try {
      const result = await AfiliadoService.actualizarNotaEjercicio(req.user.sub, req.params.id_nota, req.body.nota);
      return res.json(result);
    } catch (err) {
      if (err.message && err.message.includes('nota es requerida'))
        return res.status(400).json({ error: err.message });
      if (err.code === 'NO_ENCONTRADO')
        return res.status(404).json({ error: err.message });
      console.error('[afiliadoController.actualizarNotaEjercicio]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * DELETE /afiliados/me/notas-ejercicio/:id_nota — elimina una nota propia.
   *
   * @param {Object} req - Request de Express (req.user.sub, params: id_nota)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200, 404 (no encontrada) o 500.
   */
  eliminarNotaEjercicio: async (req, res) => {
    try {
      const result = await AfiliadoService.eliminarNotaEjercicio(req.user.sub, req.params.id_nota);
      return res.json(result);
    } catch (err) {
      if (err.code === 'NO_ENCONTRADO')
        return res.status(404).json({ error: err.message });
      console.error('[afiliadoController.eliminarNotaEjercicio]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /afiliados/:id/notas-ejercicio — lista las notas de ejercicios de un
   * afiliado específico (uso del staff para revisar el feedback del cliente).
   *
   * @param {Object} req - Request de Express (params: id)
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Responde 200 con la lista o 500.
   */
  getNotasEjercicioAfiliado: async (req, res) => {
    try {
      const result = await AfiliadoService.getNotasEjercicioDeAfiliado(req.params.id);
      return res.json(result);
    } catch (err) {
      console.error('[afiliadoController.getNotasEjercicioAfiliado]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = AfiliadoController;
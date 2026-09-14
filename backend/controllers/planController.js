// backend/controllers/planController.js
// ─── Planes de entrenamiento y nutricionales (web staff) ─────
// Controlador HTTP de los planes: delega en PlanModel y traduce errores SQL
// a respuestas de negocio. Patrón BUG-010: todos los catch registran el error
// con console.error (tag del controlador) y devuelven mensaje genérico al
// cliente; solo se exponen errores específicos (duplicados de PK, checks).
// Hardened: BUG-010 — todos los catch ahora usan log interno + mensaje genérico al cliente.
'use strict';
const PlanModel = require('../models/planModel');
const { enviarPushAUsuarioDelCiclo } = require('../services/pushService');

const PlanController = {

  // ── PLAN ENTRENAMIENTO ────────────────────────────────────
  /**
   * GET /planes/entrenamiento/:id_ciclo — Devuelve el plan de entrenamiento de
   * un ciclo (rutinas + ejercicios) para la vista de Rutinas. 404 si el ciclo
   * no tiene plan.
   *
   * @param {Object} req - Express request (params.id_ciclo)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con el plan completo o 404/500.
   */
  getEntrenamiento: async (req, res) => {
    try {
      const plan = await PlanModel.getEntrenamientoByCiclo(req.params.id_ciclo);
      if (!plan) return res.status(404).json({ error: 'Plan de entrenamiento no encontrado para este ciclo' });
      res.json(plan);
    } catch (err) {
      console.error('[planController.getEntrenamiento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /planes/entrenamiento/:id_ciclo/rutina/dia/:dia_numero — FASE A.3:
   * rutina de un día filtrada por su grupo muscular. Valida primero el rango
   * 1-7 del día (fuera de rango no es un problema del servidor, es petición
   * inválida). El grupo muscular opcional `?grupo_muscular=` viaja al modelo.
   *
   * @param {Object} req - Express request (params.id_ciclo, params.dia_numero;
   *                       query.grupo_muscular opcional)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con la rutina del día, 400 si día inválido,
   *                          404 si no hay rutina o 500.
   */
  getRutinaDiaria: async (req, res) => {
    const diaNumero = parseInt(req.params.dia_numero, 10);
    if (!Number.isInteger(diaNumero) || diaNumero < 1 || diaNumero > 7) {
      return res.status(400).json({ error: 'dia_numero debe estar entre 1 y 7' });
    }
    try {
      const rutina = await PlanModel.getRutinaDiaria(
        req.params.id_ciclo, diaNumero, req.query.grupo_muscular
      );
      if (!rutina) {
        return res.status(404).json({ error: 'No hay rutina para ese día en este ciclo' });
      }
      res.json(rutina);
    } catch (err) {
      console.error('[planController.getRutinaDiaria]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /planes/entrenamiento — Crea el plan de entrenamiento de un ciclo.
   * El autor (req.user.sub) se toma del token JWT para la auditoría al
   * modificado_por. Después de crear, avisa al afiliado del ciclo por push
   * (fire-and-forget; un error de push no debe fallar el alta). ER_DUP_ENTRY
   * significa que el ciclo ya tenía plan (PK id_ciclo).
   *
   * @param {Object} req - Express request (body.id_ciclo requerido, body.observaciones)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 201 con el id, 400 si falta id_ciclo o ya hay plan, o 500.
   */
  createEntrenamiento: async (req, res) => {
    const { id_ciclo, observaciones } = req.body;
    if (!id_ciclo) return res.status(400).json({ error: 'id_ciclo es requerido' });
    try {
      const id = await PlanModel.createEntrenamiento(
        id_ciclo, req.user.sub, observaciones
      );
      // Notificación push al afiliado del ciclo (no bloquea la respuesta).
      enviarPushAUsuarioDelCiclo(id_ciclo, {
        title: '🏋️ Nueva rutina asignada',
        body: 'Tu entrenador te asignó un plan de entrenamiento. ¡A darle!',
        data: { screen: 'Rutina' },
      });
      res.status(201).json({ id_ciclo: id, message: 'Plan de entrenamiento creado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Este ciclo ya tiene un plan de entrenamiento' });
      console.error('[planController.createEntrenamiento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * PATCH /planes/entrenamiento/:id — Actualiza observaciones y autor del plan
   * de entrenamiento de un ciclo (auditoría con req.user.sub).
   *
   * @param {Object} req - Express request (params.id = id_ciclo, body)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 siempre (el modelo no valida existencia).
   */
  updateEntrenamiento: async (req, res) => {
    try {
      await PlanModel.updateEntrenamiento(req.params.id, req.body, req.user.sub);
      res.json({ message: 'Plan de entrenamiento actualizado' });
    } catch (err) {
      console.error('[planController.updateEntrenamiento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── RUTINAS ───────────────────────────────────────────────
  /**
   * POST /planes/rutinas — Crea una rutina (día) dentro del plan de un ciclo.
   * Valida dia_numero 1-7 en el controlador. ER_DUP_ENTRY = ya existe un día
   * con ese número en el ciclo (la PK real es id_ciclo+dia_numero).
   *
   * @param {Object} req - Express request (body.id_ciclo, nombre_rutina, dia_numero)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 201 con el id de rutina, 400 por validación o 500.
   */
  createRutina: async (req, res) => {
    const { id_ciclo, nombre_rutina, enfoque_muscular, dia_numero } = req.body;
    if (!id_ciclo || !nombre_rutina || !dia_numero)
      return res.status(400).json({ error: 'id_ciclo, nombre_rutina y dia_numero son requeridos' });
    if (dia_numero < 1 || dia_numero > 7)
      return res.status(400).json({ error: 'dia_numero debe estar entre 1 y 7' });
    try {
      const id = await PlanModel.createRutina(
        id_ciclo, nombre_rutina, enfoque_muscular, dia_numero
      );
      res.status(201).json({ id, message: 'Rutina creada correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: `Ya existe una rutina el día ${dia_numero} en este ciclo` });
      console.error('[planController.createRutina]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /planes/rutinas/:id_rutina/ejercicios — Agrega un ejercicio a la
   * rutina del día con sus series/repeticiones y posición (orden). ER_DUP_ENTRY
   * cubre tanto el ejercicio repetido como el orden ya ocupado.
   *
   * @param {Object} req - Express request (params.id_rutina; body.id_ejercicio,
   *                       series, repeticiones, orden requeridos)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 201, 400 (faltan campos o PK duplicada) o 500.
   */
  addEjercicio: async (req, res) => {
    const { id_ejercicio, series, repeticiones, orden } = req.body;
    if (!id_ejercicio || !series || !repeticiones || !orden)
      return res.status(400).json({ error: 'id_ejercicio, series, repeticiones y orden son requeridos' });
    try {
      await PlanModel.addEjercicioToRutina(
        req.params.id_rutina, id_ejercicio, series, repeticiones, orden
      );
      res.status(201).json({ message: 'Ejercicio añadido a la rutina' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ese ejercicio ya está en la rutina o ese orden ya existe' });
      console.error('[planController.addEjercicio]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * PATCH /planes/rutinas/:id_rutina/ejercicios/:id_ejercicio — Parte 2.
   * Actualiza la configuración del ejercicio (series, repeticiones y
   * opcionalmente peso_kg/descanso_seg) dentro de la rutina, y si llega
   * `descripcion` además actualiza el instructivo del ejercicio en el catálogo
   * (cambio maestro que se refleja en todos los planes). Convierte los números
   * a Number porque vienen como strings del body. 404 si la fila de la rutina
   * no existe y no hubo descripcion; ER_CHECK_CONSTRAINT_VIOLATED si algún
   * valor rompe los CHECKs del schema.
   *
   * @param {Object} req - Express request (params.id_rutina, params.id_ejercicio;
   *                       body.series/repeticiones/peso_kg/descanso_seg/descripcion)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 400 (sin campos o CHECK violado) o 404/500.
   */
  updateEjercicio: async (req, res) => {
    const { id_rutina, id_ejercicio } = req.params;
    const { series, repeticiones, descripcion, peso_kg, descanso_seg } = req.body;
    if (series === undefined && repeticiones === undefined && descripcion === undefined
        && peso_kg === undefined && descanso_seg === undefined) {
      return res.status(400).json({ error: 'Envía al menos series, repeticiones, peso_kg, descanso_seg o descripcion' });
    }
    try {
      let affected = 0;
      if (series !== undefined || repeticiones !== undefined || peso_kg !== undefined || descanso_seg !== undefined) {
        affected = await PlanModel.updateEjercicioEnRutina(id_rutina, id_ejercicio, {
          series:       series       !== undefined ? Number(series)       : undefined,
          repeticiones: repeticiones !== undefined ? Number(repeticiones) : undefined,
          peso_kg:      peso_kg      !== undefined ? Number(peso_kg)      : undefined,
          descanso_seg: descanso_seg !== undefined ? Number(descanso_seg) : undefined,
        });
      }
      if (descripcion !== undefined) {
        await PlanModel.updateDescripcionEjercicio(id_ejercicio, descripcion);
      }
      if (affected === 0 && descripcion === undefined) {
        return res.status(404).json({ error: 'Ejercicio no encontrado en esa rutina' });
      }
      res.json({ message: 'Ejercicio actualizado correctamente', affected });
    } catch (err) {
      if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
        return res.status(400).json({ error: 'series, repeticiones, peso_kg o descanso_seg inválidos' });
      }
      console.error('[planController.updateEjercicio]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * DELETE /planes/rutinas/:id_rutina/ejercicios/:id_ejercicio — Quita un
   * ejercicio de la rutina del día. 404 si el ejercicio no estaba en la rutina.
   *
   * @param {Object} req - Express request (params.id_rutina, params.id_ejercicio)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con filas afectadas, 404 o 500.
   */
  removeEjercicio: async (req, res) => {
    try {
      const affected = await PlanModel.removeEjercicioFromRutina(
        req.params.id_rutina, req.params.id_ejercicio
      );
      if (affected === 0) {
        return res.status(404).json({ error: 'Ejercicio no encontrado en esa rutina' });
      }
      res.json({ message: 'Ejercicio eliminado de la rutina', affected });
    } catch (err) {
      console.error('[planController.removeEjercicio]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * DELETE /planes/rutinas/:id_rutina — Elimina la rutina + sus ejercicios en
   * transacción (PlanModel.deleteRutina). 200, aunque no exista (idempotente).
   *
   * @param {Object} req - Express request (params.id_rutina)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 o 500.
   */
  deleteRutina: async (req, res) => {
    try {
      await PlanModel.deleteRutina(req.params.id_rutina);
      res.json({ message: 'Rutina eliminada correctamente' });
    } catch (err) {
      console.error('[planController.deleteRutina]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── PLAN NUTRICIONAL ──────────────────────────────────────
  /**
   * GET /planes/nutricional/:id_ciclo — Devuelve el plan nutricional de un
   * ciclo con el detalle de alimentos por comida. 404 si no tiene plan.
   *
   * @param {Object} req - Express request (params.id_ciclo)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 404 o 500.
   */
  getNutricional: async (req, res) => {
    try {
      const plan = await PlanModel.getNutricionalByCiclo(req.params.id_ciclo);
      if (!plan) return res.status(404).json({ error: 'Plan nutricional no encontrado para este ciclo' });
      res.json(plan);
    } catch (err) {
      console.error('[planController.getNutricional]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /planes/nutricional — Crea el plan nutricional de un ciclo. Acepta
   * tanto los nombres de campos nuevos (calorias_objetivo/num_comidas) como
   * los legacy (calorias_estimadas/num_comidas_diarias) para no romper el
   * móvil. Autor tomado de req.user.sub; ER_DUP_ENTRY = el ciclo ya tenía plan.
   * Tras crear, avisa al afiliado por push (fire-and-forget).
   *
   * @param {Object} req - Express request (body.id_ciclo, calorias_objetivo,
   *                       num_comidas requeridos)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 201, 400 o 500.
   */
  createNutricional: async (req, res) => {
    // Acepta tanto nombres nuevos (calorias_objetivo/num_comidas) como legacy
    const id_ciclo          = req.body.id_ciclo;
    const calorias_objetivo = req.body.calorias_objetivo || req.body.calorias_estimadas;
    const num_comidas       = req.body.num_comidas || req.body.num_comidas_diarias;
    const observaciones     = req.body.observaciones;

    if (!id_ciclo || !calorias_objetivo || !num_comidas)
      return res.status(400).json({ error: 'id_ciclo, calorias_objetivo y num_comidas son requeridos' });
    try {
      const id = await PlanModel.createNutricional(
        id_ciclo, calorias_objetivo, num_comidas, req.user.sub, observaciones
      );
      // Notificación push al afiliado (no bloquea la respuesta).
      enviarPushAUsuarioDelCiclo(id_ciclo, {
        title: '🥗 Nueva dieta asignada',
        body: 'Tu nutricionista te asignó un plan de alimentación. ¡A comer rico y sano!',
        data: { screen: 'Dieta' },
      });
      res.status(201).json({ id_ciclo: id, message: 'Plan nutricional creado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Este ciclo ya tiene un plan nutricional' });
      console.error('[planController.createNutricional]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * PATCH /planes/nutricional/:id — Actualiza calorías objetivo, número de
   * comidas y observaciones. Igual que create, acepta campos legacy; valida
   * que lleguen las dos métricas obligatorias.
   *
   * @param {Object} req - Express request (params.id = id_ciclo; body)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 400 o 500.
   */
  updateNutricional: async (req, res) => {
    const calorias_objetivo = req.body.calorias_objetivo || req.body.calorias_estimadas;
    const num_comidas       = req.body.num_comidas || req.body.num_comidas_diarias;
    const observaciones     = req.body.observaciones;
    if (!calorias_objetivo || !num_comidas)
      return res.status(400).json({ error: 'calorias_objetivo y num_comidas son requeridos' });
    try {
      await PlanModel.updateNutricional(
        req.params.id, { calorias_objetivo, num_comidas, observaciones }, req.user.sub
      );
      res.json({ message: 'Plan nutricional actualizado' });
    } catch (err) {
      console.error('[planController.updateNutricional]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /planes/nutricional/:id_plan/detalle — Agrega un alimento a una comida
   * del plan con su peso en gramos. El :id_plan es en realidad el id_ciclo.
   * Acepta campos legacy (numero_comida/cantidad). ER_DUP_ENTRY = la comida ya
   * tenía ese alimento (PK natural triple).
   *
   * @param {Object} req - Express request (params.id_plan; body.id_alimento,
   *                       num_comida, cantidad_g requeridos)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 201, 400 o 500.
   */
  addAlimento: async (req, res) => {
    // Acepta tanto nombres nuevos (num_comida/cantidad_g) como legacy
    const id_alimento = req.body.id_alimento;
    const num_comida  = req.body.num_comida  || req.body.numero_comida;
    const cantidad_g  = req.body.cantidad_g  || req.body.cantidad;
    if (!id_alimento || !num_comida || !cantidad_g)
      return res.status(400).json({ error: 'id_alimento, num_comida y cantidad_g son requeridos' });
    try {
      await PlanModel.addAlimentoToDetalle(
        req.params.id_plan, id_alimento, num_comida, cantidad_g
      );
      res.status(201).json({ message: 'Alimento añadido al plan nutricional' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ese alimento ya está en esa comida del plan' });
      console.error('[planController.addAlimento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * PATCH /planes/nutricional/:id_plan/detalle/:id_detalle — Parte 2.
   * Actualiza un alimento del plan: cambia cantidad_g (campo real del schema;
   * también acepta cantidad_gramos legacy) y/o MUEVE la fila a otra comida.
   * Para mover se requiere `num_comida_anterior` en el body: al ser num_comida
   * parte de la PK, el modelo hace DELETE+INSERT; el 409 se usa cuando el
   * alimento ya existe en la comida destino (PK duplicada en el INSERT).
   *
   * @param {Object} req - Express request (params.id_plan = id_ciclo,
   *                       params.id_detalle = id_alimento; body.cantidad_g,
   *                       body.num_comida, body.num_comida_anterior)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 400 (sin campos / CHECK), 404, 409 o 500.
   */
  updateDetalle: async (req, res) => {
    const { id_plan, id_detalle } = req.params;
    const cantidad_g = req.body.cantidad_g !== undefined ? req.body.cantidad_g
      : (req.body.cantidad_gramos !== undefined ? req.body.cantidad_gramos : undefined);
    const num_comida = req.body.num_comida;
    const num_comida_anterior = req.body.num_comida_anterior;
    if (cantidad_g === undefined && num_comida === undefined) {
      return res.status(400).json({ error: 'Envía cantidad_gramos y/o num_comida' });
    }
    try {
      const affected = await PlanModel.updateAlimentoEnDetalle(
        id_plan, id_detalle, { cantidad_g, num_comida, num_comida_anterior }
      );
      if (affected === 0) {
        return res.status(404).json({ error: 'Alimento no encontrado en ese plan' });
      }
      res.json({ message: 'Detalle nutricional actualizado', affected });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(409).json({ error: 'Ese alimento ya está en la comida destino' });
      if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED')
        return res.status(400).json({ error: 'cantidad_g debe ser mayor a 0' });
      console.error('[planController.updateDetalle]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * DELETE /planes/nutricional/:id_plan/detalle/:id_detalle — Parte 2. Quita
   * un alimento del detalle. Si el body trae `num_comida` borra solo esa fila
   * de la comida; si no, todas las apariciones del alimento en el plan.
   * 404 si no había ninguna fila que coincidiera.
   *
   * @param {Object} req - Express request (params.id_plan = id_ciclo,
   *                       params.id_detalle = id_alimento; body.num_comida opcional)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 404 o 500.
   */
  removeDetalle: async (req, res) => {
    const { id_plan, id_detalle } = req.params;
    try {
      const affected = await PlanModel.removeAlimentoDeDetalle(
        id_plan, id_detalle, req.body.num_comida
      );
      if (affected === 0) {
        return res.status(404).json({ error: 'Alimento no encontrado en ese plan' });
      }
      res.json({ message: 'Alimento eliminado del plan nutricional', affected });
    } catch (err) {
      console.error('[planController.removeDetalle]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = PlanController;
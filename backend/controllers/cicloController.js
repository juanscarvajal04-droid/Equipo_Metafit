// controllers/cicloController.js
// Parte 1: CRUD completo de ciclos — PATCH/DELETE /ciclos/:id_ciclo.
// Reutiliza AfiliadoService (misma lógica de negocio que /afiliados/*/ciclos).
'use strict';

const AfiliadoService = require('../services/afiliadoService');

const CicloController = {

  // PATCH /ciclos/:id_ciclo (Admin o Entrenador)
  updateCiclo: async (req, res) => {
    try {
      const ok = await AfiliadoService.updateCiclo(req.params.id_ciclo, req.body);
      if (!ok) return res.status(404).json({ error: 'Ciclo no encontrado' });
      return res.json({ message: 'Ciclo actualizado correctamente' });
    } catch (err) {
      if (err.code === 'NO_ENCONTRADO') {
        return res.status(404).json({ error: err.message });
      }
      if (err.code === 'DATOS_INVALIDOS') {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ya existe un ciclo con esa fecha de inicio para este afiliado' });
      }
      if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
        return res.status(400).json({ error: 'Los datos violan las restricciones del ciclo (fechas o disponibilidad)' });
      }
      console.error('[cicloController.updateCiclo]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // DELETE /ciclos/:id_ciclo (solo Admin) — borrado en cascada explícito
  deleteCiclo: async (req, res) => {
    try {
      const ok = await AfiliadoService.deleteCiclo(req.params.id_ciclo);
      if (!ok) return res.status(404).json({ error: 'Ciclo no encontrado' });
      return res.json({ message: 'Ciclo eliminado correctamente' });
    } catch (err) {
      if (err.code === 'NO_ENCONTRADO') {
        return res.status(404).json({ error: err.message });
      }
      console.error('[cicloController.deleteCiclo]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = CicloController;
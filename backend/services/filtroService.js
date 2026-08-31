// backend/services/filtroService.js
// FASE 1: filtrado de catálogos por restricciones del afiliado + filtros opcionales del cliente.
// Reutiliza la lógica real de exclusión de CatalogoModel (EJERCICIO_RESTRICCION_EXCLUIDA /
// ALIMENTO_RESTRICCION_EXCLUIDA vía AFILIADO_RESTRICCION) en lugar del mapeo por keywords del borrador.
'use strict';

const pool = require('../config/db');
const CatalogoModel = require('../models/catalogoModel');

const FiltroService = {

  // Ejercicios permitidos para el afiliado, con filtro opcional de grupo muscular.
  async getEjerciciosFiltrados(id_usuario, { grupo_muscular } = {}) {
    let ejercicios = await CatalogoModel.getEjerciciosDisponibles(id_usuario);
    if (grupo_muscular) {
      const g = String(grupo_muscular).trim();
      ejercicios = ejercicios.filter(e => e.grupo_muscular && e.grupo_muscular.toLowerCase() === g.toLowerCase());
    }
    return ejercicios;
  },

  // Alimentos permitidos para el afiliado, enriquecidos con calorías por 100 g
  // (vista v_alimento_calorias) y con filtros opcionales de macro-nutrientes.
  async getAlimentosFiltrados(id_usuario, { max_kcal, min_proteinas } = {}) {
    const base = await CatalogoModel.getAlimentosDisponibles(id_usuario);
    if (!base.length) return [];

    const ids = base.map(a => a.id_alimento);
    const [calorias] = await pool.query(
      'SELECT id_alimento, calorias_por_100g FROM v_alimento_calorias WHERE id_alimento IN (?)',
      [ids]
    );
    const kcalMap = new Map(calorias.map(c => [c.id_alimento, c.calorias_por_100g]));

    let alimentos = base.map(a => ({
      ...a,
      calorias_por_100g: kcalMap.get(a.id_alimento) || null,
    }));

    if (max_kcal != null) {
      alimentos = alimentos.filter(a => a.calorias_por_100g == null || a.calorias_por_100g <= Number(max_kcal));
    }
    if (min_proteinas != null) {
      alimentos = alimentos.filter(a => a.proteinas >= Number(min_proteinas));
    }
    return alimentos;
  },
};

module.exports = FiltroService;
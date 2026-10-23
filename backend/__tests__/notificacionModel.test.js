'use strict';

// Tests unitarios de NotificacionModel: notificaciones por rol.

jest.mock('../config/db', () => ({ query: jest.fn() }));

const pool = require('../config/db');
const Model = require('../models/notificacionModel');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('notificacionModel.getByRole', () => {
  test('rol desconocido devuelve array vacío sin consultar', async () => {
    await expect(Model.getByRole('Afiliado')).resolves.toEqual([]);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('Administrador devuelve 3 notificaciones', async () => {
    pool.query
      .mockResolvedValueOnce([[{ membresias: 4 }]])
      .mockResolvedValueOnce([[{ nuevos: 2 }]])
      .mockResolvedValueOnce([[{ pendientes: 1 }]]);

    const res = await Model.getByRole('Administrador');
    expect(res).toHaveLength(3);
    expect(res.map((n) => n.tipo)).toEqual([
      'membresias_por_vencer',
      'nuevos_afiliados',
      'personal_pendiente',
    ]);
    expect(res[0].cantidad).toBe(4);
    expect(res.every((n) => n.ruta)).toBe(true);
  });

  test('Recepcionista devuelve 4 notificaciones', async () => {
    pool.query
      .mockResolvedValueOnce([[{ pagosHoy: 3 }]])
      .mockResolvedValueOnce([[{ vencidos: 2 }]])
      .mockResolvedValueOnce([[{ cumples: 1 }]])
      .mockResolvedValueOnce([[{ nuevos: 5 }]]);

    const res = await Model.getByRole('Recepcionista');
    expect(res).toHaveLength(4);
    expect(res.map((n) => n.tipo)).toEqual([
      'pagos_hoy',
      'pagos_vencidos',
      'cumpleaños_mes',
      'bienvenida_nuevos',
    ]);
    expect(res[3].cantidad).toBe(5);
  });

  test('Entrenador devuelve 4 notificaciones', async () => {
    pool.query
      .mockResolvedValueOnce([[{ sin_plan: 2 }]])
      .mockResolvedValueOnce([[{ estancados: 3 }]])
      .mockResolvedValueOnce([[{ activos: 8 }]])
      .mockResolvedValueOnce([[{ con_restricciones: 4 }]]);

    const res = await Model.getByRole('Entrenador');
    expect(res).toHaveLength(4);
    expect(res.map((n) => n.tipo)).toEqual([
      'sin_plan',
      'progreso_estancado',
      'ciclos_activos',
      'con_restricciones',
    ]);
    expect(res[1].cantidad).toBe(3);
  });
});

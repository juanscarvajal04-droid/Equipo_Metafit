'use strict';

// Tests unitarios de AfiliadoModel: reensamblado sin N+1, detalle, CRUD y
// actualizaciones transaccionales. Pool y bcrypt mockeados.

jest.mock('../config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));
jest.mock('../middlewares/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hash-bcrypt'),
}));

const pool = require('../config/db');
const AfiliadoModel = require('../models/afiliadoModel');
const { hashPassword } = require('../middlewares/auth');

function makeConn() {
  return {
    query: jest.fn(),
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('afiliadoModel.findAll', () => {
  test('devuelve [] y solo consulta afiliados cuando no hay resultados', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(AfiliadoModel.findAll()).resolves.toEqual([]);
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query.mock.calls[0][1]).toEqual([50, 0]);
  });

  test('respeta paginación y reensambla restricciones, ciclo, planes y progreso', async () => {
    pool.query
      .mockResolvedValueOnce([[
        { id_usuario: 1, nombres: 'Ana', estatura_cm: 165 },
        { id_usuario: 2, nombres: 'Luis', estatura_cm: 175 },
      ]])
      .mockResolvedValueOnce([[
        { id_usuario: 1, id_restriccion: 5, nombre_restriccion: 'Lactosa' },
      ]])
      .mockResolvedValueOnce([[
        {
          id_ciclo: 10,
          id_usuario: 1,
          activo: 1,
          objetivo_fisico: 'Fuerza',
          nivel_experiencia: 'Intermedio',
          disponibilidad_dias: 4,
          grupo_muscular_prioritario: 'Pierna',
          numero_ciclo: 2,
          plan_entrenamiento_id: 10,
          plan_observaciones: 'obs',
          calorias_objetivo: 2000,
          num_comidas: 5,
          plan_nutricional_obs: null,
          recomendacion_agua_vasos: 8,
        },
      ]])
      .mockResolvedValueOnce([[
        { id_ciclo: 10, peso_kg: 60, imc: 22.04 },
      ]]);

    const res = await AfiliadoModel.findAll({ page: 2, limit: 10 });

    expect(pool.query.mock.calls[0][1]).toEqual([10, 10]);
    expect(res).toHaveLength(2);

    const ana = res[0];
    expect(ana.restricciones).toEqual([
      { id_usuario: 1, id_restriccion: 5, nombre_restriccion: 'Lactosa' },
    ]);
    expect(ana.ciclo_activo.numero_ciclo).toBe(2);
    expect(ana.ciclo_activo.plan_entrenamiento).toEqual({ observaciones: 'obs' });
    expect(ana.ciclo_activo.plan_nutricional).toEqual({
      calorias_estimadas: 2000,
      num_comidas_diarias: 5,
      observaciones: null,
      recomendacion_agua_vasos: 8,
    });
    expect(ana.ciclo_activo.ultimo_progreso).toEqual({ id_ciclo: 10, peso_kg: 60, imc: 22.04 });
    expect(ana.objetivo_fisico).toBe('Fuerza');
    expect(ana.disponibilidad_semanal_dias).toBe(4);

    const luis = res[1];
    expect(luis.restricciones).toEqual([]);
    expect(luis.ciclo_activo).toBeNull();
    expect(luis.objetivo_fisico).toBeNull();
  });

  test('omite la query de progreso si no hay ciclos activos', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_usuario: 3 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);

    const res = await AfiliadoModel.findAll();
    expect(res[0].ciclo_activo).toBeNull();
    expect(pool.query).toHaveBeenCalledTimes(3);
  });

  test('ciclo sin plan de entrenamiento ni nutricional deja ambos en null', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_usuario: 1 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[
        {
          id_ciclo: 10,
          id_usuario: 1,
          plan_entrenamiento_id: null,
          calorias_objetivo: null,
        },
      ]])
      .mockResolvedValueOnce([[]]);

    const res = await AfiliadoModel.findAll();
    expect(res[0].ciclo_activo.plan_entrenamiento).toBeNull();
    expect(res[0].ciclo_activo.plan_nutricional).toBeNull();
  });
});

describe('afiliadoModel.findById', () => {
  test('devuelve null si no existe', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(AfiliadoModel.findById(99)).resolves.toBeNull();
  });

  test('incluye restricciones y ciclo activo', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_usuario: 1, nombres: 'Ana' }]])
      .mockResolvedValueOnce([[{ id_restriccion: 5, nombre_restriccion: 'Lactosa' }]]);
    jest.spyOn(AfiliadoModel, '_getCicloActivo').mockResolvedValue({ id_ciclo: 10 });

    const res = await AfiliadoModel.findById(1);
    expect(res.restricciones).toEqual([{ id_restriccion: 5, nombre_restriccion: 'Lactosa' }]);
    expect(res.ciclo_activo).toEqual({ id_ciclo: 10 });
    expect(AfiliadoModel._getCicloActivo).toHaveBeenCalledWith(1);
  });
});

describe('afiliadoModel._getCicloActivo', () => {
  test('devuelve null sin ciclo activo', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(AfiliadoModel._getCicloActivo(1)).resolves.toBeNull();
  });

  test('carga plan de entrenamiento, nutricional y progreso', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_ciclo: 10, id_usuario: 1 }]])
      .mockResolvedValueOnce([[{ id_ciclo: 10, observaciones: 'pe' }]])
      .mockResolvedValueOnce([[
        {
          id_rutina: 1,
          ejercicios: JSON.stringify([
            { id_ejercicio: 2, orden: 2 },
            null,
            { id_ejercicio: 1, orden: 1 },
          ]),
        },
      ]])
      .mockResolvedValueOnce([[{ id_ciclo: 10, calorias_objetivo: 2100, num_comidas: 5 }]])
      .mockResolvedValueOnce([[{ num_comida: 1, nombre_alimento: 'Arroz' }]])
      .mockResolvedValueOnce([[{ peso_kg: 60 }]]);

    const ciclo = await AfiliadoModel._getCicloActivo(1);
    expect(ciclo.plan_entrenamiento.id_ciclo).toBe(10);
    expect(ciclo.plan_entrenamiento.rutinas[0].ejercicios.map((e) => e.id_ejercicio)).toEqual([1, 2]);
    expect(ciclo.plan_nutricional.calorias_estimadas).toBe(2100);
    expect(ciclo.plan_nutricional.num_comidas_diarias).toBe(5);
    expect(ciclo.plan_nutricional.detalle).toHaveLength(1);
    expect(ciclo.progreso_fisico).toEqual([{ peso_kg: 60 }]);
  });

  test('sin plan de entrenamiento ni nutricional no agrega esas claves', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_ciclo: 10 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);

    const ciclo = await AfiliadoModel._getCicloActivo(1);
    expect(ciclo.plan_entrenamiento).toBeUndefined();
    expect(ciclo.plan_nutricional).toBeUndefined();
    expect(ciclo.progreso_fisico).toEqual([]);
  });

  test('parsea JSON en string y ejercicios ya array', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_ciclo: 10 }]])
      .mockResolvedValueOnce([[{}]])
      .mockResolvedValueOnce([[
        { id_rutina: 1, ejercicios: '[{"id_ejercicio":1,"orden":2},{"id_ejercicio":2,"orden":1}]' },
        { id_rutina: 2, ejercicios: [{ id_ejercicio: 3, orden: 1 }] },
        { id_rutina: 3, ejercicios: null },
      ]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);

    const ciclo = await AfiliadoModel._getCicloActivo(1);
    expect(ciclo.plan_entrenamiento.rutinas[0].ejercicios.map((e) => e.id_ejercicio)).toEqual([2, 1]);
    expect(ciclo.plan_entrenamiento.rutinas[1].ejercicios).toHaveLength(1);
    expect(ciclo.plan_entrenamiento.rutinas[2].ejercicios).toEqual([]);
  });
});

describe('afiliadoModel.create', () => {
  test('genera contraseña temporal, normaliza fecha y estado, y hace commit', async () => {
    const conn = makeConn();
    conn.query
      .mockResolvedValueOnce([{ insertId: 7 }])
      .mockResolvedValueOnce([{}]);
    pool.getConnection.mockResolvedValue(conn);

    const res = await AfiliadoModel.create({
      nombres: 'Ana',
      apellidos: 'Pérez',
      correo: 'ana@metafit.com',
      documento: '123',
      fecha_nacimiento: '2000-05-20T00:00:00.000Z',
      estatura_cm: '165.5',
      estado: 'Inactivo',
    }, 99);

    expect(res).toEqual({ id_usuario: 7, password_temporal: 'MF_123@2025' });
    expect(hashPassword).toHaveBeenCalledWith('MF_123@2025');
    expect(conn.query.mock.calls[0][1]).toEqual([
      'Ana',
      'Pérez',
      'ana@metafit.com',
      'hash-bcrypt',
    ]);
    const afiliadoParams = conn.query.mock.calls[1][1];
    expect(afiliadoParams).toEqual([
      7,
      '123',
      '2000-05-20',
      'Masculino',
      '',
      '',
      165.5,
      'Inactivo',
      99,
    ]);
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('usa la contraseña provista (trim) y defaults', async () => {
    const conn = makeConn();
    conn.query
      .mockResolvedValueOnce([{ insertId: 8 }])
      .mockResolvedValueOnce([{}]);
    pool.getConnection.mockResolvedValue(conn);

    const res = await AfiliadoModel.create({
      nombres: 'Luis',
      documento: '9',
      contrasena: '  secreta  ',
      fecha_nacimiento: '1990-01-02 10:00:00',
      estatura_cm: 'abc',
    }, 1);

    expect(res.password_temporal).toBe('secreta');
    expect(hashPassword).toHaveBeenCalledWith('secreta');
    expect(conn.query.mock.calls[1][1][2]).toBe('1990-01-02');
    expect(conn.query.mock.calls[1][1][6]).toBeNull();
    expect(conn.query.mock.calls[1][1][7]).toBe('Activo');
  });

  test('hace rollback si falla la transacción', async () => {
    const conn = makeConn();
    conn.query.mockRejectedValueOnce(new Error('duplicado'));
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.create({
      nombres: 'Ana',
      documento: '123',
      contrasena: 'x',
    })).rejects.toThrow('duplicado');
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });
});

describe('afiliadoModel.update', () => {
  test('devuelve 0 sin campos permitidos', async () => {
    await expect(AfiliadoModel.update(1, { foo: 'bar' })).resolves.toBe(0);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('mapea estado a estado_afiliacion y actualiza ambas tablas', async () => {
    const conn = makeConn();
    conn.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    pool.getConnection.mockResolvedValue(conn);

    const affected = await AfiliadoModel.update(1, {
      estado: 'Inactivo',
      telefono: '300',
      nombres: 'Ana',
      correo: 'ana@metafit.com',
    });

    expect(affected).toBe(1);
    expect(conn.query.mock.calls[0][0]).toContain('estado_afiliacion=?');
    expect(conn.query.mock.calls[0][0]).toContain('telefono=?');
    expect(conn.query.mock.calls[1][0]).toContain('nombres=?');
    expect(conn.query.mock.calls[1][0]).toContain('correo=?');
    expect(conn.commit).toHaveBeenCalled();
  });

  test('usa affectedRows de USUARIO cuando no hay campos de AFILIADO', async () => {
    const conn = makeConn();
    conn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.update(1, { correo: 'nuevo@metafit.com' })).resolves.toBe(1);
    expect(conn.query).toHaveBeenCalledTimes(1);
  });

  test('hace rollback ante error', async () => {
    const conn = makeConn();
    conn.query.mockRejectedValueOnce(new Error('db'));
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.update(1, { telefono: '300' })).rejects.toThrow('db');
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });
});

describe('afiliadoModel.updateMe', () => {
  test('devuelve 0 sin campos', async () => {
    await expect(AfiliadoModel.updateMe(1, {})).resolves.toBe(0);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('actualiza AFILIADO con fecha_ultima_modificacion y USUARIO', async () => {
    const conn = makeConn();
    conn.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.updateMe(1, {
      telefono: '300',
      direccion: 'Calle 1',
      estatura_cm: 165,
      correo: 'ana@metafit.com',
    })).resolves.toBe(true);

    expect(conn.query.mock.calls[0][0]).toContain('fecha_ultima_modificacion = NOW()');
    expect(conn.query.mock.calls[1][0]).toContain('correo=?');
    expect(conn.commit).toHaveBeenCalled();
  });

  test('solo correo usa affectedRows de USUARIO', async () => {
    const conn = makeConn();
    conn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.updateMe(1, { correo: 'x@y.com' })).resolves.toBe(true);
    expect(conn.query).toHaveBeenCalledTimes(1);
  });

  test('registra peso en el ciclo activo', async () => {
    const conn = makeConn();
    conn.query
      .mockResolvedValueOnce([[{ id_ciclo: 10 }]])
      .mockResolvedValueOnce([{}]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.updateMe(1, { peso_kg: 70 })).resolves.toBe(true);
    expect(conn.query.mock.calls[0][0]).toContain('FROM CICLO');
    expect(conn.query.mock.calls[1][0]).toContain('INSERT INTO PROGRESO_FISICO');
    expect(conn.query.mock.calls[1][1]).toEqual([10, 70, 1]);
    expect(conn.commit).toHaveBeenCalled();
  });

  test('lanza SIN_CICLO_ACTIVO y hace rollback si no hay ciclo', async () => {
    const conn = makeConn();
    conn.query.mockResolvedValueOnce([[]]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.updateMe(1, { peso_kg: 70 })).rejects.toMatchObject({
      code: 'SIN_CICLO_ACTIVO',
    });
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('hace rollback ante error genérico', async () => {
    const conn = makeConn();
    conn.query.mockRejectedValueOnce(new Error('db'));
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.updateMe(1, { telefono: '300' })).rejects.toThrow('db');
    expect(conn.rollback).toHaveBeenCalled();
  });
});

describe('afiliadoModel getMeData / foto', () => {
  test('getMeData devuelve la fila o null', async () => {
    pool.query.mockResolvedValueOnce([[{ id_usuario: 1, peso_kg: 70 }]]);
    await expect(AfiliadoModel.getMeData(1)).resolves.toEqual({ id_usuario: 1, peso_kg: 70 });

    pool.query.mockResolvedValueOnce([[]]);
    await expect(AfiliadoModel.getMeData(99)).resolves.toBeNull();
  });

  test('getFoto devuelve la foto o null', async () => {
    pool.query.mockResolvedValueOnce([[{ foto: '/uploads/a.jpg' }]]);
    await expect(AfiliadoModel.getFoto(1)).resolves.toBe('/uploads/a.jpg');

    pool.query.mockResolvedValueOnce([[]]);
    await expect(AfiliadoModel.getFoto(99)).resolves.toBeNull();
  });

  test('setFoto devuelve true/false según affectedRows', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(AfiliadoModel.setFoto(1, '/uploads/a.jpg')).resolves.toBe(true);

    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    await expect(AfiliadoModel.setFoto(99, '/uploads/a.jpg')).resolves.toBe(false);
  });
});

describe('afiliadoModel.delete', () => {
  test('elimina AFILIADO y USUARIO en transacción', async () => {
    const conn = makeConn();
    conn.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.delete(1)).resolves.toBe(1);
    expect(conn.query.mock.calls[1][0]).toContain('DELETE FROM USUARIO');
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('no borra USUARIO si el afiliado no existía', async () => {
    const conn = makeConn();
    conn.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.delete(99)).resolves.toBe(0);
    expect(conn.query).toHaveBeenCalledTimes(1);
  });

  test('hace rollback si una FK impide el borrado', async () => {
    const conn = makeConn();
    conn.query.mockRejectedValueOnce(new Error('ER_ROW_IS_REFERENCED_2'));
    pool.getConnection.mockResolvedValue(conn);

    await expect(AfiliadoModel.delete(1)).rejects.toThrow('ER_ROW_IS_REFERENCED_2');
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });
});

'use strict';

// Tests de middlewares/auth.js: JWT, RBAC y propiedad de ciclo.

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

jest.mock('../models/cicloModel', () => ({
  findById: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const CicloModel = require('../models/cicloModel');
const {
  requireAuth,
  requireAdmin,
  requireAdminOrEntrenador,
  requireAdminOrRecepcionista,
  requireStaff,
  requireOwnCiclo,
} = require('../middlewares/auth');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function token(payload, options = { expiresIn: '1h' }) {
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('requireAuth', () => {
  test('rechaza sin header o con esquema distinto', () => {
    let res = makeRes();
    requireAuth({ headers: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token requerido' });

    res = makeRes();
    requireAuth({ headers: { authorization: 'Basic abc' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('adjunta el payload y llama next con token válido', () => {
    const req = { headers: { authorization: `Bearer ${token({ sub: 1, role: 'Administrador' })}` } };
    const next = jest.fn();
    requireAuth(req, makeRes(), next);

    expect(next).toHaveBeenCalled();
    expect(req.user.sub).toBe(1);
    expect(req.user.role).toBe('Administrador');
  });

  test('distingue token inválido de expirado', () => {
    let res = makeRes();
    requireAuth({ headers: { authorization: 'Bearer no-es-jwt' } }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido' });

    const expired = jwt.sign(
      { sub: 1 },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );
    res = makeRes();
    requireAuth({ headers: { authorization: `Bearer ${expired}` } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expirado' });
  });
});

describe('middlewares de rol', () => {
  test('requireAdmin exige autenticación y rol Administrador', () => {
    let res = makeRes();
    requireAdmin({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);

    res = makeRes();
    requireAdmin({ user: { role: 'Entrenador' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);

    const next = jest.fn();
    requireAdmin({ user: { role: 'Administrador' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('requireAdminOrEntrenador permite ambos roles', () => {
    let res = makeRes();
    requireAdminOrEntrenador({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);

    res = makeRes();
    requireAdminOrEntrenador({ user: { role: 'Afiliado' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);

    for (const role of ['Administrador', 'Entrenador']) {
      const next = jest.fn();
      requireAdminOrEntrenador({ user: { role } }, makeRes(), next);
      expect(next).toHaveBeenCalled();
    }
  });

  test('requireAdminOrRecepcionista permite ambos roles', () => {
    let res = makeRes();
    requireAdminOrRecepcionista({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);

    res = makeRes();
    requireAdminOrRecepcionista({ user: { role: 'Entrenador' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);

    for (const role of ['Administrador', 'Recepcionista']) {
      const next = jest.fn();
      requireAdminOrRecepcionista({ user: { role } }, makeRes(), next);
      expect(next).toHaveBeenCalled();
    }
  });

  test('requireStaff permite admin, entrenador y recepcionista', () => {
    let res = makeRes();
    requireStaff({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);

    res = makeRes();
    requireStaff({ user: { role: 'Afiliado' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);

    for (const role of ['Administrador', 'Entrenador', 'Recepcionista']) {
      const next = jest.fn();
      requireStaff({ user: { role } }, makeRes(), next);
      expect(next).toHaveBeenCalled();
    }
  });
});

describe('requireOwnCiclo', () => {
  test('exige autenticación', async () => {
    const res = makeRes();
    await requireOwnCiclo({ params: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('admin y entrenador pasan sin consultar el ciclo', async () => {
    for (const role of ['Administrador', 'Entrenador']) {
      const next = jest.fn();
      await requireOwnCiclo({ user: { role, sub: 1 }, params: {} }, makeRes(), next);
      expect(next).toHaveBeenCalled();
    }
    expect(CicloModel.findById).not.toHaveBeenCalled();
  });

  test('exige id_ciclo para afiliados', async () => {
    const res = makeRes();
    await requireOwnCiclo({ user: { role: 'Afiliado', sub: 1 }, params: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'id_ciclo es requerido' });
  });

  test('404 si el ciclo no existe', async () => {
    CicloModel.findById.mockResolvedValue(null);
    const res = makeRes();

    await requireOwnCiclo({
      user: { role: 'Afiliado', sub: 1 },
      params: { id_ciclo: 5 },
    }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Ciclo no encontrado' });
  });

  test('403 si el ciclo pertenece a otro usuario', async () => {
    CicloModel.findById.mockResolvedValue({ id_usuario: 2 });
    const res = makeRes();

    await requireOwnCiclo({
      user: { role: 'Afiliado', sub: 1 },
      params: { id_ciclo: 5 },
    }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Este ciclo no te pertenece' });
  });

  test('pasa si el ciclo es del afiliado', async () => {
    CicloModel.findById.mockResolvedValue({ id_usuario: 1 });
    const next = jest.fn();

    await requireOwnCiclo({
      user: { role: 'Afiliado', sub: 1 },
      params: { id_ciclo: 5 },
    }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  test('500 si el modelo falla', async () => {
    CicloModel.findById.mockRejectedValue(new Error('db'));
    const res = makeRes();

    await requireOwnCiclo({
      user: { role: 'Afiliado', sub: 1 },
      params: { id_ciclo: 5 },
    }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

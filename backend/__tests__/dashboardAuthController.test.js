'use strict';

// Tests de dashboardController y authController. Servicios, modelos,
// JWT/bcrypt, nodemailer y fetch están mockeados.

jest.mock('../models/catalogoModel', () => ({
  getDashboardKPIs: jest.fn(),
}));
jest.mock('../models/usuarioModel', () => ({
  findByEmail: jest.fn(),
}));
jest.mock('../models/passwordResetModel', () => ({
  invalidarAnteriores: jest.fn(),
  create: jest.fn(),
  findVigente: jest.fn(),
  marcarUsado: jest.fn(),
}));
jest.mock('../services/authService', () => ({
  signResetToken: jest.fn().mockReturnValue('reset-token'),
  verifyResetToken: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue('nuevo-hash'),
}));
jest.mock('../middlewares/auth', () => ({
  signJWT: jest.fn().mockReturnValue('jwt-token'),
  comparePassword: jest.fn(),
}));
jest.mock('../config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const CatalogoModel = require('../models/catalogoModel');
const UsuarioModel = require('../models/usuarioModel');
const PasswordResetModel = require('../models/passwordResetModel');
const AuthService = require('../services/authService');
const { signJWT, comparePassword } = require('../middlewares/auth');
const pool = require('../config/db');
const nodemailer = require('nodemailer');
const DashboardController = require('../controllers/dashboardController');
const AuthController = require('../controllers/authController');

const ENV_KEYS = [
  'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_PORT', 'SMTP_SECURE',
  'SMTP_FROM', 'BREVO_API_KEY', 'FRONTEND_URL',
];
let envSnapshot;
let fetchMock;

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeConn() {
  return {
    query: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  envSnapshot = {};
  for (const key of ENV_KEYS) {
    envSnapshot[key] = process.env[key];
    delete process.env[key];
  }
  fetchMock = jest.fn();
  global.fetch = fetchMock;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
  for (const key of ENV_KEYS) {
    if (envSnapshot[key] === undefined) delete process.env[key];
    else process.env[key] = envSnapshot[key];
  }
});

describe('dashboardController.getKPIs', () => {
  test('responde con los KPIs', async () => {
    CatalogoModel.getDashboardKPIs.mockResolvedValue({ afiliados: 10 });
    const res = makeRes();

    await DashboardController.getKPIs({}, res);
    expect(res.json).toHaveBeenCalledWith({ afiliados: 10 });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('responde 500 genérico ante error', async () => {
    CatalogoModel.getDashboardKPIs.mockRejectedValue(new Error('db'));
    const res = makeRes();

    await DashboardController.getKPIs({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('authController.login', () => {
  function loginReq(email, password) {
    return { body: { email, password } };
  }

  test('exige correo y contraseña', async () => {
    const res = makeRes();
    await AuthController.login(loginReq('', ''), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Correo y contraseña requeridos' });
  });

  test('valida formato de correo', async () => {
    const res = makeRes();
    await AuthController.login(loginReq(123, 'x'), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Formato de correo inválido' });
  });

  test('rechaza contraseña no string o mayor a 72 bytes', async () => {
    let res = makeRes();
    await AuthController.login(loginReq('ana@metafit.com', 1234), res);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('72 caracteres') });

    res = makeRes();
    await AuthController.login(loginReq('ana@metafit.com', 'x'.repeat(73)), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('devuelve 401 si el usuario no existe', async () => {
    UsuarioModel.findByEmail.mockResolvedValue(null);
    const res = makeRes();

    await AuthController.login(loginReq('ana@metafit.com', 'secreta'), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Correo o contraseña incorrectos' });
  });

  test('devuelve 403 si la cuenta no está activa (sin comparar bcrypt)', async () => {
    UsuarioModel.findByEmail.mockResolvedValue({ estado: 'Inactivo' });
    const res = makeRes();

    await AuthController.login(loginReq('ana@metafit.com', 'secreta'), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(comparePassword).not.toHaveBeenCalled();
  });

  test('devuelve 401 si la contraseña no coincide', async () => {
    UsuarioModel.findByEmail.mockResolvedValue({ estado: 'Activo' });
    comparePassword.mockResolvedValue(false);
    const res = makeRes();

    await AuthController.login(loginReq('ana@metafit.com', 'secreta'), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(signJWT).not.toHaveBeenCalled();
  });

  test('devuelve token y datos del usuario en login exitoso', async () => {
    UsuarioModel.findByEmail.mockResolvedValue({
      id_usuario: 1,
      correo: 'ana@metafit.com',
      rol: 'Administrador',
      nombres: 'Ana',
      apellidos: 'Pérez',
      estado: 'Activo',
      contrasena: 'hash',
    });
    comparePassword.mockResolvedValue(true);
    const res = makeRes();

    await AuthController.login(loginReq(' ANA@Metafit.com ', 'secreta'), res);

    expect(UsuarioModel.findByEmail).toHaveBeenCalledWith('ana@metafit.com');
    expect(comparePassword).toHaveBeenCalledWith('secreta', 'hash');
    expect(signJWT).toHaveBeenCalledWith({
      sub: 1,
      email: 'ana@metafit.com',
      role: 'Administrador',
    });
    expect(res.json).toHaveBeenCalledWith({
      accessToken: 'jwt-token',
      user: {
        id: 1,
        email: 'ana@metafit.com',
        role: 'Administrador',
        nombres: 'Ana',
        apellidos: 'Pérez',
        foto: null,
      },
    });
  });

  test('devuelve 500 si el modelo falla', async () => {
    UsuarioModel.findByEmail.mockRejectedValue(new Error('db'));
    const res = makeRes();

    await AuthController.login(loginReq('ana@metafit.com', 'secreta'), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('authController.recuperarPassword', () => {
  const req = (email) => ({ body: { email } });

  function mockUser() {
    UsuarioModel.findByEmail.mockResolvedValue({
      id_usuario: 1,
      nombres: 'Ana',
      correo: 'ana@metafit.com',
    });
  }

  test('valida correo', async () => {
    for (const email of [undefined, 123, 'mal']) {
      const res = makeRes();
      await AuthController.recuperarPassword(req(email), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Correo inválido' });
    }
  });

  test('responde genérico si el usuario no existe', async () => {
    UsuarioModel.findByEmail.mockResolvedValue(null);
    const res = makeRes();

    await AuthController.recuperarPassword(req('nadie@metafit.com'), res);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña',
    });
    expect(PasswordResetModel.create).not.toHaveBeenCalled();
  });

  test('crea token y lo devuelve en modo prueba sin SMTP', async () => {
    mockUser();
    const res = makeRes();

    await AuthController.recuperarPassword(req('ANA@metafit.com'), res);

    expect(UsuarioModel.findByEmail).toHaveBeenCalledWith('ana@metafit.com');
    expect(PasswordResetModel.invalidarAnteriores).toHaveBeenCalledWith(1);
    expect(AuthService.signResetToken).toHaveBeenCalledWith(1);
    expect(PasswordResetModel.create).toHaveBeenCalledWith({
      usuario_id: 1,
      token: 'reset-token',
      expiracion: expect.any(Date),
    });
    expect(res.json).toHaveBeenCalledWith({
      mensaje: expect.stringContaining('recibirás un enlace'),
      modoPrueba: true,
      token: 'reset-token',
    });
  });

  test('usa modo prueba aunque la plantilla no exista', async () => {
    mockUser();
    const fs = require('fs');
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const res = makeRes();

    await AuthController.recuperarPassword(req('ana@metafit.com'), res);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ modoPrueba: true }));
  });

  test('usa modo prueba si falla la lectura de la plantilla', async () => {
    mockUser();
    const fs = require('fs');
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('EACCES');
    });
    const res = makeRes();

    await AuthController.recuperarPassword(req('ana@metafit.com'), res);

    expect(console.error).toHaveBeenCalledWith(
      '[authController.recuperarPassword] plantilla:',
      'EACCES'
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ modoPrueba: true, token: 'reset-token' })
    );
  });

  test('envía por Brevo y oculta el token', async () => {
    mockUser();
    process.env.BREVO_API_KEY = 'brevo-key';
    process.env.SMTP_FROM = 'noreply@metafit.com';
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ messageId: 'm1' }),
    });
    const res = makeRes();

    await AuthController.recuperarPassword(req('ana@metafit.com'), res);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({ method: 'POST' })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.htmlContent).toContain('Ana');
    expect(body.textContent).toContain('restablecer');
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña',
    });
  });

  test('si Brevo falla usa SMTP como fallback', async () => {
    mockUser();
    process.env.BREVO_API_KEY = 'brevo-key';
    process.env.SMTP_HOST = 'smtp.test';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ message: 'boom' }),
    });
    const sendMail = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });
    const res = makeRes();

    await AuthController.recuperarPassword(req('ana@metafit.com'), res);

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ana@metafit.com',
      subject: expect.stringContaining('Recuperación de contraseña'),
      html: expect.stringContaining('Ana'),
    }));
    expect(res.json).toHaveBeenCalledWith({
      mensaje: expect.any(String),
    });
  });

  test('registra el error si también falla el envío por SMTP', async () => {
    mockUser();
    process.env.BREVO_API_KEY = 'brevo-key';
    process.env.SMTP_HOST = 'smtp.test';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ message: 'boom' }),
    });
    const sendMail = jest.fn().mockRejectedValue(new Error('smtp caído'));
    nodemailer.createTransport.mockReturnValue({ sendMail });
    const res = makeRes();

    await AuthController.recuperarPassword(req('ana@metafit.com'), res);

    expect(console.error).toHaveBeenCalledWith(
      '[authController.recuperarPassword] error envío:',
      'smtp caído'
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ modoPrueba: true, token: 'reset-token' })
    );
  });

  test('si Brevo lanza y no hay SMTP devuelve token', async () => {
    mockUser();
    process.env.BREVO_API_KEY = 'brevo-key';
    fetchMock.mockRejectedValue(new Error('network'));
    const res = makeRes();

    await AuthController.recuperarPassword(req('ana@metafit.com'), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      modoPrueba: true,
      token: 'reset-token',
    }));
  });

  test('envía solo por SMTP si no hay Brevo', async () => {
    mockUser();
    process.env.SMTP_HOST = 'smtp.test';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    const sendMail = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });
    const res = makeRes();

    await AuthController.recuperarPassword(req('ana@metafit.com'), res);

    expect(sendMail).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ mensaje: expect.any(String) });
  });

  test('devuelve 500 si falla la persistencia del token', async () => {
    mockUser();
    PasswordResetModel.create.mockRejectedValue(new Error('db'));
    const res = makeRes();

    await AuthController.recuperarPassword(req('ana@metafit.com'), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('authController.resetPassword', () => {
  const body = (overrides = {}) => ({
    body: { token: 'token', nuevaPassword: 'Nueva123!', ...overrides },
  });

  test('valida token, contraseña y longitud', async () => {
    let res = makeRes();
    await AuthController.resetPassword(body({ token: undefined }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token requerido' });

    res = makeRes();
    await AuthController.resetPassword(body({ token: 123 }), res);
    expect(res.status).toHaveBeenCalledWith(400);

    res = makeRes();
    await AuthController.resetPassword(body({ nuevaPassword: '' }), res);
    expect(res.json).toHaveBeenCalledWith({ error: 'Nueva contraseña requerida' });

    res = makeRes();
    await AuthController.resetPassword(body({ nuevaPassword: 123 }), res);
    expect(res.json).toHaveBeenCalledWith({ error: 'Nueva contraseña requerida' });

    res = makeRes();
    await AuthController.resetPassword(body({ nuevaPassword: 'x'.repeat(73) }), res);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('72 caracteres') });
  });

  test('rechaza token inválido o expirado', async () => {
    AuthService.verifyResetToken.mockImplementation(() => {
      throw new Error('jwt');
    });
    const res = makeRes();

    await AuthController.resetPassword(body(), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
  });

  test('rechaza token con tipo incorrecto', async () => {
    AuthService.verifyResetToken.mockReturnValue({ sub: 1, tipo: 'otro' });
    const res = makeRes();

    await AuthController.resetPassword(body(), res);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido' });
  });

  test('rechaza token no vigente y hace rollback', async () => {
    AuthService.verifyResetToken.mockReturnValue({ sub: 1, tipo: 'password_reset' });
    const conn = makeConn();
    pool.getConnection.mockResolvedValue(conn);
    PasswordResetModel.findVigente.mockResolvedValue(null);
    const res = makeRes();

    await AuthController.resetPassword(body(), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o ya utilizado' });
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('rechaza token de otro usuario', async () => {
    AuthService.verifyResetToken.mockReturnValue({ sub: 1, tipo: 'password_reset' });
    const conn = makeConn();
    pool.getConnection.mockResolvedValue(conn);
    PasswordResetModel.findVigente.mockResolvedValue({ id: 5, usuario_id: 2 });
    const res = makeRes();

    await AuthController.resetPassword(body(), res);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o ya utilizado' });
    expect(conn.rollback).toHaveBeenCalled();
  });

  test('actualiza contraseña, marca token y hace commit', async () => {
    AuthService.verifyResetToken.mockReturnValue({ sub: 1, tipo: 'password_reset' });
    const conn = makeConn();
    pool.getConnection.mockResolvedValue(conn);
    PasswordResetModel.findVigente.mockResolvedValue({ id: 5, usuario_id: 1 });
    const res = makeRes();

    await AuthController.resetPassword(body(), res);

    expect(AuthService.hashPassword).toHaveBeenCalledWith('Nueva123!');
    expect(conn.query).toHaveBeenCalledWith(
      'UPDATE USUARIO SET contrasena = ? WHERE id_usuario = ?',
      ['nuevo-hash', 1]
    );
    expect(PasswordResetModel.marcarUsado).toHaveBeenCalledWith(5);
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Contraseña actualizada correctamente' });
  });

  test('hace rollback y responde 500 si falla la actualización', async () => {
    AuthService.verifyResetToken.mockReturnValue({ sub: 1, tipo: 'password_reset' });
    const conn = makeConn();
    conn.query.mockRejectedValue(new Error('db'));
    pool.getConnection.mockResolvedValue(conn);
    PasswordResetModel.findVigente.mockResolvedValue({ id: 5, usuario_id: 1 });
    const res = makeRes();

    await AuthController.resetPassword(body(), res);
    expect(conn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    expect(conn.release).toHaveBeenCalled();
  });
});

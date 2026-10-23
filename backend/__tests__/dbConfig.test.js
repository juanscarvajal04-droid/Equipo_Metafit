'use strict';

// Tests de config/db.js: parseo de DATABASE_URL, variables individuales,
// socket, SSL, typeCast y prueba inicial de conexión. mysql2 está mockeado.

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(),
}));

const mysql = require('mysql2/promise');

const DB_ENV_KEYS = [
  'DATABASE_URL',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_SSL',
  'DB_SOCKET',
];
let envSnapshot;
let exitSpy;

const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  envSnapshot = {};
  for (const key of DB_ENV_KEYS) {
    envSnapshot[key] = process.env[key];
    delete process.env[key];
  }
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
});

afterEach(() => {
  exitSpy.mockRestore();
  jest.restoreAllMocks();
  for (const key of DB_ENV_KEYS) {
    if (envSnapshot[key] === undefined) delete process.env[key];
    else process.env[key] = envSnapshot[key];
  }
});

function loadDb() {
  let db;
  jest.isolateModules(() => {
    db = require('../config/db');
  });
  return db;
}

describe('config/db con DATABASE_URL', () => {
  test('parsea URL, activa SSL y libera la conexión de prueba', async () => {
    process.env.DATABASE_URL = 'mysql://user%40mail:pa%24s@db.example.com:3307/metafit?ssl=true';
    const conn = { release: jest.fn() };
    const pool = { query: jest.fn(), getConnection: jest.fn().mockResolvedValue(conn) };
    mysql.createPool.mockReturnValue(pool);

    const db = loadDb();
    await flush();

    expect(db).toBe(pool);
    expect(mysql.createPool).toHaveBeenCalledTimes(1);
    const config = mysql.createPool.mock.calls[0][0];
    expect(config).toMatchObject({
      host: 'db.example.com',
      port: 3307,
      user: 'user@mail',
      password: 'pa$s',
      database: 'metafit',
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      ssl: { rejectUnauthorized: false },
    });
    expect(conn.release).toHaveBeenCalled();
  });

  test('sin puerto usa 3306 y SSL por defecto con DATABASE_URL', async () => {
    process.env.DATABASE_URL = 'mysql://root:root@localhost/metafit';
    const pool = {
      query: jest.fn(),
      getConnection: jest.fn().mockRejectedValue(new Error('offline')),
    };
    mysql.createPool.mockReturnValue(pool);

    loadDb();
    await flush();

    const config = mysql.createPool.mock.calls[0][0];
    expect(config.port).toBe(3306);
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  test('respeta ssl=false en la URL', async () => {
    process.env.DATABASE_URL = 'mysql://root:root@localhost/metafit?ssl=false';
    mysql.createPool.mockReturnValue({
      query: jest.fn(),
      getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
    });

    loadDb();
    await flush();

    const config = mysql.createPool.mock.calls[0][0];
    expect(config.ssl).toBeUndefined();
  });
});

describe('config/db con variables individuales', () => {
  test('usa variables DB_* y socket Unix', async () => {
    process.env.DB_HOST = '127.0.0.1';
    process.env.DB_PORT = '3310';
    process.env.DB_USER = 'root';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'metafit';
    process.env.DB_SSL = '1';
    process.env.DB_SOCKET = '/var/run/mysqld/mysqld.sock';
    mysql.createPool.mockReturnValue({
      query: jest.fn(),
      getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
    });

    loadDb();
    await flush();

    const config = mysql.createPool.mock.calls[0][0];
    expect(config.socketPath).toBe('/var/run/mysqld/mysqld.sock');
    expect(config.host).toBeUndefined();
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
    expect(config.user).toBe('root');
    expect(config.password).toBe('secret');
    expect(config.database).toBe('metafit');
  });

  test('usa host/puerto y sin SSL cuando DB_SSL=false', async () => {
    process.env.DB_HOST = 'db.local';
    process.env.DB_USER = 'root';
    process.env.DB_PASSWORD = 'pw';
    process.env.DB_NAME = 'metafit';
    mysql.createPool.mockReturnValue({
      query: jest.fn(),
      getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
    });

    loadDb();
    await flush();

    const config = mysql.createPool.mock.calls[0][0];
    expect(config.host).toBe('db.local');
    expect(config.port).toBe(3306);
    expect(config.ssl).toBeUndefined();
  });

  test('process.exit(1) si faltan variables críticas', async () => {
    process.env.DB_HOST = 'db.local';
    mysql.createPool.mockReturnValue({
      query: jest.fn(),
      getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
    });

    loadDb();
    await flush();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('typeCast devuelve el string JSON y delega el resto', async () => {
    process.env.DB_HOST = 'db.local';
    process.env.DB_USER = 'root';
    process.env.DB_PASSWORD = 'pw';
    process.env.DB_NAME = 'metafit';
    mysql.createPool.mockReturnValue({
      query: jest.fn(),
      getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
    });

    loadDb();
    await flush();

    const { typeCast } = mysql.createPool.mock.calls[0][0];
    const jsonField = { type: 'JSON', string: jest.fn().mockReturnValue('{"a":1}') };
    expect(typeCast(jsonField, jest.fn())).toBe('{"a":1}');

    const nullField = { type: 'JSON', string: jest.fn().mockReturnValue(null) };
    const next = jest.fn().mockReturnValue('next-value');
    expect(typeCast(nullField, next)).toBe('next-value');
    expect(next).toHaveBeenCalled();

    const otherField = { type: 'VAR_STRING' };
    const next2 = jest.fn().mockReturnValue('plain');
    expect(typeCast(otherField, next2)).toBe('plain');
  });
});

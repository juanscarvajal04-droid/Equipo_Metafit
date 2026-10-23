'use strict';

// Tests de config/cloudinary.js y middlewares/uploadFoto.js.
// Se mockean cloudinary, multer y multer-storage-cloudinary.

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    api: { ping: jest.fn() },
    uploader: { destroy: jest.fn() },
  },
}));

jest.mock('multer', () => {
  const multerFn = jest.fn(() => ({ single: jest.fn(() => 'middleware-single') }));
  multerFn.diskStorage = jest.fn((opts) => ({ __disk: true, ...opts }));
  return multerFn;
});

jest.mock('multer-storage-cloudinary', () => ({
  CloudinaryStorage: jest.fn(function CloudinaryStorage(opts) {
    this.opts = opts;
  }),
}));

const fs = require('fs');
const cloudinaryPkg = require('cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const ENV_KEYS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];
let envSnapshot;

beforeEach(() => {
  envSnapshot = {};
  for (const key of ENV_KEYS) {
    envSnapshot[key] = process.env[key];
    delete process.env[key];
  }
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
  for (const key of ENV_KEYS) {
    if (envSnapshot[key] === undefined) delete process.env[key];
    else process.env[key] = envSnapshot[key];
  }
});

function loadFresh(modulePath) {
  let mod;
  jest.isolateModules(() => {
    mod = require(modulePath);
  });
  return mod;
}

function setCloudinaryEnv() {
  process.env.CLOUDINARY_CLOUD_NAME = 'metafit-cloud';
  process.env.CLOUDINARY_API_KEY = 'key';
  process.env.CLOUDINARY_API_SECRET = 'secret';
}

describe('config/cloudinary sin credenciales', () => {
  test('no configura cloudinary y publicIdDesdeUrl procesa URLs', () => {
    const mod = loadFresh('../config/cloudinary');

    expect(mod.configurado).toBe(false);
    expect(mod.FOLDER).toBe('metafit/afiliados');
    expect(cloudinaryPkg.v2.config).not.toHaveBeenCalled();

    expect(mod.publicIdDesdeUrl(
      'https://res.cloudinary.com/metafit-cloud/image/upload/v1616/metafit/afiliados/abc.jpg?x=1'
    )).toBe('v1616/metafit/afiliados/abc');
    expect(mod.publicIdDesdeUrl('https://cdn.test/foto.png')).toBeNull();
    expect(mod.publicIdDesdeUrl(null)).toBeNull();
  });

  test('verificarCredenciales devuelve false sin credenciales', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mod = loadFresh('../config/cloudinary');

    await expect(mod.verificarCredenciales()).resolves.toBe(false);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('sin credenciales'));
  });
});

describe('config/cloudinary con credenciales', () => {
  test('configura, hace ping y devuelve true', async () => {
    setCloudinaryEnv();
    cloudinaryPkg.v2.api.ping.mockResolvedValue({ status: 'ok' });
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const mod = loadFresh('../config/cloudinary');

    expect(mod.configurado).toBe(true);
    expect(cloudinaryPkg.v2.config).toHaveBeenCalledWith({
      cloud_name: 'metafit-cloud',
      api_key: 'key',
      api_secret: 'secret',
      secure: true,
    });

    await expect(mod.verificarCredenciales()).resolves.toBe(true);
    expect(cloudinaryPkg.v2.api.ping).toHaveBeenCalled();
  });

  test('ping con error anidado devuelve false y loguea el mensaje', async () => {
    setCloudinaryEnv();
    cloudinaryPkg.v2.api.ping.mockRejectedValue({ error: { message: 'bad creds' } });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mod = loadFresh('../config/cloudinary');
    await expect(mod.verificarCredenciales()).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('bad creds'));
  });

  test('ping con error plano usa err.message', async () => {
    setCloudinaryEnv();
    cloudinaryPkg.v2.api.ping.mockRejectedValue(new Error('network down'));
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mod = loadFresh('../config/cloudinary');
    await expect(mod.verificarCredenciales()).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('network down'));
  });

  test('ping con error vacío usa mensaje por defecto', async () => {
    setCloudinaryEnv();
    cloudinaryPkg.v2.api.ping.mockRejectedValue({});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mod = loadFresh('../config/cloudinary');
    await expect(mod.verificarCredenciales()).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('credenciales inválidas'));
  });
});

describe('middlewares/uploadFoto con storage en disco', () => {
  test('crea uploads si no existe, filtra imágenes y genera nombres', () => {
    const exists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const mkdir = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    const unlink = jest.spyOn(fs, 'unlink').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const mod = loadFresh('../middlewares/uploadFoto');

    expect(exists).toHaveBeenCalled();
    expect(mkdir).toHaveBeenCalled();
    expect(mod.STORAGE_KIND).toBe('disk');
    expect(mod.uploadFoto).toBe('middleware-single');

    const cfg = multer.mock.calls[0][0];
    expect(cfg.limits).toEqual({ fileSize: 5 * 1024 * 1024 });

    const cbOk = jest.fn();
    cfg.fileFilter({}, { mimetype: 'image/png' }, cbOk);
    expect(cbOk).toHaveBeenCalledWith(null, true);

    cfg.fileFilter({}, { mimetype: 'image/jpeg' }, cbOk);
    expect(cbOk).toHaveBeenCalledWith(null, true);

    const cbBad = jest.fn();
    cfg.fileFilter({}, { mimetype: 'application/pdf' }, cbBad);
    expect(cbBad.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(cbBad.mock.calls[0][0].message).toContain('Solo se permiten imágenes');

    const dest = jest.fn();
    cfg.diskStorage ? null : null;
    cfg.storage.destination(null, {}, dest);
    expect(dest).toHaveBeenCalledWith(null, expect.stringContaining('uploads'));

    const nameCb = jest.fn();
    cfg.storage.filename(null, { originalname: 'foto.PNG' }, nameCb);
    expect(nameCb.mock.calls[0][0]).toBeNull();
    expect(nameCb.mock.calls[0][1]).toMatch(/\.png$/);

    const nameDefault = jest.fn();
    cfg.storage.filename(null, { originalname: '' }, nameDefault);
    expect(nameDefault.mock.calls[0][1]).toMatch(/\.jpg$/);

    mod.eliminarFotoAnterior('/uploads/vieja.jpg');
    expect(unlink).toHaveBeenCalledWith(
      expect.stringContaining('vieja.jpg'),
      expect.any(Function)
    );

    // URL remota con storage en disco: no toca el filesystem.
    unlink.mockClear();
    mod.eliminarFotoAnterior('https://cdn.test/foto.jpg');
    expect(unlink).not.toHaveBeenCalled();
  });

  test('eliminarFotoAnterior captura errores del filesystem', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'unlink').mockImplementation(() => {
      throw new Error('EACCES');
    });
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mod = loadFresh('../middlewares/uploadFoto');
    expect(() => mod.eliminarFotoAnterior('/uploads/x.jpg')).not.toThrow();
    expect(error).toHaveBeenCalledWith(
      '[uploadFoto.eliminarFotoAnterior]',
      'EACCES'
    );
  });
});

describe('middlewares/uploadFoto con Cloudinary', () => {
  test('usa CloudinaryStorage y borra por public_id', () => {
    setCloudinaryEnv();
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const mod = loadFresh('../middlewares/uploadFoto');

    expect(mod.STORAGE_KIND).toBe('cloudinary');
    expect(CloudinaryStorage).toHaveBeenCalled();
    const cfg = CloudinaryStorage.mock.instances[0].opts;
    expect(cfg.params.folder).toBe('metafit/afiliados');
    expect(cfg.params.allowed_formats).toContain('webp');

    mod.eliminarFotoAnterior(
      'https://res.cloudinary.com/metafit-cloud/image/upload/v1/metafit/afiliados/abc.jpg'
    );
    expect(cloudinaryPkg.v2.uploader.destroy).toHaveBeenCalledWith(
      'v1/metafit/afiliados/abc',
      expect.any(Function)
    );

    cloudinaryPkg.v2.uploader.destroy.mockClear();
    mod.eliminarFotoAnterior('https://cdn.test/no-upload/foto.jpg');
    expect(cloudinaryPkg.v2.uploader.destroy).not.toHaveBeenCalled();
  });

  test('si CloudinaryStorage falla cae a disco', () => {
    setCloudinaryEnv();
    CloudinaryStorage.mockImplementationOnce(() => {
      throw new Error('no storage');
    });
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mod = loadFresh('../middlewares/uploadFoto');
    expect(mod.STORAGE_KIND).toBe('disk');
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('no se pudo configurar Cloudinary'),
      'no storage'
    );
  });
});

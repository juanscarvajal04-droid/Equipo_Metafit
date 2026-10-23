'use strict';

// Tests unitarios completos de AfiliadoService. Todos los modelos están
// mockeados: se validan reglas de negocio, ramas de error y delegación.

jest.mock('../models/afiliadoModel', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMe: jest.fn(),
  getMeData: jest.fn(),
  getFoto: jest.fn(),
  setFoto: jest.fn(),
  delete: jest.fn(),
}));
jest.mock('../models/cicloModel', () => ({
  findByAfiliado: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('../models/catalogoModel', () => ({
  getRestriccionesByAfiliado: jest.fn(),
  addRestriccionToAfiliado: jest.fn(),
  removeRestriccionFromAfiliado: jest.fn(),
  getEjerciciosDisponibles: jest.fn(),
  getAlimentosDisponibles: jest.fn(),
  getProgresoByAfiliado: jest.fn(),
  createProgreso: jest.fn(),
}));
jest.mock('../models/seguimientoDiarioModel', () => ({
  saveProgresoEjercicio: jest.fn(),
  getProgresoEjercicio: jest.fn(),
  saveAgua: jest.fn(),
  getAgua: jest.fn(),
  saveConsumoAlimento: jest.fn(),
  getAguaHistorial: jest.fn(),
  getConsumoHistorial: jest.fn(),
  getProgresoEjercicioHistorial: jest.fn(),
}));
jest.mock('../models/usuarioModel', () => ({ findByEmail: jest.fn() }));
jest.mock('../models/notaEjercicioModel', () => ({
  create: jest.fn(),
  findByUsuario: jest.fn(),
  findByUsuarioYCiclo: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

const AfiliadoModel = require('../models/afiliadoModel');
const CicloModel = require('../models/cicloModel');
const CatalogoModel = require('../models/catalogoModel');
const SeguimientoDiarioModel = require('../models/seguimientoDiarioModel');
const UsuarioModel = require('../models/usuarioModel');
const NotaEjercicioModel = require('../models/notaEjercicioModel');
const Service = require('../services/afiliadoService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('afiliadoService lectura básica', () => {
  test('getAll y getById delegan en el modelo', async () => {
    AfiliadoModel.findAll.mockResolvedValue([{ id_usuario: 1 }]);
    AfiliadoModel.findById.mockResolvedValue({ id_usuario: 1 });

    await expect(Service.getAll({ page: 1, limit: 10 })).resolves.toEqual([{ id_usuario: 1 }]);
    expect(AfiliadoModel.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });

    await expect(Service.getById(1)).resolves.toEqual({ id_usuario: 1 });
    expect(AfiliadoModel.findById).toHaveBeenCalledWith(1);
  });

  test('getFoto, setFoto y delete delegan y traducen', async () => {
    AfiliadoModel.getFoto.mockResolvedValue('/uploads/a.jpg');
    AfiliadoModel.setFoto.mockResolvedValue(true);
    AfiliadoModel.delete.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(Service.getFoto(1)).resolves.toBe('/uploads/a.jpg');
    await expect(Service.setFoto(1, '/uploads/a.jpg')).resolves.toBe(true);
    await expect(Service.delete(1)).resolves.toBe(true);
    await expect(Service.delete(99)).resolves.toBe(false);
  });
});

describe('afiliadoService.create', () => {
  test('exige nombre y documento', async () => {
    await expect(Service.create({}, 1)).rejects.toThrow('Nombre y documento son requeridos');
    await expect(Service.create({ nombres: 'Ana' }, 1)).rejects.toThrow('Nombre y documento son requeridos');
    expect(AfiliadoModel.create).not.toHaveBeenCalled();
  });

  test('normaliza la fecha y devuelve id + password temporal', async () => {
    AfiliadoModel.create.mockResolvedValue({ id_usuario: 5, password_temporal: 'MF_1@2025' });

    const res = await Service.create({
      nombres: 'Ana',
      documento: '1',
      fecha_nacimiento: '20/05/2000',
    }, 9);

    expect(res).toEqual({
      id: 5,
      message: 'Afiliado creado correctamente',
      password_temporal: 'MF_1@2025',
    });
    expect(AfiliadoModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ fecha_nacimiento: '2000-05-20' }),
      9
    );
  });

  test('propaga error de fecha inválida', async () => {
    await expect(Service.create({
      nombres: 'Ana',
      documento: '1',
      fecha_nacimiento: '32/01/2024',
    }, 9)).rejects.toThrow('Fecha inválida');
  });

  test('update devuelve booleano', async () => {
    AfiliadoModel.update.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    await expect(Service.update(1, { telefono: '300' })).resolves.toBe(true);
    await expect(Service.update(1, {})).resolves.toBe(false);
  });
});

describe('afiliadoService.updateMe', () => {
  test('exige al menos un campo', async () => {
    await expect(Service.updateMe(1, {})).rejects.toMatchObject({
      code: 'DATOS_INVALIDOS',
      message: expect.stringContaining('No hay campos'),
    });
  });

  test.each([
    [{ peso: 19 }, 'El peso debe estar entre 20 y 300 kg'],
    [{ peso_kg: 301 }, 'El peso debe estar entre 20 y 300 kg'],
    [{ peso_kg: 'abc' }, 'El peso debe estar entre 20 y 300 kg'],
    [{ talla: 0 }, 'La altura debe estar entre 1 y 300 cm'],
    [{ altura_cm: 301 }, 'La altura debe estar entre 1 y 300 cm'],
    [{ telefono: '123456789012345678901' }, 'El teléfono no puede superar 20 caracteres'],
    [{ direccion: 'x'.repeat(101) }, 'La dirección no puede superar 100 caracteres'],
    [{ correo: 'no-es-email' }, 'Formato de correo inválido'],
  ])('valida %j', async (datos, mensaje) => {
    await expect(Service.updateMe(1, datos)).rejects.toThrow(mensaje);
  });

  test('rechaza correo en uso por otro usuario', async () => {
    UsuarioModel.findByEmail.mockResolvedValue({ id_usuario: 2 });

    await expect(Service.updateMe(1, { correo: ' OTRO@MetaFit.com ' })).rejects.toMatchObject({
      code: 'CORREO_EN_USO',
    });
    expect(UsuarioModel.findByEmail).toHaveBeenCalledWith('otro@metafit.com');
    expect(AfiliadoModel.updateMe).not.toHaveBeenCalled();
  });

  test('permite conservar el propio correo', async () => {
    UsuarioModel.findByEmail.mockResolvedValue({ id_usuario: '1' });
    AfiliadoModel.updateMe.mockResolvedValue(true);
    AfiliadoModel.getMeData.mockResolvedValue({
      id_usuario: 1,
      telefono: '300',
      estatura_cm: 165,
      correo: 'ana@metafit.com',
      peso_kg: 66,
    });

    const res = await Service.updateMe(1, {
      correo: ' ANA@metafit.com ',
      peso: 66,
      talla: 165,
      telefono: '300',
      direccion: ' Calle 1 ',
    });

    expect(AfiliadoModel.updateMe).toHaveBeenCalledWith(1, {
      telefono: '300',
      estatura_cm: 165,
      correo: 'ana@metafit.com',
      peso_kg: 66,
      direccion: 'Calle 1',
    });
    expect(res.imc).toBe(24.24);
    expect(res.perfil).toEqual({
      id_usuario: 1,
      telefono: '300',
      estatura_cm: 165,
      correo: 'ana@metafit.com',
      peso_kg: 66,
      direccion: 'Calle 1',
    });
  });

  test('lanza NO_ENCONTRADO si el modelo no actualiza', async () => {
    AfiliadoModel.updateMe.mockResolvedValue(false);
    await expect(Service.updateMe(1, { telefono: '300' })).rejects.toMatchObject({
      code: 'NO_ENCONTRADO',
    });
  });

  test('perfil incompleto deja IMC null y usa fallbacks', async () => {
    AfiliadoModel.updateMe.mockResolvedValue(true);
    AfiliadoModel.getMeData.mockResolvedValue(null);

    const res = await Service.updateMe(7, { peso_kg: 70 });
    expect(res.imc).toBeNull();
    expect(res.perfil).toEqual({
      id_usuario: 7,
      telefono: null,
      estatura_cm: null,
      correo: null,
      peso_kg: null,
      direccion: null,
    });
  });

  test('si la estatura es 0 no calcula IMC', async () => {
    AfiliadoModel.updateMe.mockResolvedValue(true);
    AfiliadoModel.getMeData.mockResolvedValue({
      id_usuario: 1, estatura_cm: 0, peso_kg: 70, telefono: null, correo: null,
    });

    await expect(Service.updateMe(1, { peso_kg: 70 })).resolves.toMatchObject({ imc: null });
  });
});

describe('afiliadoService ciclos', () => {
  test('getCiclos delega en CicloModel', async () => {
    CicloModel.findByAfiliado.mockResolvedValue([{ id_ciclo: 1 }]);
    await expect(Service.getCiclos(1)).resolves.toEqual([{ id_ciclo: 1 }]);
  });

  test('createCiclo valida campos obligatorios', async () => {
    await expect(Service.createCiclo({}, 1)).rejects.toThrow(
      'id_usuario, fecha_inicio y fecha_fin son requeridos'
    );
    await expect(Service.createCiclo({
      id_usuario: 1,
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-02-01',
    }, 1)).rejects.toThrow(
      'objetivo_fisico, nivel_experiencia y disponibilidad_dias son requeridos'
    );
  });

  test('createCiclo normaliza ENUMs y disponibilidad', async () => {
    CicloModel.create.mockResolvedValue(10);

    const res = await Service.createCiclo({
      id_usuario: 1,
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-02-01',
      objetivo_fisico: 'Pérdida de grasa',
      nivel_experiencia: 'intermedio',
      disponibilidad_dias: '4',
      grupo_muscular_prioritario: 'Pierna',
    }, 2);

    expect(res).toEqual({ id_ciclo: 10, message: 'Ciclo creado correctamente' });
    expect(CicloModel.create).toHaveBeenCalledWith({
      id_usuario: 1,
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-02-01',
      objetivo_fisico: 'Perdida de grasa',
      nivel_experiencia: 'Intermedio',
      disponibilidad_dias: 4,
      grupo_muscular_prioritario: 'Pierna',
      observaciones: null,
      registrado_por: 2,
    });
  });

  test('updateCiclo exige id y ciclo existente', async () => {
    await expect(Service.updateCiclo(null, {})).rejects.toThrow('id_ciclo requerido');

    CicloModel.findById.mockResolvedValue(null);
    await expect(Service.updateCiclo(99, {})).rejects.toMatchObject({ code: 'NO_ENCONTRADO' });
  });

  test('updateCiclo valida el orden de fechas', async () => {
    CicloModel.findById.mockResolvedValue({ fecha_inicio: '2026-01-01', fecha_fin: '2026-02-01' });
    await expect(Service.updateCiclo(1, {
      fecha_inicio: '2026-03-01',
      fecha_fin: '2026-02-01',
    })).rejects.toThrow('La fecha de fin debe ser posterior a la fecha de inicio');
  });

  test.each([0, 8, 1.5])('updateCiclo rechaza disponibilidad %p', async (dias) => {
    CicloModel.findById.mockResolvedValue({ fecha_inicio: '2026-01-01', fecha_fin: '2026-02-01' });
    await expect(Service.updateCiclo(1, { disponibilidad_dias: dias })).rejects.toThrow(
      'disponibilidad_dias debe estar entre 1 y 7'
    );
  });

  test('updateCiclo rechaza objetivo y nivel inválidos', async () => {
    CicloModel.findById.mockResolvedValue({ fecha_inicio: '2026-01-01', fecha_fin: '2026-02-01' });

    await expect(Service.updateCiclo(1, { objetivo_fisico: 'Hipertrofia extrema' }))
      .rejects.toThrow('objetivo_fisico inválido');
    await expect(Service.updateCiclo(1, { nivel_experiencia: 'Experto' }))
      .rejects.toThrow('nivel_experiencia inválido');
  });

  test('updateCiclo normaliza y actualiza campos', async () => {
    CicloModel.findById.mockResolvedValue({ fecha_inicio: '2026-01-01', fecha_fin: '2026-02-01' });
    CicloModel.update.mockResolvedValue(1);

    const ok = await Service.updateCiclo(1, {
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-02-01',
      disponibilidad_dias: '5',
      objetivo_fisico: 'Pérdida de grasa',
      nivel_experiencia: 'avanzado',
      grupo_muscular_prioritario: 'Core',
      observaciones: 'ok',
      activo: true,
    });

    expect(ok).toBe(true);
    expect(CicloModel.update).toHaveBeenCalledWith(1, {
      fecha_inicio: undefined,
      fecha_fin: undefined,
      objetivo_fisico: 'Perdida de grasa',
      nivel_experiencia: 'Avanzado',
      disponibilidad_dias: 5,
      grupo_muscular_prioritario: 'Core',
      observaciones: 'ok',
      activo: 1,
    });
  });

  test('updateCiclo devuelve false si no afecta filas', async () => {
    CicloModel.findById.mockResolvedValue({ fecha_inicio: '2026-01-01', fecha_fin: '2026-02-01' });
    CicloModel.update.mockResolvedValue(0);
    await expect(Service.updateCiclo(1, {})).resolves.toBe(false);
  });

  test('deleteCiclo valida existencia y resultado', async () => {
    await expect(Service.deleteCiclo(null)).rejects.toThrow('id_ciclo requerido');

    CicloModel.findById.mockResolvedValue(null);
    await expect(Service.deleteCiclo(9)).rejects.toMatchObject({ code: 'NO_ENCONTRADO' });

    CicloModel.findById.mockResolvedValue({ id_ciclo: 9 });
    CicloModel.remove.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    await expect(Service.deleteCiclo(9)).resolves.toBe(true);
    await expect(Service.deleteCiclo(9)).resolves.toBe(false);
  });
});

describe('afiliadoService restricciones y catálogo', () => {
  test('getRestricciones delega', async () => {
    CatalogoModel.getRestriccionesByAfiliado.mockResolvedValue([{ id: 1 }]);
    await expect(Service.getRestricciones(1)).resolves.toEqual([{ id: 1 }]);
  });

  test('addRestriccion exige id y delega', async () => {
    await expect(Service.addRestriccion(1)).rejects.toThrow('id_restriccion requerido');

    await expect(Service.addRestriccion(1, 5)).resolves.toEqual({ message: 'Restricción asignada' });
    expect(CatalogoModel.addRestriccionToAfiliado).toHaveBeenCalledWith(1, 5);
  });

  test('removeRestriccion devuelve booleano', async () => {
    CatalogoModel.removeRestriccionFromAfiliado.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    await expect(Service.removeRestriccion(1, 5)).resolves.toBe(true);
    await expect(Service.removeRestriccion(1, 5)).resolves.toBe(false);
  });

  test('métodos de catálogo delegan', async () => {
    CatalogoModel.getEjerciciosDisponibles.mockResolvedValue([{ id: 1 }]);
    CatalogoModel.getAlimentosDisponibles.mockResolvedValue([{ id: 2 }]);
    CatalogoModel.getProgresoByAfiliado.mockResolvedValue([{ id: 3 }]);

    await expect(Service.getEjerciciosDisponibles(1)).resolves.toEqual([{ id: 1 }]);
    await expect(Service.getAlimentosDisponibles(1)).resolves.toEqual([{ id: 2 }]);
    await expect(Service.getProgreso(1)).resolves.toEqual([{ id: 3 }]);
  });

  test('createProgreso valida y delega', async () => {
    await expect(Service.createProgreso({}, 1)).rejects.toThrow(
      'id_ciclo, fecha_registro y peso son requeridos'
    );

    await expect(Service.createProgreso({
      id_ciclo: 1,
      fecha_registro: '2026-10-21',
      peso: 70,
    }, 2)).resolves.toEqual({ message: 'Progreso registrado correctamente' });
    expect(CatalogoModel.createProgreso).toHaveBeenCalledWith({
      id_ciclo: 1,
      fecha_registro: '2026-10-21',
      peso: 70,
    }, 2);
  });
});

describe('afiliadoService seguimiento diario', () => {
  test('saveProgresoEjercicio valida y delega', async () => {
    await expect(Service.saveProgresoEjercicio(7, {})).rejects.toThrow(
      'id_ciclo, fecha y ejercicios son requeridos'
    );

    SeguimientoDiarioModel.saveProgresoEjercicio.mockResolvedValue({ message: 'ok' });
    await expect(Service.saveProgresoEjercicio(7, {
      id_ciclo: 2, fecha: '2026-10-21', ejercicios: [],
    })).resolves.toEqual({ message: 'ok' });
  });

  test('getProgresoEjercicio delega', async () => {
    SeguimientoDiarioModel.getProgresoEjercicio.mockResolvedValue([{ id: 1 }]);
    await expect(Service.getProgresoEjercicio(7, 2, '2026-10-21')).resolves.toEqual([{ id: 1 }]);
  });

  test('saveAgua valida y delega', async () => {
    await expect(Service.saveAgua(7, {})).rejects.toThrow('fecha y vasos son requeridos');
    await expect(Service.saveAgua(7, { fecha: '2026-10-21' })).rejects.toThrow(
      'fecha y vasos son requeridos'
    );

    SeguimientoDiarioModel.saveAgua.mockResolvedValue({ message: 'agua' });
    await expect(Service.saveAgua(7, { fecha: '2026-10-21', vasos: 0 })).resolves.toEqual({
      message: 'agua',
    });
  });

  test('getAgua delega', async () => {
    SeguimientoDiarioModel.getAgua.mockResolvedValue({ vasos: 8 });
    await expect(Service.getAgua(7, '2026-10-21')).resolves.toEqual({ vasos: 8 });
  });

  test('saveConsumoAlimento valida y delega', async () => {
    await expect(Service.saveConsumoAlimento(7, {})).rejects.toThrow(
      'id_ciclo, fecha y alimentos son requeridos'
    );

    SeguimientoDiarioModel.saveConsumoAlimento.mockResolvedValue({ message: 'consumo' });
    await expect(Service.saveConsumoAlimento(7, {
      id_ciclo: 2, fecha: '2026-10-21', alimentos: [],
    })).resolves.toEqual({ message: 'consumo' });
  });

  test('historiales pasan los filtros de query', async () => {
    SeguimientoDiarioModel.getAguaHistorial.mockResolvedValue([]);
    SeguimientoDiarioModel.getConsumoHistorial.mockResolvedValue([]);
    SeguimientoDiarioModel.getProgresoEjercicioHistorial.mockResolvedValue([]);

    await Service.getAguaHistorial(7, { fechaInicio: '2026-01-01', fechaFin: '2026-02-01' });
    expect(SeguimientoDiarioModel.getAguaHistorial).toHaveBeenCalledWith(7, '2026-01-01', '2026-02-01');

    await Service.getConsumoHistorial(7, { fechaInicio: '2026-01-01', fechaFin: '2026-02-01' });
    expect(SeguimientoDiarioModel.getConsumoHistorial).toHaveBeenCalledWith(7, '2026-01-01', '2026-02-01');

    await Service.getProgresoEjercicioHistorial(7, {
      id_ciclo: 2, fechaInicio: '2026-01-01', fechaFin: '2026-02-01',
    });
    expect(SeguimientoDiarioModel.getProgresoEjercicioHistorial).toHaveBeenCalledWith(
      7, 2, '2026-01-01', '2026-02-01'
    );
  });
});

describe('afiliadoService notas de ejercicio', () => {
  test('guardarNotaEjercicio valida y crea con tipos normalizados', async () => {
    await expect(Service.guardarNotaEjercicio(7, {})).rejects.toThrow(
      'id_ejercicio, id_ciclo y nota son requeridos'
    );

    NotaEjercicioModel.create.mockResolvedValue(15);
    const res = await Service.guardarNotaEjercicio(7, {
      id_ejercicio: '3',
      id_ciclo: '2',
      nota: '  subir peso  ',
      fecha_nota: '2026-10-21',
    });

    expect(res).toEqual({ id_nota: 15, message: 'Nota guardada correctamente' });
    expect(NotaEjercicioModel.create).toHaveBeenCalledWith({
      id_usuario: 7,
      id_ejercicio: 3,
      id_ciclo: 2,
      nota: 'subir peso',
      fecha_nota: '2026-10-21',
    });
  });

  test('getMisNotasEjercicio filtra por ciclo cuando se envía', async () => {
    NotaEjercicioModel.findByUsuarioYCiclo.mockResolvedValue([{ id_nota: 1 }]);
    NotaEjercicioModel.findByUsuario.mockResolvedValue([{ id_nota: 2 }]);

    await expect(Service.getMisNotasEjercicio(7, '2')).resolves.toEqual([{ id_nota: 1 }]);
    expect(NotaEjercicioModel.findByUsuarioYCiclo).toHaveBeenCalledWith(7, 2);

    await expect(Service.getMisNotasEjercicio(7)).resolves.toEqual([{ id_nota: 2 }]);
    expect(NotaEjercicioModel.findByUsuario).toHaveBeenCalledWith(7);
  });

  test('getNotasEjercicioDeAfiliado delega', async () => {
    NotaEjercicioModel.findByUsuario.mockResolvedValue([{ id_nota: 3 }]);
    await expect(Service.getNotasEjercicioDeAfiliado(7)).resolves.toEqual([{ id_nota: 3 }]);
  });

  test('actualizarNotaEjercicio exige nota, detecta no encontrada y actualiza', async () => {
    await expect(Service.actualizarNotaEjercicio(7, 1, '')).rejects.toThrow('nota es requerida');

    NotaEjercicioModel.update.mockResolvedValueOnce(0);
    await expect(Service.actualizarNotaEjercicio(7, 1, 'ok')).rejects.toMatchObject({
      code: 'NO_ENCONTRADO',
    });

    NotaEjercicioModel.update.mockResolvedValueOnce(1);
    await expect(Service.actualizarNotaEjercicio(7, 1, ' ok ')).resolves.toEqual({
      message: 'Nota actualizada correctamente',
    });
    expect(NotaEjercicioModel.update).toHaveBeenCalledWith(1, 7, 'ok');
  });

  test('eliminarNotaEjercicio detecta no encontrada y elimina', async () => {
    NotaEjercicioModel.remove.mockResolvedValueOnce(0);
    await expect(Service.eliminarNotaEjercicio(7, 1)).rejects.toMatchObject({
      code: 'NO_ENCONTRADO',
    });

    NotaEjercicioModel.remove.mockResolvedValueOnce(1);
    await expect(Service.eliminarNotaEjercicio(7, 1)).resolves.toEqual({
      message: 'Nota eliminada correctamente',
    });
    expect(NotaEjercicioModel.remove).toHaveBeenCalledWith(1, 7);
  });
});

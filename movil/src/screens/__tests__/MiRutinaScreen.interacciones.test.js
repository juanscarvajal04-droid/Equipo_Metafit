// movil/src/screens/__tests__/MiRutinaScreen.interacciones.test.js
// Cubre la tarjeta del día (expandir, marcar, detalle, registrar), envío de
// notas, guardado de progreso, cambio de ciclo, selector de día y errores.
import React from 'react';
import { Alert } from 'react-native';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import MiRutinaScreen from '../MiRutinaScreen';
import {
  getMisCiclos,
  getPlanEntrenamiento,
  getPlanRutinaDia,
  guardarProgresoEjercicio,
  getProgresoEjercicioHoy,
  guardarNotaEjercicio,
  getMisNotasEjercicio,
} from '../../services/api';

jest.mock('../../services/api', () => ({
  getMisCiclos: jest.fn(),
  getPlanEntrenamiento: jest.fn(),
  getPlanRutinaDia: jest.fn(),
  guardarProgresoEjercicio: jest.fn(),
  getProgresoEjercicioHoy: jest.fn(),
  guardarNotaEjercicio: jest.fn(),
  getMisNotasEjercicio: jest.fn(),
}));

jest.mock('../../hooks/useAutoRefresh', () => ({ __esModule: true, default: jest.fn() }));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ getParent: () => ({ navigate: mockNavigate }) }),
}));

jest.setTimeout(30000);

const CICLOS = {
  data: [
    { id_ciclo: 1, nombre_ciclo: 'Ciclo 1', activo: 1, fecha_inicio: '2026-10-01', fecha_fin: '2026-10-30' },
    { id_ciclo: 2, nombre_ciclo: 'Ciclo 2', activo: 0, fecha_inicio: '2026-09-01', fecha_fin: '2026-09-30' },
  ],
};

const PLAN = {
  data: {
    rutinas: [
      {
        id_rutina: 9,
        nombre_rutina: 'Lunes',
        dia_numero: 1,
        ejercicios: [
          {
            id_ejercicio: 5,
            nombre_ejercicio: 'Sentadilla',
            series: 4,
            repeticiones: 12,
            peso_kg: 40,
            descanso_seg: 60,
            instrucciones: 'Baja controlado',
            orden: 1,
            grupo_muscular: 'Piernas',
          },
        ],
      },
      {
        id_rutina: 10,
        nombre_rutina: 'Martes',
        dia_numero: 2,
        ejercicios: [{ id_ejercicio: 6, nombre_ejercicio: 'Remo', orden: 1, grupo_muscular: 'Espalda' }],
      },
    ],
  },
};

function prepararMocks(overrides = {}) {
  getMisCiclos.mockResolvedValue(overrides.ciclos ?? CICLOS);
  getPlanEntrenamiento.mockResolvedValue(overrides.plan ?? PLAN);
  getPlanRutinaDia.mockResolvedValue(overrides.rutinaDia ?? { data: null });
  getProgresoEjercicioHoy.mockResolvedValue({ data: [] });
  getMisNotasEjercicio.mockResolvedValue({ data: [] });
  guardarProgresoEjercicio.mockResolvedValue({ data: {} });
  guardarNotaEjercicio.mockResolvedValue({ data: {} });
}

const hoy = new Date().toISOString().slice(0, 10);

describe('<MiRutinaScreen /> — interacciones', () => {
  let alertSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    prepararMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => alertSpy.mockRestore());

  test('expande el día, marca el ejercicio, ve el detalle y abre el registro', async () => {
    const { getByText, getAllByText, UNSAFE_getAllByProps } = render(<MiRutinaScreen />);

    await waitFor(() => expect(getByText('Mi Rutina')).toBeTruthy());
    expect(getByText('Sentadilla')).toBeTruthy();
    expect(getByText('4 series × 12 reps · 40 kg · 60s descanso')).toBeTruthy();

    // Expandir el día (el chip y el encabezado de la tarjeta comparten texto)
    fireEvent.press(getAllByText('Lunes')[1]);
    await act(async () => {});
    fireEvent.press(getByText('Sentadilla'));
    await waitFor(() => expect(getAllByText('1/1 ejercicios').length).toBeGreaterThan(0));

    // Ver el detalle (instrucciones)
    const infoBtn = UNSAFE_getAllByProps({ name: 'information-circle-outline' })[0];
    fireEvent.press(infoBtn);
    await waitFor(() => expect(getByText('Baja controlado')).toBeTruthy());

    // Abrir el registro del ejercicio
    const addBtn = UNSAFE_getAllByProps({ name: 'add-circle-outline' })[0];
    fireEvent.press(addBtn);
    expect(mockNavigate).toHaveBeenCalledWith('RegistroEjercicio', {
      id_ciclo: 1,
      id_rutina: 9,
      orden: 1,
      nombre: 'Sentadilla',
      nombre_rutina: 'Lunes',
    });
  });

  test('envía una nota: avisa si está vacía, guarda con texto y maneja el error', async () => {
    const { getByText, getAllByText, getByPlaceholderText, UNSAFE_getAllByProps } = render(<MiRutinaScreen />);

    await waitFor(() => expect(getByText('Mi Rutina')).toBeTruthy());
    fireEvent.press(getAllByText('Lunes')[1]);
    await act(async () => {});

    const notaInput = getByPlaceholderText('💬 Nota para el entrenador…');
    const enviarBtn = UNSAFE_getAllByProps({ name: 'send' })[0];

    fireEvent.press(enviarBtn);
    expect(alertSpy).toHaveBeenCalledWith('Nota vacía', 'Escribí una nota antes de enviar');
    expect(guardarNotaEjercicio).not.toHaveBeenCalled();

    fireEvent.changeText(notaInput, 'Me costó la última serie');
    fireEvent.press(enviarBtn);
    await waitFor(() =>
      expect(guardarNotaEjercicio).toHaveBeenCalledWith({
        id_ejercicio: 5,
        id_ciclo: 1,
        nota: 'Me costó la última serie',
        fecha_nota: hoy,
      })
    );
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('✅ Nota enviada al entrenador'));

    guardarNotaEjercicio.mockRejectedValueOnce(new Error('net'));
    fireEvent.changeText(getByPlaceholderText('💬 Nota para el entrenador…'), 'Otra nota');
    fireEvent.press(UNSAFE_getAllByProps({ name: 'send' })[0]);
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo enviar la nota. Intentá de nuevo.')
    );
  });

  test('guarda el progreso y maneja el error de guardado', async () => {
    const { getByText } = render(<MiRutinaScreen />);

    await waitFor(() => expect(getByText('Mi Rutina')).toBeTruthy());
    fireEvent.press(getByText('Guardar Progreso'));

    await waitFor(() =>
      expect(guardarProgresoEjercicio).toHaveBeenCalledWith(1, hoy, [
        { id_ejercicio: 5, completado: false },
        { id_ejercicio: 6, completado: false },
      ])
    );
    expect(alertSpy).toHaveBeenCalledWith('✅ Progreso guardado', 'Tu progreso de rutina fue guardado.');

    guardarProgresoEjercicio.mockRejectedValueOnce(new Error('net'));
    fireEvent.press(getByText('Guardar Progreso'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('❌ No se pudo guardar', 'Verificá tu conexión e intentá de nuevo.')
    );
  });

  test('cambia de ciclo desde el picker y usa la rutina del día', async () => {
    getPlanRutinaDia.mockResolvedValue({
      data: { id_rutina: 9, dia_numero: 1, enfoque_muscular: 'piernas', ejercicios: [{ id_ejercicio: 5, nombre_ejercicio: 'Sentadilla búlgara' }] },
    });
    const { getByText, queryByText } = render(<MiRutinaScreen />);

    await waitFor(() => expect(getByText('Ciclo: Ciclo 1')).toBeTruthy());
    expect(getByText('Sentadilla búlgara')).toBeTruthy();
    expect(getByText('Piernas')).toBeTruthy();

    fireEvent.press(getByText('Ciclo: Ciclo 1'));
    await act(async () => {});
    fireEvent.press(getByText('Ciclo 2'));
    await waitFor(() => expect(getPlanEntrenamiento).toHaveBeenLastCalledWith(2));
    await waitFor(() => expect(queryByText('Ciclo: Ciclo 2')).toBeTruthy());
  });

  test('selecciona otro día del plan', async () => {
    const { getByText } = render(<MiRutinaScreen />);

    await waitFor(() => expect(getByText('Mi Rutina')).toBeTruthy());
    fireEvent.press(getByText('Martes'));

    await waitFor(() => expect(getPlanRutinaDia).toHaveBeenCalledWith(1, 2));
    expect(getByText('Remo')).toBeTruthy();
  });

  test('se actualiza manualmente con el botón de refresco', async () => {
    const { getByText, UNSAFE_getAllByProps } = render(<MiRutinaScreen />);

    await waitFor(() => expect(getByText('Mi Rutina')).toBeTruthy());
    const llamadasIniciales = getMisCiclos.mock.calls.length;

    fireEvent.press(UNSAFE_getAllByProps({ name: 'refresh' })[0]);
    await waitFor(() => expect(getMisCiclos.mock.calls.length).toBeGreaterThan(llamadasIniciales));
  });

  test('sin ciclo asignado muestra el aviso', async () => {
    prepararMocks({ ciclos: { data: [] } });
    const { getByText } = render(<MiRutinaScreen />);

    await waitFor(() => expect(getByText('No tenés un ciclo asignado.')).toBeTruthy());
  });

  test('traduce errores 403, 500 y de red', async () => {
    const casos = [
      [{ response: { status: 403 } }, 'No tenés permiso para ver estos datos.'],
      [{ response: { status: 500 } }, 'Error al cargar los datos. Intentá más tarde.'],
      [new Error('sin red'), 'Sin conexión. Verificá tu red.'],
      [{ response: { status: 400 } }, 'No se pudieron cargar los datos.'],
    ];

    for (const [err, mensaje] of casos) {
      getMisCiclos.mockRejectedValueOnce(err);
      const { getByText, unmount } = render(<MiRutinaScreen />);
      await waitFor(() => expect(getByText(mensaje)).toBeTruthy());
      unmount();
    }
  });
});

// movil/src/components/historial/__tests__/ResumenCiclo.test.jsx
// Cubre el resumen de ciclo activo y completado.
import React from 'react';
import { render } from '@testing-library/react-native';
import ResumenCiclo from '../ResumenCiclo';

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', isDark: true }),
}));

describe('<ResumenCiclo />', () => {
  test('sin ciclo no renderiza nada', () => {
    const { toJSON } = render(<ResumenCiclo ciclo={null} />);
    expect(toJSON()).toBeNull();
  });

  test('ciclo activo con objetivo, fechas y disponibilidad', () => {
    const { getByText } = render(
      <ResumenCiclo
        ciclo={{
          numero_ciclo: 2,
          activo: 1,
          objetivo_fisico: 'Pérdida de grasa',
          fecha_inicio: '2026-10-01',
          fecha_fin: '2026-10-31',
          disponibilidad_dias: 4,
        }}
      />
    );
    expect(getByText('#2')).toBeTruthy();
    expect(getByText('Ciclo 2')).toBeTruthy();
    expect(getByText('En curso')).toBeTruthy();
    expect(getByText('Pérdida de grasa')).toBeTruthy();
    expect(getByText(/→/)).toBeTruthy();
    expect(getByText('4 días/semana')).toBeTruthy();
  });

  test('ciclo completado sin objetivo/fechas usa id y singular', () => {
    const { getByText, queryByText } = render(
      <ResumenCiclo ciclo={{ id_ciclo: 7, activo: 0, disponibilidad_dias: 1 }} />
    );
    expect(getByText('#7')).toBeTruthy();
    expect(getByText('Completado')).toBeTruthy();
    expect(getByText('1 día/semana')).toBeTruthy();
    expect(queryByText(/→/)).toBeNull();
  });

  test('ciclo activo sin fecha_fin muestra Activo', () => {
    const { getByText } = render(
      <ResumenCiclo ciclo={{ numero_ciclo: 3, activo: 1, fecha_inicio: '2026-10-01' }} />
    );
    expect(getByText(/Activo/)).toBeTruthy();
  });
});

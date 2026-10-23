// movil/src/components/graficos/__tests__/graficos.test.jsx
// Cubre los 3 gráficos: cumplimiento (pie), peso (line) y volumen (bar).
import React from 'react';
import { render } from '@testing-library/react-native';
import GraficoCumplimiento from '../GraficoCumplimiento';
import GraficoPeso from '../GraficoPeso';
import GraficoVolumen from '../GraficoVolumen';

jest.mock('react-native-chart-kit', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  const make = (testID) => (props) => ReactLib.createElement(View, { testID, ...props });
  return { PieChart: make('pie-chart'), LineChart: make('line-chart'), BarChart: make('bar-chart') };
});

describe('<GraficoCumplimiento />', () => {
  test('sin registros no renderiza nada', () => {
    const { toJSON } = render(<GraficoCumplimiento registrosConsumo={[]} />);
    expect(toJSON()).toBeNull();
  });

  test('calcula el porcentaje y muestra los contadores', () => {
    const { getByText, getByTestId } = render(
      <GraficoCumplimiento
        registrosConsumo={[
          { fecha: '2026-10-01', num_comida: 1 },
          { fecha: '2026-10-01', num_comida: 2 },
          { fecha: '2026-10-02', num_comida: 1 },
        ]}
      />
    );
    expect(getByTestId('pie-chart')).toBeTruthy();
    expect(getByText('Cumplimiento nutricional')).toBeTruthy();
    expect(getByText('38%')).toBeTruthy();
    expect(getByText('3 comidas registradas')).toBeTruthy();
    expect(getByText('8 esperadas')).toBeTruthy();
  });
});

describe('<GraficoPeso />', () => {
  test('con menos de 2 puntos no renderiza nada', () => {
    expect(render(<GraficoPeso data={[]} />).toJSON()).toBeNull();
    expect(
      render(<GraficoPeso data={[{ fecha: '2026-10-01', peso: 70 }]} />).toJSON()
    ).toBeNull();
    expect(
      render(<GraficoPeso data={[{ fecha: '2026-10-01', peso: 0 }]} />).toJSON()
    ).toBeNull();
  });

  test('ordena los puntos y muestra la gráfica', () => {
    const { getByText, getByTestId } = render(
      <GraficoPeso
        data={[
          { created_at: '2026-10-08', peso: '69.5' },
          { fecha: '2026-10-01', peso: 72 },
          { fecha: '', peso: 100 },
        ]}
      />
    );
    const chart = getByTestId('line-chart');
    expect(chart).toBeTruthy();
    expect(getByText('Evolución de peso')).toBeTruthy();
    expect(getByText('2 registros')).toBeTruthy();
    expect(chart.props.chartConfig.color(0.5)).toBe('rgba(167, 139, 250, 0.5)');
    expect(chart.props.chartConfig.labelColor(1)).toBe('rgba(255, 255, 255, 0.5)');
  });
});

describe('<GraficoVolumen />', () => {
  test('sin semanas válidas no renderiza nada', () => {
    expect(render(<GraficoVolumen data={[]} />).toJSON()).toBeNull();
    expect(
      render(<GraficoVolumen data={[{ fecha: 'sin-fecha', volumen: 100 }]} />).toJSON()
    ).toBeNull();
    expect(
      render(
        <GraficoVolumen
          data={[
            { fecha: '2026-10-01', volumen: 0 },
            { fecha: '2026-10-08', volumen: 0 },
          ]}
        />
      ).toJSON()
    ).toBeNull();
  });

  test('agrupa por semana ISO y suma volumen', () => {
    const { getByText, getByTestId } = render(
      <GraficoVolumen
        data={[
          { fecha: '2026-10-01', volumen: 100 },
          { fecha: '2026-10-02', volumen: 50 },
          { fecha: '2026-10-08', volumen: 120 },
        ]}
      />
    );
    const chart = getByTestId('bar-chart');
    expect(chart).toBeTruthy();
    expect(getByText('Volumen por semana')).toBeTruthy();
    expect(getByText('kg levantados')).toBeTruthy();
    expect(chart.props.chartConfig.color(0.5)).toBe('rgba(139, 92, 246, 0.5)');
    expect(chart.props.chartConfig.labelColor(1)).toBe('rgba(255, 255, 255, 0.5)');
  });
});

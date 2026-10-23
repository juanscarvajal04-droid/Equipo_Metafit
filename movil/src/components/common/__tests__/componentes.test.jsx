// movil/src/components/common/__tests__/componentes.test.jsx
// Cubre los componentes reutilizables: BadgeRestriccion, BarraAgua y StatsCard.
import React from 'react';
import { render } from '@testing-library/react-native';
import BadgeRestriccion from '../BadgeRestriccion';
import BarraAgua from '../BarraAgua';
import StatsCard from '../StatsCard';

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', isDark: true }),
}));

describe('<BadgeRestriccion />', () => {
  test('muestra el nombre y el tipo de la restricción', () => {
    const { getByText } = render(
      <BadgeRestriccion restriccion={{ nombre_restriccion: 'Asma', tipo: 'Enfermedad' }} />
    );
    expect(getByText('Asma')).toBeTruthy();
    expect(getByText('Enfermedad')).toBeTruthy();
  });

  test('usa nombre y descripcion como alternativas', () => {
    const { getByText } = render(<BadgeRestriccion restriccion={{ nombre: 'Lactosa' }} />);
    expect(getByText('Lactosa')).toBeTruthy();

    const { getByText: getByText2 } = render(
      <BadgeRestriccion restriccion={{ descripcion: 'Sin gluten' }} />
    );
    expect(getByText2('Sin gluten')).toBeTruthy();
  });

  test('sin datos cae en el texto por defecto y sin tipo', () => {
    const { getByText, queryByText } = render(<BadgeRestriccion />);
    expect(getByText('Restricción')).toBeTruthy();
    expect(queryByText('Enfermedad')).toBeNull();
  });
});

describe('<BarraAgua />', () => {
  test('muestra el progreso parcial', () => {
    const { getByText, queryByText } = render(<BarraAgua actual={3} />);
    expect(getByText('3 de 8 vasos · 0,8 L')).toBeTruthy();
    expect(getByText('Meta: 2 L (8 vasos)')).toBeTruthy();
    expect(queryByText('Meta de agua cumplida')).toBeNull();
  });

  test('al llegar a la meta muestra el check', () => {
    const { getByText } = render(<BarraAgua actual={8} />);
    expect(getByText('8 de 8 vasos · 2,0 L')).toBeTruthy();
    expect(getByText('Meta de agua cumplida')).toBeTruthy();
  });

  test('clampea valores fuera de rango y tolera meta 0', () => {
    const { getByText } = render(<BarraAgua actual={99} meta={10} />);
    expect(getByText('10 de 10 vasos · 2,5 L')).toBeTruthy();

    const { getByText: getByText2 } = render(<BarraAgua actual={-5} meta={0} />);
    expect(getByText2('0 de 0 vasos · 0,0 L')).toBeTruthy();
  });
});

describe('<StatsCard />', () => {
  test('renderiza icono, etiqueta y valor', () => {
    const { getByText } = render(
      <StatsCard icon="barbell" label="Rutinas" value="12" color="#123456" />
    );
    expect(getByText('Rutinas')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
  });
});

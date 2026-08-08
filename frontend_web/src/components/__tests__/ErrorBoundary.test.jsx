// frontend_web/src/components/__tests__/ErrorBoundary.test.jsx
// ISO 25010 · Fiabilidad: el ErrorBoundary captura errores de renderizado
// de un hijo y muestra el mensaje amigable en lugar de una pantalla blanca.
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

function Boom() {
  throw new Error('explosion intencional del test');
}

const renderBoundary = (children) => render(<ErrorBoundary>{children}</ErrorBoundary>);

describe('<ErrorBoundary />', () => {
  beforeEach(() => {
    // El error controlado loguea en consola; lo silenciamos en el test.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renderiza los hijos cuando no hay error', () => {
    renderBoundary(<h1>Contenido normal</h1>);
    expect(screen.getByText('Contenido normal')).toBeInTheDocument();
  });

  test('muestra el mensaje de error si un hijo lanza una excepción', () => {
    renderBoundary(<Boom />);

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText(/Ocurrió un error inesperado en la aplicación/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recargar página/ })).toBeInTheDocument();
  });

  test('en desarrollo expone los detalles del error capturado', () => {
    renderBoundary(<Boom />);

    expect(screen.getByText(/explosion intencional/)).toBeInTheDocument();
  });
});
// frontend_web/src/views/__tests__/AdminDashboard.test.jsx
// Smoke test del dashboard: KPIs, gráficas, búsqueda y edición del precio.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import AdminDashboard from "../AdminDashboard";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { useDashboard } from "../../hooks/useDashboard";
import { useAfiliados } from "../../hooks/useAfiliados";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useToast", () => ({ useToast: vi.fn() }));
vi.mock("../../hooks/useDashboard", () => ({ useDashboard: vi.fn() }));
vi.mock("../../hooks/useAfiliados", () => ({ useAfiliados: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("react-chartjs-2", () => ({
  Bar: () => <div data-testid="chart-bar" />,
  Line: () => <div data-testid="chart-line" />,
  Doughnut: () => <div data-testid="chart-doughnut" />,
}));

const KPIS = {
  total_afiliados: 3,
  afiliados_activos: 2,
  afiliados_inactivos: 1,
  ciclos_en_curso: 1,
  con_restricciones: 1,
  entrenadores: 1,
  recepcionistas: 1,
  ingresos: 170000,
  pagos_registrados: 2,
  proximos_vencimientos: 1,
  por_objetivo: [
    { objetivo: "Perdida de grasa", cantidad: 2 },
    { objetivo: "Aumento de masa", cantidad: 1 },
    { objetivo: "Mantenimiento", cantidad: 0 },
  ],
};

const AFILIADOS = [
  {
    id_usuario: 1,
    nombres: "Ana",
    apellidos: "Pérez",
    correo: "ana@metafit.com",
    objetivo_fisico: "Perdida de grasa",
    nivel_experiencia: "Intermedio",
    estado: "Activo",
    ciclo_activo: { numero_ciclo: 2 },
  },
  {
    id_usuario: 2,
    nombres: "Luis",
    apellidos: "Gómez",
    correo: "luis@metafit.com",
    objetivo_fisico: "Aumento de masa",
    nivel_experiencia: "Principiante",
    estado: "Inactivo",
    ciclo_activo: null,
  },
  {
    id_usuario: 3,
    nombres: "Marta",
    apellidos: "Ruiz",
    correo: "marta@metafit.com",
    objetivo_fisico: "Mantenimiento",
    nivel_experiencia: "Avanzado",
    estado: "Activo",
    ciclo_activo: null,
  },
];

let authAxiosMock;

function crearAuthAxios() {
  return {
    get: vi.fn((url) => {
      if (url.includes("precio-membresia")) return Promise.resolve({ data: { valor: "85000" } });
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
}

function renderView() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );
}

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authAxiosMock = crearAuthAxios();
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios: authAxiosMock });
    useToast.mockReturnValue({ toast: {}, showToast: vi.fn() });
    useDashboard.mockReturnValue({
      kpis: KPIS,
      loading: false,
      error: "",
      fetchKpis: vi.fn(),
    });
    useAfiliados.mockReturnValue({
      afiliados: AFILIADOS,
      loading: false,
      error: "",
      fetchAfiliados: vi.fn(),
    });
  });

  test("renderiza KPIs, gráficas, tabla y permite editar el precio", async () => {
    renderView();

    expect(await screen.findByText("Dashboard General")).toBeInTheDocument();
    expect(screen.getByText("Total Afiliados")).toBeInTheDocument();
    expect(screen.getByText("Ciclos en curso")).toBeInTheDocument();
    expect(screen.getByText("Pagos registrados")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.getAllByTestId("chart-bar").length).toBeGreaterThan(0);
    expect(screen.getByTestId("chart-line")).toBeInTheDocument();
    expect(screen.getByTestId("chart-doughnut")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Buscar/), {
      target: { value: "Ana" },
    });
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.queryByText("Luis Gómez")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Editar/));
    const inputPrecio = screen.getByRole("spinbutton");
    fireEvent.change(inputPrecio, { target: { value: "90000" } });
    fireEvent.click(screen.getByText(/Guardar/));
    await waitFor(() =>
      expect(authAxiosMock.put).toHaveBeenCalledWith(
        "/configuracion/precio-membresia",
        { valor: 90000 }
      )
    );
  });
});

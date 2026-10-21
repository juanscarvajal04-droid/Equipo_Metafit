// frontend_web/src/views/__tests__/Dashboard.test.jsx
// Smoke test del dashboard clásico: KPIs, distribución y estado operativo.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import Dashboard from "../Dashboard";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useToast", () => ({ useToast: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

const KPIS = {
  ingresos: 170000,
  pagos_registrados: 2,
  proximos_vencimientos: 1,
  total_afiliados: 3,
  afiliados_activos: 2,
  afiliados_inactivos: 1,
  entrenadores: 1,
  recepcionistas: 1,
  ciclos_en_curso: 2,
  con_restricciones: 1,
  por_objetivo: [
    { objetivo: "Perdida de grasa", cantidad: 1 },
    { objetivo: "Aumento de masa", cantidad: 1 },
  ],
};

let authAxiosMock;

function renderView() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authAxiosMock = {
      get: vi.fn().mockResolvedValue({ data: KPIS }),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    useAuth.mockReturnValue({ authAxios: authAxiosMock });
    useToast.mockReturnValue({ toast: {}, showToast: vi.fn() });
  });

  test("renderiza métricas y refresca", async () => {
    renderView();

    expect(await screen.findByText("Ingresos Totales")).toBeInTheDocument();
    expect(screen.getByText("$170.000")).toBeInTheDocument();
    expect(screen.getByText("Pagos Registrados")).toBeInTheDocument();
    expect(screen.getByText("Próximos Vencimientos")).toBeInTheDocument();
    expect(screen.getByText("Total Afiliados")).toBeInTheDocument();
    expect(screen.getByText("Ciclos Activos")).toBeInTheDocument();
    expect(screen.getByText("Perdida de grasa")).toBeInTheDocument();
    expect(screen.getByText("Aumento de masa")).toBeInTheDocument();
    expect(screen.getByText("2 personas")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Actualizar datos/));
    await waitFor(() => expect(authAxiosMock.get).toHaveBeenCalledTimes(2));

    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => expect(authAxiosMock.get).toHaveBeenCalledTimes(3));
  });

  test("muestra error si falla la carga", async () => {
    authAxiosMock.get.mockRejectedValueOnce(new Error("network"));
    renderView();
    expect(
      await screen.findByText(/No se pudieron cargar las estadísticas/)
    ).toBeInTheDocument();
  });
});

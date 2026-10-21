// frontend_web/src/views/__tests__/FinanzasView.test.jsx
// Smoke test del panel financiero: KPIs, gráficas, filtros y últimos pagos.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import FinanzasView from "../FinanzasView";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("react-chartjs-2", () => ({
  Bar: () => <div data-testid="finanzas-bar" />,
  Doughnut: () => <div data-testid="finanzas-doughnut" />,
}));

const METRICAS = {
  total_recaudado: 255000,
  ingresos_por_mes: [
    { mes: 10, anio: 2026, total: 170000 },
    { mes: 9, anio: 2026, total: 85000 },
  ],
  pagos_por_recepcionista: [
    {
      nombres: "Rita",
      apellidos: "López",
      total_recaudado: 255000,
      cantidad_pagos: 2,
    },
  ],
  ultimos_pagos: [
    {
      id_pago: 1,
      nombres_afiliado: "Ana",
      apellidos_afiliado: "Pérez",
      fecha_pago: "2026-10-01",
      valor_pagado: 85000,
      estado: "Pagado",
      nombres_recepcionista: "Rita",
      apellidos_recepcionista: "López",
    },
  ],
};

let authAxiosMock;

function crearAuthAxios() {
  return {
    get: vi.fn((url) => {
      if (url.startsWith("/pagos/metricas")) return Promise.resolve({ data: METRICAS });
      if (url === "/usuarios/recepcionistas") {
        return Promise.resolve({
          data: [{ id: 1, nombres: "Rita", apellidos: "López" }],
        });
      }
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
      <FinanzasView />
    </MemoryRouter>
  );
}

describe("FinanzasView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authAxiosMock = crearAuthAxios();
    useAuth.mockReturnValue({ authAxios: authAxiosMock });
  });

  test("renderiza métricas, gráficas, filtros y últimos pagos", async () => {
    renderView();

    expect(await screen.findByText("Panel de Finanzas")).toBeInTheDocument();
    expect(screen.getByText("Total recaudado")).toBeInTheDocument();
    expect(screen.getByText("Recaudado este mes")).toBeInTheDocument();
    expect(screen.getByText("Mejor recepcionista")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByTestId("finanzas-bar")).toBeInTheDocument();
    expect(screen.getByTestId("finanzas-doughnut")).toBeInTheDocument();

    const fechaInicio = screen.getByText("Fecha inicio").parentElement.querySelector("input");
    const fechaFin = screen.getByText("Fecha fin").parentElement.querySelector("input");
    fireEvent.change(fechaInicio, { target: { value: "2026-10-01" } });
    fireEvent.change(fechaFin, { target: { value: "2026-10-31" } });
    fireEvent.click(screen.getByText("Filtrar"));
    await waitFor(() =>
      expect(authAxiosMock.get).toHaveBeenCalledWith(
        "/pagos/metricas?fecha_inicio=2026-10-01&fecha_fin=2026-10-31"
      )
    );

    fireEvent.click(screen.getByText("Limpiar"));
    await waitFor(() =>
      expect(authAxiosMock.get).toHaveBeenCalledWith("/pagos/metricas")
    );
  });
});

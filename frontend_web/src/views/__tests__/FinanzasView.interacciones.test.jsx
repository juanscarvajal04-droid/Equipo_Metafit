// frontend_web/src/views/__tests__/FinanzasView.interacciones.test.jsx
// Cubre exportPDF, eventos globales (pago-registrado/visibilitychange),
// estados vacíos, agrupación "Otros" y el camino de error de carga.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";

const { docMock } = vi.hoisted(() => ({
  docMock: {
    setFontSize: vi.fn(),
    text: vi.fn(),
    setTextColor: vi.fn(),
    save: vi.fn(),
    lastAutoTable: { finalY: 100 },
  },
}));

vi.mock("jspdf", () => ({ default: vi.fn(function jsPDF() { return docMock; }) }));
vi.mock("jspdf-autotable", () => ({ default: vi.fn() }));
vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("react-chartjs-2", () => ({
  Bar: () => <div data-testid="finanzas-bar" />,
  Doughnut: () => <div data-testid="finanzas-doughnut" />,
}));

import FinanzasView from "../FinanzasView";
import { useAuth } from "../../context/AuthContext";

const METRICAS = {
  total_recaudado: 255000,
  ingresos_por_mes: [
    { mes: 10, anio: 2026, total: 170000 },
    { mes: 9, anio: 2026, total: 85000 },
  ],
  pagos_por_recepcionista: [
    { nombres: "Rita", apellidos: "López", total_recaudado: 255000, cantidad_pagos: 2 },
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
    {
      id_pago: 2,
      nombres_afiliado: "Luis",
      apellidos_afiliado: "Gómez",
      fecha_pago: "2026-10-02",
      valor_pagado: 50000,
      estado: "Pendiente",
    },
  ],
};

let authAxiosMock;

function crearAuthAxios(metricas = METRICAS) {
  return {
    get: vi.fn((url) => {
      if (url.startsWith("/pagos/metricas")) return Promise.resolve({ data: metricas });
      if (url === "/usuarios/recepcionistas") {
        return Promise.resolve({ data: [{ id: 1, nombres: "Rita", apellidos: "López" }] });
      }
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
}

function renderView(metricas = METRICAS) {
  authAxiosMock = crearAuthAxios(metricas);
  useAuth.mockReturnValue({ authAxios: authAxiosMock });
  return render(
    <MemoryRouter>
      <FinanzasView />
    </MemoryRouter>
  );
}

describe("FinanzasView — interacciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue: () => "" }));
  });

  test("exporta a PDF con jspdf y refresca con eventos globales", async () => {
    renderView();
    await screen.findByText("Panel de Finanzas");

    const llamadasMetricas = () =>
      authAxiosMock.get.mock.calls.filter((c) => c[0] === "/pagos/metricas").length;
    const iniciales = llamadasMetricas();

    window.dispatchEvent(new Event("pago-registrado"));
    await waitFor(() => expect(llamadasMetricas()).toBe(iniciales + 1));

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => expect(llamadasMetricas()).toBe(iniciales + 2));

    fireEvent.click(screen.getByText("Exportar a PDF"));

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    await waitFor(() => expect(jsPDF).toHaveBeenCalled());
    expect(autoTable).toHaveBeenCalled();
    expect(docMock.text).toHaveBeenCalledWith("MetaFit – Reporte de Finanzas", 14, 20);
    expect(docMock.text).toHaveBeenCalledWith("Total de pagos: 2", 14, expect.any(Number));
    expect(docMock.save).toHaveBeenCalledWith(expect.stringMatching(/^finanzas_metafit_\d{4}-\d{2}-\d{2}\.pdf$/));
  });

  test("filtra por recepcionista y exporta con periodo activo", async () => {
    renderView();
    await screen.findByText("Panel de Finanzas");

    fireEvent.change(screen.getByLabelText("Recepcionista"), { target: { value: "1" } });
    fireEvent.click(screen.getByText("Filtrar"));
    await waitFor(() =>
      expect(authAxiosMock.get).toHaveBeenCalledWith("/pagos/metricas?id_recepcionista=1")
    );

    fireEvent.click(screen.getByText("Exportar a PDF"));
    await waitFor(() => expect(docMock.save).toHaveBeenCalled());
    expect(docMock.text).toHaveBeenCalledWith("Periodo: Todo", 14, 28);
  });

  test("estados vacíos: sin ingresos, sin recepcionistas y sin pagos", async () => {
    renderView({
      total_recaudado: 0,
      ingresos_por_mes: [],
      pagos_por_recepcionista: [],
      ultimos_pagos: [],
    });

    expect(await screen.findByText("Sin datos de ingresos.")).toBeInTheDocument();
    expect(screen.getByText("Sin datos de recepcionistas.")).toBeInTheDocument();
    expect(screen.getByText("📭 No hay pagos registrados aun.")).toBeInTheDocument();
    expect(screen.queryByTestId("finanzas-bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("finanzas-doughnut")).not.toBeInTheDocument();
  });

  test("agrupa en Otros cuando hay más de 5 recepcionistas", async () => {
    const recepcionistas = Array.from({ length: 7 }, (_, i) => ({
      nombres: `Recepcionista${i + 1}`,
      apellidos: "Test",
      total_recaudado: 100000 - i * 10000,
      cantidad_pagos: 3,
    }));
    renderView({ ...METRICAS, pagos_por_recepcionista: recepcionistas });

    expect(await screen.findByTestId("finanzas-doughnut")).toBeInTheDocument();
    expect(screen.getByText("Mejor recepcionista")).toBeInTheDocument();
  });

  test("camino de error: no se pudieron cargar las métricas", async () => {
    authAxiosMock = crearAuthAxios();
    authAxiosMock.get = vi.fn((url) => {
      if (url === "/usuarios/recepcionistas") return Promise.reject(new Error("net"));
      if (url.startsWith("/pagos/metricas")) return Promise.reject(new Error("net"));
      return Promise.resolve({ data: {} });
    });
    useAuth.mockReturnValue({ authAxios: authAxiosMock });

    render(
      <MemoryRouter>
        <FinanzasView />
      </MemoryRouter>
    );

    expect(await screen.findByText("No se pudieron cargar las metricas financieras.")).toBeInTheDocument();
  });
});

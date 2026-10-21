// frontend_web/src/views/__tests__/ProgresoAfiliado.test.jsx
// Smoke test del progreso: KPIs, gráficas, ciclo, restricciones y observaciones.
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import ProgresoAfiliado from "../ProgresoAfiliado";
import {
  fetchAfiliado,
  fetchAguaAfiliado,
  ultimoRegistroFisico,
} from "../../services/progresoService";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useAutoRefresh", () => ({ default: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../components/graficos/ProgresoPesoChart", () => ({
  default: () => <div data-testid="peso-chart" />,
}));
vi.mock("../../components/graficos/ProgresoVolumenChart", () => ({
  default: () => <div data-testid="volumen-chart" />,
}));
vi.mock("../../services/progresoService", () => ({
  fetchAfiliado: vi.fn(),
  fetchAguaAfiliado: vi.fn(),
  ultimoRegistroFisico: vi.fn(),
}));

const AFILIADO = {
  id_usuario: 1,
  nombres: "Ana",
  apellidos: "Pérez",
  correo: "ana@metafit.com",
  objetivo_fisico: "Perdida de grasa",
  nivel_experiencia: "Intermedio",
  estatura_cm: 165,
  disponibilidad_semanal_dias: 4,
  estado_afiliacion: "Activo",
  ciclo_activo: {
    numero_ciclo: 2,
    fecha_inicio: "2026-10-01",
    fecha_fin: "2026-10-31",
    dias_restantes: 11,
  },
  restricciones: [
    { id_restriccion: 1, nombre_restriccion: "Asma", tipo: "Enfermedad" },
  ],
};

const HISTORIAL = [
  {
    id_progreso: 2,
    fecha_registro: "2026-10-15",
    peso_kg: 70,
    imc: 25.7,
    porcentaje_grasa: 18,
  },
  {
    id_progreso: 1,
    fecha_registro: "2026-10-01",
    peso_kg: 74,
    imc: 27.2,
    porcentaje_grasa: 20,
  },
];

const REGISTROS = [
  {
    id_registro: 1,
    fecha: "2026-10-10",
    nombre_ejercicio: "Sentadilla",
    notas: "Buena sesión",
    series: 4,
    repeticiones: 10,
    peso_utilizado_kg: 60,
  },
  {
    id_registro: 2,
    fecha: "2026-10-11",
    nombre_ejercicio: "Press banca",
    notas: "",
  },
];

function renderView() {
  return render(
    <MemoryRouter initialEntries={["/progreso/1"]}>
      <Routes>
        <Route path="/progreso/:id" element={<ProgresoAfiliado />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProgresoAfiliado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAfiliado.mockResolvedValue(AFILIADO);
    ultimoRegistroFisico.mockReturnValue({
      peso: 70,
      imc: 25.7,
      grasa: 18,
      fecha: "2026-10-15",
    });

    const iso = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    fetchAguaAfiliado.mockResolvedValue([
      { fecha: iso(hoy), vasos: 8, litros: 2 },
      { fecha: iso(ayer), vasos: 3, litros: 0.75 },
    ]);
    useAuth.mockReturnValue({
      authAxios: {
        get: vi.fn().mockResolvedValue({
          data: { historial: HISTORIAL, registros: REGISTROS },
        }),
      },
    });
  });

  test("renderiza métricas, información del afiliado y observaciones", async () => {
    renderView();

    expect(
      await screen.findByRole("heading", { name: /Progreso de Ana Pérez/ })
    ).toBeInTheDocument();
    expect(screen.getByText("Peso actual")).toBeInTheDocument();
    expect(screen.getByText("70 kg")).toBeInTheDocument();
    expect(screen.getByText("IMC")).toBeInTheDocument();
    expect(screen.getByText("25.7")).toBeInTheDocument();
    expect(screen.getByText("% grasa")).toBeInTheDocument();
    expect(screen.getByText("Registros físicos")).toBeInTheDocument();
    expect(screen.getByTestId("peso-chart")).toBeInTheDocument();
    expect(screen.getByTestId("volumen-chart")).toBeInTheDocument();
    expect(screen.getByText(/Ciclo 2/)).toBeInTheDocument();
    expect(screen.getByText(/Asma/)).toBeInTheDocument();
    expect(screen.getByText("Buena sesión")).toBeInTheDocument();
    expect(screen.queryByText("Sin observaciones registradas.")).not.toBeInTheDocument();

    expect(screen.getByText(/Agua — últimos 7 días/)).toBeInTheDocument();
    expect(screen.getByText("11 vasos")).toBeInTheDocument();
    expect(screen.getByText("2.75 L")).toBeInTheDocument();
    expect(fetchAguaAfiliado).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({ fechaInicio: expect.any(String), fechaFin: expect.any(String) })
    );

    fireEvent.click(screen.getByText(/Volver a Afiliados/));
  });

  test("muestra error cuando falla la carga del progreso", async () => {
    fetchAfiliado.mockRejectedValueOnce({
      response: { data: { error: "Afiliado no encontrado" } },
    });
    renderView();
    expect(await screen.findByText("Afiliado no encontrado")).toBeInTheDocument();
  });
});

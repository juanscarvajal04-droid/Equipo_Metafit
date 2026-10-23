// frontend_web/src/components/graficos/__tests__/graficos.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";

vi.mock("react-chartjs-2", () => ({
  Line: ({ data, options }) => {
    options?.plugins?.tooltip?.callbacks?.label?.({
      dataset: { label: "Peso (kg)" },
      parsed: { y: 70 },
    });
    return (
      <div data-testid="line-chart" data-datasets={data.datasets.length} data-labels={data.labels.length} />
    );
  },
}));

import ProgresoPesoChart from "../ProgresoPesoChart";
import ProgresoVolumenChart from "../ProgresoVolumenChart";

const HISTORIAL = [
  {
    fecha_registro: "2026-10-01",
    peso_kg: 74,
    imc: 27.2,
    porcentaje_grasa: 20,
    medida_cintura: 84,
    medida_brazo: 33,
    medida_pierna: 57,
  },
  {
    fecha_registro: "2026-10-15",
    peso_kg: 70,
    imc: 25.7,
    porcentaje_grasa: 18,
    medida_cintura: 80,
    medida_brazo: 32,
    medida_pierna: 56,
  },
];

describe("ProgresoPesoChart", () => {
  test("renderiza la gráfica con datos de peso e IMC", () => {
    render(<ProgresoPesoChart historial={HISTORIAL} />);
    const chart = screen.getByTestId("line-chart");
    expect(chart).toHaveAttribute("data-datasets", "2");
    expect(chart).toHaveAttribute("data-labels", "2");
  });

  test("sin datos muestra el estado vacío", () => {
    render(<ProgresoPesoChart historial={[]} />);
    expect(screen.getByText("Sin datos de peso registrados")).toBeInTheDocument();
  });

  test("con registros sin peso también muestra vacío", () => {
    render(<ProgresoPesoChart historial={[{ fecha_registro: "2026-10-01" }]} />);
    expect(screen.getByText("Sin datos de peso registrados")).toBeInTheDocument();
  });
});

describe("ProgresoVolumenChart", () => {
  test("renderiza la gráfica de medidas", () => {
    render(<ProgresoVolumenChart historial={HISTORIAL} />);
    const chart = screen.getByTestId("line-chart");
    expect(chart).toHaveAttribute("data-datasets", "4");
  });

  test("sin medidas ni grasa muestra el estado vacío", () => {
    render(<ProgresoVolumenChart historial={[{ fecha_registro: "2026-10-01" }]} />);
    expect(screen.getByText("Sin medidas corporales registradas")).toBeInTheDocument();
  });
});

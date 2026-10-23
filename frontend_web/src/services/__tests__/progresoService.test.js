// frontend_web/src/services/__tests__/progresoService.test.js
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../api", () => ({
  default: { get: vi.fn() },
}));

import api from "../api";
import {
  fetchAfiliado,
  fetchHistorialFisico,
  fetchEjerciciosDisponibles,
  fetchAguaAfiliado,
  calcularEvolucion,
  ultimoRegistroFisico,
} from "../progresoService";

const HISTORIAL = [
  { fecha_registro: "2026-10-15", peso_kg: "70", imc: "25.7", porcentaje_grasa: "18" },
  { fecha_registro: null, peso_kg: 99 },
  { fecha_registro: "2026-10-01", peso_kg: 74, imc: 27.2, porcentaje_grasa: 20 },
];

describe("progresoService — llamadas a la API", () => {
  beforeEach(() => vi.clearAllMocks());

  test("fetchAfiliado consulta el perfil", async () => {
    api.get.mockResolvedValueOnce({ data: { id_usuario: 1 } });
    await expect(fetchAfiliado(1)).resolves.toEqual({ id_usuario: 1 });
    expect(api.get).toHaveBeenCalledWith("/afiliados/1");
  });

  test("fetchHistorialFisico consulta el progreso", async () => {
    api.get.mockResolvedValueOnce({ data: HISTORIAL });
    await expect(fetchHistorialFisico("1")).resolves.toBe(HISTORIAL);
    expect(api.get).toHaveBeenCalledWith("/afiliados/1/progreso");
  });

  test("fetchEjerciciosDisponibles consulta el catálogo filtrado", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await fetchEjerciciosDisponibles(2);
    expect(api.get).toHaveBeenCalledWith("/afiliados/2/ejercicios-disponibles");
  });

  test("fetchAguaAfiliado manda params y normaliza a array", async () => {
    api.get.mockResolvedValueOnce({ data: [{ fecha: "2026-10-01", vasos: 8 }] });
    const res = await fetchAguaAfiliado(1, { fechaInicio: "2026-10-01", fechaFin: "2026-10-07" });
    expect(res).toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/afiliados/1/agua", {
      params: { fechaInicio: "2026-10-01", fechaFin: "2026-10-07" },
    });

    api.get.mockResolvedValueOnce({ data: null });
    await expect(fetchAguaAfiliado(1)).resolves.toEqual([]);
  });
});

describe("progresoService — transformación", () => {
  test("calcularEvolucion ordena y normaliza números", () => {
    const { etiquetas, pesos, imcs, grasa } = calcularEvolucion(HISTORIAL);
    expect(etiquetas).toHaveLength(2);
    expect(pesos).toEqual([74, 70]);
    expect(imcs).toEqual([27.2, 25.7]);
    expect(grasa).toEqual([20, 18]);
  });

  test("calcularEvolucion tolera entradas vacías y nulas", () => {
    expect(calcularEvolucion()).toEqual({ etiquetas: [], pesos: [], imcs: [], grasa: [] });
    const res = calcularEvolucion([null, { fecha_registro: "2026-10-01" }]);
    expect(res.pesos).toEqual([null]);
  });

  test("ultimoRegistroFisico devuelve el primero o nulls", () => {
    expect(ultimoRegistroFisico(HISTORIAL)).toEqual({
      peso: 70,
      imc: 25.7,
      grasa: 18,
      fecha: "2026-10-15",
    });
    expect(ultimoRegistroFisico()).toEqual({ peso: null, imc: null, grasa: null, fecha: null });
    expect(ultimoRegistroFisico([{ fecha_registro: "2026-10-01" }])).toEqual({
      peso: null,
      imc: null,
      grasa: null,
      fecha: "2026-10-01",
    });
  });
});

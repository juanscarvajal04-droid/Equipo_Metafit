import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../api";
import {
  TIPOS_RESTRICCION,
  TIPO_ICONO,
  FORM_RESTRICCION_VACIO,
  fetchRestricciones,
  crearRestriccion,
  actualizarRestriccion,
  eliminarRestriccion,
  fetchRestriccionesPorAfiliado,
  asignarRestriccion,
  removerRestriccion,
} from "../restriccionService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("restriccionService", () => {
  test("expone catálogos y formulario vacío", () => {
    expect(TIPOS_RESTRICCION).toContain("Alergia");
    expect(TIPO_ICONO.Lesion).toBeDefined();
    expect(FORM_RESTRICCION_VACIO.tipo).toBe("Enfermedad");
  });

  test("delega el CRUD del catálogo en la API", async () => {
    api.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    await expect(fetchRestricciones()).resolves.toEqual([{ id: 1 }]);
    expect(api.get).toHaveBeenCalledWith("/catalogo/restricciones");

    api.post.mockResolvedValueOnce({ data: { id: 2 } });
    await expect(crearRestriccion({ nombre_restriccion: "Lactosa" }))
      .resolves.toEqual({ id: 2 });
    expect(api.post).toHaveBeenCalledWith("/catalogo/restricciones", {
      nombre_restriccion: "Lactosa",
    });

    api.put.mockResolvedValueOnce({ data: { message: "ok" } });
    await expect(actualizarRestriccion(2, { tipo: "Alergia" }))
      .resolves.toEqual({ message: "ok" });
    expect(api.put).toHaveBeenCalledWith("/catalogo/restricciones/2", { tipo: "Alergia" });

    api.delete.mockResolvedValueOnce({ data: { message: "ok" } });
    await expect(eliminarRestriccion(2)).resolves.toEqual({ message: "ok" });
    expect(api.delete).toHaveBeenCalledWith("/catalogo/restricciones/2");
  });

  test("consulta y modifica restricciones de un afiliado", async () => {
    api.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    await expect(fetchRestriccionesPorAfiliado(9)).resolves.toEqual([{ id: 1 }]);
    expect(api.get).toHaveBeenCalledWith("/afiliados/9/restricciones");

    api.post.mockResolvedValueOnce({ data: { message: "asignada" } });
    await expect(asignarRestriccion(9, 3)).resolves.toEqual({ message: "asignada" });
    expect(api.post).toHaveBeenCalledWith("/afiliados/9/restricciones", {
      id_restriccion: 3,
    });

    api.delete.mockResolvedValueOnce({ data: { message: "removida" } });
    await expect(removerRestriccion(9, 3)).resolves.toEqual({ message: "removida" });
    expect(api.delete).toHaveBeenCalledWith("/afiliados/9/restricciones/3");
  });
});

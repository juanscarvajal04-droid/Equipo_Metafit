// frontend_web/src/services/__tests__/afiliadosService.test.js
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from "../api";
import {
  OBJETIVO_CONFIG,
  OBJETIVOS,
  NIVELES,
  ESTADOS,
  SEXOS,
  MUSCULOS,
  TABS_POR_ROL,
  FORM_VACIO,
  getId,
  nombreCompleto,
  inicial,
  cicloActivo,
  toDateInput,
  buildCrearPayload,
  buildAfiliadoLocal,
  fetchAfiliados,
  crearAfiliado,
  actualizarAfiliado,
  cambiarEstadoAfiliado,
} from "../afiliadosService";

describe("afiliadosService — datos de dominio", () => {
  test("expone catálogos y formulario vacío", () => {
    expect(OBJETIVO_CONFIG["Pérdida de grasa"].icono).toBe("🔥");
    expect(OBJETIVOS).toHaveLength(3);
    expect(NIVELES).toContain("Avanzado");
    expect(ESTADOS).toContain("Pendiente");
    expect(SEXOS).toContain("Otro");
    expect(MUSCULOS).toContain("Piernas");
    expect(TABS_POR_ROL.Entrenador).toEqual(["Progreso Físico", "Ciclo Activo"]);
    expect(FORM_VACIO.estado).toBe("Activo");
  });
});

describe("afiliadosService — helpers puros", () => {
  test("getId prioriza id_usuario y cae a _id/id", () => {
    expect(getId({ id_usuario: 1 })).toBe(1);
    expect(getId({ _id: "abc" })).toBe("abc");
    expect(getId({ id: 9 })).toBe(9);
  });

  test("nombreCompleto e inicial", () => {
    expect(nombreCompleto({ nombres: "Ana", apellidos: "Pérez" })).toBe("Ana Pérez");
    expect(nombreCompleto({})).toBe("Sin nombre");
    expect(inicial({ nombres: "ana" })).toBe("A");
    expect(inicial({ correo: "luis@metafit.com" })).toBe("L");
    expect(inicial({})).toBe("?");
  });

  test("cicloActivo y toDateInput", () => {
    expect(cicloActivo({ ciclo_activo: { id: 1 } })).toEqual({ id: 1 });
    expect(cicloActivo({})).toBeNull();

    expect(toDateInput("2026-10-21T05:00:00.000Z")).toBe("2026-10-21");
    expect(toDateInput("2026-10-21 08:30:00")).toBe("2026-10-21");
    expect(toDateInput(new Date("2026-01-02T12:00:00Z"))).toBe("2026-01-02");
    expect(toDateInput("")).toBe("");
    expect(toDateInput(123)).toBe("");
  });

  test("buildCrearPayload normaliza el formulario", () => {
    const payload = buildCrearPayload({
      nombres: "Ana",
      apellidos: "Pérez",
      correo: "ana@metafit.com",
      documento: "123",
      fecha_nacimiento: "1995-04-12T00:00:00.000Z",
      sexo: "Femenino",
      estatura_cm: "165.5",
      estado: "Inactivo",
      objetivo_fisico: "Mantenimiento",
      grupo_muscular_prioritario: "Piernas",
      nivel_experiencia: "Avanzado",
      disponibilidad_semanal_dias: "5",
    });
    expect(payload).toMatchObject({
      nombres: "Ana",
      telefono: "",
      direccion: "",
      fecha_nacimiento: "1995-04-12",
      estatura_cm: 165.5,
      estado_afiliacion: "Inactivo",
      disponibilidad_semanal_dias: 5,
    });

    const sinOpcionales = buildCrearPayload({ fecha_nacimiento: "", estatura_cm: "", disponibilidad_semanal_dias: "" });
    expect(sinOpcionales.fecha_nacimiento).toBeNull();
    expect(sinOpcionales.estatura_cm).toBeNull();
    expect(sinOpcionales.estado_afiliacion).toBe("Activo");
    expect(sinOpcionales.disponibilidad_semanal_dias).toBe(3);
  });

  test("buildAfiliadoLocal agrega id, estado y defaults", () => {
    const local = buildAfiliadoLocal({ nombres: "Ana", estado_afiliacion: "Activo" }, 10);
    expect(local).toEqual({
      nombres: "Ana",
      estado_afiliacion: "Activo",
      id_usuario: 10,
      estado: "Activo",
      restricciones: [],
      ciclo_activo: null,
    });
  });
});

describe("afiliadosService — CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fetchAfiliados devuelve la data", async () => {
    api.get.mockResolvedValueOnce({ data: [{ id_usuario: 1 }] });
    await expect(fetchAfiliados()).resolves.toEqual([{ id_usuario: 1 }]);
    expect(api.get).toHaveBeenCalledWith("/afiliados");
  });

  test("crearAfiliado devuelve payload e id", async () => {
    api.post.mockResolvedValueOnce({ data: { id: 77 } });
    const res = await crearAfiliado({ nombres: "Ana", apellidos: "Pérez", documento: "1" });
    expect(res.idRetornado).toBe(77);
    expect(res.payload.nombres).toBe("Ana");
    expect(api.post).toHaveBeenCalledWith("/afiliados", expect.objectContaining({ nombres: "Ana" }));
  });

  test("actualizarAfiliado hace PATCH", async () => {
    api.patch.mockResolvedValueOnce({ data: {} });
    await actualizarAfiliado(3, { nombres: "Nuevo" });
    expect(api.patch).toHaveBeenCalledWith("/afiliados/3", { nombres: "Nuevo" });
  });

  test("cambiarEstadoAfiliado devuelve la data", async () => {
    api.patch.mockResolvedValueOnce({ data: { estado: "Activo" } });
    await expect(cambiarEstadoAfiliado(5, "Activo")).resolves.toEqual({ estado: "Activo" });
    expect(api.patch).toHaveBeenCalledWith("/afiliados/5", { estado: "Activo" });
  });
});

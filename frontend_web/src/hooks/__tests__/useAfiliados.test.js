// frontend_web/src/hooks/__tests__/useAfiliados.test.js
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));

import { useAuth } from "../../context/AuthContext";
import { useAfiliados } from "../useAfiliados";

function crearAxios(overrides = {}) {
  return {
    get: vi.fn().mockResolvedValue({ data: [{ id_usuario: 1 }, { id_usuario: 2 }] }),
    post: vi.fn().mockResolvedValue({ data: { id: 9 } }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    ...overrides,
  };
}

describe("useAfiliados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("carga afiliados, crea, actualiza y elimina", async () => {
    const authAxios = crearAxios();
    useAuth.mockReturnValue({ authAxios });
    const { result } = renderHook(() => useAfiliados());

    await act(async () => {
      await result.current.fetchAfiliados();
    });
    expect(result.current.afiliados).toHaveLength(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");

    await act(async () => {
      const creado = await result.current.createAfiliado({ nombres: "Ana" });
      expect(creado).toEqual({ id: 9 });
    });

    await act(async () => {
      await result.current.updateAfiliado(1, { nombres: "Nuevo" });
    });
    expect(authAxios.patch).toHaveBeenCalledWith("/afiliados/1", { nombres: "Nuevo" });

    await act(async () => {
      await result.current.deleteAfiliado(1);
    });
    expect(result.current.afiliados).toHaveLength(1);
  });

  test("data no array se normaliza a [] y error capturado", async () => {
    const authAxios = crearAxios({
      get: vi.fn()
        .mockResolvedValueOnce({ data: null })
        .mockRejectedValueOnce(new Error("boom")),
    });
    useAuth.mockReturnValue({ authAxios });
    const { result } = renderHook(() => useAfiliados());

    await act(async () => {
      await result.current.fetchAfiliados();
    });
    expect(result.current.afiliados).toEqual([]);

    await act(async () => {
      await result.current.fetchAfiliados();
    });
    await waitFor(() => expect(result.current.error).toBe("No se pudieron cargar los afiliados."));
    expect(result.current.loading).toBe(false);

    act(() => result.current.setAfiliados([{ id_usuario: 3 }]));
    expect(result.current.afiliados).toHaveLength(1);
    act(() => result.current.setError("manual"));
    expect(result.current.error).toBe("manual");
  });
});

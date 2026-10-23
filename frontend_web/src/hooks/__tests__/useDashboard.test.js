// frontend_web/src/hooks/__tests__/useDashboard.test.js
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));

import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../useDashboard";
import { useToast } from "../useToast";

describe("useDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("carga KPIs correctamente", async () => {
    const authAxios = { get: vi.fn().mockResolvedValue({ data: { total_afiliados: 10 } }) };
    useAuth.mockReturnValue({ authAxios });
    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.fetchKpis();
    });
    expect(result.current.kpis).toEqual({ total_afiliados: 10 });
    expect(result.current.loading).toBe(false);
    expect(authAxios.get).toHaveBeenCalledWith("/dashboard/kpis");
  });

  test("captura error de KPIs", async () => {
    const authAxios = { get: vi.fn().mockRejectedValue(new Error("fail")) };
    useAuth.mockReturnValue({ authAxios });
    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.fetchKpis();
    });
    await waitFor(() =>
      expect(result.current.error).toBe("No se pudieron cargar las estadísticas del sistema.")
    );
  });
});

describe("useToast", () => {
  test("muestra y oculta el toast", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Afiliado creado", "success");
    });
    expect(result.current.toast).toEqual({ msg: "Afiliado creado", type: "success" });

    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(result.current.toast).toEqual({ msg: "", type: "success" });
    vi.useRealTimers();
  });
});

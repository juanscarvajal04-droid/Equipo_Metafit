// frontend_web/src/hooks/__tests__/useAutoRefresh.test.js
// Cobertura del hook de polling: ejecución por intervalo y manejo de errores.
import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import useAutoRefresh from "../useAutoRefresh";

describe("useAutoRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("ejecuta el fetch en cada intervalo", async () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useAutoRefresh(fetchFn, 1000));

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    unmount();
  });

  test("captura errores síncronos y responde a foco/visibilidad", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchFn = vi.fn(() => {
      throw new Error("sync boom");
    });
    const { result, unmount } = renderHook(() => useAutoRefresh(fetchFn, 1000));

    act(() => {
      result.current();
    });
    expect(errorSpy).toHaveBeenCalledWith("[useAutoRefresh]", expect.any(Error));

    fetchFn.mockReturnValue(undefined);
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    unmount();
  });

  test("captura errores sin dejar el polling bloqueado", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("boom"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useAutoRefresh(fetchFn, 1000));

    await act(async () => {
      result.current();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
    unmount();
  });
});

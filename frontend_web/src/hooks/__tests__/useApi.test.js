import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { useApi } from "../useApi";

describe("useApi", () => {
  test("ejecuta la función, expone datos y llama onSuccess", async () => {
    const apiFunction = vi.fn().mockResolvedValue([{ id: 1 }]);
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useApi(apiFunction, { initialData: [], onSuccess })
    );

    let response;
    await act(async () => {
      response = await result.current.execute(7);
    });

    expect(apiFunction).toHaveBeenCalledWith(7);
    expect(response).toEqual([{ id: 1 }]);
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith([{ id: 1 }]);
  });

  test("expone el mensaje del backend, llama onError y relanza", async () => {
    const error = { response: { data: { error: "Sin permisos" } } };
    const apiFunction = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();
    const { result } = renderHook(() => useApi(apiFunction, { onError }));

    await act(async () => {
      await expect(result.current.execute()).rejects.toBe(error);
    });

    expect(result.current.error).toBe("Sin permisos");
    expect(result.current.loading).toBe(false);
    expect(onError).toHaveBeenCalledWith(error);
  });

  test("usa err.message o el mensaje genérico y permite reset", async () => {
    const apiFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error("fallo de red"))
      .mockRejectedValueOnce({});
    const { result } = renderHook(() => useApi(apiFunction, { initialData: { base: true } }));

    await act(async () => {
      await expect(result.current.execute()).rejects.toBeDefined();
    });
    expect(result.current.error).toBe("fallo de red");

    await act(async () => {
      await expect(result.current.execute()).rejects.toBeDefined();
    });
    expect(result.current.error).toBe("Error en la petición");

    act(() => result.current.reset());
    expect(result.current.data).toEqual({ base: true });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

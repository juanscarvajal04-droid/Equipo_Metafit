import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { useMutation } from "../useMutation";

describe("useMutation", () => {
  test("ejecuta la mutación, guarda datos y llama onSuccess", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 9 });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useMutation(mutationFn, { onSuccess }));

    let response;
    await act(async () => {
      response = await result.current.mutate("payload");
    });

    expect(mutationFn).toHaveBeenCalledWith("payload");
    expect(response).toEqual({ id: 9 });
    expect(result.current.data).toEqual({ id: 9 });
    expect(result.current.loading).toBe(false);
    expect(onSuccess).toHaveBeenCalledWith({ id: 9 });
  });

  test("expone el error del backend, llama onError y relanza", async () => {
    const error = { response: { data: { error: "Duplicado" } } };
    const mutationFn = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();
    const { result } = renderHook(() => useMutation(mutationFn, { onError }));

    await act(async () => {
      await expect(result.current.mutate()).rejects.toBe(error);
    });

    expect(result.current.error).toBe("Duplicado");
    expect(onError).toHaveBeenCalledWith(error);
  });

  test("usa err.message, mensaje genérico y reset", async () => {
    const mutationFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("sin red"))
      .mockRejectedValueOnce({});
    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await expect(result.current.mutate()).rejects.toBeDefined();
    });
    expect(result.current.error).toBe("sin red");

    await act(async () => {
      await expect(result.current.mutate()).rejects.toBeDefined();
    });
    expect(result.current.error).toBe("Error en la operación");

    act(() => result.current.reset());
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

// ============================================================
// src/hooks/useMutation.js — MetaFit Generic mutation hook
//
// Encapsula operaciones de escritura (POST/PUT/PATCH/DELETE)
// exponiendo mutate(), loading, error y data del resultado.
// ============================================================

import { useState, useCallback } from "react";

export function useMutation(mutationFn, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await mutationFn(...args);
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err.response?.data?.error || err.message || "Error en la operación";
        setError(message);
        options.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutationFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
}
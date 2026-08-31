// ============================================================
// src/hooks/useApi.js — MetaFit Generic GET hook
//
// Encapsula la carga asíncrona de una función de servicio y
// expone su estado (data / loading / error) + ejecutor.
// Evita repetir el patrón useState + try/catch en cada vista.
// ============================================================

import { useState, useCallback } from "react";

export function useApi(apiFunction, options = {}) {
  const [data, setData] = useState(options.initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err.response?.data?.error || err.message || "Error en la petición";
        setError(message);
        options.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(options.initialData ?? null);
    setError(null);
    setLoading(false);
  }, [options.initialData]);

  return { data, loading, error, execute, reset };
}
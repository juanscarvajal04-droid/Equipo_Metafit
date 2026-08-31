import { useState, useEffect, useCallback } from 'react';

export default function useApi(apiFunction, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFunction();
      setData(res.data);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Error de conexión. Intentá de nuevo.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
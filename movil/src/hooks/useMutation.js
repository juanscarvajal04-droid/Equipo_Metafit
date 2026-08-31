import { useState, useCallback } from 'react';

export default function useMutation(mutationFunction, { onSuccess, onError } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const res = await mutationFunction(data);
        if (onSuccess) onSuccess(res);
        return res;
      } catch (err) {
        const msg = err?.response?.data?.error || 'Error de conexión. Intentá de nuevo.';
        setError(msg);
        if (onError) onError(err, msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFunction, onSuccess, onError]
  );

  return { execute, loading, error, resetError: () => setError(null) };
}
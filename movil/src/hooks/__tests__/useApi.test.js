// movil/src/hooks/__tests__/useApi.test.js
// Cubre la ejecución inicial del hook y su estado de carga.
import { act, renderHook, waitFor } from '@testing-library/react-native';
import useApi from '../useApi';

describe('useApi', () => {
  test('ejecuta la función y expone los datos', async () => {
    const apiFn = jest.fn().mockResolvedValue({ data: { ok: true } });
    const { result } = renderHook(() => useApi(apiFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ ok: true });
    expect(result.current.error).toBeNull();
  });

  test('expone el mensaje del backend, de Error y el fallback genérico', async () => {
    const apiFn = jest
      .fn()
      .mockRejectedValueOnce({ response: { data: { error: 'boom backend' } } })
      .mockRejectedValueOnce(new Error('boom local'))
      .mockRejectedValueOnce({})
      .mockResolvedValueOnce({ data: { ok: true } });

    const { result } = renderHook(() => useApi(apiFn));
    await waitFor(() => expect(result.current.error).toBe('boom backend'));

    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe('boom local');

    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe('Error de conexión. Intentá de nuevo.');

    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({ ok: true });
  });
});

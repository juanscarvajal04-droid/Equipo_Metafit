// movil/src/hooks/__tests__/useApi.test.js
// Cubre la ejecución inicial del hook y su estado de carga.
import { renderHook, waitFor } from '@testing-library/react-native';
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
});

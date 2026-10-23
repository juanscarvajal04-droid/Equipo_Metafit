// movil/src/hooks/__tests__/useMutation.test.js
// Cubre éxito, error de API, error genérico y resetError.
import { renderHook, act, waitFor } from '@testing-library/react-native';
import useMutation from '../useMutation';

describe('useMutation', () => {
  test('ejecuta la mutación y llama a onSuccess', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ data: { id: 1 } });
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useMutation(mutationFn, { onSuccess }));

    let res;
    await act(async () => {
      res = await result.current.execute({ nombre: 'Ana' });
    });

    expect(res).toEqual({ data: { id: 1 } });
    expect(mutationFn).toHaveBeenCalledWith({ nombre: 'Ana' });
    expect(onSuccess).toHaveBeenCalledWith({ data: { id: 1 } });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('expone el error del backend y llama a onError', async () => {
    const err = { response: { data: { error: 'Documento duplicado' } } };
    const mutationFn = jest.fn().mockRejectedValue(err);
    const onError = jest.fn();
    const { result } = renderHook(() => useMutation(mutationFn, { onError }));

    let res;
    await act(async () => {
      res = await result.current.execute({});
    });

    expect(res).toBeNull();
    await waitFor(() => expect(result.current.error).toBe('Documento duplicado'));
    expect(onError).toHaveBeenCalledWith(err, 'Documento duplicado');
  });

  test('error genérico y resetError', async () => {
    const mutationFn = jest.fn().mockRejectedValue(new Error('sin conexión'));
    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await result.current.execute({});
    });
    await waitFor(() =>
      expect(result.current.error).toBe('Error de conexión. Intentá de nuevo.')
    );

    act(() => result.current.resetError());
    expect(result.current.error).toBeNull();
  });
});

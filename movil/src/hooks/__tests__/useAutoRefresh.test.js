// movil/src/hooks/__tests__/useAutoRefresh.test.js
// Cobertura del polling móvil: ejecución por intervalo y manejo de errores.
import { renderHook, act } from '@testing-library/react-native';
import useAutoRefresh from '../useAutoRefresh';

describe('useAutoRefresh (móvil)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('ejecuta el fetch en cada intervalo', async () => {
    const fetchFn = jest.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useAutoRefresh(fetchFn, 1000));

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    unmount();
  });

  test('captura errores sin dejar el polling bloqueado', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('boom'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useAutoRefresh(fetchFn, 1000));

    await act(async () => {
      result.current();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();
    unmount();
  });
});

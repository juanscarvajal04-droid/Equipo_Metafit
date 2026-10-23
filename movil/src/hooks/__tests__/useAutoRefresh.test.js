// movil/src/hooks/__tests__/useAutoRefresh.test.js
// Cobertura del polling móvil: ejecución por intervalo y manejo de errores.
import { AppState } from 'react-native';
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

  test('captura excepciones sincrónicas y libera el bloqueo', () => {
    const fetchFn = jest
      .fn()
      .mockImplementationOnce(() => { throw new Error('sync boom'); })
      .mockResolvedValueOnce(undefined);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useAutoRefresh(fetchFn, 1000));

    act(() => { result.current(); });
    expect(warnSpy).toHaveBeenCalledWith('[useAutoRefresh]', expect.any(Error));

    act(() => { result.current(); });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    unmount();
  });

  test('refresca al volver la app a estado activo y limpia la suscripción', () => {
    let listener;
    const subscription = { remove: jest.fn() };
    const addSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, cb) => {
        listener = cb;
        return subscription;
      });
    const fetchFn = jest.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useAutoRefresh(fetchFn, 1000));

    act(() => { listener('active'); });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    act(() => { listener('background'); });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    unmount();
    expect(subscription.remove).toHaveBeenCalled();
    addSpy.mockRestore();
  });
});

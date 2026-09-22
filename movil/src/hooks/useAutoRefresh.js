// movil/src/hooks/useAutoRefresh.js
// Sincronización en tiempo real por polling (QA persistencia — Fase 3).
// Ejecuta fetchFn cada intervalMs y al volver la app a estado activo.
// Compatible con Expo SDK 55 (AppState de react-native-core); APIs estables
// también en SDK 56 según docs oficiales.
import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';

export default function useAutoRefresh(fetchFn, intervalMs = 10000) {
  const fnRef = useRef(fetchFn);
  fnRef.current = fetchFn;
  const runningRef = useRef(false);

  const refresh = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    let p;
    try {
      p = Promise.resolve(fnRef.current());
    } catch (err) {
      console.warn('[useAutoRefresh]', err);
      runningRef.current = false;
      return;
    }
    if (p && typeof p.catch === 'function') {
      p.catch((err) => console.warn('[useAutoRefresh]', err));
    }
    Promise.resolve(p).finally(() => { runningRef.current = false; });
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [intervalMs, refresh]);

  return refresh;
}
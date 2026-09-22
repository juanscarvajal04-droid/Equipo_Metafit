// frontend_web/src/hooks/useAutoRefresh.js
// Sincronización en tiempo real por polling (QA persistencia — Fase 3).
// Hook reutilizable: ejecuta fetchFn cada intervalMs y además al recuperar
// el foco/visibilidad de la pestaña. Ignora errores y evita polls solapados.
import { useEffect, useRef, useCallback } from "react";

export default function useAutoRefresh(fetchFn, intervalMs = 10000) {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;
  const runningRef = useRef(false);

  const refresh = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    let p;
    try {
      p = Promise.resolve(fetchRef.current());
    } catch (err) {
      console.error("[useAutoRefresh]", err);
      runningRef.current = false;
      return;
    }
    if (p && typeof p.catch === "function") {
      p.catch((err) => console.error("[useAutoRefresh]", err));
    }
    Promise.resolve(p).finally(() => { runningRef.current = false; });
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    const onFocus = () => refresh();
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, refresh]);

  return refresh;
}
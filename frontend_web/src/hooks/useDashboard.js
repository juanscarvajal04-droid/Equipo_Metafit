// frontend_web/src/hooks/useDashboard.js
// ISO 25000 — Separación de lógica de estado de la interfaz (modularidad).
// Consume el endpoint /dashboard/kpis y expone los KPIs con estados reactivos.
import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Hook personalizado para los KPIs del dashboard.
 *
 * El endpoint /dashboard/kpis devuelve datos agregados a nivel de BD,
 * sin límite de paginación, garantizando cifras exactas.
 *
 * @returns {{
 *   kpis: object|null,
 *   loading: boolean,
 *   error: string,
 *   fetchKpis: () => Promise<void>
 * }}
 */
export function useDashboard() {
  const { authAxios, logout } = useAuth();

  const [kpis,    setKpis]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  /**
   * Carga los KPIs del dashboard.
   * Respuesta esperada:
   * {
   *   total_afiliados, afiliados_activos, afiliados_inactivos,
   *   ciclos_en_curso, con_restricciones,
   *   entrenadores, recepcionistas,
   *   ingresos, pagos_registrados, proximos_vencimientos,
   *   por_objetivo: [{ objetivo, cantidad }]
   * }
   */
  const fetchKpis = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authAxios.get("/dashboard/kpis");
      setKpis(data);
    } catch (err) {
      console.error("[useDashboard] fetchKpis:", err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        logout();
      } else {
        setError("No se pudieron cargar las estadísticas del sistema.");
      }
    } finally {
      setLoading(false);
    }
  }, [authAxios, logout]);

  return { kpis, loading, error, fetchKpis };
}

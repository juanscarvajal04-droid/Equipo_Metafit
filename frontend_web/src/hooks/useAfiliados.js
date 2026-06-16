// frontend_web/src/hooks/useAfiliados.js
// ISO 25000 — Separación de lógica de estado de la interfaz (modularidad).
// Encapsula todo el acceso a la API de afiliados con estados loading/error.
import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getId } from "../utils/afiliadoHelpers";

/**
 * Hook personalizado para la gestión completa de afiliados.
 *
 * @returns {{
 *   afiliados: Array,
 *   loading: boolean,
 *   error: string,
 *   fetchAfiliados: () => Promise<void>,
 *   createAfiliado: (data: object) => Promise<object>,
 *   updateAfiliado: (id: number|string, data: object) => Promise<void>,
 *   deleteAfiliado: (id: number|string) => Promise<void>,
 *   setAfiliados: Function
 * }}
 */
export function useAfiliados() {
  const { authAxios, logout } = useAuth();

  const [afiliados, setAfiliados] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  /** Carga la lista completa de afiliados desde el backend */
  const fetchAfiliados = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authAxios.get("/afiliados");
      setAfiliados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[useAfiliados] fetchAfiliados:", err);
      if (err?.response?.status === 401) {
        logout();
      } else {
        setError("No se pudieron cargar los afiliados.");
      }
    } finally {
      setLoading(false);
    }
  }, [authAxios, logout]);

  /**
   * Crea un nuevo afiliado.
   * @param {object} data — payload normalizado para POST /afiliados
   * @returns {object} { id, message }
   */
  const createAfiliado = useCallback(async (data) => {
    const response = await authAxios.post("/afiliados", data);
    return response.data;
  }, [authAxios]);

  /**
   * Actualiza un afiliado existente (PATCH parcial).
   * @param {number|string} id
   * @param {object} data — campos a actualizar
   */
  const updateAfiliado = useCallback(async (id, data) => {
    await authAxios.patch(`/afiliados/${id}`, data);
  }, [authAxios]);

  /**
   * Elimina un afiliado.
   * @param {number|string} id
   */
  const deleteAfiliado = useCallback(async (id) => {
    await authAxios.delete(`/afiliados/${id}`);
    setAfiliados((prev) => prev.filter((a) => getId(a) !== id));
  }, [authAxios]);

  return {
    afiliados,
    loading,
    error,
    fetchAfiliados,
    createAfiliado,
    updateAfiliado,
    deleteAfiliado,
    setAfiliados,
    setError,
  };
}

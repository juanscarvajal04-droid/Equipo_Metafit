// frontend_web/src/hooks/useAfiliados.js
// ISO 25000 — Separación de lógica de estado de la interfaz (modularidad).
// Encapsula todo el acceso a la API de afiliados con estados loading/error.
// Los handlers se envuelven en useCallback para que las vistas que los reciben
// (p. ej. AfiliadosView) no re-rendericen en cada render del padre y puedan
// pasarlos a useMemo/useEffect con dependencias estables.
import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getId } from "../utils/afiliadoHelpers";

/**
 * Hook personalizado para la gestión completa de afiliados.
 *
 * Estado que maneja: lista de afiliados recibida del backend, bandera `loading`
 * durante las peticiones y mensaje `error` para mostrar en la UI. Todas las
 * llamadas salen por authAxios (que a su vez usa api.js con el token JWT).
 *
 * @returns {{
 *   afiliados: Array,
 *   loading: boolean,
 *   error: string,
 *   fetchAfiliados: () => Promise<void>,
 *   createAfiliado: (data: object) => Promise<object>,
 *   updateAfiliado: (id: number|string, data: object) => Promise<void>,
 *   deleteAfiliado: (id: number|string) => Promise<void>,
 *   setAfiliados: Function,
 *   setError: Function
 * }}
 */
export function useAfiliados() {
  const { authAxios } = useAuth();

  const [afiliados, setAfiliados] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  /**
   * Carga la lista completa de afiliados desde el backend.
   * GET /afiliados (requiere sesión staff). Se envuelve en useCallback con
   * dependencia [authAxios] (que nunca cambia) para que las vistas puedan
   * llamarla desde un useEffect sin re-crearla en cada render.
   *
   * Si la petición falla, setError() muestra el mensaje en la UI; el 401 de
   * token expirado ya lo deriva el interceptor global de api.js (redirige a
   * /login), así que este catch solo cubre errores de red o 500.
   */
  const fetchAfiliados = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authAxios.get("/afiliados");
      setAfiliados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[useAfiliados] fetchAfiliados:", err);
      // El interceptor global de api.js ya maneja 401 de token expirado.
      setError("No se pudieron cargar los afiliados.");
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  /**
   * Crea un nuevo afiliado.
   * POST /afiliados (requiere Admin o Recepcionista). DELEGA la validación al
   * backend: aquí solo se envía el payload y se devuelve la respuesta.
   *
   * @param {object} data — payload normalizado para POST /afiliados
   * @returns {Promise<object>} { id, message }
   */
  const createAfiliado = useCallback(async (data) => {
    const response = await authAxios.post("/afiliados", data);
    return response.data;
  }, [authAxios]);

  /**
   * Actualiza un afiliado existente.
   * PATCH /afiliados/:id — actualización parcial de solo los campos enviados.
   *
   * @param {number|string} id
   * @param {object} data — campos a actualizar
   */
  const updateAfiliado = useCallback(async (id, data) => {
    await authAxios.patch(`/afiliados/${id}`, data);
  }, [authAxios]);

  /**
   * Elimina un afiliado.
   * DELETE /afiliados/:id (requiere Admin). Además de borrarlo en el backend,
   * actualiza el estado local filtrando la lista para que la UI se refresque
   * sin una recarga adicional. El id se compara con getId() para respetar
   * los distintos formatos (id_usuario / id_afiliado) que devuelve la API.
   *
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
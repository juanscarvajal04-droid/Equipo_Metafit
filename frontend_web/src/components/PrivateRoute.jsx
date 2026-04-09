import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PrivateRoute
 * Envuelve rutas que requieren autenticación.
 * Si NO hay token → redirige a /login.
 * Si hay token    → renderiza el componente hijo (Outlet).
 *
 * Uso en App.jsx:
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 */
export default function PrivateRoute() {
  const { token } = useAuth();

  if (!token) {
    // Redirige a login conservando la ruta intenta acceder
    return <Navigate to="/login" replace />;
  }

  // Renderiza el hijo correspondiente a la ruta
  return <Outlet />;
}

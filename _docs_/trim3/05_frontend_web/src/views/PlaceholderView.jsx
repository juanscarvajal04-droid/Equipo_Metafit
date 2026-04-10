import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

/**
 * PlaceholderView — Vista temporal para módulos en construcción.
 * A diferencia del Dashboard antiguo, SÍ usa AppLayout → incluye el Sidebar.
 *
 * Props:
 *  @param {string} titulo   Título del módulo (ej: "Rutinas")
 *  @param {string} icono    Emoji representativo
 *  @param {string} color    Color de acento (hex)
 *  @param {string} desc     Descripción corta del módulo
 */
export default function PlaceholderView({ titulo, icono, color, desc }) {
  const { user } = useAuth();
  const rol = user?.role || "";

  return (
    <AppLayout>
      <div className="container-fluid py-5 px-4 d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: "80vh" }}>

        {/* Ícono grande */}
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mb-4"
          style={{
            width: 100, height: 100,
            background: `${color}18`,
            border: `2px solid ${color}44`,
            fontSize: "3rem",
          }}
        >
          {icono}
        </div>

        {/* Título */}
        <h1 className="fw-bold mb-2 text-center" style={{ color }}>
          {titulo}
        </h1>

        {/* Descripción */}
        <p className="text-muted text-center mb-4" style={{ maxWidth: 420 }}>
          {desc}
        </p>

        {/* Badge de rol */}
        <span
          className="badge px-3 py-2 mb-5"
          style={{
            background: color,
            fontSize: "0.75rem",
            letterSpacing: "0.04em",
          }}
        >
          🔒 Acceso: {rol}
        </span>

        {/* Aviso de construcción */}
        <div
          className="card border-0 shadow-sm text-center py-4 px-5"
          style={{
            maxWidth: 460,
            background: "linear-gradient(135deg,#1a1a2e,#16213e)",
            color: "#fff",
          }}
        >
          <div className="fs-3 mb-2">🚧</div>
          <h2 className="h5 fw-bold mb-2">Módulo en construcción</h2>
          <p className="text-white-50 small mb-0">
            Este módulo está siendo desarrollado. Pronto estará disponible
            con todas sus funcionalidades.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import styles from "./PlaceholderView.module.css";

/**
 * PlaceholderView — Vista temporal para módulos en construcción.
 *
 * Props:
 *  @param {string} titulo   Título del módulo
 *  @param {string} icono    Emoji representativo
 *  @param {string} color    Color de acento (hex) — DINÁMICO
 *  @param {string} desc     Descripción corta del módulo
 */
export default function PlaceholderView({ titulo, icono, color, desc }) {
  const { user } = useAuth();
  const rol = user?.role || "";

  return (
    <AppLayout>
      <div className={`container-fluid py-5 px-4 d-flex flex-column align-items-center justify-content-center ${styles.container}`}>

        {/* Ícono — background y border son DINÁMICOS (prop color) */}
        <div className={styles.iconWrap} style={{
          background: `${color}18`,
          border: `2px solid ${color}44`,
        }}>
          {icono}
        </div>

        {/* Título — color DINÁMICO (prop color) */}
        <h1 className={styles.titulo} style={{ color }}>
          {titulo}
        </h1>

        <p className={`text-muted ${styles.desc}`}>{desc}</p>

        {/* Badge de rol — background DINÁMICO (prop color) */}
        <span className={`badge px-3 py-2 ${styles.rolBadge}`}
          style={{ background: color }}>
          🔒 Acceso: {rol}
        </span>

        {/* Card de construcción */}
        <div className={`card border-0 shadow-sm text-center py-4 px-5 ${styles.buildCard}`}>
          <div className={styles.buildIcon}>🚧</div>
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

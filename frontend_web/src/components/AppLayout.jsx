// frontend_web/src/components/AppLayout.jsx
// ─── Layout global de las vistas autenticadas ────────────────
// Composición fija para toda página privada: Sidebar (fija a la izquierda) +
// columna derecha con Header sticky, <main> con el contenido (scroll propio)
// y Footer minimalista.
//
// Sin estado y sin API calls: es contenedor puro que envuelve <children> y
// delega el comportamiento a Sidebar/Header/Footer.
import Sidebar from "./Sidebar";
import Header  from "./Header";
import Footer  from "./Footer";
import styles from "./AppLayout.module.css";

/**
 * AppLayout — wrapper global con Sidebar + columna derecha (Header + content + Footer)
 *
 * Estructura visual:
 * ┌─────────────┬────────────────────────────────────────┐
 * │             │  Header sticky (breadcrumb + fecha)    │
 * │   Sidebar   ├────────────────────────────────────────┤
 * │  (sticky)   │  <children> — scrollable               │
 * │             ├────────────────────────────────────────┤
 * │             │  Footer minimalista                    │
 * └─────────────┴────────────────────────────────────────┘
 *
 * @param {object}   props     - Props del componente.
 * @param {ReactNode} children - Contenido de la vista (una ruta hija).
 * @returns {JSX.Element} Layout sidebar + columna derecha.
 */
export default function AppLayout({ children }) {
  return (
    <div className={styles.root}>
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Columna derecha: Header sticky + contenido + Footer */}
      <div className={styles.rightCol}>

        {/* Header sticky — dentro de la columna, NO sobre el sidebar */}
        <Header />

        {/* Contenido de la página — hace scroll independiente */}
        <main className={styles.main}>
          {children}
        </main>

        {/* Footer al fondo */}
        <Footer />
      </div>
    </div>
  );
}

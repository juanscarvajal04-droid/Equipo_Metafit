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

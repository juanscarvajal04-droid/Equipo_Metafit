import Sidebar from "./Sidebar";
import Header  from "./Header";
import Footer  from "./Footer";

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
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f9" }}>
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Columna derecha: Header sticky + contenido + Footer */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" }}>

        {/* Header sticky — dentro de la columna, NO sobre el sidebar */}
        <Header />

        {/* Contenido de la página — hace scroll independiente */}
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>

        {/* Footer al fondo */}
        <Footer />
      </div>
    </div>
  );
}

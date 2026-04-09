import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

/* ── Paleta compartida con LandingPage ──────────────────────────────────────── */
const RED      = "#e31c25";
const RED_DARK = "#b71c1c";
const RED_GLOW = "rgba(227,28,37,0.30)";
const DARK1    = "#0a0a0f";
const DARK2    = "#12121e";
const DARK3    = "#1a1a2e";

/* ── Icono de Instagram ──────────────────────────────────────────────────────── */
function IgIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

/* ── Modal Términos ──────────────────────────────────────────────────────────── */
function ModalTerminos({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 9000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: DARK3, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
        width: "100%", maxWidth: 580, maxHeight: "78vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{
          background: `linear-gradient(135deg,${DARK3},${DARK2})`, borderRadius: "14px 14px 0 0",
          padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0,
        }}>
          <div>
            <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>📋 Términos y Condiciones</h5>
            <small style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.66rem" }}>MetaFit — Sport Gym Sede 80 · v1.0</small>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8,
            width: 30, height: 30, cursor: "pointer", fontSize: "0.95rem",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>
          {[
            { n: "1", t: "🔒 Privacidad de Datos", c: "#7c3aed", p: "MetaFit recopila únicamente los datos necesarios para la gestión de membresías e historial de entrenamiento, conforme a la Ley 1581 de 2012 (Habeas Data). Los datos no serán compartidos con terceros sin autorización." },
            { n: "2", t: "🏋️ Uso de Instalaciones", c: "#2563eb", p: "El acceso está restringido a afiliados con membresía activa. El uso inadecuado de equipos puede resultar en suspensión de membresía. Los horarios y normas pueden actualizarse sin previo aviso." },
            { n: "3", t: "⚕️ Responsabilidad en Salud", c: RED, p: "Sport Gym Sede 80 no asume responsabilidad por lesiones derivadas del uso inadecuado de equipos. Se recomienda chequeo médico previo. Las rutinas y dietas son orientativas y no reemplazan el diagnóstico médico." },
          ].map(s => (
            <div key={s.n} style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: `${s.c}20`, border: `2px solid ${s.c}50`, color: s.c, fontWeight: 800, fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</span>
                <h6 style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>{s.t}</h6>
              </div>
              <p style={{ margin: "0 0 0 34px", fontSize: "0.76rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{s.p}</p>
            </div>
          ))}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 14px", fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
            Al usar las instalaciones aceptas estos términos. Consultas: <strong style={{ color: "rgba(255,255,255,0.65)" }}>admin@metafit.com</strong>
          </div>
        </div>
        <div style={{ padding: "10px 22px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: `linear-gradient(135deg,${RED},${RED_DARK})`, color: "#fff", border: "none", borderRadius: 8, padding: "8px 22px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
            Entendido ✓
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PUBLIC LAYOUT — compartido por LandingPage y Login
   Incluye: Navbar de marca + children + Footer con Términos e Instagram
══════════════════════════════════════════════════════════════════════════════ */
export default function PublicLayout({ children }) {
  const [scrolled,    setScrolled]    = useState(false);
  const [showTerminos, setShowTerminos] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkStyle = {
    color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textDecoration: "none",
    background: "none", border: "none", padding: 0, cursor: "pointer", transition: "color 0.18s",
  };

  return (
    <div style={{
      background: DARK1, color: "#fff", minHeight: "100vh",
      display: "flex", flexDirection: "column",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      width: "100vw",
      marginLeft: "calc(-1 * ((100vw - 100%) / 2))",
      boxSizing: "border-box",
    }}>
      {showTerminos && <ModalTerminos onClose={() => setShowTerminos(false)} />}

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position:       "sticky",
        top:            0,
        zIndex:         500,
        height:         60,
        background:     scrolled ? "rgba(10,10,15,0.96)" : "rgba(10,10,15,0.75)",
        backdropFilter: "blur(14px)",
        borderBottom:   `1px solid ${scrolled ? "rgba(255,255,255,0.07)" : "transparent"}`,
        transition:     "all 0.3s ease",
        flexShrink:     0,
      }}>
        {/* Contenedor centrado con max-width para que no se pegue a los bordes */}
        <div style={{
          maxWidth:       1200,
          margin:         "0 auto",
          padding:        "0 32px",
          height:         "100%",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
        }}>
          {/* Logo → vuelve a la landing */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ fontSize: "1.6rem", filter: `drop-shadow(0 0 8px ${RED_GLOW})` }}>💪</span>
            <div>
              <div style={{
                fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.05em",
                background: `linear-gradient(90deg,#fff 60%,${RED})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                MetaFit
              </div>
              <div style={{
                fontSize: "0.55rem", color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1,
              }}>
                Sport Gym Sede 80
              </div>
            </div>
          </Link>

          {/* Botón "← Volver al inicio" */}
          <Link
            to="/"
            style={{
              display:       "flex",
              alignItems:    "center",
              gap:           6,
              color:         "rgba(255,255,255,0.55)",
              fontSize:      "0.8rem",
              fontWeight:    500,
              textDecoration:"none",
              padding:       "7px 16px",
              borderRadius:  8,
              border:        "1px solid rgba(255,255,255,0.1)",
              background:    "rgba(255,255,255,0.05)",
              transition:    "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            ← Volver al inicio
          </Link>
        </div>
      </nav>

      {/* ── CONTENIDO ─────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        {children}
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{
        background:     DARK1,
        borderTop:      "1px solid rgba(255,255,255,0.06)",
        padding:        "14px 48px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        flexWrap:       "wrap",
        gap:            10,
        flexShrink:     0,
      }}>
        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.28)", whiteSpace: "nowrap" }}>
          © {new Date().getFullYear()}{" "}
          <strong style={{ color: "rgba(255,255,255,0.5)" }}>MetaFit</strong>
          {" | "}Desarrollado para Sport Gym Sede 80
        </span>

        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <button style={linkStyle}
            onClick={() => setShowTerminos(true)}
            onMouseEnter={e => e.currentTarget.style.color = RED}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
          >
            📋 Términos y Condiciones
          </button>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <a
            href="https://www.instagram.com/sportgymsede80/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...linkStyle, display: "flex", alignItems: "center", gap: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = "#e1306c"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
          >
            <IgIcon /> @sportgymsede80
          </a>
        </div>
      </footer>
    </div>
  );
}

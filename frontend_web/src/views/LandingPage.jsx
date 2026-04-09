import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ── Paleta ─────────────────────────────────────────────────────────────────── */
const RED      = "#e31c25";
const RED_DARK = "#b71c1c";
const RED_GLOW = "rgba(227,28,37,0.35)";
const DARK1    = "#0a0a0f";
const DARK2    = "#12121e";
const DARK3    = "#1a1a2e";

/* ── Smooth scroll helper ────────────────────────────────────────────────────── */
const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

/* ── Nav links con su ancla ─────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Funciones",          id: "funciones" },
  { label: "Sport Gym Sede 80",  id: "sede80"    },
  { label: "Sobre Nosotros",     id: "nosotros"  },
];

/* ── KPIs ───────────────────────────────────────────────────────────────────── */
const KPIS = [
  { valor: "1,200+", label: "Afiliados activos",            icono: "👥" },
  { valor: "500+",   label: "Planes nutricionales creados", icono: "🥗" },
  { valor: "20+",    label: "Entrenadores certificados",    icono: "🏆" },
  { valor: "98%",    label: "Satisfacción de miembros",    icono: "⭐" },
];

/* ── Feature cards (sección Funciones) ─────────────────────────────────────── */
const FEATURES_MAIN = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 8.5l2-2 2 2M18 8.5l2-2 2 2
                 M2 15.5l2 2 2-2M18 15.5l2 2 2-2"/>
      </svg>
    ),
    titulo:  "Rutinas Inteligentes",
    desc:    "Planes de entrenamiento adaptados al nivel, objetivo y disponibilidad de cada afiliado. El entrenador asigna, el afiliado ejecuta.",
    color:   "#059669",
    acento:  "#05966920",
    id:      "f1",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
        <path d="M8.5 14.5s1 2 3.5 2 3.5-2 3.5-2"/>
      </svg>
    ),
    titulo:  "Dieta de Precisión",
    desc:    "Seguimiento calórico y distribución de macronutrientes en tiempo real. Planes compatibles con restricciones alimenticias y alergias.",
    color:   RED,
    acento:  `${RED}20`,
    id:      "f2",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 8h2M11 8h6M7 12h4M13 12h4"/>
      </svg>
    ),
    titulo:  "Control Total",
    desc:    "Historial de membresías, estado de pagos y progreso físico en un solo panel. Semáforo de vencimientos en tiempo real.",
    color:   "#2563eb",
    acento:  "#2563eb20",
    id:      "f3",
  },
];

const FEATURES_EXTRA = [
  { icono: "🛡️", titulo: "Control de Acceso por Roles",  desc: "Administrador, Entrenador y Recepcionista. Cada rol opera exactamente lo que le corresponde.",              color: "#f59e0b" },
  { icono: "📊", titulo: "Dashboard Gerencial",           desc: "Métricas clave: afiliados activos, mora, distribución por objetivos y ciclos de entrenamiento.",           color: "#059669" },
  { icono: "👤", titulo: "Perfil Completo de Afiliado",   desc: "Datos personales, historial médico, restricciones y progreso físico en un solo lugar.",                    color: "#0891b2" },
];

/* ── Estilos globales ──────────────────────────────────────────────────────── */
const GLOBAL_STYLE = `
  .mf-landing * { box-sizing: border-box; }
  .mf-landing { font-family: 'Segoe UI', system-ui, sans-serif; }

  .mf-btn-red {
    background: linear-gradient(135deg, ${RED}, ${RED_DARK});
    color: #fff; border: none; border-radius: 8px;
    padding: 10px 22px; font-weight: 700; font-size: 0.88rem;
    cursor: pointer; transition: all 0.2s; text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px;
    box-shadow: 0 4px 18px ${RED_GLOW}; letter-spacing: 0.02em;
  }
  .mf-btn-red:hover {
    transform: translateY(-2px); box-shadow: 0 8px 28px ${RED_GLOW};
    color: #fff; text-decoration: none;
  }
  .mf-btn-ghost {
    background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
    padding: 10px 22px; font-weight: 600; font-size: 0.88rem;
    cursor: pointer; transition: all 0.2s; text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px; letter-spacing: 0.02em;
  }
  .mf-btn-ghost:hover {
    background: rgba(255,255,255,0.12); color: #fff;
    text-decoration: none; transform: translateY(-1px);
  }
  .mf-nav-link {
    color: rgba(255,255,255,0.6); text-decoration: none;
    font-size: 0.85rem; font-weight: 500; transition: color 0.18s; cursor: pointer;
  }
  .mf-nav-link:hover { color: #fff; }

  .mf-kpi-card { transition: transform 0.25s, box-shadow 0.25s; }
  .mf-kpi-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 48px rgba(227,28,37,0.2) !important;
  }
  .mf-feature-card { transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s; }
  .mf-feature-card:hover { transform: translateY(-5px); }

  .mf-main-card { transition: transform 0.3s, box-shadow 0.3s; }
  .mf-main-card:hover { transform: translateY(-8px); }

  @keyframes mf-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-12px); }
  }
  @keyframes mf-pulse-ring {
    0%   { transform: scale(0.92); opacity: 0.8; }
    50%  { transform: scale(1.04); opacity: 0.4; }
    100% { transform: scale(0.92); opacity: 0.8; }
  }
  @keyframes mf-slide-up {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .mf-animate    { animation: mf-slide-up 0.7s ease both; }
  .mf-animate-d1 { animation-delay: 0.1s; }
  .mf-animate-d2 { animation-delay: 0.25s; }
  .mf-animate-d3 { animation-delay: 0.4s; }
  .mf-animate-d4 { animation-delay: 0.55s; }

  .mf-footer-link {
    color: rgba(255,255,255,0.4); font-size: 0.72rem; text-decoration: none;
    transition: color 0.18s; cursor: pointer; background: none; border: none; padding: 0;
  }
  .mf-footer-link:hover { color: ${RED}; }
  .mf-ig-link {
    color: rgba(255,255,255,0.4); font-size: 0.72rem; text-decoration: none;
    transition: color 0.18s; display: inline-flex; align-items: center; gap: 4px;
  }
  .mf-ig-link:hover { color: #e1306c; }

  .mf-section-badge {
    display: inline-block; background: ${RED}15;
    border: 1px solid ${RED}40; border-radius: 20px;
    padding: 4px 14px; font-size: 0.7rem; color: ${RED};
    font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    margin-bottom: 16px;
  }
  @media (max-width: 768px) {
    .mf-nav-desktop { display: none !important; }
    .mf-sede-grid { grid-template-columns: 1fr !important; }
  }
`;

/* ── Icono Instagram ─────────────────────────────────────────────────────────── */
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
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
        width: "100%", maxWidth: 600, maxHeight: "78vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{
          background: `linear-gradient(135deg,${DARK3},${DARK2})`, borderRadius: "14px 14px 0 0",
          padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 1,
        }}>
          <div>
            <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: "1rem" }}>📋 Términos y Condiciones</h5>
            <small style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem" }}>
              MetaFit — Sport Gym Sede 80 · Versión 1.0 · Abril 2026
            </small>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none", color: "#fff",
            borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: "1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          {[
            { num: "1", titulo: "🔒 Privacidad de Datos", color: "#7c3aed", texto: "MetaFit recopila únicamente los datos necesarios para la gestión de membresías, historial de entrenamiento y planes nutricionales. Esta información es tratada conforme a la Ley 1581 de 2012 (Habeas Data). Los datos personales no serán compartidos con terceros sin autorización expresa del titular." },
            { num: "2", titulo: "🏋️ Uso de Instalaciones", color: "#2563eb", texto: "El acceso a las instalaciones está restringido a afiliados con membresía activa. El uso de equipos debe realizarse de manera responsable. Cualquier daño intencional resultará en la suspensión temporal o definitiva de la membresía." },
            { num: "3", titulo: "⚕️ Responsabilidad en Salud", color: RED, texto: "Sport Gym Sede 80 no asume responsabilidad por lesiones derivadas del uso inadecuado de equipos o la omisión de información médica. Se recomienda chequeo médico previo al inicio de cualquier programa. Las rutinas y planes nutricionales son orientativos y no reemplazan el diagnóstico médico profesional." },
          ].map(s => (
            <div key={s.num} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: "50%", background: `${s.color}20`,
                  border: `2px solid ${s.color}50`, color: s.color, fontWeight: 800, fontSize: "0.72rem",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{s.num}</span>
                <h6 style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>{s.titulo}</h6>
              </div>
              <p style={{ margin: "0 0 0 36px", fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{s.texto}</p>
            </div>
          ))}
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 14px",
            fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textAlign: "center",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            Al hacer uso de las instalaciones, el afiliado acepta estos términos.
            Consultas: <strong style={{ color: "rgba(255,255,255,0.7)" }}>admin@metafit.com</strong>
          </div>
        </div>
        <div style={{ padding: "12px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="mf-btn-red">Entendido ✓</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [scrolled, setScrolled]     = useState(false);
  const [showTerminos, setShowTerminos] = useState(false);

  /* Redirigir si ya está autenticado */
  useEffect(() => {
    if (user?.role) {
      const map = { Administrador: "/dashboard", Recepcionista: "/afiliados", Entrenador: "/rutinas" };
      navigate(map[user.role] || "/login", { replace: true });
    }
  }, [user, navigate]);

  /* Header sólido al hacer scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mf-landing" style={{ background: DARK1, color: "#fff", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{GLOBAL_STYLE}</style>
      {showTerminos && <ModalTerminos onClose={() => setShowTerminos(false)} />}

      {/* ════════════════════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════════════════════ */}
      <nav style={{
        position:       "fixed", top: 0, left: 0, right: 0, zIndex: 500,
        padding:        "0 5%", height: 64,
        display:        "flex", alignItems: "center", justifyContent: "space-between",
        background:     scrolled ? "rgba(10,10,15,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom:   scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition:     "all 0.35s ease",
      }}>
        {/* Logo → vuelve al inicio del Hero */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <span style={{ fontSize: "1.7rem", filter: `drop-shadow(0 0 10px ${RED_GLOW})` }}>💪</span>
          <div>
            <div style={{
              fontWeight: 900, fontSize: "1.15rem", letterSpacing: "0.05em",
              background: `linear-gradient(90deg,#fff 60%,${RED})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>MetaFit</div>
            <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1 }}>
              Sport Gym Sede 80
            </div>
          </div>
        </div>

        {/* Nav links — desktop (smooth scroll) */}
        <div style={{ display: "flex", gap: 32, alignItems: "center" }} className="mf-nav-desktop">
          {NAV_LINKS.map(l => (
            <span
              key={l.id}
              className="mf-nav-link"
              onClick={() => scrollTo(l.id)}
            >
              {l.label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href="https://www.instagram.com/sportgymsede80/"
            target="_blank"
            rel="noopener noreferrer"
            className="mf-btn-ghost"
            style={{ padding: "8px 16px", fontSize: "0.8rem", textDecoration: "none" }}
          >
            📲 Contacto
          </a>
          <Link to="/login" className="mf-btn-red" style={{ padding: "8px 18px", fontSize: "0.8rem" }}>
            Ingresar al Sistema →
          </Link>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════ */}
      <section id="hero" style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden", padding: "80px 5% 60px", textAlign: "center",
      }}>
        {/* Fondo foto gimnasio */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80')",
          backgroundSize: "cover", backgroundPosition: "center 30%",
          filter: "brightness(0.22) saturate(0.6)", zIndex: 0,
        }} />
        {/* Overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: `radial-gradient(ellipse at center top, ${RED_GLOW} 0%, transparent 60%),
                       linear-gradient(180deg, transparent 50%, ${DARK1} 100%)`,
        }} />
        {/* Glow orb */}
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: `radial-gradient(circle, ${RED_GLOW} 0%, transparent 70%)`,
          top: "10%", left: "50%", transform: "translateX(-50%)", zIndex: 1,
          animation: "mf-pulse-ring 4s ease-in-out infinite", pointerEvents: "none",
        }} />

        {/* Contenido */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 780 }}>
          <div className="mf-animate mf-animate-d1" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: `${RED}18`, border: `1px solid ${RED}50`, borderRadius: 20,
            padding: "5px 14px", fontSize: "0.72rem", color: RED, fontWeight: 700,
            letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 24,
          }}>
            🔴 Sistema de Gestión Deportiva v1.0
          </div>

          <h1 className="mf-animate mf-animate-d2" style={{
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)", fontWeight: 900,
            lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-0.02em",
          }}>
            Toma el Control{" "}
            <span style={{
              background: `linear-gradient(90deg, ${RED}, #ff6b6b)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Total</span>{" "}
            de tu Progreso
          </h1>

          <p className="mf-animate mf-animate-d3" style={{
            fontSize: "clamp(1rem, 2.2vw, 1.2rem)", color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7, margin: "0 auto 36px", maxWidth: 620,
          }}>
            MetaFit es el sistema de gestión avanzado para{" "}
            <strong style={{ color: "rgba(255,255,255,0.85)" }}>Sport Gym Sede 80</strong>.
            Rutinas, dietas y seguimiento de membresías en un solo lugar.
          </p>

          <div className="mf-animate mf-animate-d4" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" className="mf-btn-red" style={{ padding: "14px 32px", fontSize: "0.95rem", borderRadius: 10 }}>
              🚀 Ingresar al Sistema
            </Link>
            <button
              className="mf-btn-ghost"
              onClick={() => scrollTo("funciones")}
              style={{ padding: "14px 28px", fontSize: "0.95rem", borderRadius: 10 }}
            >
              Conoce Más ↓
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
          zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          animation: "mf-float 2.5s ease-in-out infinite",
        }}>
          <div style={{ width: 1, height: 36, background: `linear-gradient(${RED}, transparent)` }} />
          <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>SCROLL</span>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          KPIs DE IMPACTO
      ════════════════════════════════════════════════════════════════════ */}
      <section id="mf-kpis" style={{
        background: `linear-gradient(135deg,${DARK2} 0%,${DARK3} 100%)`,
        borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "56px 5%",
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 20, maxWidth: 1100, margin: "0 auto",
        }}>
          {KPIS.map((k, i) => (
            <div key={k.label} className="mf-kpi-card" style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "28px 20px", textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animationDelay: `${i * 0.1}s`,
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 10 }}>{k.icono}</div>
              <div style={{
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: RED,
                lineHeight: 1, marginBottom: 6, textShadow: `0 0 30px ${RED_GLOW}`,
              }}>{k.valor}</div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FUNCIONES (id="funciones")
      ════════════════════════════════════════════════════════════════════ */}
      <section id="funciones" style={{ padding: "96px 5%", background: DARK1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Encabezado */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="mf-section-badge">✦ Funciones del Sistema</div>
            <h2 style={{
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900,
              margin: "0 0 14px", letterSpacing: "-0.02em",
            }}>
              Todo lo que necesitas en{" "}
              <span style={{ color: RED }}>un solo lugar</span>
            </h2>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto" }}>
              Diseñado para que Administradores, Entrenadores y Recepcionistas
              trabajen de forma eficiente con acceso exactamente a lo que les corresponde.
            </p>
          </div>

          {/* 3 cards principales */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 28, marginBottom: 28,
          }}>
            {FEATURES_MAIN.map(f => (
              <div key={f.id} className="mf-main-card" style={{
                background: `linear-gradient(145deg, ${DARK2}, ${DARK3})`,
                border: `1px solid ${f.color}30`, borderRadius: 18,
                padding: "36px 32px", position: "relative", overflow: "hidden",
                boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)`,
              }}>
                {/* Glow de color */}
                <div style={{
                  position: "absolute", top: -40, right: -40, width: 140, height: 140,
                  borderRadius: "50%", background: `${f.color}15`, filter: "blur(30px)", pointerEvents: "none",
                }} />
                {/* Barra superior de color */}
                <div style={{
                  position: "absolute", top: 0, left: "10%", width: "80%", height: 3,
                  background: `linear-gradient(90deg, transparent, ${f.color}, transparent)`, borderRadius: 3,
                }} />

                <div style={{
                  width: 58, height: 58, borderRadius: 14, background: f.acento,
                  border: `1px solid ${f.color}40`, display: "flex", alignItems: "center",
                  justifyContent: "center", color: f.color, marginBottom: 20,
                }}>
                  {f.icon}
                </div>

                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>
                  {f.titulo}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 3 cards extra */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {FEATURES_EXTRA.map(f => (
              <div key={f.titulo} className="mf-feature-card" style={{
                background: `linear-gradient(135deg,${DARK2},${DARK3})`,
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px 22px",
                position: "relative", overflow: "hidden",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${f.color}60`}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
              >
                <div style={{ position: "absolute", top: -30, right: -30, width: 90, height: 90, borderRadius: "50%", background: `${f.color}12`, filter: "blur(20px)", pointerEvents: "none" }} />
                <div style={{
                  width: 44, height: 44, borderRadius: 11, background: `${f.color}18`,
                  border: `1px solid ${f.color}35`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "1.3rem", marginBottom: 14,
                }}>{f.icono}</div>
                <h3 style={{ fontSize: "0.93rem", fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>{f.titulo}</h3>
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                <div style={{
                  position: "absolute", bottom: 0, left: "10%", width: "80%", height: 2,
                  background: `linear-gradient(90deg, transparent, ${f.color}, transparent)`, borderRadius: 2,
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SPORT GYM SEDE 80 (id="sede80")
      ════════════════════════════════════════════════════════════════════ */}
      <section id="sede80" style={{
        padding: "100px 5%",
        background: `linear-gradient(160deg, ${DARK3} 0%, ${DARK2} 60%, ${DARK1} 100%)`,
        borderTop: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden",
      }}>
        {/* Fondo decorativo */}
        <div style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          background: `radial-gradient(circle, ${RED_GLOW} 0%, transparent 65%)`,
          top: "50%", right: "-15%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5,
        }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="mf-sede-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center",
          }}>
            {/* Columna izquierda — Texto */}
            <div>
              <div className="mf-section-badge">📍 Bogotá, Colombia</div>
              <h2 style={{
                fontSize: "clamp(2rem, 4.5vw, 3.2rem)", fontWeight: 900, lineHeight: 1.1,
                margin: "0 0 24px", letterSpacing: "-0.02em",
              }}>
                Entrena en el{" "}
                <span style={{
                  background: `linear-gradient(90deg, ${RED}, #ff6b6b)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Templo</span>
              </h2>
              <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, margin: "0 0 20px" }}>
                <strong style={{ color: "rgba(255,255,255,0.9)" }}>Sport Gym Sede 80</strong> es la sede principal de nuestra cadena en Bogotá.
                Contamos con el equipamiento más completo de la ciudad: zonas de peso libre, cardio de alta gama,
                piscina semiolímpica y salones especializados de funcional, boxeo y spinning.
              </p>
              <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.8, margin: "0 0 36px" }}>
                MetaFit es la tecnología que potencia el esfuerzo físico de nuestros más de
                <strong style={{ color: RED }}> 1,200 afiliados activos</strong>, permitiendo a
                nuestro staff gestionar cada aspecto del rendimiento deportivo con precisión quirúrgica.
              </p>

              {/* Stats rápidas */}
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  { valor: "3,500 m²", label: "Área total" },
                  { valor: "6 AM–10 PM", label: "Horario de atención" },
                  { valor: "Cra 80 con Av. 68", label: "Ubicación" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: RED }}>{s.valor}</div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna derecha — Visual */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Card principal */}
              <div style={{
                background: `linear-gradient(135deg, ${DARK2}, ${DARK3})`,
                border: `1px solid ${RED}30`, borderRadius: 18, padding: "32px 28px",
                boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🏟️</div>
                <h4 style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", margin: "0 0 10px" }}>
                  Infraestructura de Élite
                </h4>
                <p style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0 }}>
                  Equipos Technogym y Life Fitness de última generación. Zona de CrossFit, pesas rusas,
                  máquinas de cable y plataformas olímpicas para levantamiento de potencia.
                </p>
              </div>

              {/* Dos mini-cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { icono: "👨‍💼", titulo: "Staff Experto", desc: "20+ entrenadores certificados NASM, ACE y NSCA." },
                  { icono: "🥤", titulo: "Nutribar", desc: "Proteínas, suplementos y jugos naturales en sitio." },
                ].map(c => (
                  <div key={c.titulo} style={{
                    background: `linear-gradient(135deg,${DARK2},${DARK3})`,
                    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 18px",
                  }}>
                    <div style={{ fontSize: "1.6rem", marginBottom: 8 }}>{c.icono}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff", marginBottom: 6 }}>{c.titulo}</div>
                    <div style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SOBRE NOSOTROS (id="nosotros")
      ════════════════════════════════════════════════════════════════════ */}
      <section id="nosotros" style={{
        padding: "96px 5%", background: DARK1, borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div className="mf-section-badge">💡 Sobre MetaFit</div>
          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900,
            margin: "0 0 32px", letterSpacing: "-0.02em",
          }}>
            La tecnología que{" "}
            <span style={{ color: RED }}>convierte el esfuerzo en datos</span>
          </h2>

          <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.9, margin: "0 0 28px" }}>
            MetaFit nació de una necesidad real: <strong style={{ color: "rgba(255,255,255,0.9)" }}>digitalizar la pasión por el deporte</strong> en Sport Gym Sede 80.
            Los procesos manuales, las planillas en papel y la falta de seguimiento eran el obstáculo entre nuestros entrenadores y el máximo rendimiento de cada afiliado.
          </p>
          <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.9, margin: "0 0 48px" }}>
            Hoy, MetaFit integra la gestión de <strong style={{ color: "rgba(255,255,255,0.75)" }}>rutinas, nutrición, pagos y personal</strong> en un solo ecosistema.
            Cada dato capturado es una decisión más inteligente para el entrenador,
            un paso más hacia el objetivo para el afiliado, y un peso menos para la administración.
          </p>

          {/* Valores */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, textAlign: "left" }}>
            {[
              { icono: "⚡", titulo: "Eficiencia",     desc: "Automatizamos los procesos operativos para que el foco esté en el entrenamiento.", color: "#f59e0b" },
              { icono: "🎯", titulo: "Precisión",      desc: "Cada plan nutricional y rutina es calibrado a las métricas reales del afiliado.",   color: RED        },
              { icono: "🔒", titulo: "Confiabilidad",  desc: "Datos seguros, acceso controlado por roles y trazabilidad total de operaciones.",   color: "#7c3aed"  },
              { icono: "📈", titulo: "Crecimiento",    desc: "Métricas de negocio en tiempo real para decisiones estratégicas más rápidas.",       color: "#059669"  },
            ].map(v => (
              <div key={v.titulo} style={{
                background: `linear-gradient(135deg,${DARK2},${DARK3})`,
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px 20px",
              }}>
                <div style={{ fontSize: "1.6rem", marginBottom: 10 }}>{v.icono}</div>
                <div style={{ fontWeight: 800, fontSize: "0.92rem", color: v.color, marginBottom: 8 }}>{v.titulo}</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "80px 5%", background: `linear-gradient(135deg,${DARK3} 0%,${DARK2} 100%)`,
        borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", width: 600, height: 300, borderRadius: "50%",
          background: `radial-gradient(ellipse, ${RED_GLOW} 0%, transparent 70%)`,
          top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: 20, filter: `drop-shadow(0 0 16px ${RED_GLOW})`, animation: "mf-float 3s ease-in-out infinite" }}>💪</div>
          <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 900, margin: "0 0 14px", letterSpacing: "-0.02em" }}>
            ¿Listo para transformar la gestión{" "}
            <span style={{ color: RED }}>de tu gimnasio?</span>
          </h2>
          <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.55)", margin: "0 0 32px", lineHeight: 1.7 }}>
            Ingresa al sistema ahora y experimenta el control total sobre
            rutinas, dietas, pagos y personal desde un solo panel.
          </p>
          <Link to="/login" className="mf-btn-red" style={{ padding: "15px 40px", fontSize: "1rem", borderRadius: 10 }}>
            🚀 Ingresar al Sistema — Es Gratis
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════ */}
      <footer style={{
        background: DARK1, borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 5%", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}>
        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
          © {new Date().getFullYear()}{" "}
          <strong style={{ color: "rgba(255,255,255,0.55)" }}>MetaFit</strong>
          {" | "}Desarrollado para Sport Gym Sede 80
        </span>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <button className="mf-footer-link" onClick={() => setShowTerminos(true)}>
            📋 Términos y Condiciones
          </button>
          <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "0.8rem" }}>|</span>
          <span className="mf-footer-link" onClick={() => scrollTo("nosotros")}>Sobre Nosotros</span>
        </div>
        <a href="https://www.instagram.com/sportgymsede80/" target="_blank" rel="noopener noreferrer" className="mf-ig-link">
          <IgIcon /> @sportgymsede80
        </a>
      </footer>
    </div>
  );
}


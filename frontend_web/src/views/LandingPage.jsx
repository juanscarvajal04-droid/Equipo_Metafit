import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { trackEvent } from "../utils/analytics";
import s from "./LandingPage.module.css";

/* ── Paleta (solo para cálculos dinámicos — los colores estáticos van al CSS) */
const RED      = "#e31c25";
const RED_DARK = "#b71c1c";
const RED_GLOW = "rgba(227,28,37,0.35)";

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
    <div onClick={onClose} className={s.modalOverlay}>
      <div onClick={e => e.stopPropagation()} className={s.modalBox}>
        <div className={s.modalHeader}>
          <div>
            <h5 className={s.modalHeaderTitle}>📋 Términos y Condiciones</h5>
            <small className={s.modalHeaderSub}>
              MetaFit — Sport Gym Sede 80 · Versión 1.0 · Abril 2026
            </small>
          </div>
          <button onClick={onClose} className={s.modalCloseBtn}>✕</button>
        </div>
        <div className={s.modalBody}>
          {[
            { num: "1", titulo: "🔒 Privacidad de Datos", color: "#e31c25", texto: "MetaFit recopila únicamente los datos necesarios para la gestión de membresías, historial de entrenamiento y planes nutricionales. Esta información es tratada conforme a la Ley 1581 de 2012 (Habeas Data). Los datos personales no serán compartidos con terceros sin autorización expresa del titular." },
            { num: "2", titulo: "🏋️ Uso de Instalaciones", color: "#2563eb", texto: "El acceso a las instalaciones está restringido a afiliados con membresía activa. El uso de equipos debe realizarse de manera responsable. Cualquier daño intencional resultará en la suspensión temporal o definitiva de la membresía." },
            { num: "3", titulo: "⚕️ Responsabilidad en Salud", color: RED, texto: "Sport Gym Sede 80 no asume responsabilidad por lesiones derivadas del uso inadecuado de equipos o la omisión de información médica. Se recomienda chequeo médico previo al inicio de cualquier programa. Las rutinas y planes nutricionales son orientativos y no reemplazan el diagnóstico médico profesional." },
          ].map(sec => (
            <div key={sec.num} className={s.modalSection}>
              <div className={s.modalSectionHeader}>
                <span
                  className={s.modalSectionNum}
                  style={{
                    background: `${sec.color}20`,
                    border: `2px solid ${sec.color}50`,
                    color: sec.color,
                  }}
                >
                  {sec.num}
                </span>
                <h6 className={s.modalSectionTitle}>{sec.titulo}</h6>
              </div>
              <p className={s.modalSectionText}>{sec.texto}</p>
            </div>
          ))}
          <div className={s.modalNote}>
            Al hacer uso de las instalaciones, el afiliado acepta estos términos.
            Consultas: <strong className={s.modalNoteEmail}>admin@metafit.com</strong>
          </div>
        </div>
        <div className={s.modalFooter}>
          <button onClick={onClose} className={s.btnRed}>Entendido ✓</button>
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
  const [scrolled, setScrolled]         = useState(false);
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
    <div className={s.landing}>
      {showTerminos && <ModalTerminos onClose={() => setShowTerminos(false)} />}

      {/* ════════════════════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════════════════════ */}
      <nav className={`${s.navbar} ${scrolled ? s.navbarScrolled : ""}`}>
        {/* Logo → vuelve al inicio del Hero */}
        <div className={s.logoWrapper} onClick={() => navigate("/")}>
          <span className={s.logoIcon}>💪</span>
          <div>
            <div className={s.logoTitle}>MetaFit</div>
            <div className={s.logoSub}>Sport Gym Sede 80</div>
          </div>
        </div>

        {/* Nav links — desktop (smooth scroll) */}
        <div className={s.navLinks}>
          {NAV_LINKS.map(l => (
            <span
              key={l.id}
              className={s.navLink}
              onClick={() => scrollTo(l.id)}
            >
              {l.label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className={s.navCtas}>
          <a
            href="https://www.instagram.com/sportgymsede80/"
            target="_blank"
            rel="noopener noreferrer"
            className={s.btnGhost}
            style={{ padding: "8px 16px", fontSize: "0.8rem", textDecoration: "none" }}
          >
            📲 Contacto
          </a>
          <Link to="/login" className={s.btnRed} style={{ padding: "8px 18px", fontSize: "0.8rem" }}>
            Ingresar al Sistema →
          </Link>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════ */}
      <section id="hero" className={s.hero}>
        {/* Fondo foto gimnasio */}
        <div className={s.heroBg} />
        {/* Overlay */}
        <div className={s.heroOverlay} />
        {/* Glow orb */}
        <div className={s.heroGlow} />

        {/* Contenido */}
        <div className={s.heroContent}>
          <div className={`${s.heroBadge} ${s.animate} ${s.animateD1}`}>
            ⚡ Sistema de Gestión Deportiva v2.0
          </div>

          <h1 className={`${s.heroTitle} ${s.animate} ${s.animateD2}`}>
            Toma el Control{" "}
            <span className={s.heroTitleAccent}>Total</span>{" "}
            de tu Progreso
          </h1>

          <p className={`${s.heroSubtitle} ${s.animate} ${s.animateD3}`}>
            MetaFit es el sistema de gestión avanzado para{" "}
            <strong className={s.heroHighlight}>Sport Gym Sede 80</strong>.
            Rutinas, dietas y seguimiento de membresías en un solo lugar.
          </p>

          <div className={`${s.heroCtaRow} ${s.animate} ${s.animateD4}`}>
            <Link to="/login" className={s.btnRed} style={{ padding: "14px 32px", fontSize: "0.95rem", borderRadius: 10 }}>
              🚀 Ingresar al Sistema
            </Link>
            <button
              className={s.btnGhost}
              onClick={() => scrollTo("funciones")}
              style={{ padding: "14px 28px", fontSize: "0.95rem", borderRadius: 10 }}
            >
              Conoce Más ↓
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={s.scrollIndicator}>
          <div className={s.scrollLine} />
          <span className={s.scrollText}>SCROLL</span>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          KPIs DE IMPACTO
      ════════════════════════════════════════════════════════════════════ */}
      <section id="mf-kpis" className={s.sectionKpis}>
        <div className={s.kpisGrid}>
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className={s.kpiCard}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={s.kpiEmoji}>{k.icono}</div>
              <div className={s.kpiValor}>{k.valor}</div>
              <div className={s.kpiLabel}>{k.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FUNCIONES (id="funciones")
      ════════════════════════════════════════════════════════════════════ */}
      <section id="funciones" className={s.sectionFunciones}>
        <div className={s.sectionInner}>

          {/* Encabezado */}
          <div className={s.sectionHeader}>
            <div className={s.sectionBadge}>✦ Funciones del Sistema</div>
            <h2 className={s.sectionTitle}>
              Todo lo que necesitas en{" "}
              <span className={s.sectionTitleAccent}>un solo lugar</span>
            </h2>
            <p className={s.sectionDesc}>
              Diseñado para que Administradores, Entrenadores y Recepcionistas
              trabajen de forma eficiente con acceso exactamente a lo que les corresponde.
            </p>
          </div>

          {/* 3 cards principales */}
          <div className={s.mainCardsGrid}>
            {FEATURES_MAIN.map(f => (
              <div
                key={f.id}
                className={s.mainCard}
                style={{ border: `1px solid ${f.color}30` }}
              >
                {/* Glow de color */}
                <div
                  className={s.mainCardGlow}
                  style={{ background: `${f.color}15` }}
                />
                {/* Barra superior de color */}
                <div
                  className={s.mainCardBar}
                  style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }}
                />
                <div
                  className={s.mainCardIcon}
                  style={{ background: f.acento, border: `1px solid ${f.color}40`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className={s.mainCardTitle}>{f.titulo}</h3>
                <p className={s.mainCardDesc}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* 3 cards extra */}
          <div className={s.extraCardsGrid}>
            {FEATURES_EXTRA.map(f => (
              <div
                key={f.titulo}
                className={s.extraCard}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${f.color}60`}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
              >
                <div className={s.extraCardGlow} style={{ background: `${f.color}12` }} />
                <div
                  className={s.extraCardIcon}
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}35` }}
                >
                  {f.icono}
                </div>
                <h3 className={s.extraCardTitle}>{f.titulo}</h3>
                <p className={s.extraCardDesc}>{f.desc}</p>
                <div
                  className={s.extraCardBar}
                  style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SPORT GYM SEDE 80 (id="sede80")
      ════════════════════════════════════════════════════════════════════ */}
      <section id="sede80" className={s.sectionSede}>
        {/* Fondo decorativo */}
        <div className={s.sedeDecorBg} />

        <div className={s.sectionInner}>
          <div className={s.sedeGrid}>
            {/* Columna izquierda — Texto */}
            <div>
              <div className={s.sectionBadge}>📍 Bogotá, Colombia</div>
              <h2 className={s.sedeTitle}>
                Entrena en el{" "}
                <span className={s.sedeTitleAccent}>Templo</span>
              </h2>
              <p className={s.sedeDesc}>
                <strong className={s.sedeDescAccent}>Sport Gym Sede 80</strong> es la sede principal de nuestra cadena en Bogotá.
                Contamos con el equipamiento más completo de la ciudad: zonas de peso libre, cardio de alta gama,
                piscina semiolímpica y salones especializados de funcional, boxeo y spinning.
              </p>
              <p className={s.sedeDesc2}>
                MetaFit es la tecnología que potencia el esfuerzo físico de nuestros más de
                <strong className={s.sedeDesc2Accent}> 1,200 afiliados activos</strong>, permitiendo a
                nuestro staff gestionar cada aspecto del rendimiento deportivo con precisión quirúrgica.
              </p>

              {/* Stats rápidas */}
              <div className={s.sedeStats}>
                {[
                  { valor: "3,500 m²",        label: "Área total" },
                  { valor: "6 AM–10 PM",       label: "Horario de atención" },
                  { valor: "Cra 80 con Av. 68", label: "Ubicación" },
                ].map(st => (
                  <div key={st.label}>
                    <div className={s.sedeStatValor}>{st.valor}</div>
                    <div className={s.sedeStatLabel}>{st.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna derecha — Visual */}
            <div className={s.sedeRightCol}>
              {/* Card principal */}
              <div className={s.sedeMainCard}>
                <div className={s.sedeMainCardEmoji}>🏟️</div>
                <h4 className={s.sedeMainCardTitle}>Infraestructura de Élite</h4>
                <p className={s.sedeMainCardDesc}>
                  Equipos Technogym y Life Fitness de última generación. Zona de CrossFit, pesas rusas,
                  máquinas de cable y plataformas olímpicas para levantamiento de potencia.
                </p>
              </div>

              {/* Dos mini-cards */}
              <div className={s.sedeMiniGrid}>
                {[
                  { icono: "👨‍💼", titulo: "Staff Experto", desc: "20+ entrenadores certificados NASM, ACE y NSCA." },
                  { icono: "🥤", titulo: "Nutribar",       desc: "Proteínas, suplementos y jugos naturales en sitio." },
                ].map(c => (
                  <div key={c.titulo} className={s.sedeMiniCard}>
                    <div className={s.sedeMiniEmoji}>{c.icono}</div>
                    <div className={s.sedeMiniTitle}>{c.titulo}</div>
                    <div className={s.sedeMiniDesc}>{c.desc}</div>
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
      <section id="nosotros" className={s.sectionNosotros}>
        <div className={s.nosotrosInner}>
          <div className={s.sectionBadge}>💡 Sobre MetaFit</div>
          <h2 className={s.nosotrosTitle}>
            La tecnología que{" "}
            <span className={s.sectionTitleAccent}>convierte el esfuerzo en datos</span>
          </h2>

          <p className={s.nosotrosDesc}>
            MetaFit nació de una necesidad real: <strong>digitalizar la pasión por el deporte</strong> en Sport Gym Sede 80.
            Los procesos manuales, las planillas en papel y la falta de seguimiento eran el obstáculo entre nuestros entrenadores y el máximo rendimiento de cada afiliado.
          </p>
          <p className={s.nosotrosDesc2}>
            Hoy, MetaFit integra la gestión de <strong>rutinas, nutrición, pagos y personal</strong> en un solo ecosistema.
            Cada dato capturado es una decisión más inteligente para el entrenador,
            un paso más hacia el objetivo para el afiliado, y un peso menos para la administración.
          </p>

          {/* Valores */}
          <div className={s.valoresGrid}>
            {[
              { icono: "⚡", titulo: "Eficiencia",    desc: "Automatizamos los procesos operativos para que el foco esté en el entrenamiento.", color: "#f59e0b" },
              { icono: "🎯", titulo: "Precisión",     desc: "Cada plan nutricional y rutina es calibrado a las métricas reales del afiliado.",   color: RED        },
              { icono: "🔒", titulo: "Confiabilidad", desc: "Datos seguros, acceso controlado por roles y trazabilidad total de operaciones.",   color: "#e31c25"  },
              { icono: "📈", titulo: "Crecimiento",   desc: "Métricas de negocio en tiempo real para decisiones estratégicas más rápidas.",      color: "#059669"  },
            ].map(v => (
              <div key={v.titulo} className={s.valorCard}>
                <div className={s.valorEmoji}>{v.icono}</div>
                <div className={s.valorTitulo} style={{ color: v.color }}>{v.titulo}</div>
                <div className={s.valorDesc}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════════════════════════════ */}
      <section className={s.sectionCta}>
        <div className={s.ctaGlowBg} />
        <div className={s.ctaInner}>
          <div className={s.ctaEmoji}>💪</div>
          <h2 className={s.ctaTitle}>
            ¿Listo para transformar la gestión{" "}
            <span className={s.sectionTitleAccent}>de tu gimnasio?</span>
          </h2>
          <p className={s.ctaDesc}>
            Ingresa al sistema ahora y experimenta el control total sobre
            rutinas, dietas, pagos y personal desde un solo panel.
          </p>
          <Link to="/login" className={s.btnRed} style={{ padding: "15px 40px", fontSize: "1rem", borderRadius: 10 }}>
            🚀 Ingresar al Sistema — Es Gratis
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          APP MÓVIL
      ════════════════════════════════════════════════════════════════════ */}
      <section id="app-movil" className={s.sectionApp}>
        <div className={s.appInner}>
          {/* Columna izquierda — contenido */}
          <div className={s.appInfo}>
            <div className={s.sectionBadge}>📱 App Móvil</div>
            <h2 className={s.appTitle}>
              Lleva MetaFit en{" "}
              <span className={s.appTitleAccent}>tu bolsillo</span>
            </h2>
            <p className={s.appSubtitle}>
              Descarga nuestra app para Android y accede a tus rutinas, dietas y
              progreso desde cualquier lugar. Sin conexión a internet, sin excusas.
            </p>

            {/* Feature bullets */}
            <div className={s.appFeatures}>
              {[
                { icono: "🏋️", titulo: "Rutinas personalizadas", desc: "Planes de entrenamiento adaptados a tu nivel y objetivos, sincronizados en tiempo real con tu entrenador." },
                { icono: "🥗", titulo: "Planes nutricionales",    desc: "Dietas calculadas con tus macros exactos. Compatible con alergias, intolerancias y preferencias." },
                { icono: "📊", titulo: "Seguimiento de progreso", desc: "Gráficos de evolución, registro de pesos, medidas corporales e hitos alcanzados." },
                { icono: "🔒", titulo: "Datos seguros",           desc: "Autenticación biométrica, cifrado de extremo a extremo y control parental de privacidad." },
              ].map(f => (
                <div key={f.titulo} className={s.appFeature}>
                  <div className={s.appFeatureIcon}>{f.icono}</div>
                  <div>
                    <div className={s.appFeatureTitle}>{f.titulo}</div>
                    <div className={s.appFeatureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón descarga */}
            <a
              href="https://expo.dev/artifacts/eas/3mCh0-T8CEI3jK_APZUO6rM6-Al1ryP4kxRezmF-i7k.apk"
              download="metafit.apk"
              className={s.btnAppDownload}
              onClick={() => trackEvent("metaFit_apk_descargado")}
            >
              📥 Descargar APK para Android
            </a>
            <div className={s.appVersion}>Versión 1.0 · Solo Android · Gratis</div>
          </div>

          {/* Columna derecha — mockup celular */}
          <div className={s.appMockupCol}>
            <div className={s.appPhone}>
              {/* Notch */}
              <div className={s.appPhoneNotch} />
              {/* Pantalla */}
              <div className={s.appPhoneScreen}>
                <div className={s.appPhoneLogo}>💪</div>
                <div className={s.appPhoneTitle}>MetaFit</div>
                <div className={s.appPhoneSub}>Sport Gym Sede 80</div>
                <div className={s.appPhoneDivider} />
                <div className={s.appPhoneFeature}>🏋️ Rutinas</div>
                <div className={s.appPhoneFeature}>🥗 Dietas</div>
                <div className={s.appPhoneFeature}>📊 Progreso</div>
                <div className={s.appPhoneBadge}>v1.0</div>
              </div>
              {/* Home indicator */}
              <div className={s.appPhoneHome} />
            </div>
            <div className={s.appBadgeAndroid}>🤖 Android</div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════ */}
      <footer className={s.landingFooter}>
        <span className={s.footerCopy}>
          © {new Date().getFullYear()}{" "}
          <strong className={s.footerCopyBold}>MetaFit</strong>
          {" | "}Desarrollado para Sport Gym Sede 80
        </span>
        <div className={s.footerLinks}>
          <button className={s.footerLink} onClick={() => setShowTerminos(true)}>
            📋 Términos y Condiciones
          </button>
          <span className={s.footerSep}>|</span>
          <span className={s.footerLink} onClick={() => scrollTo("nosotros")}>Sobre Nosotros</span>
        </div>
        <a href="https://www.instagram.com/sportgymsede80/" target="_blank" rel="noopener noreferrer" className={s.footerIg}>
          <IgIcon /> @sportgymsede80
        </a>
      </footer>
    </div>
  );
}

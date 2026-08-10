import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./PublicLayout.module.css";

/* Paleta de marca — usada en estilos DINÁMICOS (inline) */
const RED      = "#e31c25";
const RED_DARK = "#b71c1c";
const RED_GLOW = "rgba(227,28,37,0.30)";

function IgIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function ModalTerminos({ onClose }) {
  const secciones = [
    { n: "1", t: "🔒 Privacidad de Datos",       c: "#e31c25", p: "MetaFit recopila únicamente los datos necesarios para la gestión de membresías e historial de entrenamiento, conforme a la Ley 1581 de 2012 (Habeas Data). Los datos no serán compartidos con terceros sin autorización." },
    { n: "2", t: "🏋️ Uso de Instalaciones",      c: "#2563eb", p: "El acceso está restringido a afiliados con membresía activa. El uso inadecuado de equipos puede resultar en suspensión de membresía. Los horarios y normas pueden actualizarse sin previo aviso." },
    { n: "3", t: "⚕️ Responsabilidad en Salud",  c: RED,       p: "Sport Gym Sede 80 no asume responsabilidad por lesiones derivadas del uso inadecuado de equipos. Se recomienda chequeo médico previo. Las rutinas y dietas son orientativas y no reemplazan el diagnóstico médico." },
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h5 className={styles.modalTitle}>📋 Términos y Condiciones</h5>
            <small className={styles.modalSub}>MetaFit — Sport Gym Sede 80 · v1.0</small>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {secciones.map(s => (
            <div key={s.n} className={styles.seccion}>
              <div className={styles.seccionHeader}>
                {/* Dinámico: colores del badge dependen de s.c (dato) */}
                <span className={styles.seccionBadge}
                  style={{ background: `${s.c}20`, border: `2px solid ${s.c}50`, color: s.c }}>
                  {s.n}
                </span>
                <h6 className={styles.seccionTitle}>{s.t}</h6>
              </div>
              <p className={styles.seccionText}>{s.p}</p>
            </div>
          ))}
          <div className={styles.modalNote}>
            Al usar las instalaciones aceptas estos términos. Consultas:{" "}
            <strong className={styles.modalNoteStrong}>admin@metafit.com</strong>
          </div>
        </div>

        <div className={styles.modalFooter}>
          {/* Dinámico: background usa RED/RED_DARK */}
          <button className={styles.modalOkBtn} onClick={onClose}
            style={{ background: `linear-gradient(135deg,${RED},${RED_DARK})` }}>
            Entendido ✓
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicLayout({ children }) {
  const [scrolled,     setScrolled]     = useState(false);
  const [showTerminos, setShowTerminos] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={styles.root}>
      {showTerminos && <ModalTerminos onClose={() => setShowTerminos(false)} />}

      {/* NAVBAR — background y borderBottom son DINÁMICOS (estado scrolled) */}
      <nav className={styles.navbar} style={{
        background:   scrolled ? "rgba(10,10,15,0.96)" : "rgba(10,10,15,0.75)",
        borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.07)" : "transparent"}`,
      }}>
        <div className={styles.navInner}>
          {/* Logo */}
          <Link to="/" className={styles.logoLink}>
            {/* Dinámico: filter usa RED_GLOW */}
            <span className={styles.logoIcon}
              style={{ filter: `drop-shadow(0 0 8px ${RED_GLOW})` }}>💪</span>
            <div>
              {/* Dinámico: gradient con RED para el texto */}
              <div className={styles.logoName} style={{
                background: `linear-gradient(90deg,#fff 60%,${RED})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>MetaFit</div>
              <div className={styles.logoTagline}>Sport Gym Sede 80</div>
            </div>
          </Link>

          {/* Botón volver — hover manejado por CSS */}
          <Link to="/" className={styles.backBtn}>← Volver al inicio</Link>
        </div>
      </nav>

      {/* CONTENIDO */}
      <main className={styles.main}>{children}</main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <span className={styles.footerCopy}>
          © {new Date().getFullYear()}{" "}
          <strong className={styles.footerCopyBrand}>MetaFit</strong>
          {" | "}Desarrollado para Sport Gym Sede 80
        </span>
        <div className={styles.footerLinks}>
          <button className={styles.footerLink} onClick={() => setShowTerminos(true)}>
            📋 Términos y Condiciones
          </button>
          <span className={styles.footerSep}>|</span>
          <a href="https://www.instagram.com/sportgymsede80/" target="_blank"
            rel="noopener noreferrer" className={styles.footerLinkIg}>
            <IgIcon /> @sportgymsede80
          </a>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import styles from "./Footer.module.css";

// ── Icono de Instagram (SVG inline, sin dependencias) ─────────────────────────
function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

// ── Modal de Términos y Condiciones ───────────────────────────────────────────
function ModalTerminos({ onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>

        {/* Header del modal */}
        <div className={styles.modalHeader}>
          <div>
            <h5 className={styles.modalHeaderTitle}>📋 Términos y Condiciones</h5>
            <small className={styles.modalHeaderSub}>
              MetaFit — Sport Gym Sede 80 · Versión 1.0 · Abril 2026
            </small>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        {/* Cuerpo */}
        <div className={styles.modalBody}>
          {[
            {
              num: "1", titulo: "🔒 Privacidad de Datos", color: "#e31c25",
              parrafos: [
                "MetaFit recopila únicamente los datos necesarios para la gestión de membresías, historial de entrenamiento y planes nutricionales de cada afiliado. Esta información es tratada conforme a la Ley 1581 de 2012 (Habeas Data) y el Decreto 1377 de 2013 de Colombia.",
                "Los datos personales (nombre, documento, correo, teléfono) son usados exclusivamente para la operación interna del gimnasio y no serán compartidos con terceros sin autorización expresa del titular.",
                "El afiliado tiene derecho a conocer, actualizar, rectificar o solicitar la eliminación de sus datos en cualquier momento, contactando a la administración de Sport Gym Sede 80.",
              ],
            },
            {
              num: "2", titulo: "🏋️ Uso de Instalaciones", color: "#2563eb",
              parrafos: [
                "El acceso a las instalaciones de Sport Gym Sede 80 está restringido exclusivamente a afiliados con membresía activa y al día en sus pagos. El sistema MetaFit valida automáticamente el estado de membresía al momento del ingreso.",
                "El uso de los equipos debe realizarse de manera responsable. Cualquier daño intencional o uso inadecuado resultará en la suspensión temporal o definitiva de la membresía, a criterio de la administración.",
                "Los horarios de atención, clases grupales y uso de áreas específicas (sauna, zona cardio, peso libre) están sujetos a disponibilidad y a las normas internas del gimnasio, las cuales pueden ser actualizadas sin previo aviso.",
              ],
            },
            {
              num: "3", titulo: "⚕️ Responsabilidad en Salud", color: "#059669",
              parrafos: [
                "Sport Gym Sede 80 no asume responsabilidad por lesiones derivadas del uso inadecuado de los equipos, el incumplimiento de las indicaciones de los entrenadores o la omisión de información médica relevante al momento de la inscripción.",
                "Se recomienda a todos los afiliados realizarse un chequeo médico previo al inicio de cualquier programa de entrenamiento, especialmente si padecen condiciones como hipertensión, diabetes, problemas cardiovasculares o lesiones musculoesqueléticas.",
                "Las rutinas y planes nutricionales asignados a través del sistema MetaFit son orientativos y no reemplazan el diagnóstico o tratamiento médico profesional.",
              ],
            },
          ].map((seccion) => (
            <section key={seccion.num} className={styles.seccion}>
              <div className={styles.seccionHeader}>
                {/* DINÁMICO: background, border y color dependen de seccion.color (dato) */}
                <span
                  className={styles.seccionNum}
                  style={{
                    background: `${seccion.color}15`,
                    border:     `2px solid ${seccion.color}40`,
                    color:       seccion.color,
                  }}
                >
                  {seccion.num}
                </span>
                <h6 className={styles.seccionTitulo}>{seccion.titulo}</h6>
              </div>
              {seccion.parrafos.map((p, i) => (
                <p key={i} className={styles.seccionParrafo}>{p}</p>
              ))}
              {seccion.num !== "3" && <hr className={styles.seccionDivider} />}
            </section>
          ))}

          {/* Nota legal */}
          <div className={styles.modalNote}>
            Al hacer uso de las instalaciones y del sistema MetaFit, el afiliado acepta estos términos
            y condiciones en su totalidad. Para consultas: <strong>admin@metafit.com</strong>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.modalOkBtn} onClick={onClose}>Entendido ✓</button>
        </div>
      </div>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
export default function Footer() {
  const [showTerminos, setShowTerminos] = useState(false);
  const year = new Date().getFullYear();

  return (
    <>
      {showTerminos && <ModalTerminos onClose={() => setShowTerminos(false)} />}

      <footer className={styles.footer}>
        {/* Izquierda: Copyright */}
        <span className={styles.copyright}>
          © {year}{" "}
          <strong className={styles.copyrightBrand}>MetaFit</strong>
          {" · "}
          <span className={styles.copyrightSub}>Sport Gym Sede 80</span>
        </span>

        {/* Centro: Términos y Condiciones */}
        <button
          id="btn-terminos-condiciones"
          onClick={() => setShowTerminos(true)}
          className={styles.link}
        >
          📋 Términos y Condiciones
        </button>

        {/* Derecha: Instagram */}
        <a
          id="link-instagram-sportgym"
          href="https://www.instagram.com/sportgymsede80/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkIg}
        >
          <InstagramIcon />
          @sportgymsede80
        </a>
      </footer>
    </>
  );
}

import React from "react";
import PublicLayout from "../PublicLayout";
import styles from "../../views/Login.module.css";

const RED = "#e31c25";
const RED_DARK = "#b71c1c";
const RED_GLOW = "rgba(227,28,37,0.30)";
const DARK2 = "#12121e";
const DARK3 = "#1a1a2e";

// Tarjeta común de las pantallas de recuperación/restablecimiento de contraseña.
export default function AuthCard({ icon, subtitle, formTitle, children, footerLink }) {
  return (
    <PublicLayout>
      <div className={styles.wrapper}>
        <div className={styles.glow} style={{
          background: `radial-gradient(circle, ${RED_GLOW} 0%, rgba(227,28,37,0.08) 55%, transparent 72%)`,
        }} />

        <div className={styles.card}
          style={{ background: `linear-gradient(160deg, ${DARK2} 0%, ${DARK3} 100%)` }}>

          <div className={styles.cardHeader}
            style={{ background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)` }}>
            <div className={styles.deco1} />
            <div className={styles.deco2} />
            <div className={styles.logoIcon}>{icon}</div>
            <h1 className={styles.logoTitle}>MetaFit</h1>
            <p className={styles.logoSubtitle}>{subtitle}</p>
          </div>

          <div className={styles.cardBody}>
            <h2 className={styles.formTitle}>{formTitle}</h2>
            {children}
            <div className={styles.forgotRow}>{footerLink}</div>
          </div>

          <div className={styles.cardFooter}>
            MetaFit v1.0 &nbsp;·&nbsp; {new Date().getFullYear()} &nbsp;·&nbsp; Sport Gym Sede Santa Rosita
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

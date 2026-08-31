// ============================================================
// src/components/common/StatsCard.jsx — Tarjeta de métrica KPI
// ============================================================

import styles from "./StatsCard.module.css";

const COLOR_CLASS = {
  primary: styles.primary,
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
  info: styles.info,
};

export default function StatsCard({
  title,
  value,
  icono,
  color = "primary",
  subtitle,
  className = "",
}) {
  const colorClass = COLOR_CLASS[color] || COLOR_CLASS.primary;

  return (
    <div className={`${styles.card} ${colorClass} ${className}`}>
      <div className={styles.body}>
        <div className={styles.textWrap}>
          <div className={styles.title}>{title}</div>
          <div className={styles.value}>{value}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
        {icono && <div className={styles.icon}>{icono}</div>}
      </div>
    </div>
  );
}
import React from "react";
import styles from "../../views/Login.module.css";

const RED = "#e31c25";
const RED_GLOW = "rgba(227,28,37,0.30)";

const focus = (e) => {
  e.target.style.borderColor = RED;
  e.target.style.boxShadow = `0 0 0 3px ${RED_GLOW}`;
};

const blur = (e) => {
  e.target.style.borderColor = "rgba(255,255,255,0.1)";
  e.target.style.boxShadow = "none";
};

// Campo de texto/contraseña de las pantallas de autenticación.
export default function AuthInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  password = false,
  showPass = false,
  onTogglePass,
}) {
  const input = (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`${styles.input} ${password ? styles.passInput : ""}`.trim()}
      onFocus={focus}
      onBlur={blur}
    />
  );

  return (
    <div className={styles.fieldGroupLast}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      {password ? (
        <div className={styles.passWrap}>
          {input}
          <button
            type="button"
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            className={styles.eyeBtn}
            onClick={onTogglePass}
          >
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>
      ) : input}
    </div>
  );
}

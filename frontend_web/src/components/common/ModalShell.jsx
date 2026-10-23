import React from "react";

/**
 * Envoltorio común de modales de las vistas de staff.
 *
 * Mantiene el mismo DOM/clases que usaban las vistas (se pasan vía `classes`)
 * para no alterar estilos ni tests, y centraliza el overlay, la cabecera y el
 * cierre por teclado/click fuera del contenido.
 */
export default function ModalShell({
  classes,
  title,
  titleId,
  maxWidth,
  onClose,
  closeDisabled = false,
  closeLabel = "✕",
  overlayAriaLabel = "Cerrar modal",
  closeAriaLabel,
  dialog = false,
  onSubmit,
  children,
}) {
  const content = onSubmit ? <form onSubmit={onSubmit}>{children}</form> : children;

  return (
    <div
      className={classes.modalOverlay}
      role="button"
      tabIndex={0}
      aria-label={overlayAriaLabel}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Escape" || e.key === "Enter")) onClose();
      }}
    >
      <div
        className={classes.modalContent}
        style={maxWidth ? { maxWidth } : undefined}
        {...(dialog ? { role: "dialog", "aria-modal": "true", "aria-labelledby": titleId } : {})}
      >
        <div className={classes.modalHeader}>
          <h5 id={titleId} className={classes.modalTitle}>{title}</h5>
          <button
            type="button"
            className={classes.btnOutline}
            onClick={onClose}
            disabled={closeDisabled}
            aria-label={closeAriaLabel}
          >
            {closeLabel}
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}

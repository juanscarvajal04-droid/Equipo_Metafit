// ============================================================
// src/components/common/RestriccionSelector.jsx
//
// Selector de restricciones médicas para un afiliado.
// Muestra los badges de las restricciones asignadas y permite
// agregar/remover desde el catálogo /catalogo/restricciones.
// Sin dependencia react-bootstrap: modales propios (CSS module).
// ============================================================

import { useEffect, useState } from "react";
import { fetchRestricciones } from "../../services/restriccionService";
import { TIPO_ICONO } from "../../services/restriccionService";
import styles from "./RestriccionSelector.module.css";

const getId = (r) => r?.id_restriccion ?? r?.id ?? r;
const getNombre = (r) => r?.nombre_restriccion ?? (typeof r === "string" ? r : "");

export default function RestriccionSelector({
  restriccionesAsignadas = [],
  onAdd,
  onRemove,
  disabled = false,
  readOnly = false,
  isRegistration = false,
}) {
  const [showModal, setShowModal] = useState(false);
  const [catalogo, setCatalogo] = useState(null);
  const [selectedId, setSelectedId] = useState("");

  const asignadasIds = restriccionesAsignadas
    .map(getId)
    .filter((v) => v != null);

  useEffect(() => {
    let activo = true;
    if (showModal && catalogo === null) {
      fetchRestricciones()
        .then((data) => {
          if (!activo) return;
          setCatalogo(Array.isArray(data) ? data : []);
          setSelectedId("");
        })
        .catch((err) => {
          if (!activo) return;
          console.error("[RestriccionSelector] cargar catálogo:", err);
          setCatalogo([]);
        });
    }
    return () => { activo = false; };
  }, [showModal, catalogo]);

  const loading = showModal && catalogo === null;

  const disponibles = catalogo.filter(
    (r) => !asignadasIds.includes(getId(r))
  );

  const handleAdd = async () => {
    if (!selectedId || !onAdd) return;
    try {
      if (isRegistration) {
        // Modo registro: el estado lo maneja el padre (se asigna al guardar)
        const restriccion = catalogo.find((r) => getId(r) === selectedId);
        if (restriccion) onAdd(restriccion);
        setSelectedId("");
        setShowModal(false);
        return;
      }
      await onAdd(selectedId);
      setSelectedId("");
      setShowModal(false);
    } catch (err) {
      console.error("[RestriccionSelector] asignar:", err);
    }
  };

  const handleRemove = async (id) => {
    if (!onRemove) return;
    if (window.confirm("¿Remover esta restricción?")) {
      try {
        await onRemove(id);
      } catch (err) {
        console.error("[RestriccionSelector] remover:", err);
      }
    }
  };

  const puedeEditar = !readOnly && !disabled;

  return (
    <div className={styles.wrap}>
      <div className={styles.badges}>
        {restriccionesAsignadas.length === 0 ? (
          <span className={styles.vacio}>Sin restricciones registradas</span>
        ) : (
          restriccionesAsignadas.map((r) => {
            const id = getId(r);
            const nombre = getNombre(r);
            const tipo = r?.tipo || "";
            return (
              <span key={id} className={styles.badge}>
                <span>{TIPO_ICONO[tipo] || "📌"} {nombre}</span>
                {puedeEditar && (
                  <button
                    type="button"
                    className={styles.badgeX}
                    onClick={() => handleRemove(id)}
                    aria-label={`Remover ${nombre}`}
                    title="Remover"
                  >
                    ✕
                  </button>
                )}
              </span>
            );
          })
        )}
      </div>

      {puedeEditar && (
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setShowModal(true)}
        >
          + Agregar restricción
        </button>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h5 className={styles.modalTitle}>➕ Agregar restricción</h5>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {loading ? (
                <div className={styles.cargando}>Cargando catálogo...</div>
              ) : disponibles.length === 0 ? (
                <div className={styles.vacio}>
                  Todas las restricciones del catálogo ya están asignadas.
                </div>
              ) : (
                <select
                  className={styles.select}
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {disponibles.map((r) => (
                    <option key={getId(r)} value={getId(r)}>
                      {TIPO_ICONO[r?.tipo] || "📌"} {getNombre(r)} ({r?.tipo || "—"})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleAdd}
                disabled={!selectedId || loading}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
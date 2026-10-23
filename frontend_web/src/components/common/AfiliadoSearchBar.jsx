import React from "react";

// Barra de búsqueda de afiliados compartida por rutinas y dietas.
export default function AfiliadoSearchBar({
  classes,
  title,
  search,
  onSearch,
  onRefresh,
  loading,
  containerClassName,
  containerStyle,
}) {
  return (
    <div className={containerClassName} style={containerStyle}>
      <span className="fw-bold" style={{ fontSize: "0.85rem", color: "var(--mf-text)" }}>{title}</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          className={classes.searchInput}
          placeholder="Buscar afiliado..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ maxWidth: 260, padding: "0.4rem 0.7rem", fontSize: "0.85rem" }}
        />
        <button
          type="button"
          className={classes.btnRefresh}
          onClick={onRefresh}
          disabled={loading}
          title="Refrescar"
        >
          {loading ? <span className="spinner-border spinner-border-sm" /> : "🔄"}
        </button>
      </div>
    </div>
  );
}

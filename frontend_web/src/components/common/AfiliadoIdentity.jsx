import React from "react";
import { avatarColor, inicial, nombreCompleto } from "../../utils/afiliadoHelpers";

// Avatar + nombre + correo de un afiliado, reutilizado en tablas y modales.
export default function AfiliadoIdentity({ afiliado, classes, avatarClassName = "avatar" }) {
  const nombre = nombreCompleto(afiliado);
  const email = afiliado?.correo || afiliado?.email || "";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div className={classes[avatarClassName]} style={{ background: avatarColor(nombre) }}>
        {inicial(afiliado)}
      </div>
      <div>
        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{nombre}</div>
        <div className={classes.emailText}>{email}</div>
      </div>
    </div>
  );
}

// src/stories/metaFit.stories.jsx
// Storybook — biblioteca de componentes MetaFit (tema oscuro).
import React from 'react';
import './metaFit.css';

/* ── Componentes de demostración ─────────────────────────────── */

function Badge({ label = 'Activo', color = '#059669' }) {
  return (
    <span className="mfBadge" style={{ background: `${color}22`, color }}>
      {label}
    </span>
  );
}

function Button({ label = 'Guardar', variant = 'primary', disabled = false }) {
  const colors = {
    primary: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    secondary: '#252545',
    danger: 'linear-gradient(135deg, #e31c25, #b71c1c)',
  };
  const fg = variant === 'secondary' ? '#e2e8f0' : '#ffffff';
  return (
    <button className="mfButton" style={{ background: colors[variant], color: fg }} disabled={disabled}>
      {label}
    </button>
  );
}

function Card({ title = 'Entrenamiento de hoy', texto = 'Pierna · 4 series x 12 reps', footer = 'Lunes · 7:00 AM' }) {
  return (
    <div className="mfCard">
      <h4 className="mfCardTitle">{title}</h4>
      <p className="mfCardText">{texto}</p>
      <div className="mfCardFooter">{footer}</div>
    </div>
  );
}

function Modal({ title = 'Nuevo afiliado', children = '¿Deseas registrar este afiliado en el sistema?' }) {
  return (
    <div className="mfModalOverlay">
      <div className="mfModal">
        <div className="mfModalHeader">
          <h4 className="mfModalTitle">{title}</h4>
          <button className="mfModalClose">✕</button>
        </div>
        <div className="mfModalBody">{children}</div>
      </div>
    </div>
  );
}

function Avatar({ iniciales = 'JL', size = 56, color = '#7c3aed' }) {
  return (
    <div
      className="mfAvatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
    >
      {iniciales}
    </div>
  );
}

/* ── Historias ───────────────────────────────────────────────── */

export default {
  title: 'MetaFit/Componentes',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0a0a0f' }] },
  },
};

export const Badges = () => (
  <div className="mfDemo">
    <div>
      <p className="mfDemoTitle">Badges de estado</p>
      <div className="mfDemoRow">
        <Badge label="Activo" color="#059669" />
        <Badge label="Suspendido" color="#e31c25" />
        <Badge label="Administrador" color="#7c3aed" />
        <Badge label="Practicante" color="#2563eb" />
      </div>
    </div>
  </div>
);

export const Botones = () => (
  <div className="mfDemo">
    <div>
      <p className="mfDemoTitle">Tipos de botón</p>
      <div className="mfDemoRow">
        <Button label="Guardar" variant="primary" />
        <Button label="Cancelar" variant="secondary" />
        <Button label="Eliminar" variant="danger" />
        <Button label="Deshabilitado" variant="primary" disabled />
      </div>
    </div>
  </div>
);

export const Tarjetas = () => (
  <div className="mfDemo">
    <div>
      <p className="mfDemoTitle">Tarjeta de contenido</p>
      <div className="mfDemoRow">
        <Card />
        <Card title="Plan de dieta" texto="2000 kcal · 5 comidas · alto en proteína" footer="Nutricionista: María P." />
      </div>
    </div>
  </div>
);

export const Modales = () => (
  <div className="mfDemo">
    <Modal />
  </div>
);

export const Avatares = () => (
  <div className="mfDemo">
    <div>
      <p className="mfDemoTitle">Avatar de usuario</p>
      <div className="mfDemoRow">
        <Avatar iniciales="JL" size={56} color="#7c3aed" />
        <Avatar iniciales="MC" size={56} color="#2563eb" />
        <Avatar iniciales="DP" size={56} color="#059669" />
        <Avatar iniciales="SR" size={72} color="#e31c25" />
      </div>
    </div>
  </div>
);
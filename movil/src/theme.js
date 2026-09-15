// movil/src/theme.js
// ─── Design tokens de la app móvil ───────────────────────────
// La app es 100% dark-mode fijo: reproduce la paleta oscura del frontend web
// (variables --mf-* definidas en frontend_web/src/index.css) para que el
// producto se sienta idéntico en web y móvil. Cada token documenta de dónde
// sale su valor y por qué.
export const COLORS = {
  // Fondo general #0a0a0f: es el --mf-bg del web. Negro azulado casi puro —
  // alto contraste con tarjetas (#1a1a2e) sin quemar la vista.
  bg: '#0a0a0f',
  // Fondo de superficies secundarias (tab bar, inputs alt): versión 1 nivel
  // más clara que bg, matiz púrpura-azulado idéntico a --mf-surface.
  bgSecondary: '#12121e',
  // Fondo de tarjetas/cards: #1a1a2e = --mf-card del web. Sobre bg destaca
  // por luminosidad (no por borde), estrategia visual usada en web y móvil.
  bgCard: '#1a1a2e',
  // Texto principal blanco puro: máximo contraste en dark mode (--mf-text).
  text: '#ffffff',
  // Texto secundario al 50% de blanco: jerarquía sin gris "sucio" (subtítulos).
  textSecondary: 'rgba(255,255,255,0.5)',
  // Texto terciario al 30%: metadatos, fechas, hints deshabilitados (--mf-muted).
  textMuted: 'rgba(255,255,255,0.3)',
  // Rojo brand #e31c25: ES el mismo color corporativo del web (--mf-accent,
  // logo "MetaFit", spinner de login, badge Pagado). Identidad visual única.
  red: '#e31c25',
  // Rojo oscuro #b71c1c: gradiente/estado hover del brand (mismo web).
  redDark: '#b71c1c',
  // Resplandor rojo (glow) a 30%: bordes/sombras de marca sin competir con bg.
  redGlow: 'rgba(227,28,37,0.3)',
  // Púrpura del rol Administrador (RBAC): en el web cada rol tiene su color
  // (ROLE_COLOR); acá se mapean los mismos: Admin púrpura #7c3aed...
  admin: '#7c3aed',
  // Entrenador verde #059669 = color de rol "Entrenador" del web (--mf-success).
  entrenador: '#059669',
  // Recepcionista azul #2563eb = color de rol "Recepcionista" del web.
  recepcionista: '#2563eb',
  // Éxito verde #059669: mismo semantic color del web (badges "Al día/Pagado").
  success: '#059669',
  // Advertencia ámbar #f59e0b: mismo que web para "Por vencer" (≤10 días).
  warning: '#f59e0b',
  // Error rojo #e31c25: mismo brand-rojo, evita introducir un segundo rojo.
  error: '#e31c25',
  // Bordes al 10% blanco: traza sutil que separa cards sin romper el dark
  // (equivale a --mf-border del web).
  border: 'rgba(255,255,255,0.1)',
  // Borde activo al 20%: inputs/items enfocados tienen traza más visible.
  borderActive: 'rgba(255,255,255,0.2)',
  // Fondo de inputs: idéntico a bgCard para que los campos "floten" como cards.
  inputBg: '#1a1a2e',
  // Púrpura #8b5cf6: acento de la app móvil (spinner de loading, botones
  // principales, gradientes). No viene del web: es el color "MetaFit" de la
  // app, elegido para diferenciar la marca del afiliado en el móvil.
  purple: '#8b5cf6',
  // Púrpura claro #a78bfa: texto/iconos activos de la tab bar (contraste sobre
  // tabBar bg oscura mejor que el purple base).
  purpleLight: '#a78bfa',
  // Púrpura oscuro #6d28d9: final de gradientes púrpura (profundidad).
  purpleDark: '#6d28d9',
  // Glow púrpura a 30%: sombras/bordes de acento de la marca móvil.
  purpleGlow: 'rgba(139,92,246,0.3)',
  // Azul agua #3b82f6: del módulo de hidratación (la convención universal del
  // agua es azul; no choca con el azul "Recepcionista" en contexto).
  water: '#3b82f6',
  // Fondo azul claro de widgets de agua (azul al 20%).
  waterLight: 'rgba(59,130,246,0.2)',
  // Verde "check" #10b981: para checks/confirmaciones del registro diario.
  check: '#10b981',
  // Fondo de chips de "hecho", verde al 15%.
  checkBg: 'rgba(16,185,129,0.15)',
};

// Paletas de gradiente: los dos extremos de cada degradado. Coinciden con los
// colores por rol del web (ROLE_GRADIENT de la Sidebar) para continuidad visual.
export const GRADIENTS = {
  /** Gradiente corporativo rojo (brand principal, login/landing). */
  rojo: ['#e31c25', '#b71c1c'],
  /** Gradiente oscuro de tarjetas: de bgCard hacia un azul-púrpura profundo. */
  oscuro: ['#1a1a2e', '#16213e'],
  /** Gradiente de rol Administrador (igual a ROLE_GRADIENT del web). */
  admin: ['#7c3aed', '#4f46e5'],
  /** Gradiente de rol Entrenador (igual al web). */
  entrenador: ['#059669', '#0d9488'],
  /** Gradiente de rol Recepcionista (igual al web). */
  recepcionista: ['#2563eb', '#0891b2'],
  /** Gradiente púrpura principal de la app móvil (marca "MetaFit móvil"). */
  purple: ['#8b5cf6', '#6d28d9'],
  /** Gradiente púrpura profundo (headers/botones de énfasis). */
  purpleDark: ['#6d28d9', '#4c1d95'],
  /** Gradiente de agua/hidratación: azul claro → azul profundo. */
  water: ['#3b82f6', '#1d4ed8'],
};

// Escala tipográfica base (pt RN): title 28 para titulares de pantalla,
// subtitle 18 para encabezados de sección, body 15 para texto, small 13 para
// metadatos y xsmall 11 para etiquetas de la tab bar y badges. Intencionalmente
// más grande que el web porque RN no renderiza con la misma densidad.
export const FONTS = {
  /** Títulos principales de pantalla / landing. */
  title: 28,
  /** Encabezados de sección y tarjetas. */
  subtitle: 18,
  /** Texto de cuerpo general. */
  body: 15,
  /** Texto secundario / metadatos. */
  small: 13,
  /** Etiquetas de tab bar y badges pequeños. */
  xsmall: 11,
};

// Escala de espaciado base 4: valores 4/8/16/24/32 garantizan ritmo vertical
// consistente (misma regla de diseño por 4 que suele verse en los márgenes web).
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Sombras para React Native: shadow* (iOS) + elevation (Android). La card usa
// sombra neutra suave (opacidad 0.3, blur 8) y purple una sombra con tinte de
// marca para elementos de accion/CTA.
export const SHADOWS = {
  /** Sombra de tarjetas: elevación media, neutra y sutil. */
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  /** Sombra sutil: para chips y elementos pequeños (menos elevación). */
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  /** Sombra púrpura: CTA/botones primarios — da "brillo" de marca. */
  purple: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
};

// Radii de tarjetas/inputs: de 6 (controles pequeños) a 24 (cards hero).
// Escala que replica los border-radius del web (--mf-radius) en tamaños RN.
export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
};

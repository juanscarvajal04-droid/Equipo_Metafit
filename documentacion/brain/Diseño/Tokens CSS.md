# 🎛️ Tokens CSS

> Design system de variables CSS para el frontend web

---

## 📁 Archivo Principal

`frontend_web/src/index.css` — 329 líneas de tokens

---

## 🏗️ Categorías de Tokens

### Superficies
```css
:root {
  --mf-bg:          #0a0a0f;
  --mf-bg-grad:     linear-gradient(180deg, #1a1a2e 0%, #0a0a0f 100%);
  --mf-sidebar:     #0e0e14;
  --mf-surface:     #16171d;
  --mf-surface-2:   #1f2230;
  --mf-surface-3:   #2a2e3f;
}
```

### Bordes
```css
:root {
  --mf-border:          rgba(255, 255, 255, 0.08);
  --mf-border-strong:   rgba(255, 255, 255, 0.18);
}
```

### Texto
```css
:root {
  --mf-text:       #e2e8f0;
  --mf-text-primary:   #e2e8f0;
  --mf-text-secondary: #94a3b8;
  --mf-text-tertiary:  #64748b;
  --mf-muted:      #94a3b8;
  --mf-faint:      #64748b;
}
```

### Marca
```css
:root {
  --mf-accent:         #c1121f;
  --mf-accent-hover:   #e31c25;
  --mf-accent-soft:    rgba(193, 18, 31, 0.14);
  --mf-accent-strong:  rgba(193, 18, 31, 0.28);
  --mf-on-accent:      #ffffff;
  --mf-accent-2:       #4b9ecb;
}
```

### Estados
```css
:root {
  --mf-success:    #22c55e;
  --mf-error:      #f87171;
  --mf-error-soft: rgba(248, 113, 113, 0.12);
  --mf-warning:    #fbbf24;
  --mf-hover:      rgba(255, 255, 255, 0.04);
}
```

### Elevación (Atlassian-style)
```css
:root {
  --mf-shadow-card:      0 1px 2px rgba(9, 30, 66, 0.25);
  --mf-shadow-raised:    0 8px 16px rgba(9, 30, 66, 0.32);
  --mf-shadow-popover:   0 4px 8px rgba(9, 30, 66, 0.24);
  --mf-shadow-modal:     0 24px 48px rgba(9, 30, 66, 0.28);
  --mf-sidebar-shadow:   4px 0 24px rgba(9, 30, 66, 0.12);
  --mf-focus-ring:       0 0 0 3px rgba(193, 18, 31, 0.5);
}
```

### Forma
```css
:root {
  --mf-radius-sm:  6px;
  --mf-radius-md:  10px;
  --mf-radius-lg:  14px;
}
```

### Espaciado
```css
:root {
  --mf-spacing-xs:  4px;
  --mf-spacing-sm:  8px;
  --mf-spacing-md:  16px;
  --mf-spacing-lg:  24px;
  --mf-spacing-xl:  32px;
}
```

---

## ☀️ Modo Claro

```css
:root[data-theme='light'] {
  --mf-bg:         #fafafa;
  --mf-bg-grad:    linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  --mf-surface:    #ffffff;
  --mf-surface-2:  #f3f4f6;
  --mf-surface-3:  #e9eaee;
  --mf-border:     #e5e7eb;
  --mf-text:       #1a1a1a;
  --mf-muted:      #6b7280;
  --mf-faint:      #9ca3af;
  --mf-accent:     #e31c25;
  --mf-accent-hover: #b71c1c;
  --mf-accent-soft:  rgba(227, 28, 37, 0.08);
  --mf-shadow-card: 0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.1);
}
```

---

## 🔤 Tokens Legacy (Landing Page)

```css
:root {
  --text:    #6b6375;
  --text-h:  #08060d;
  --bg:      #fff;
  --border:  #e5e4e7;
  --code-bg: #f4f3ec;
  --accent:  #e31c25;
  --accent-bg: rgba(170, 59, 255, 0.1);
  --sans:    system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono:    ui-monospace, Consolas, monospace;
}
```

---

## 📱 Tokens Móvil (theme.js)

```js
export const COLORS = {
  bg: '#0a0a0f',           bgSecondary: '#12121e',    bgCard: '#1a1a2e',
  text: '#ffffff',         textSecondary: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.3)',
  red: '#e31c25',          purple: '#8b5cf6',
  success: '#059669',      warning: '#f59e0b',        error: '#e31c25',
  border: 'rgba(255,255,255,0.1)',  borderActive: 'rgba(255,255,255,0.2)',
  inputBg: '#1a1a2e',
  water: '#3b82f6',        check: '#10b981',
};

export const GRADIENTS = {
  rojo: ['#e31c25', '#b71c1c'],
  oscuro: ['#1a1a2e', '#16213e'],
  admin: ['#7c3aed', '#4f46e5'],
  entrenador: ['#059669', '#0d9488'],
  recepcionista: ['#2563eb', '#0891b2'],
  purple: ['#8b5cf6', '#6d28d9'],
};

export const FONTS = { title: 28, subtitle: 18, body: 15, small: 13, xsmall: 11 };
export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const BORDER_RADIUS = { sm: 6, md: 10, lg: 16, xl: 24 };
```

---

## 📎 Notas Relacionadas

- [[Paleta de colores]]
- [[Frontend React]]
- [[App Móvil React Native]]

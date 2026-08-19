# 🎨 Paleta de Colores

> Design system de colores para web (dark/light) y móvil

---

## 🌙 Modo Oscuro (Default)

### Superficies
| Token | Valor | Uso |
|---|---|---|
| `--mf-bg` | `#0a0a0f` | Fondo principal |
| `--mf-bg-grad` | `linear-gradient(180deg, #1a1a2e, #0a0a0f)` | Fondo con degradado |
| `--mf-surface` | `#16171d` | Tarjetas, paneles |
| `--mf-surface-2` | `#1f2230` | Elementos elevados |
| `--mf-surface-3` | `#2a2e3f` | Hover, activated |

### Texto
| Token | Valor | Uso |
|---|---|---|
| `--mf-text` | `#e2e8f0` | Texto principal |
| `--mf-muted` | `#94a3b8` | Texto secundario |
| `--mf-faint` | `#64748b` | Texto terciario |

### Bordes
| Token | Valor | Uso |
|---|---|---|
| `--mf-border` | `rgba(255,255,255,0.08)` | Bordes sutiles |
| `--mf-border-strong` | `rgba(255,255,255,0.18)` | Bordes activos |

---

## ☀️ Modo Claro

```css
:root[data-theme='light'] {
  --mf-bg: #fafafa;
  --mf-surface: #ffffff;
  --mf-surface-2: #f3f4f6;
  --mf-surface-3: #e9eaee;
  --mf-border: #e5e7eb;
  --mf-text: #1a1a1a;
  --mf-muted: #6b7280;
  --mf-faint: #9ca3af;
}
```

---

## 🎯 Colores de Marca

| Token | Valor | Uso |
|---|---|---|
| `--mf-accent` | `#c1121f` | Rojo principal (dark) |
| `--mf-accent-hover` | `#e31c25` | Rojo hover (dark) |
| `--mf-accent-soft` | `rgba(193,18,31,0.14)` | Fondo sutil rojo |
| `--mf-on-accent` | `#ffffff` | Texto sobre rojo |
| `--mf-accent-2` | `#4b9ecb` | Azul secundario |

### Modo Claro
| Token | Valor |
|---|---|
| `--mf-accent` | `#e31c25` |
| `--mf-accent-hover` | `#b71c1c` |
| `--mf-accent-soft` | `rgba(227,28,37,0.08)` |

---

## 🚦 Estados

| Token | Valor | Uso |
|---|---|---|
| `--mf-success` | `#22c55e` | Éxito, completado |
| `--mf-error` | `#f87171` | Error |
| `--mf-warning` | `#fbbf24` | Advertencia |

---

## 👥 Colores por Rol

### Web (Sidebar + Header)

| Rol | Color | Gradiente |
|---|---|---|
| **Administrador** | `#e31c25` | `linear-gradient(135deg, #e31c25, #b71c1c)` |
| **Recepcionista** | `#2563eb` | `linear-gradient(135deg, #2563eb, #0891b2)` |
| **Entrenador** | `#059669` | `linear-gradient(135deg, #059669, #0d9488)` |

### Móvil (theme.js)

| Token | Valor | Uso |
|---|---|---|
| `COLORS.red` | `#e31c25` | Marca |
| `COLORS.purple` | `#8b5cf6` | Tabs activos |
| `COLORS.admin` | `#7c3aed` | Gradiente admin |
| `COLORS.entrenador` | `#059669` | Gradiente entrenador |
| `COLORS.recepcionista` | `#2563eb` | Gradiente recepcionista |
| `COLORS.water` | `#3b82f6` | Registro de agua |
| `COLORS.check` | `#10b981` | Ejercicio completado |

---

## 🌈 Landing Page

```css
/* LandingPage.module.css */
--lp-red:      #e31c25;
--lp-red-dark: #b71c1c;
--lp-red-glow: rgba(227,28,37,0.35);
--lp-dark1:    #0a0a0f;
--lp-dark2:    #12121e;
--lp-dark3:    #1a1a2e;
```

---

## 📎 Notas Relacionadas

- [[Tokens CSS]]
- [[Favicon e iconos]]
- [[Frontend React]]
- [[App Móvil React Native]]

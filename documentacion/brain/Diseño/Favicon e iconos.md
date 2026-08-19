# 🖼️ Favicon e Iconos

> Assets gráficos y branding del proyecto

---

## 🔷 Favicon Principal (SVG)

**Archivo:** `frontend_web/public/favicon.svg`

Pesa (dumbbell) estilizada con el color de marca rojo.

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect x="0" y="0" width="64" height="64" fill="#ffffff"/>
  <rect x="20" y="27" width="24" height="10" rx="4" fill="#e31c25"/>
  <circle cx="16" cy="32" r="10" fill="#e31c25"/>
  <circle cx="48" cy="32" r="10" fill="#e31c25"/>
</svg>
```

### Colores del Favicon
| Elemento | Color |
|---|---|
| Fondo | `#ffffff` |
| Pesa | `#e31c25` (rojo de marca) |

---

## 📄 Referencias en HTML

**Archivo:** `frontend_web/index.html`

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="shortcut icon" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/favicon.svg" />
<meta name="theme-color" content="#ffffff" />
```

---

## 🎨 Branding "MetaFit Mechanical Crest"

**Archivo:** `frontend_web/public/README_favicon.md`

Diseño documentado con:
- Engranaje + anillos + hexágono
- Pesa central con monograma "MF"
- Paleta: fondo `#0a0a0f`, púrpura `#7c3aed`-`#8b5cf6`, rojo `#e31c25`

---

## 📱 Assets por Plataforma

### Frontend Web
| Archivo | Uso |
|---|---|
| `public/favicon.svg` | Favicon principal |
| `public/icons.svg` | Sprite de iconos sociales |
| `public/app/logo-metafit.png` | Logo PNG |
| `public/images/gym-hero.jpg` | Imagen hero de Landing |
| `public/app/metafit.apk` | APK pre-compilada |

### App Móvil
| Archivo | Uso |
|---|---|
| `movil/assets/images/favicon.png` | Favicon móvil |
| `movil/assets/images/logo-glow.png` | Logo con efecto glow |
| `movil/assets/images/icon.png` | Icono de la app |
| `movil/assets/expo.icon/icon.json` | Config Expo |

### Iconos Sociales (SVG Sprites)
| Icono | Archivo |
|---|---|
| GitHub | `icons.svg` |
| Discord | `icons.svg` |
| Bluesky | `icons.svg` |
| X (Twitter) | `icons.svg` |
| Documentación | `icons.svg` |

---

## 📦 Iconos de UI

### Frontend Web
- **Lucide React** (`lucide-react` v0.511.0)
- Iconos inline en Sidebar, Header, vistas

### App Móvil
- **Ionicons** via `@expo/vector-icons`
- `person` (Perfil), `barbell` (Rutina), `restaurant` (Dieta), `stats-chart` (Progreso)

---

## 📎 Notas Relacionadas

- [[Paleta de colores]]
- [[Tokens CSS]]
- [[Frontend React]]
- [[App Móvil React Native]]

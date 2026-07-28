# 🎨 Manual del Favicon de MetaFit

## Archivos incluidos

| Archivo | Tamaño | Propósito |
|---------|--------|-----------|
| `favicon.svg` | 64×64 | Favicon principal (SVG vectorial, funciona en todos los navegadores modernos) |
| `favicon-16x16.svg` | 16×16 | Versión optimizada para 16px |
| `favicon-32x32.svg` | 32×32 | Versión optimizada para 32px |
| `apple-touch-icon.svg` | 180×180 | Icono para dispositivos Apple (Safari, iOS, macOS) |

## Diseño

El favicon combina tres elementos clave de la identidad MetaFit:

1. **Pesa (dumbbell)** — representa el gimnasio, la fuerza, el entrenamiento físico.
2. **Monograma "MF"** — las iniciales de MetaFit, integradas en el centro de la barra.
3. **Cápsula hexagonal** — forma que evoca tecnología, modernidad y un ciclo continuo de entrenamiento.

Paleta de colores:
- Fondo: `#0a0a0f` / `#12121e` (oscuro técnico)
- Púrpura: `#7c3aed` → `#8b5cf6` → `#a78bfa` (gradiente, identidad principal)
- Rojo: `#e31c25` → `#b71c1c` (acento de energía)
- Blanco: `#ffffff` (texto del monograma)

## Cómo generar los archivos PNG y ICO

### Opción 1: Inkscape (recomendada, gratuita)

```bash
# Instalar Inkscape
sudo apt install inkscape  # Linux
# brew install --cask inkscape  # macOS

# Generar PNG desde SVG
inkscape frontend_web/public/favicon.svg \
  --export-width=32 --export-height=32 \
  --export-filename=frontend_web/public/favicon-32x32.png

inkscape frontend_web/public/favicon-16x16.svg \
  --export-width=16 --export-height=16 \
  --export-filename=frontend_web/public/favicon-16x16.png

inkscape frontend_web/public/apple-touch-icon.svg \
  --export-width=180 --export-height=180 \
  --export-filename=frontend_web/public/apple-touch-icon.png
```

### Opción 2: cairosvg (Python, vía pip)

```bash
pip install cairosvg pillow

python3 << 'EOF'
import cairosvg
from PIL import Image
import io

sizes = {
    'favicon-16x16.png': (16, 16, 'favicon-16x16.svg'),
    'favicon-32x32.png': (32, 32, 'favicon-32x32.svg'),
    'apple-touch-icon.png': (180, 180, 'apple-touch-icon.svg'),
}

for filename, (w, h, svg_file) in sizes.items():
    png_data = cairosvg.svg2png(
        url=f'frontend_web/public/{svg_file}',
        output_width=w, output_height=h
    )
    with open(f'frontend_web/public/{filename}', 'wb') as f:
        f.write(png_data)
    print(f'✓ {filename}')
EOF
```

### Opción 3: ImageMagick

```bash
sudo apt install imagemagick  # Linux
# brew install imagemagick  # macOS

convert frontend_web/public/favicon-16x16.svg \
  frontend_web/public/favicon-16x16.png

convert frontend_web/public/favicon-32x32.svg \
  frontend_web/public/favicon-32x32.png

convert frontend_web/public/apple-touch-icon.svg \
  frontend_web/public/apple-touch-icon.png
```

### Opción 4: Convertidores online (sin instalar nada)

1. Sube `favicon.svg` a https://realfavicongenerator.net/
2. Selecciona las opciones de diseño que prefieras
3. Descarga el paquete completo con PNG, ICO, y HTML

O alternativamente:
1. https://convertio.co/es/svg-png/ — convierte SVG a PNG en alta calidad
2. https://icoconverter.com/ — convierte PNG a ICO

### Generar el archivo .ico

El .ico debe contener múltiples resoluciones (16×16, 32×32, 48×48). Usando ImageMagick:

```bash
# Primero generar PNGs en varios tamaños
convert frontend_web/public/favicon.svg \
  -define icon:auto-resize=16,32,48 \
  frontend_web/public/favicon.ico
```

O con Inkscape + ImageMagick:
```bash
inkscape frontend_web/public/favicon.svg \
  --export-width=48 --export-height=48 \
  --export-filename=/tmp/favicon-48.png

convert /tmp/favicon-48.png \
  \( +clone -resize 32x32 \) \
  \( +clone -resize 16x16 \) \
  frontend_web/public/favicon.ico
```

## Nota importante

Los navegadores modernos (Chrome, Firefox, Edge, Safari 16+) usan el SVG
directamente. Los PNG e ICO son **fallbacks** para navegadores antiguos.
Si no puedes generar los PNG ahora, el sitio funcionará correctamente en
casi todos los dispositivos gracias al `favicon.svg`.

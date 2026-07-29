# Favicon de MetaFit — Manual de recursos

## Archivos incluidos

| Archivo | Tamaño | Propósito |
|---------|--------|-----------|
| `favicon.svg` | 64×64 | Favicon principal (todos los navegadores modernos) |
| `favicon-32x32.svg` | 32×32 | Versión optimizada para 32px |
| `favicon-16x16.svg` | 16×16 | Versión optimizada para 16px |
| `apple-touch-icon.svg` | 180×180 | Icono para iOS / Safari / macOS |

## Diseño — "MetaFit Mechanical Crest"

El favicon es un emblema circular con estética mecánico‑tecnológica que
combina:

1. **Engranaje exterior** — 12 dientes alrededor del perímetro que simbolizan
   precisión, tecnología y el movimiento continuo del entrenamiento.
2. **Anillos concéntricos** — Trazados sólidos y punteados que representan
   el ciclo de entrenamiento, la constancia y la evolución.
3. **Armazón hexagonal** — La estructura interna evoca estabilidad, fuerza
   y la rigurosidad del método deportivo.
4. **Pesa central (dumbbell)** — El símbolo universal del gimnasio, con
   dos discos: púrpura (identidad MetaFit) a la izquierda y rojo (energía)
   a la derecha.
5. **Monograma "MF"** — Las iniciales de MetaFit en blanco, con sombra
   y resplandor, centradas en la barra de la pesa.
6. **Letras M y F** — Talladas como espacio negativo en cada disco,
   integrando el branding en el propio icono.
7. **Arcos de movimiento** — Líneas curvas con partículas a los costados
   que transmiten energía, dinamismo y actividad.
8. **Puntos en vértices** — 8 puntos que marcan los vértices del hexágono,
   cada uno representa un valor: Fuerza, Disciplina, Tecnología, Pasión,
   Precisión, Comunidad, Crecimiento, Resultados.
9. **Diamantes decorativos** — 4 diamantes en los puntos intercardinales
   como detalle de calidad y premiumness.

### Paleta

- Fondo: `#0a0a0f` → `#12121e` (degradado sutil)
- Púrpura principal: `#7c3aed` → `#8b5cf6` → `#c084fc`
- Rojo acento: `#e31c25` → `#ff4d4d`
- Metálico: `rgba(255,255,255,0.04→0.12)`
- Texto: `#ffffff`

### Especificaciones técnicas

- 150 elementos SVG totales
- 10 degradados (9 lineales + 1 radial)
- 3 filtros (resplandor, sombra, brillo interno)
- 1 patrón (grid de fondo)
- 1 clipPath
- 12 dientes de engranaje
- 12 partículas de energía
- 28 stops de degradado

## Cómo generar PNG e ICO

### Opción 1: Inkscape (recomendada)

```bash
# Instalar
sudo apt install inkscape  # Linux
brew install --cask inkscape  # macOS

# Exportar PNG
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

### Opción 2: cairosvg (Python)

```bash
pip install cairosvg pillow

python3 << 'EOF'
import cairosvg
sizes = [
    ('favicon-16x16.png', 16, 16, 'favicon-16x16.svg'),
    ('favicon-32x32.png', 32, 32, 'favicon-32x32.svg'),
    ('apple-touch-icon.png', 180, 180, 'apple-touch-icon.svg'),
]
for name, w, h, src in sizes:
    png = cairosvg.svg2png(
        url=f'frontend_web/public/{src}',
        output_width=w, output_height=h
    )
    with open(f'frontend_web/public/{name}', 'wb') as f:
        f.write(png)
    print(f'✓ {name}')
EOF
```

### Opción 3: ImageMagick

```bash
sudo apt install imagemagick  # Linux

convert frontend_web/public/favicon-16x16.svg \
  frontend_web/public/favicon-16x16.png

convert frontend_web/public/favicon-32x32.svg \
  frontend_web/public/favicon-32x32.png

convert frontend_web/public/apple-touch-icon.svg \
  frontend_web/public/apple-touch-icon.png
```

### Opción 4: Generador online

1. https://realfavicongenerator.net/ — Subí `favicon.svg`,
   personalizá y descargá el paquete completo con PNG, ICO y HTML.
2. https://convertio.co/es/svg-png/ — Conversión simple SVG → PNG.

### Generar favicon.ico

```bash
# Con ImageMagick (requiere PNGs primero)
convert frontend_web/public/favicon-16x16.png \
  frontend_web/public/favicon-32x32.png \
  frontend_web/public/favicon.ico

# O directo desde SVG con auto-resize
convert frontend_web/public/favicon-32x32.svg \
  -define icon:auto-resize=16,32,48 \
  frontend_web/public/favicon.ico
```

## Nota importante

Los navegadores modernos (Chrome, Firefox, Edge, Safari 16+) renderizan
SVG directamente. Los PNG/ICO son **fallbacks** para navegadores antiguos.
Si no generás los PNG, el sitio se verá correctamente en la gran mayoría
de dispositivos gracias al SVG.

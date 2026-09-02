# APK de MetaFit — App Móvil

La descarga del APK de la app móvil se sirve **directamente desde la build de EAS (Expo)**, no desde un archivo local del repositorio.

## Enlace de descarga actual

El botón "Descargar APK" de la landing page apunta directamente al artefacto de la última build de EAS:

```
https://expo.dev/artifacts/eas/3mCh0-T8CEI3jK_APZUO6rM6-Al1ryP4kxRezmF-i7k.apk
```

- Tamaño: ~94,9 MB (build de **React Native/Expo**).
- Se actualiza manualmente editando `frontend_web/src/views/LandingPage.jsx` (y el `manual_apk_movil.md`) con la URL del artefacto de la nueva build.

## Cómo generar y publicar una nueva APK

Build en la nube (recomendado):

```bash
cd movil
npx eas build --platform android --profile production
```

Al terminar, EAS muestra la URL del artefacto (formato `https://expo.dev/artifacts/eas/<id>.apk`).

### Pasos para actualizar el enlace

1. Generar la build con `eas build`.
2. Copiar la URL del artefacto `*.apk` resultante.
3. Reemplazar esa URL en:
   - `frontend_web/src/views/LandingPage.jsx` (atributo `href` del botón de descarga)
   - `documentacion/manual_apk_movil.md` (sección 8 APK)
   - Este README (sección "Enlace de descarga actual")
4. Commitear y esperar el deploy en Render.

## Notas

- El APK ya **no** se copia a `frontend_web/public/app/` ni a `frontend_web/dist/app/`; la descarga sale de Expo, por lo que no hay que subir binarios al repositorio ni al sitio estático.
- Instalación por "orígenes desconocidos" en el dispositivo (build firmada con debug key).

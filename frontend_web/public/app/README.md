# APK de MetaFit — App Móvil

Colocá el archivo `metafit.apk` en esta carpeta para que esté disponible
para descarga desde la landing page en `/app/metafit.apk`.

## Versión actual

- **APK v4 (2026-09-08, EAS Build)**: build ID `aedfabcd-e41f-4557-a539-41ed5f53ec0b`
  (commit `cdb0681`). Incluye CRUD de ciclos, edición de rutinas/dietas, notas
  del afiliado, URL de Render en móvil, modo claro/oscuro y notificaciones push.
  Compilado con EAS Build (profile `preview`) vía Expo SDK 55, firmado con debug
  key (instalación por "orígenes desconocidos").
- Tamaño: ~90,5 MB (94,9 MB en disco).

## Requisitos

- Nombre del archivo: `metafit.apk`
- Ruta final: `frontend_web/public/app/metafit.apk` (+ copia en `frontend_web/dist/app/metafit.apk`)
- URL pública: `https://metafit-frontend-78x6.onrender.com/app/metafit.apk`

## Cómo generar el APK

Con EAS Build (nube):

```bash
cd movil
EXPO_TOKEN=<tu_token> npx eas-cli build --platform android --profile preview --non-interactive
# Descargar el artefacto de https://expo.dev/artifacts/eas/... y copiarlo a:
cp <descarga>.apk frontend_web/public/app/metafit.apk
```

Build local (entorno con memoria limitada) vía systemd:

```bash
cd movil/android
systemd-run --collect --unit=metafit-gradle \
  --working-directory=$PWD bash -c \
  './gradlew :app:assembleRelease -x lint -x lintVitalAnalyzeRelease \
   -PreactNativeArchitectures=arm64-v8a \
   -Dorg.gradle.jvmargs="-Xmx1024m -XX:MaxMetaspaceSize=420m" --max-workers=1'
# Requiere movil/android/local.properties con sdk.dir=<tu SDK>
cp movil/android/app/build/outputs/apk/release/app-release.apk frontend_web/public/app/metafit.apk
cp movil/android/app/build/outputs/apk/release/app-release.apk frontend_web/dist/app/metafit.apk
```

Alternativa en la nube: `cd movil && npx eas build --platform android --profile production`.
# APK de MetaFit — App Móvil

Colocá el archivo `metafit.apk` en esta carpeta para que esté disponible
para descarga desde la landing page en `/app/metafit.apk`.

## Versión actual

- **APK v3 (2026-08-09)**: incluye modo claro/oscuro (☀️/🌙 persistente),
  notificaciones push (expo-notifications + registro de `push_token` en el
  backend) y la versión previa v2 (fotos de perfil). Compilado release
  arm64-v8a, firmado con debug key (instalación por "orígenes desconocidos").
- Tamaño: ~35,8 MB.

## Requisitos

- Nombre del archivo: `metafit.apk`
- Ruta final: `frontend_web/public/app/metafit.apk` (+ copia en `frontend_web/dist/app/metafit.apk`)
- URL pública: `https://metafit-frontend-78x6.onrender.com/app/metafit.apk`

## Cómo generar el APK

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
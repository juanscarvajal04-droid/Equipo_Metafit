# APK de MetaFit — App Móvil

Colocá el archivo `metafit.apk` en esta carpeta para que esté disponible
para descarga desde la landing page en `/app/metafit.apk`.

## Requisitos

- Nombre del archivo: `metafit.apk`
- Ruta final: `frontend_web/public/app/metafit.apk`
- URL pública: `https://metafit-frontend.onrender.com/app/metafit.apk`

## Cómo generar el APK

```bash
# Desde la raíz del proyecto
cd movil
npx eas build --platform android --profile production
```

El APK generado se puede copiar a esta carpeta:

```bash
cp /ruta/al/archivo.apk frontend_web/public/app/metafit.apk
```

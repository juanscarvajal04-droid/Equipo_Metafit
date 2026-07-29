#!/bin/bash
#
# Monitorear compilación EAS y descargar APK cuando esté lista.
# Uso: EXPO_TOKEN="tu_token" bash scripts/monitorear_apk.sh
#

set -e
cd "$(dirname "$0")/../movil"

TOKEN="${EXPO_TOKEN}"
BUILD_ID="045b178d-8758-4167-b9bb-50fe881b992f"
APK_DEST="../frontend_web/public/app/metafit.apk"
CHECK_INTERVAL=120  # segundos entre cada verificación

echo "=== Monitoreando build EAS: $BUILD_ID ==="
echo "Proyecto: @sebas-carva07/movil"
echo "URL: https://expo.dev/accounts/sebas-carva07/projects/movil/builds/$BUILD_ID"
echo ""
echo "Revisando cada $CHECK_INTERVAL segundos..."
echo ""

while true; do
  STATUS=$(EXPO_TOKEN="$TOKEN" npx eas-cli@latest build:view --non-interactive 2>&1 \
    | grep -E "^Status" | sed 's/^Status[[:space:]]*//')

  ARTIFACT_URL=$(EXPO_TOKEN="$TOKEN" npx eas-cli@latest build:view --non-interactive 2>&1 \
    | grep -E "Application Archive URL" | sed 's/.*https/https/')

  echo "[$(date +%H:%M:%S)] Estado: $STATUS"

  if [ "$STATUS" = "finished" ] && [ -n "$ARTIFACT_URL" ]; then
    echo "✅ Build completado!"
    echo "Descargando APK..."
    curl -L "$ARTIFACT_URL" -o "$APK_DEST"
    
    echo ""
    echo "=== APK descargado ==="
    ls -lh "$APK_DEST"
    file "$APK_DEST"
    echo ""
    echo "APK guardado en: $APK_DEST"
    
    # Ahora hacer commit y push
    cd ..
    git add frontend_web/public/app/metafit.apk
    git commit -m "APK real de MetaFit generado con EAS Build"
    git push
    echo "✅ APK subido a GitHub y en producción en minutos"
    exit 0
  fi

  if [ "$STATUS" = "errored" ] || [ "$STATUS" = "cancelled" ]; then
    echo "❌ Build falló o fue cancelado. Revisá los logs:"
    echo "   https://expo.dev/accounts/sebas-carva07/projects/movil/builds/$BUILD_ID"
    exit 1
  fi

  sleep "$CHECK_INTERVAL"
done

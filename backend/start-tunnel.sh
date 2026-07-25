#!/usr/bin/env bash
set -e

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$BACKEND_DIR")"
MOVIL_URL_FILE="$PROJECT_DIR/movil/src/services/tunnelUrl.js"
API_FILE="$PROJECT_DIR/movil/src/services/api.js"
PORT=3001
TUNNEL_PORT=${TUNNEL_PORT:-3001}
TUNNEL_HOST=${TUNNEL_HOST:-""}

echo "============================================"
echo " MetaFit — Tunnel de desarrollo"
echo "============================================"

cleanup() {
  echo ""
  echo "Deteniendo servicios..."
  [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  rm -f "$MOVIL_URL_FILE"
  echo "Listo."
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Verificar si el puerto ya está en uso (backend corriendo) ──
BACKEND_ALREADY_RUNNING=false
if lsof -i :$PORT -sTCP:LISTEN 2>/dev/null | grep -qE "node|docker|LISTEN"; then
  echo "[✓] Backend ya está corriendo en el puerto $PORT"
  BACKEND_ALREADY_RUNNING=true
fi

# ── Iniciar backend si no está corriendo ──
if [ "$BACKEND_ALREADY_RUNNING" = false ]; then
  echo "[...] Iniciando backend en el puerto $PORT..."
  cd "$BACKEND_DIR"

  # Preferir Docker si está disponible
  if command -v docker &>/dev/null && docker compose ps 2>/dev/null | grep -q "metafit_backend"; then
    echo "[...] Usando Docker..."
    docker compose up -d backend 2>&1 | tail -1
  else
    node index.js &
    BACKEND_PID=$!
  fi

  # Esperar a que el backend responda
  echo "[...] Esperando a que el backend responda..."
  for i in $(seq 1 30); do
    if curl -s http://localhost:$PORT/health >/dev/null 2>&1; then
      echo "[✓] Backend listo (intento $i)"
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "[✗] El backend no respondió después de 30 segundos"
      exit 1
    fi
    sleep 1
  done
fi

# ── Iniciar localtunnel ──
echo "[...] Iniciando localtunnel en el puerto $TUNNEL_PORT..."
TUNNEL_ARGS="--port $TUNNEL_PORT"
[ -n "$TUNNEL_HOST" ] && TUNNEL_ARGS="$TUNNEL_ARGS --host $TUNNEL_HOST"

# Ejecutar lt y capturar la URL desde stdout
LT_OUTPUT=$(mktemp)
npx localtunnel $TUNNEL_ARGS > "$LT_OUTPUT" 2>&1 &
TUNNEL_PID=$!

# Esperar a que localtunnel genere la URL
TUNNEL_URL=""
for i in $(seq 1 20); do
  if grep -q "your url is:" "$LT_OUTPUT" 2>/dev/null; then
    TUNNEL_URL=$(grep "your url is:" "$LT_OUTPUT" | sed 's/.*your url is: //')
    break
  fi
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  # Fallback: intentar leer del archivo una vez más
  sleep 3
  TUNNEL_URL=$(grep "your url is:" "$LT_OUTPUT" 2>/dev/null | sed 's/.*your url is: //')
fi

if [ -z "$TUNNEL_URL" ]; then
  echo "[✗] No se pudo obtener la URL del túnel"
  cat "$LT_OUTPUT"
  rm -f "$LT_OUTPUT"
  exit 1
fi

rm -f "$LT_OUTPUT"
echo "[✓] Túnel creado: $TUNNEL_URL"

# ── Escribir la URL en tunnelUrl.js ──
echo "[...] Actualizando tunnelUrl.js..."
cat > "$MOVIL_URL_FILE" <<- EOF
const TUNNEL_URL = '$TUNNEL_URL';
export default TUNNEL_URL;
EOF

echo "[✓] tunnelUrl.js actualizado: $TUNNEL_URL"
echo ""
echo "============================================"
echo "  Backend:    http://localhost:$PORT"
echo "  Túnel:      $TUNNEL_URL"
echo "  App móvil:  Recargá Expo para usar el túnel"
echo "============================================"
echo ""
echo "Presioná Ctrl+C para detener todo."

# Mantener el script vivo
wait

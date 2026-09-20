#!/bin/bash
set -e

MYSQL_DATA=/var/lib/mysql
MYSQL_SOCK=/run/mysqld/mysqld.sock
MYSQLD=/usr/bin/mariadbd

mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld

if [ ! -d "$MYSQL_DATA/mysql" ]; then
  echo ">>> Inicializando base de datos MariaDB..."
  mariadb-install-db --user=mysql --datadir="$MYSQL_DATA" --skip-test-db
fi

$MYSQLD --datadir="$MYSQL_DATA" --socket="$MYSQL_SOCK" --pid-file=/tmp/mysql.pid \
  --skip-name-resolve --innodb-buffer-pool-size=128M --user=mysql &
MYSQL_PID=$!

echo ">>> Esperando MariaDB..."
for i in $(seq 1 20); do
  if mysqladmin ping --socket="$MYSQL_SOCK" 2>/dev/null; then
    echo ">>> MariaDB listo"
    break
  fi
  sleep 1
done

if ! mysqladmin ping --socket="$MYSQL_SOCK" 2>/dev/null; then
  echo ">>> Error: MariaDB no inició"
  exit 1
fi

DB_EXISTS=$(mysql --socket="$MYSQL_SOCK" -e "SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='metafit'" 2>/dev/null | grep 1 || echo "")

if [ -z "$DB_EXISTS" ]; then
  echo ">>> Creando base de datos metafit..."
  mysql --socket="$MYSQL_SOCK" -e "CREATE DATABASE IF NOT EXISTS metafit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
  echo ">>> Ejecutando 01_estructura..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/01_estructura.sql
  echo ">>> Ejecutando 02_migracion_movil..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/02_migracion_movil.sql
  echo ">>> Ejecutando 03_mejoras_estructura..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/03_mejoras_estructura.sql
  echo ">>> Ejecutando 04_datos_iniciales..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/04_datos_iniciales.sql
  echo ">>> Ejecutando 05_password_reset..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/05_password_reset.sql
  echo ">>> Base de datos inicializada!"
else
  echo ">>> Base de datos metafit ya existe"
fi

echo ">>> Iniciando Node.js..."
export DB_SOCKET="$MYSQL_SOCK"
export DB_USER="root"
export DB_PASSWORD="ignored"
export DB_NAME="metafit"
exec node /app/index.js
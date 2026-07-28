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

echo ">>> Iniciando MariaDB (sin auth)..."
$MYSQLD --datadir="$MYSQL_DATA" --socket="$MYSQL_SOCK" --pid-file=/tmp/mysql.pid \
  --skip-grant-tables --skip-name-resolve --innodb-buffer-pool-size=256M \
  --user=mysql &
MYSQL_PID=$!

echo ">>> Esperando a que MariaDB inicie..."
for i in $(seq 1 30); do
  if mysqladmin ping --socket="$MYSQL_SOCK" 2>/dev/null; then
    echo ">>> MariaDB listo!"
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
  echo ">>> Ejecutando schema..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/01_schema.sql
  echo ">>> Ejecutando seed..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/02_seed.sql
  echo ">>> Ejecutando migración app móvil..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/04_migracion_app_movil.sql
  echo ">>> Base de datos inicializada!"
else
  echo ">>> Base de datos metafit ya existe"
fi

echo ">>> Configurando autenticación root para TCP..."
mysql --socket="$MYSQL_SOCK" -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY 'Admin123!'; FLUSH PRIVILEGES;" 2>/dev/null || true
mysql --socket="$MYSQL_SOCK" -e "CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'Admin123!'; ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY 'Admin123!'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;" 2>/dev/null || true

echo ">>> Deteniendo MariaDB (modo sin auth)..."
mysqladmin -u root shutdown --socket="$MYSQL_SOCK" 2>/dev/null || true
wait $MYSQL_PID 2>/dev/null || true

echo ">>> Iniciando MariaDB (modo normal)..."
$MYSQLD --datadir="$MYSQL_DATA" --socket="$MYSQL_SOCK" --pid-file=/tmp/mysql.pid \
  --skip-name-resolve --innodb-buffer-pool-size=256M \
  --user=mysql &
MYSQL_PID=$!

echo ">>> Esperando a que MariaDB inicie..."
for i in $(seq 1 15); do
  if mysqladmin ping --socket="$MYSQL_SOCK" 2>/dev/null; then
    echo ">>> MariaDB listo!"
    break
  fi
  sleep 1
done

echo ">>> Iniciando aplicación Node.js..."
exec node /app/index.js
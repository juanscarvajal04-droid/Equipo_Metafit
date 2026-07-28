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

echo ">>> Iniciando MariaDB..."
$MYSQLD --datadir="$MYSQL_DATA" --socket="$MYSQL_SOCK" --pid-file=/tmp/mysql.pid \
  --skip-name-resolve --innodb-buffer-pool-size=256M \
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
  echo ">>> Ejecutando schema y seed..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/01_schema.sql
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/02_seed.sql
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/04_migracion_app_movil.sql
  echo ">>> Configurando contraseña root..."
  mysql --socket="$MYSQL_SOCK" -e "ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('Admin123!'); FLUSH PRIVILEGES;"
  echo ">>> Base de datos inicializada!"
else
  echo ">>> Base de datos metafit ya existe"
fi

echo ">>> Iniciando aplicación Node.js..."
exec node /app/index.js
#!/bin/bash
set -e

MYSQL_DATA=/var/lib/mysql
MYSQL_SOCK=/run/mysqld/mysqld.sock
MYSQLD=/usr/bin/mariadbd

mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld

echo ">>> Iniciando MariaDB (modo setup)..."
$MYSQLD --datadir="$MYSQL_DATA" --socket="$MYSQL_SOCK" --pid-file=/tmp/mysql.pid \
  --skip-grant-tables --skip-networking --skip-name-resolve --innodb-buffer-pool-size=256M --user=mysql &
MYSQL_PID=$!

echo ">>> Esperando a que MariaDB inicie..."
for i in $(seq 1 20); do
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

echo ">>> Configurando autenticación root para TCP..."
mysql --socket="$MYSQL_SOCK" -e "FLUSH PRIVILEGES;"
mysql --socket="$MYSQL_SOCK" -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'Admin123!';"
mysql --socket="$MYSQL_SOCK" -e "CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'Admin123!'; ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY 'Admin123!'; GRANT ALL ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;"
mysql --socket="$MYSQL_SOCK" -e "CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'Admin123!'; ALTER USER 'root'@'%' IDENTIFIED BY 'Admin123!'; GRANT ALL ON *.* TO 'root'@'%' WITH GRANT OPTION;"
mysql --socket="$MYSQL_SOCK" -e "FLUSH PRIVILEGES;"
echo ">>> Root configurado para TCP"

echo ">>> Deteniendo MariaDB (modo setup)..."
mysqladmin -u root shutdown --socket="$MYSQL_SOCK" 2>/dev/null || true
wait $MYSQL_PID 2>/dev/null || true

echo ">>> Iniciando MariaDB (modo normal)..."
$MYSQLD --datadir="$MYSQL_DATA" --socket="$MYSQL_SOCK" --pid-file=/tmp/mysql.pid \
  --skip-name-resolve --innodb-buffer-pool-size=256M --user=mysql &
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
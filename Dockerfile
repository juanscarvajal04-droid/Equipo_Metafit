FROM node:22-alpine

RUN apk add --no-cache mariadb mariadb-client bash

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/ ./
COPY database/ ./database/

RUN chmod +x start.sh

RUN mkdir -p /run/mysqld && \
    mariadb-install-db --user=mysql --datadir=/var/lib/mysql --skip-test-db && \
    chown -R mysql:mysql /var/lib/mysql /run/mysqld && \
    mariadbd --datadir=/var/lib/mysql --socket=/run/mysqld/mysqld.sock --pid-file=/tmp/mysql.pid \
      --skip-grant-tables --skip-name-resolve --innodb-buffer-pool-size=64M --user=mysql & \
    MYSQL_PID=$! && \
    for i in $(seq 1 20); do \
      mysqladmin ping --socket=/run/mysqld/mysqld.sock 2>/dev/null && break; \
      sleep 1; \
    done && \
    mysql --socket=/run/mysqld/mysqld.sock -e "CREATE DATABASE IF NOT EXISTS metafit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci" && \
    mysql --socket=/run/mysqld/mysqld.sock metafit < /app/database/01_schema.sql && \
    mysql --socket=/run/mysqld/mysqld.sock metafit < /app/database/02_seed.sql && \
    mysql --socket=/run/mysqld/mysqld.sock metafit < /app/database/04_migracion_app_movil.sql && \
    mysqladmin -u root shutdown --socket=/run/mysqld/mysqld.sock && \
    wait $MYSQL_PID && \
    rm -rf /run/mysqld && \
    sed -i 's/skip-grant-tables//' /etc/mysql/my.cnf 2>/dev/null || true

EXPOSE 3001

CMD ["bash", "start.sh"]
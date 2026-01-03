#!/bin/sh
set -e

# Проверяем обязательные переменные
if [ -z "$DATABASES_HOST" ] && [ -z "$DATABASES" ]; then
  echo "ERROR: You have to set the DATABASES_HOST or DATABASES Environment variable at the very least"
  exit 1
fi

# Устанавливаем значения по умолчанию
DATABASES_HOST=${DATABASES_HOST:-postgres}
DATABASES_PORT=${DATABASES_PORT:-5432}
DATABASES_USER=${DATABASES_USER:-admin}
DATABASES_PASSWORD=${DATABASES_PASSWORD:-password}
DATABASES_DBNAME=${DATABASES_DBNAME:-city_delivery}

echo "Configuring pgBouncer..."
echo "Database Host: $DATABASES_HOST"
echo "Database Port: $DATABASES_PORT"
echo "Database Name: $DATABASES_DBNAME"
echo "Database User: $DATABASES_USER"

# Создаём конфигурацию с подстановкой переменных
cat > /etc/pgbouncer/pgbouncer.ini <<EOF
[databases]
city_delivery = host=$DATABASES_HOST port=$DATABASES_PORT dbname=$DATABASES_DBNAME user=$DATABASES_USER password=$DATABASES_PASSWORD
* = host=$DATABASES_HOST port=$DATABASES_PORT

[pgbouncer]
logfile = /tmp/pgbouncer.log
pidfile = /tmp/pgbouncer.pid

listen_addr = *
listen_port = 6432

unix_socket_dir = /tmp

auth_type = trust
auth_file = /etc/pgbouncer/userlist.txt

pool_mode = transaction

max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5

server_idle_timeout = 600
server_lifetime = 3600
query_timeout = 0
query_wait_timeout = 120
server_connect_timeout = 15

tcp_keepalive = 1
tcp_keepidle = 60
tcp_keepintvl = 10
tcp_keepcnt = 5

dns_max_ttl = 15
dns_nxdomain_ttl = 15

log_connections = 1
log_disconnections = 1
log_pooler_errors = 1

verbose = 0

ignore_startup_parameters = extra_float_digits

client_encoding = utf8

stats_users = admin
stats_period = 60

admin_users = admin
EOF

# Создаём userlist.txt
cat > /etc/pgbouncer/userlist.txt <<EOF
"$DATABASES_USER" "$DATABASES_PASSWORD"
EOF

# Устанавливаем права
chmod 644 /etc/pgbouncer/pgbouncer.ini
chmod 600 /etc/pgbouncer/userlist.txt

echo "Configuration created. Starting pgBouncer..."

# Запускаем pgbouncer через стандартный entrypoint
exec pgbouncer /etc/pgbouncer/pgbouncer.ini

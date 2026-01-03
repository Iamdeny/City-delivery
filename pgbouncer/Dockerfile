FROM pgbouncer/pgbouncer:latest

# Копируем entrypoint скрипт
USER root
COPY entrypoint.sh /docker-entrypoint.sh

# Устанавливаем права
RUN chmod +x /docker-entrypoint.sh

# Создаём директории заранее
RUN mkdir -p /etc/pgbouncer && chown 70:70 /etc/pgbouncer

# Переключаемся обратно на дефолтного пользователя
USER 70

# Запускаем через entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

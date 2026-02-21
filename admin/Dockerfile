# admin/Dockerfile (production)
# Этап сборки
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Этап раздачи
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем пользовательский конфиг nginx (если нужно)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
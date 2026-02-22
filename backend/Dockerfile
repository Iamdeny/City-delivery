FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости (только production)
RUN npm ci --only=production

# Копируем остальной код
COPY . .

# Порт, который слушает приложение
EXPOSE 5000

# Команда запуска
CMD ["node", "server.js"]
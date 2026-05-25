# City Delivery — Android (Expo)

Нативная оболочка с **WebView** поверх `frontend-next`. Для теста на телефоне собирается **APK** через [EAS Build](https://docs.expo.dev/build/introduction/).

## Быстрый старт (APK)

### 1. Подготовить серверы на ПК

В одной Wi‑Fi сети с телефоном. Узнайте IP ПК: `ipconfig` → IPv4 (например `192.168.1.100`).

**Backend** (порт 5000):

```bash
cd backend
npm install
npm run dev
```

**Frontend** — в `frontend-next/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
NEXT_PUBLIC_WS_URL=http://192.168.1.100:5000
```

Запуск, доступный с телефона:

```bash
cd frontend-next
npm run dev:lan
```

### 2. URL в мобильном приложении

Скопируйте `mobile/.env.example` → `mobile/.env` и укажите тот же IP:

```env
EXPO_PUBLIC_WEB_URL=http://192.168.1.100:3000
```

Для облачной сборки отредактируйте `eas.json` → профиль `preview` → `env.EXPO_PUBLIC_WEB_URL` (тот же адрес).

### 3. Expo / EAS

```bash
cd mobile
npm install
npx eas-cli login
npx eas-cli init
```

`eas init` привяжет проект к аккаунту Expo и запишет `projectId` в `app.config.ts` (или в `app.json`).

### 4. Собрать APK

```bash
npx eas-cli build -p android --profile preview
```

После сборки ссылка на **APK** появится в [expo.dev](https://expo.dev) → ваш проект → Builds. Скачайте и установите на Android (разрешите установку из неизвестных источников).

Локальная сборка (нужен Android SDK на ПК):

```bash
npm run build:apk:local
```

## Скрипты

| Команда | Описание |
|--------|----------|
| `npm start` | Expo Dev Tools |
| `npm run build:apk` | EAS Build → APK (preview) |
| `npm run build:apk:local` | Локальная сборка APK |

## Проверка без сборки

Expo Go на телефоне (тот же Wi‑Fi):

```bash
cd mobile
npm start
```

Отсканируйте QR. WebView откроет `EXPO_PUBLIC_WEB_URL` из `.env`.

## Production

Для APK на боевой домен задайте HTTPS URL:

```env
EXPO_PUBLIC_WEB_URL=https://your-domain.com
```

В `eas.json` для `production` по умолчанию **AAB** (Google Play). Для тестового APK используйте профиль `preview`.

## Заметки

- `android.usesCleartextTraffic: true` — нужен для `http://` в локальной сети.
- Node на машине разработки: RN 0.85 рекомендует **^22.13.0**; облачный EAS Build не зависит от вашей версии Node.
- Cookies BFF работают в WebView при том же origin, что и в браузере (`http://IP:3000`).

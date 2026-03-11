# Veo3 Aggregator Integration

Минимальный сервер для приёма callback’ов от `https://api.kie.ai/api/v1/veo/generate`, плюс инструкции по локальному запуску, туннелю и выкладке на Render.

## Структура

- `src/server.js` — Express-приложение с эндпоинтом `/veo3/callback` и health-check `/healthz`.
- `.env.example` — список переменных окружения.
- `scripts/sample-generate.sh` — вспомогательный скрипт, который шлёт тестовый `POST /veo/generate` с указанным `callBackUrl`.
- `render.yaml` — blueprint для быстрой публикации на Render.

## Быстрый старт локально

1. Скопировать переменные окружения:
   ```bash
   cp .env.example .env
   ```
2. Заполнить значения:
   - `PORT` — локальный порт (по умолчанию `8787`).
   - `KIE_API_KEY` — ключ из личного кабинета kie.ai.
   - `KIE_WEBHOOK_SECRET` — строка для HMAC-подписи (алгоритм SHA-256, заголовок `x-kie-signature`, формат `sha256=<hex>`).
   - `CALLBACK_URL` — внешний адрес вебхука (нужен только скрипту `sample-generate.sh`).
3. Установить зависимости и запустить сервер:
   ```bash
   npm install
   npm run dev
   ```
4. Прокинуть туннель (пример с ngrok):
   ```bash
   ngrok http 8787
   ```
   Полученный URL вида `https://abc123.ngrok.io/veo3/callback` указываем в `callBackUrl` при вызове Veo3 API.
5. Отправить тестовую задачу (curl или скрипт):
   ```bash
   ./scripts/sample-generate.sh
   ```
   Скрипт читает ключ и `CALLBACK_URL` из `.env` и отправляет task в `veo3_fast`.

## Деплой на Render

1. В корне проекта лежит `render.yaml` с настройками web‑сервиса (Node runtime, build/start команды `npm install` / `npm start`).
2. Импортируем репозиторий в Render (через GitHub/GitLab) и выбираем **Blueprint** деплой.
3. В разделе Environment Variables задаём:
   - `KIE_API_KEY` — `fd0f5cb25c69888bf01b02bd0b7454d2` (можно хранить как Secret).
   - `KIE_WEBHOOK_SECRET` — `veo3_hook_2026`.
4. Render сам пробросит переменную `PORT`; приложение читает её автоматически (иначе упадёт на дефолт `8787`).
5. После раскатки получаем URL вида `https://veo3-webhook.onrender.com/veo3/callback` и используем его как `callBackUrl` в запросах к kie.ai.

## TODO

- Подключить сторедж (файл/БД) для сохранения payload’ов.
- Добавить очередь скачивания видео (GET `/api/v1/veo/get-1080p-video`).
- Сверить текущий HMAC с официальной спецификацией `/common-api/webhook-verification` (пока стоит базовый плейсхолдер).

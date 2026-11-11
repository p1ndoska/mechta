# Mechta

Стек: Node.js + Express + Prisma + PostgreSQL (backend), React + Vite (frontend).

```
backend/    Express API, Prisma (prisma/schema.prisma)
frontend/   React + Vite
```

## Порты

| Сервис   | Порт |
|----------|------|
| Сайт     | 8083 |
| API      | 3002 |
| БД       | 5435 |

## Запуск из готовой сборки (без npm)

```
download-prebuilt.bat
```

Скачивает собранные в облаке `node_modules` backend и `dist` frontend и запускает Docker.

## Запуск с полной сборкой в Docker

```
copy .env.example .env
docker compose up -d --build
```

Если npm падает с `self-signed certificate`, положите корневые сертификаты в `backend/certs/` и `frontend/certs/` или поставьте `NPM_STRICT_SSL=false` в `.env`.

## Локальная разработка

```
docker compose up -d db
cd backend
copy .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

```
cd frontend
npm install
npm run dev
```

Vite: http://localhost:5173 (запросы `/api` проксируются на 3002).

## Обновление готовой сборки (в облаке)

```
./scripts/make-prebuilt.sh
gh release upload images mechta-prebuilt-<hash>.tar.gz
git add prebuilt.txt && git commit -m "Update prebuilt" && git push
```

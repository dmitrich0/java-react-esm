# EMS frontend

React + TypeScript + Vite. Фронтенд обращается к `/api/employees` на своём домене.
В разработке запросы перенаправляет Vite, в Docker — Nginx.
Адрес бэкенда задаётся через `BACKEND_API_URL`, а не в коде приложения.

## Переменные окружения

| Переменная | Назначение | Пример |
| --- | --- | --- |
| `BACKEND_API_URL` | Полный адрес API бэкенда, включая `/api`, без завершающего `/`. Обязателен для запуска Vite dev и контейнера. | `https://backend-nu-lilac-29.vercel.app/api` |
| `DEV_PORT` | Порт Vite при локальной разработке. По умолчанию `4200`. | `4200` |
| `PORT` | HTTP-порт внутри Docker. По умолчанию `80`. | `80` |

`BACKEND_API_URL` читается при запуске контейнера и не встраивается в JavaScript.
Поэтому один Docker-образ можно запускать с разными бэкендами.
В браузере API остаётся на домене фронтенда: настройка CORS для домена фронтенда не требуется.
Секреты не добавляйте в переменные с префиксом `VITE_`: они доступны браузеру.

## Локальная разработка

```sh
npm ci
cp .env.example .env.local
npm run dev
```

В `.env.local` уже указан опубликованный бэкенд. Для локального Spring-приложения
укажите `BACKEND_API_URL=http://localhost:8080/api`. После изменения переменных
перезапустите Vite. `.env.local` не попадает в Git или Docker-образ.

```sh
npm run lint
npm run build
```

`npm run preview` предназначен для проверки статических файлов, а не API-прокси.
Для проверки готовой сборки вместе с API используйте Docker.

## Docker

```sh
docker build -f Dockerfile.vercel -t ems-frontend .
docker run --rm -p 4200:80 --env-file .env.local ems-frontend
```

Откройте `http://localhost:4200/employees`. Если бэкенд работает на машине хоста,
для Docker Desktop используйте `http://host.docker.internal:8080/api`.
При смене `PORT` меняйте также правую часть публикации порта (`-p 4200:8080`).

## Деплой на Vercel через Docker

1. Создайте отдельный Vercel-проект фронтенда из репозитория `java-react-esm`.
2. Установите **Root Directory**: `ems-frontend`. Бэкенд остаётся отдельным проектом.
3. Используйте контейнерную конфигурацию из `vercel.json`: сервис `frontend`
   запускает `Dockerfile.vercel`. Не задавайте вручную Vite Build Command или Output Directory.
4. В **Settings → Environment Variables** добавьте для **Production** и **Preview**:

   ```text
   BACKEND_API_URL=https://backend-nu-lilac-29.vercel.app/api
   ```

   `PORT` можно не задавать: контейнер слушает стандартный для Vercel порт `80`.
5. Запустите Deploy. После смены переменных окружения создайте новый deployment.

Для CLI после входа в Vercel запускайте из `ems-frontend`:

```sh
npx vercel link
npx vercel env add BACKEND_API_URL production
npx vercel env add BACKEND_API_URL preview
npx vercel deploy --prod
```

Nginx обслуживает файлы сборки и перенаправляет API-запросы на бэкенд по HTTPS.
Прямые ссылки `/employees`, `/employees/add` и `/employees/edit/:id` обслуживаются
через `index.html`; ошибки API не заменяются HTML фронтенда.

После деплоя проверьте список сотрудников, открытие формы по прямой ссылке и
запрос `GET /api/employees` в Network браузера.

Документация: [Vercel Container Images](https://vercel.com/docs/functions/container-images),
[Vercel environment variables](https://vercel.com/docs/environment-variables).

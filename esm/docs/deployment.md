# Docker и развертывание на Vercel

## Можно ли запустить этот backend на Vercel?

Да. По состоянию на 2 октября 2026 года Vercel поддерживает OCI/Docker-образы
как Vercel Functions; Container Images находятся в Beta и доступны на всех планах.
Для Spring Boot здесь используется контейнер с Java 25 и встроенным HTTP-сервером.
Это применение общего механизма контейнеров к нашему приложению; отдельный
официальный Java runtime для такого запуска не нужен.
[Документация Container Images](https://vercel.com/docs/functions/container-images).

В репозитории один `Dockerfile`. Файл `vercel.json` явно задаёт его как entrypoint
сервиса `backend` и направляет все URL в этот сервис. Поэтому отдельная копия
`Dockerfile.vercel` не нужна. Формат соответствует актуальным
[Vercel Services](https://vercel.com/docs/services) и
[конфигурации контейнеров](https://vercel.com/docs/functions/container-images#services).

## Что находится в проекте

| Файл | Назначение |
| --- | --- |
| `Dockerfile` | Сборка JAR в JDK 25; запуск в JRE 25 от пользователя без root |
| `.dockerignore` | Исключает секреты, Git, сборочные файлы и IDE из build context |
| `compose.yaml` | Только backend, порт `127.0.0.1:8080`, внешняя БД |
| `.env.docker.example` | Шаблон параметров БД для контейнера |
| `vercel.json` | Сервис backend из Dockerfile и маршрутизация всех запросов |
| `.vercelignore` | Исключает локальные секреты и сборочные файлы из CLI upload |

JDK, Maven и исходники остаются в стадии сборки; в рабочем образе находятся JRE,
JAR и `curl` для healthcheck. Версии Temurin закреплены в Dockerfile.
Maven Wrapper закрепляет Maven; Docker BuildKit кеширует загрузки в `/root/.m2`.
Для обновления Java меняй обе базовые версии и пересобирай образ.
Пароль БД при сборке не нужен: Flyway запускается при старте приложения.

Приложение слушает `0.0.0.0:${PORT}`, по умолчанию порт 8080.
`/actuator/health` проверяет состояние приложения, включая доступность БД,
и возвращает статус без внутренних подробностей. Другие Actuator endpoints
не выставлены в HTTP. Java получает SIGTERM напрямую; graceful shutdown
настроен на 20 секунд, Compose даёт контейнеру 30 секунд на завершение.

## 1. Подготовить окружение для локального Docker

Установи и запусти Docker Desktop. Нужен Docker Compose **2.30.0 или новее**:
используется `env_file.format: raw`, сохраняющий `$`, кавычки и обратные слеши
без интерполяции. [Описание формата Docker](https://docs.docker.com/reference/compose-file/services/#format).

```bash
docker version
docker compose version
```

Локальные Java и Maven для Docker-сборки не нужны.
Из корня приложения создай файл настроек, если его ещё нет:

```bash
cp .env.docker.example .env.docker
```

В Supabase → Connect → Session pooler скопируй host и username:

```dotenv
DB_URL=jdbc:postgresql://POOLER_HOST:5432/postgres?sslmode=require
DB_USERNAME=postgres.PROJECT_REF
DB_PASSWORD=YOUR_DATABASE_PASSWORD
DB_POOL_SIZE=5
DB_POOL_MIN_IDLE=1
```

Используй пароль **PostgreSQL**, а не API key. Значения вводятся без кавычек
и `export`; пароль вставляется буквально, в одну строку. `.env.docker` исключён
из Git и образа. Он отличается от `.env`, который Spring читает из IntelliJ
как Java properties; в контейнере `.env` не копируется и не читается.
Подробности TLS и подключения: [гайд БД](database.md).

## 2. Собрать и запустить локально

```bash
docker compose up --build -d --wait --wait-timeout 180
docker compose ps
docker compose logs --tail=100 backend
```

Первый запуск может занять дольше из-за скачивания базовых образов и Maven-зависимостей.
После запуска миграция создаст таблицы в подключённой БД, если они ещё не созданы.
Убедись, что у выбранного пользователя есть права для миграций.

```bash
curl --fail http://localhost:8080/actuator/health
curl --fail http://localhost:8080/api/employees
```

В health ожидается `"status":"UP"`; Spring также может вернуть список групп
`liveness` / `readiness`. API вернёт список сотрудников (для новой БД — `[]`).
Для проверки записи используй POST и DELETE из [гайда БД](database.md#3-запустить-и-проверить).
Запрос `/` может вернуть 404: у backend нет главной HTML-страницы.

После изменения `.env.docker` пересоздай контейнер:

```bash
docker compose up -d --force-recreate --wait --wait-timeout 180
```

После изменения кода повтори запуск с `--build`. Остановка:

```bash
docker compose down
```

Это останавливает backend; внешняя БД и данные в Supabase сохраняются.
В Compose нет сервиса PostgreSQL, его портов или volumes.
Если остался контейнер PostgreSQL от прежней конфигурации, он больше не управляется
новым файлом. Можно удалить старый остановленный контейнер отдельно; не удаляй его
volume до переноса нужных данных.

## 3. Запустить образ без Compose

```bash
docker build --tag esm-backend:local .
docker run --detach --name esm-backend \
  --env-file .env.docker \
  --env PORT=8080 \
  --publish 127.0.0.1:8080:8080 \
  --stop-timeout 30 \
  esm-backend:local

docker logs --tail=100 esm-backend
curl --fail http://localhost:8080/actuator/health
docker stop esm-backend
docker rm esm-backend
```

Не запускай Compose и этот контейнер одновременно на одном порту.
`docker run --env-file` принимает тот же файл с буквальными значениями.

## 4. Подготовить Vercel

Создай отдельный Vercel-проект для backend. Загрузи код в свой Git-репозиторий
без `.env` / `.env.docker`, либо используй CLI upload ниже.
Если репозиторий содержит папку `esm`, укажи её как **Root Directory** проекта.
Если `pom.xml`, `Dockerfile` и `vercel.json` уже лежат в корне репозитория,
оставь Root Directory корнем. CLI-команды выполняй из папки `esm` приложения.

В настройках Build and Deployment используй Framework Preset **Services**,
если интерфейс предлагает выбрать preset. Собирает приложение Dockerfile:
не задавай `npm run build`, отдельную Maven Build Command или `target` как
Output Directory. Текущая конфигурация использует поле `services`,
а не старое `experimentalServices`.

В **Settings → Environment Variables** добавь значения:

| Переменная | Значение |
| --- | --- |
| `DB_URL` | JDBC URL внешней PostgreSQL с TLS |
| `DB_USERNAME` | Имя пользователя выбранного подключения |
| `DB_PASSWORD` | Пароль БД |
| `DB_POOL_SIZE` | `2` для первого эксперимента |
| `DB_POOL_MIN_IDLE` | `0` |
| `PORT` | `8080` |

Значение `PORT=8080` обязательно задаётся в Vercel: платформа должна направлять
HTTP на тот же порт, который слушает Spring. Vercel по умолчанию ожидает порт 80,
если `PORT` не задан в настройках проекта.
[Контракт порта](https://vercel.com/docs/functions/container-images#port-resolution).

Добавляй переменные в **Preview** и **Production**; для `vercel dev` также в
**Development**. Vercel не импортирует локальный `.env.docker` автоматически.
Для Preview используй отдельную тестовую БД/проект Supabase: запуск preview тоже
применяет Flyway-миграции и позволяет изменять данные через API.
После изменения переменных требуется новый deployment.

Если включена фильтрация IP в БД, проверь доступность подключения из Vercel:
фиксированный IP для Container Images пока не поддерживается. Не полагайся
на Docker HEALTHCHECK как на настройку Vercel: готовность облачного deployment
проверяется через запрос к `/actuator/health`.

## 5. Первый deployment через CLI

Установи актуальный Vercel CLI (нужны Node.js и npm):

```bash
npm install --global vercel
vercel --version
vercel login
vercel link
```

Выбери свой account/team и backend-проект. После `link` появится локальная
папка `.vercel`; она исключена из Git и Docker build context.
Создание проекта и связывание ещё не публикуют приложение.
Перед первым deploy заполни переменные в Dashboard.

Если удобнее задавать их через CLI, команды интерактивно запросят значения:

```bash
vercel env add DB_URL preview
vercel env add DB_USERNAME preview
vercel env add DB_PASSWORD preview
vercel env add DB_POOL_SIZE preview
vercel env add DB_POOL_MIN_IDLE preview
vercel env add PORT preview
```

Не добавляй одну переменную повторно, если уже создал её в Dashboard.
Для Production повтори команды с `production` и соответствующей БД.
[Команды управления переменными](https://vercel.com/docs/cli/env).

Создай Preview:

```bash
vercel deploy
```

Vercel соберёт образ из Dockerfile и выдаст URL. В Build Logs должна быть видна
Docker-сборка, а в runtime logs — запуск Spring, Flyway и HTTP-сервера.
Локально работающий Docker не нужен для удалённой сборки через `vercel deploy`;
для `vercel dev` нужен.

Проверь выданный deployment URL:

```bash
vercel curl /actuator/health --deployment https://YOUR-PREVIEW.vercel.app
vercel curl /api/employees --deployment https://YOUR-PREVIEW.vercel.app
```

`vercel curl` подходит для проверок preview с Deployment Protection.
Для публичного URL можно использовать обычный `curl --fail`.
[Документация vercel curl](https://vercel.com/docs/cli/curl).

После проверки и настройки Production variables:

```bash
vercel deploy --prod
vercel curl /actuator/health --deployment https://YOUR-PRODUCTION.vercel.app
```

Здесь новый production deployment получает Production variables.
`vercel promote` только переносит существующий deployment без пересборки,
поэтому не заменяет этот шаг, если Preview и Production используют разные БД.
[Команды deployment](https://vercel.com/docs/cli/deploy).

## 6. Git deployment и дальнейшие обновления

Альтернатива CLI: Vercel Dashboard → Add New Project → Import Git Repository.
Укажи Root Directory приложения, проверь Services/Docker-конфигурацию,
добавь environment variables и нажми Deploy.
При подключённом Git новые commits запускают deployments согласно настройкам
production branch; отдельные ветки дают Preview deployments.
[Git integration](https://vercel.com/docs/git).

В логах должны отсутствовать JDBC-пароли; не выводи полный набор переменных
окружения для диагностики. Для запуска того же образа у другого провайдера
потребуются только Dockerfile и runtime variables; `vercel.json` там не используется.

Если используешь `sslmode=verify-full` и свой CA-файл, путь `sslrootcert`
должен указывать на файл **внутри** контейнера. Локально смонтируй сертификат
read-only и сделай его читаемым пользователю 10001. Путь на ноутбуке не существует
автоматически в Vercel: передай CA через поддерживаемый платформой механизм
либо отдельно включи публичный CA-файл в образ и скорректируй ignore-файлы.

## Особенности Spring Boot на Vercel

- После простоя инстанс может остановиться; следующий запрос снова запускает JVM,
  Spring и Flyway. Измерь задержку первого запроса: это не постоянно работающая VM.
- Каждый инстанс имеет собственный Hikari pool. При масштабировании лимит БД
  расходуется всеми инстансами; увеличивай `DB_POOL_SIZE` после измерений.
- Файлы контейнера не используй для хранения пользовательских данных.
  Долговечные данные остаются в PostgreSQL или внешнем хранилище.
- Изменения схемы должны оставаться совместимыми с предыдущей версией приложения:
  старый и новый deployments могут обращаться к БД одновременно.

Простой контейнера и автоматическое масштабирование описаны в
[Container Images](https://vercel.com/docs/functions/container-images#scale-in-behavior).
На контейнерные Functions распространяются ограничения Functions по памяти,
времени обработки и другим ресурсам. Проверяй актуальные значения для своего
плана в [Vercel Functions Limits](https://vercel.com/docs/functions/limitations);
Beta-доступность не означает неограниченное бесплатное использование.

Если React работает на другом домене, понадобятся разрешённые CORS origins
в backend или проксирование `/api` через frontend. Также текущие employee CRUD
endpoints не требуют авторизации: для эксперимента используй тестовые данные;
доступ к реальным данным требует настройки авторизации backend.

## Запуск на своей VM вместо Vercel

Скопируй проект и отдельный `.env.docker` на VM с Docker/Compose и запусти ту же команду:

```bash
docker compose up --build -d --wait --wait-timeout 180
```

Порт опубликован только на `127.0.0.1`. Для публичного доступа поставь на VM
reverse proxy с HTTPS (например, Caddy или Nginx), направленный на
`http://127.0.0.1:8080`, и открой входящие 80/443. PostgreSQL остаётся внешним.
Обновление кода: новая сборка с `docker compose up --build -d --wait`.

## Если запуск не удался

| Симптом | Что проверить |
| --- | --- |
| Docker daemon недоступен | Docker Desktop запущен; `docker version` показывает Server |
| Compose не понимает `format: raw` | Обнови Compose до 2.30.0+ |
| Сборка не видит Java 25 | Обе стадии используют Temurin 25 из Dockerfile |
| Vercel не собирает контейнер | Root Directory, актуальный CLI, `services.backend.entrypoint`, доступность Beta |
| Vercel возвращает 502/504 | Runtime logs, `PORT=8080` в проекте, доступность БД, время старта JVM |
| 404 на `/` | Проверяй `/actuator/health` и `/api/employees` |
| 401/403 только на Preview | Deployment Protection; проверь через `vercel curl` |
| Health показывает `DOWN` | Параметры БД, TLS, сетевой доступ, лимит подключений |
| Password authentication failed | Пароль PostgreSQL и username из выбранного режима Connect |
| Ошибка Flyway / Hibernate validate | Права миграций и соответствие БД файлам `db/migration` |
| Java завершилась с OutOfMemoryError | Посмотри доступную память и JVM options; не выделяй heap всю память контейнера |

Автоматических тестов в проекте нет. Для проверки сборки вне Docker выполни
`./mvnw clean package`; для Docker — `docker build`, затем health/API запросы
к запущенному контейнеру. Облачный запуск подтверждается только успешным
deployment и проверкой его URL.

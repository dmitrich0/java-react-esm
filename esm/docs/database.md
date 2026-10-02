# Подключение и перенос PostgreSQL

## Что настроено

- Стандартные JDBC и Spring Data JPA: Java-код не зависит от провайдера.
- Flyway применяет `src/main/resources/db/migration/V*.sql` при запуске.
- Hibernate работает в режиме `validate`: проверяет соответствие сущностей схеме,
  но не изменяет таблицы автоматически.
- Таблица `esm.employees` и история `esm.flyway_schema_history` находятся в отдельной
  схеме `esm`. Flyway создаёт эту схему при первом запуске.
- Сервис задаёт границы транзакций; чтение использует `readOnly = true`.
- Секреты передаются через переменные окружения или локальный `.env`, исключённый из Git.

Переносимость здесь означает **смену хостинга PostgreSQL**: Supabase, Yandex Cloud,
AWS RDS или PostgreSQL на своей VM. Переход на MySQL или другую СУБД потребует
другого JDBC-драйвера и адаптации миграций; одного изменения URL недостаточно.

## 1. Получить параметры Supabase

Открой созданный проект в Supabase Dashboard и нажми **Connect**.
Для постоянно работающего Spring backend выбирай:

| Подключение | Когда использовать | Порт | Имя пользователя |
| --- | --- | --- | --- |
| Direct connection | У машины есть IPv6 либо у проекта включён IPv4 add-on | 5432 | `postgres` |
| Session pooler | Локальная разработка / сервер с IPv4 | 5432 | `postgres.PROJECT_REF` |

Для начала удобно взять **Session pooler**. Хост и имя пользователя скопируй
из Connect: адрес pooler нельзя надёжно составить вручную по региону.
Transaction pooler на порту 6543 здесь не используй: он имеет ограничения
prepared statements и состояния сессии, в том числе блокировок миграций.
См. [официальную инструкцию Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

Нужен **пароль базы данных**, заданный при создании проекта.
Если его не помнишь, сбрось его в настройках БД проекта и обнови настройки приложения.
Publishable / anon / service_role API keys не являются паролем JDBC.

## 2. Заполнить `.env`

Из корня проекта:

```bash
cp .env.example .env
```

Если `.env` уже существует, отредактируй его, не перезаписывая текущие настройки.
Для Session pooler содержимое будет таким (замени все заглушки):

```properties
DB_URL=jdbc:postgresql://POOLER_HOST:5432/postgres?sslmode=require
DB_USERNAME=postgres.PROJECT_REF
DB_PASSWORD=YOUR_DATABASE_PASSWORD
DB_POOL_SIZE=5
DB_POOL_MIN_IDLE=1
```

Для Direct connection:

```properties
DB_URL=jdbc:postgresql://db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=YOUR_DATABASE_PASSWORD
```

`DB_URL` содержит только JDBC-адрес, без логина и пароля.
Вставляй пароль отдельно, без URL-кодирования. Значение URL из Connect вида
`postgresql://user:password@host:port/postgres` нужно разделить на три настройки,
а к адресу добавить префикс `jdbc:`.

Этот `.env` читается Spring как **Java properties**, а не shell dotenv:
без `export` и без кавычек вокруг значений. Символ `\` в значении экранируй
как `\\`; начальные пробелы тоже требуют экранирования. Для сложных паролей
проще задать реальные переменные окружения в IntelliJ или на сервере.
Не выполняй `source .env`: файл не является shell-скриптом.

`sslmode=require` обеспечивает шифрование, но не проверяет подлинность сервера.
Для проверки сертификата скачай CA в настройках БД и укажи:

```properties
DB_URL=jdbc:postgresql://HOST:5432/postgres?sslmode=verify-full&sslrootcert=/absolute/path/to/supabase-ca.crt
```

См. [настройки SSL Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres#ssl).
Параметры SSL другого хостинга бери из его документации.

## 3. Запустить и проверить

Требуется JDK 25. Запускай из корня проекта:

```bash
./mvnw spring-boot:run
```

В IntelliJ запускай `EsmApplication` с **Working directory**, равной корню проекта.
Альтернатива `.env`: Run → Edit Configurations → Environment variables,
где задаются `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
Реальные переменные окружения имеют приоритет над локальным файлом.

При первом запуске Flyway создаст `esm.employees`, а Hibernate проверит схему.
При последующих запусках применятся только новые миграции.
Пользователь первоначального подключения должен иметь право создавать схему
и таблицы; для первого подключения Supabase подходит `postgres`.

Проверка API:

```bash
curl http://localhost:8080/api/employees
```

Для новой БД ожидается `[]`. Чтобы проверить запись (создаёт тестового сотрудника):

```bash
curl -i -X POST http://localhost:8080/api/employees \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Anna","lastName":"Ivanova","email":"anna@example.com"}'
```

Ожидается HTTP 201 с сгенерированным `id`. Повторный POST с тем же email нарушит
ограничение уникальности. Прочитай созданную запись через
`GET /api/employees/<id>` и удали через `DELETE /api/employees/<id>`.

В Supabase SQL Editor проверь:

```sql
SELECT version, description, success
FROM esm.flyway_schema_history
ORDER BY installed_rank;

SELECT id, first_name, last_name, email_id FROM esm.employees;
```

Не добавляй `esm` в exposed schemas Supabase Data API и не выдавай доступ
`anon` / `authenticated`: доступ приложения идёт через JDBC на backend.
RLS включён; владелец таблиц (при таком запуске `postgres`) его обходит.
Для отдельной runtime-роли без владения таблицами понадобятся явные GRANT
на схему, таблицы и sequences, а также RLS-политики для этой роли.
Перед публичным размещением backend нужно отдельно настроить авторизацию API:
RLS не защищает HTTP-контроллер, работающий от имени владельца таблиц.

## Локальный PostgreSQL

В `.env` задай URL `jdbc:postgresql://localhost:5432/esm`, пользователя `postgres`
и свой локальный пароль. Затем:

```bash
docker compose up -d --wait
./mvnw spring-boot:run
```

Compose нужен только для локальной БД. Для Supabase он не нужен.
Данные остаются в именованном Docker volume после `docker compose down`.
Изменение `DB_PASSWORD` не меняет пароль уже инициализированного volume:
пароль существующей БД меняется SQL-командой `ALTER ROLE`.

## Как изменять структуру БД

Добавляй файлы `V2__description.sql`, `V3__description.sql` и т. д.
в `src/main/resources/db/migration`. Уже применённые миграции не редактируй:
Flyway проверяет их контрольные суммы. Изменения сущностей сопровождай новой
миграцией. После запуска `validate` обнаружит несовпадения типов и колонок.
Это [стандартный механизм Spring Boot](https://docs.spring.io/spring-boot/how-to/data-initialization.html#howto.data-initialization.migration-tool.flyway).

Если в БД уже есть `public.employees` от прежнего `ddl-auto=update`, приложение
не перенесёт данные автоматически: теперь оно использует `esm.employees`.
Сначала сделай резервную копию и останови запись. Для прежней структуры этого
проекта запусти приложение для создания новой схемы, затем останови backend
и скопируй данные в пустую целевую таблицу:

```sql
BEGIN;
INSERT INTO esm.employees (id, first_name, last_name, email_id)
SELECT id, first_name, last_name, email_id FROM public.employees;

SELECT setval(
    pg_get_serial_sequence('esm.employees', 'id'),
    COALESCE((SELECT MAX(id) FROM esm.employees), 1),
    EXISTS (SELECT 1 FROM esm.employees)
);
COMMIT;
```

Проверь количество и содержимое строк перед возобновлением работы.
Исходная таблица остаётся на месте. Если схема `esm` уже непустая без истории
Flyway, сначала сверяй её с миграциями; не включай автоматически baseline.

## Перенос на Yandex Cloud, AWS или VM

1. Создай PostgreSQL, настрой доступ с backend и TLS.
2. Для пустой БД поменяй `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` и запусти приложение:
   Flyway создаст ту же структуру.
3. Для переноса существующих данных останови запись, сделай резервную копию
   и перенеси схему `esm` вместе с `flyway_schema_history`.
4. После восстановления поменяй настройки подключения и проверь API.

Пример для `pg_dump` / `pg_restore` (PostgreSQL CLI должен быть установлен):

```bash
pg_dump --dbname='postgresql://SOURCE_HOST:5432/postgres?sslmode=require' \
  --username=SOURCE_USER --password --schema=esm \
  --format=custom --no-owner --no-acl --file=esm.dump

pg_restore --dbname='postgresql://TARGET_HOST:5432/esm?sslmode=require' \
  --username=TARGET_USER --password --no-owner --no-acl esm.dump
```

Здесь используются libpq URL **без `jdbc:`**; пароли вводятся в запросе CLI.
Для Supabase предпочитай direct endpoint; при отсутствии IPv6 используй session
pooler. Восстанавливай в пустую целевую БД до первого запуска backend.
Целевой пользователь должен создавать объекты и владеть восстановленными таблицами.
`--no-acl` исключает роли и привилегии Supabase; отдельные runtime GRANT / RLS-политики
после восстановления нужно настроить для новых ролей.
Используй совместимые версии сервера и CLI: `pg_dump` должен быть не старее
исходного сервера; перенос на более старую версию сервера не гарантирован.

При развертывании передавай секреты из переменных окружения / secret manager,
а не копируй `.env` в репозиторий. `DB_POOL_SIZE` задаёт лимит подключений **одного**
экземпляра backend; учитывай количество экземпляров и лимит облачной БД.

## Проверки и типичные ошибки

`./mvnw test` запускает настоящий PostgreSQL 17 в Testcontainers и проверяет
создание схемы, CRUD, уникальность email, RLS и повторное применение миграций.
Нужен работающий Docker; облачные секреты тестам не нужны.

- **Unknown host / network unreachable**: проверь адрес; при отсутствии IPv6
  перейди с Direct на Session pooler.
- **Password authentication failed**: нужен пароль БД и правильный пользователь
  выбранного подключения, а не API key.
- **Tenant or user not found**: скопируй pooler host и `postgres.PROJECT_REF` из Connect.
- **Permission denied**: проверь владельца схемы/таблиц, GRANT и RLS для выбранной роли.
- **Flyway checksum mismatch**: верни применённый файл и внеси изменение новой миграцией.
- **Could not find a valid Docker environment** в тестах: запусти или восстанови Docker Desktop.

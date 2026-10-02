# Employee Management System

Spring Boot 4.1, Java 25, PostgreSQL, Spring Data JPA и Flyway.

Работа с БД: `EmployeeController → EmployeeService → EmployeeRepository (JpaRepository)`.
Spring реализует репозиторий декларативно. Транзакции задаются через `@Transactional`,
структура БД — через SQL-миграции, подключение — через внешние настройки.
Supabase используется как обычный хостинг PostgreSQL: SDK, REST API и Supabase Auth
для доступа к БД не нужны. Фронтенд обращается к `/api/employees` на Spring backend.

Подключение к Supabase, запуск, миграции и перенос на другой хостинг описаны в
[гайде по БД](docs/database.md).

Docker, локальный запуск, публикация на Vercel и запуск на VM описаны в
[гайде по развертыванию](docs/deployment.md).

Быстрый запуск: создай `.env.docker` по `.env.docker.example`, заполни параметры
своего Supabase и выполни `docker compose up --build -d --wait`.
Compose запускает только backend; БД подключается по сети.
Проверка: `curl http://localhost:8080/actuator/health`.

Сборка без Docker: `./mvnw clean package` → `target/esm.jar`.
Тесты и их зависимости удалены.

Исходный курс: https://www.youtube.com/watch?v=sAVki6-iRQs&list=PLGRDMO4rOGcODJeYSY08lIILkqoydQI2k&index=1

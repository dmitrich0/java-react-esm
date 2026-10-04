# Employee Management System

Full-stack Employee Management System built with **React, TypeScript, Java, Spring Boot and PostgreSQL**.

The project demonstrates a complete client-server application with REST API integration, layered backend architecture, database migrations, Docker-based deployment and environment-based configuration.

## Features

- View employee list
- Create employees
- Edit employee information
- Delete employees
- RESTful CRUD API
- Client-side routing
- Reusable React components
- Custom React hooks for form logic
- DTO-based backend API
- Layered Spring architecture
- PostgreSQL persistence
- Database schema migrations with Flyway
- Dockerized backend and frontend
- Runtime backend configuration for the frontend
- Spring Boot Actuator health checks

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Bootstrap
- ESLint
- Nginx

### Backend

- Java 25
- Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- Hibernate
- Lombok
- Maven
- Spring Boot Actuator

### Database

- PostgreSQL
- Flyway
- Supabase PostgreSQL hosting

### Infrastructure

- Docker
- Docker Compose
- Nginx reverse proxy
- Environment-based configuration
- Vercel deployment configuration

## REST API

Base path:

```text
/api/employees
```

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/employees` | Get all employees |
| `GET` | `/api/employees/{id}` | Get employee by ID |
| `POST` | `/api/employees` | Create employee |
| `PUT` | `/api/employees/{id}` | Update employee |
| `DELETE` | `/api/employees/{id}` | Delete employee |

## Frontend Routes

| Route | Description |
| --- | --- |
| `/employees` | Employee list |
| `/employees/add` | Create employee |
| `/employees/edit/:id` | Edit employee |

The root route redirects to `/employees`.

## Database

The application uses PostgreSQL through Spring Data JPA.

Database schema changes are version-controlled with Flyway:

```text
esm/src/main/resources/db/migration/
└── V1__create_employees.sql
```

This allows the database schema to be created and updated automatically when the backend starts.

Supabase is used only as managed PostgreSQL hosting. The backend connects directly to PostgreSQL, so the application is not coupled to the Supabase SDK or Supabase REST API.

## Frontend API Proxy

The browser communicates with the frontend domain using:

```text
/api/*
```

During development, Vite proxies these requests to the Spring Boot backend.

In the containerized frontend, Nginx performs the same role:

```text
Browser
   ↓
Frontend /api/*
   ↓
Nginx
   ↓
Spring Boot API
```

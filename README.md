# Task CRM

A role-based task management and workflow system built with **Python and Django**. The application provides separate workspaces for administrators and employees, enabling task delegation, progress tracking, and centralized workflow management.

## Features

* **Role-Based Access Control (RBAC)**

  * Separate permissions and interfaces for administrators and employees
  * Controlled access to tasks and management functionality

* **Task Management**

  * Create and assign tasks
  * Track task status and progress
  * Manage employee workloads and daily responsibilities

* **Administrative Dashboard**

  * Assign tasks to employees
  * Monitor task progress
  * Manage users and operational workflows

* **Employee Workspace**

  * View assigned tasks
  * Update task statuses
  * Track daily responsibilities

* **Authentication & Authorization**

  * Secure user authentication
  * Role-based permissions
  * Protected application endpoints

* **REST API**

  * RESTful backend API
  * Structured endpoints for frontend/backend communication

* **Containerized Development**

  * Docker-based development environment
  * Docker Compose for running application services
  * Containerized database migrations

## Architecture

The project follows a modular Django architecture:

```text
task-crm/
├── backend/
│   ├── core/
│   │   └── Project configuration and settings
│   │
│   ├── accounts/
│   │   └── Authentication and role management
│   │
│   ├── tasks/
│   │   └── Task models, assignment and status tracking
│   │
│   └── api/
│       └── REST API endpoints
│
├── frontend/
│   └── Client-side application
│
├── docker-compose.yml
└── README.md
```

## Tech Stack

### Backend

* Python
* Django
* REST API

### Database

* PostgreSQL
* Django ORM
* Database migrations

### DevOps & Infrastructure

* Docker
* Docker Compose
* Linux

### Development Tools

* Git
* GitHub

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Python 3.10+
* Docker
* Docker Compose
* Git

### 1. Clone the repository

```bash
git clone https://github.com/alex083/task-crm.git
cd task-crm
```

### 2. Configure environment variables

Create a `.env` file in the project root and configure the required environment variables.

```bash
cp .env.example .env
```

Update the values according to your environment.

### 3. Build and start the application

```bash
docker-compose up --build
```

### 4. Apply database migrations

```bash
docker-compose exec web python manage.py migrate
```

### 5. Create an administrator account

```bash
docker-compose exec web python manage.py createsuperuser
```

Follow the prompts to create the administrator account.

### 6. Open the application

Once the containers are running, open:

```text
http://127.0.0.1:8000/
```

## Project Structure

### `core/`

Contains the main Django project configuration, settings, URL routing, and application setup.

### `accounts/`

Responsible for:

* User authentication
* User roles
* Permissions
* Access control

### `tasks/`

Contains the core task management functionality:

* Task creation
* Task assignment
* Task status tracking
* Employee task management

### `api/`

Provides REST API endpoints used for communication between the backend and frontend.

## Key Concepts

### Role-Based Access Control

The application separates functionality based on user roles.

```text
Administrator
     │
     ├── Manage users
     ├── Assign tasks
     ├── Monitor progress
     └── Manage workflows

Employee
     │
     ├── View assigned tasks
     ├── Update task status
     └── Manage daily tasks
```

This approach allows the application to enforce authorization at different levels while keeping the business logic organized by Django applications.

## API

The backend exposes RESTful endpoints for interacting with application resources.

Example API workflow:

```text
Client
   │
   ▼
REST API
   │
   ▼
Django
   │
   ├── Authentication
   ├── Authorization
   ├── Business Logic
   │
   ▼
Database
```

## Docker

The application is designed to run in a containerized environment using Docker Compose.

This provides:

* Reproducible development environments
* Simplified setup
* Isolated application services
* Consistent deployment configuration

Start the complete environment with:

```bash
docker-compose up --build
```

## Development

Run the Django development server inside the container:

```bash
docker-compose exec web python manage.py runserver 0.0.0.0:8000
```

Run migrations:

```bash
docker-compose exec web python manage.py migrate
```

Create a superuser:

```bash
docker-compose exec web python manage.py createsuperuser
```

## Future Improvements

Potential improvements include:

* Automated test coverage
* API documentation with OpenAPI / Swagger
* Background task processing with Celery
* Redis caching
* Email notifications
* Advanced task filtering and search
* Activity and audit logs
* Production deployment configuration
* CI/CD pipeline

## License

This project is licensed under the **MIT License**.

## Author

**Oleksandr Hordovenko**

GitHub: https://github.com/alex083

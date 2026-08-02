Task Management CRM
A robust, role-based Task Management CRM built to streamline workflow delegation, administrative oversight, and employee task tracking.

Features
Role-Based Access Control (RBAC): Distinct permission levels and interfaces for administrators and regular employees.

Administrative Oversight: Tools for managers to assign tasks, monitor team progress, and oversee operational workflows.

Employee Workspace: Dedicated views for team members to track assigned tasks, update statuses, and manage daily responsibilities.

Secure Authentication: Built-in user authentication ensuring secure access control across all system layers.

RESTful API: Clean API endpoints powering seamless communication between the backend and client interfaces.

Tech Stack
Backend: Python, Django

Database & Management: Docker, containerized migrations

Version Control: Git & GitHub

Getting Started
Prerequisites
Ensure you have the following installed on your local machine:

Python (version 3.10 or higher recommended)

Docker & Docker Compose

Git

Installation & Setup
Clone the repository:

Bash
git clone https://github.com/alex083/task-crm.git
cd task-crm
Configure environment variables:
Create a .env file in the root directory and add your configuration settings (refer to .env.example if available).

Run with Docker:

Bash
docker-compose up --build
Apply database migrations:

Bash
docker-compose exec web python manage.py migrate
Create a superuser (for admin access):

Bash
docker-compose exec web python manage.py createsuperuser
Access the application:
Open your browser and navigate to [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

Project Structure
core/ — Main project settings and configurations.

api/ — API endpoints and request handlers.

accounts/ — User authentication and role management logic.

tasks/ — Task creation, status tracking, and assignment models.

Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

License
This project is open-source and available under the MIT License.

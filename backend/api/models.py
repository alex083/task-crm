from django.contrib.auth.models import AbstractUser
from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Назва відділу")

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = (
        ('super_admin', 'Super Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Відділ")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return f"{self.username} ({self.role})"

class Task(models.Model):
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    STATUS_CHOICES = (
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    )

    title = models.CharField(max_length=200, verbose_name="Назва завдання")
    description = models.TextField(blank=True, verbose_name="Опис")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    
    # Робимо поля необов'язковими (null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Відділ завдання")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tasks', verbose_name="Створив")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks', verbose_name="Виконавець")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
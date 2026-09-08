from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Department name")

    def __str__(self):
        return self.name


class Position(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Job title")

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
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Department")
    position = models.ForeignKey(Position, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Job title")
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

    title = models.CharField(max_length=200, verbose_name="Task title")
    description = models.TextField(blank=True, verbose_name="Description")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')

    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Task department")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tasks', verbose_name="Created by")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks', verbose_name="Assignee")

    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True, verbose_name="Due date")

    def __str__(self):
        return self.title


class TaskComment(models.Model):
    task = models.ForeignKey(
        Task,
        related_name='comments',
        on_delete=models.CASCADE,
    )
    author = models.ForeignKey(
        User,
        related_name='task_comments',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment on {self.task_id}'


class InternalMessage(models.Model):
    RECIPIENT_TYPE_CHOICES = (
        ('user', 'User'),
        ('department', 'Department'),
        ('position', 'Position'),
        ('all', 'All'),
    )

    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_messages',
        verbose_name="Sender",
    )
    recipient_type = models.CharField(
        max_length=20,
        choices=RECIPIENT_TYPE_CHOICES,
        default='user',
        verbose_name="Recipient type",
    )
    recipient_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='addressed_messages',
        verbose_name="Recipient user",
    )
    recipient_department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='department_messages',
        verbose_name="Recipient department",
    )
    recipient_position = models.ForeignKey(
        Position,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='position_messages',
        verbose_name="Recipient position",
    )
    title = models.CharField(max_length=200, verbose_name="Message title")
    text = models.TextField(verbose_name="Message")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        super().clean()
        errors = {}

        if self.recipient_type == 'user':
            if not self.recipient_user_id:
                errors['recipient_user'] = 'Select a user.'
            self.recipient_department = None
            self.recipient_position = None
        elif self.recipient_type == 'department':
            if not self.recipient_department_id:
                errors['recipient_department'] = 'Select a department.'
            self.recipient_user = None
            self.recipient_position = None
        elif self.recipient_type == 'position':
            if not self.recipient_position_id:
                errors['recipient_position'] = 'Select a position.'
            self.recipient_user = None
            self.recipient_department = None
        elif self.recipient_type == 'all':
            self.recipient_user = None
            self.recipient_department = None
            self.recipient_position = None

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return self.title


class MessageReceipt(models.Model):
    message = models.ForeignKey(
        InternalMessage,
        related_name='receipts',
        on_delete=models.CASCADE,
    )
    recipient = models.ForeignKey(
        User,
        related_name='message_receipts',
        on_delete=models.CASCADE,
    )
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-id']
        constraints = [
            models.UniqueConstraint(
                fields=('message', 'recipient'),
                name='unique_message_recipient',
            ),
        ]

    def __str__(self):
        return f'Receipt {self.message_id} → {self.recipient_id}'
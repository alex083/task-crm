from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q

from .models import User


def _send(subject, message, recipients):
    emails = [email for email in recipients if email]
    if not emails:
        return
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=emails,
        fail_silently=True,
    )


def notify_registration(user):
    """Notify the new user and managers/admins about a pending registration."""
    if user.email:
        _send(
            subject='Task CRM: registration received',
            message=(
                f'Hello {user.first_name or user.username},\n\n'
                'Your account was created and is waiting for approval.\n'
                f'Login: {user.username}\n'
                f'Department: {user.department.name if user.department else "—"}\n\n'
                'You will get access after a manager or super admin approves you.'
            ),
            recipients=[user.email],
        )

    reviewers = User.objects.filter(
        Q(role='super_admin')
        | Q(role='manager', department_id=user.department_id, status='approved')
    ).exclude(pk=user.pk)

    _send(
        subject='Task CRM: new user awaiting approval',
        message=(
            f'A new employee registered and is pending approval.\n\n'
            f'Username: {user.username}\n'
            f'Email: {user.email or "—"}\n'
            f'Name: {user.first_name} {user.last_name}\n'
            f'Department: {user.department.name if user.department else "—"}\n'
        ),
        recipients=[u.email for u in reviewers],
    )


def notify_user_approved(user):
    if not user.email:
        return
    _send(
        subject='Task CRM: account approved',
        message=(
            f'Hello {user.first_name or user.username},\n\n'
            'Your account has been approved. You can now sign in to Task CRM.'
        ),
        recipients=[user.email],
    )


def notify_task_assigned(task, actor=None):
    assignee = task.assigned_to
    if not assignee or not assignee.email:
        return
    if actor and assignee.pk == actor.pk:
        return

    _send(
        subject=f'Task CRM: assigned task "{task.title}"',
        message=(
            f'Hello {assignee.first_name or assignee.username},\n\n'
            f'You were assigned a task: {task.title}\n'
            f'Status: {task.status}\n'
            f'Priority: {task.priority}\n'
            f'Due date: {task.due_date or "—"}\n'
            f'Department: {task.department.name if task.department else "—"}\n'
            f'Created by: {task.created_by.username if task.created_by else "—"}\n\n'
            f'Description:\n{task.description or "—"}\n'
        ),
        recipients=[assignee.email],
    )

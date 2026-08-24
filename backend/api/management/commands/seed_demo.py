from django.core.management.base import BaseCommand

from api.models import Department, Task, User

DEMO_PASSWORD = 'demo1234'


class Command(BaseCommand):
    help = 'Create demo departments, users and tasks for the portfolio site.'

    def handle(self, *args, **options):
        engineering, _ = Department.objects.get_or_create(name='Engineering')
        sales, _ = Department.objects.get_or_create(name='Sales')

        admin = self._ensure_user(
            'admin',
            email='admin@demo.local',
            first_name='Alex',
            last_name='Admin',
            role='super_admin',
            status='approved',
            is_staff=True,
            is_superuser=True,
        )
        manager = self._ensure_user(
            'manager',
            email='manager@demo.local',
            first_name='Maria',
            last_name='Manager',
            role='manager',
            status='approved',
            department=engineering,
        )
        self._ensure_user(
            'employee',
            email='employee@demo.local',
            first_name='Evan',
            last_name='Employee',
            role='employee',
            status='approved',
            department=engineering,
        )

        if not Task.objects.exists():
            Task.objects.create(
                title='Prepare demo for the client',
                description='Collect screenshots and a short walkthrough of Task CRM.',
                priority='high',
                status='in_progress',
                department=engineering,
                created_by=admin,
                assigned_to=manager,
            )
            Task.objects.create(
                title='Review open registrations',
                description='Approve pending employees after checking their department.',
                priority='medium',
                status='todo',
                department=engineering,
                created_by=admin,
                assigned_to=manager,
            )
            Task.objects.create(
                title='Update sales pipeline notes',
                description='Add the latest follow-ups to the department board.',
                priority='low',
                status='todo',
                department=sales,
                created_by=admin,
                assigned_to=manager,
            )

        self.stdout.write(self.style.SUCCESS(
            'Demo ready. Logins: admin / manager / employee  (password: demo1234)'
        ))

    def _ensure_user(self, username, **fields):
        user, created = User.objects.get_or_create(username=username, defaults=fields)
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
        return user

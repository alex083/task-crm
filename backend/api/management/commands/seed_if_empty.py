from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand

from api.models import Department, Position, Task, User


class Command(BaseCommand):
    help = 'Load api/fixtures/seed.json only when the database has no CRM data.'

    def handle(self, *args, **options):
        already_filled = (
            User.objects.exists()
            or Department.objects.exists()
            or Position.objects.exists()
            or Task.objects.exists()
        )
        if already_filled:
            self.stdout.write('Database already has data, skip seed.')
            return

        fixture = Path(settings.BASE_DIR) / 'api' / 'fixtures' / 'seed.json'
        if not fixture.exists():
            self.stdout.write('No seed.json found, skip seed.')
            return

        self.stdout.write(f'Loading {fixture}...')
        call_command('loaddata', str(fixture))
        self.stdout.write(self.style.SUCCESS('Seed loaded.'))

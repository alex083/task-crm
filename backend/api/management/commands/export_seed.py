from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Dump departments, positions, users, tasks and comments into api/fixtures/seed.json.'

    def handle(self, *args, **options):
        fixture_dir = Path(settings.BASE_DIR) / 'api' / 'fixtures'
        fixture_dir.mkdir(parents=True, exist_ok=True)
        fixture = fixture_dir / 'seed.json'

        call_command(
            'dumpdata',
            'api.Department',
            'api.Position',
            'api.User',
            'api.Task',
            'api.TaskComment',
            indent=2,
            output=str(fixture),
            natural_foreign=True,
        )
        self.stdout.write(self.style.SUCCESS(f'Seed written to {fixture}'))
        self.stdout.write(
            'This file contains password hashes. Commit it only if that is acceptable.'
        )

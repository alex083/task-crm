#!/bin/sh
set -e
python manage.py migrate --noinput
python manage.py seed_demo
python manage.py collectstatic --noinput
exec gunicorn core.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 1 --timeout 120

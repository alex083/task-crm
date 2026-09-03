#!/bin/sh
set -e

python - <<'PY'
import os
import sys
import time

import psycopg2

db = {
    'dbname': os.environ.get('DB_NAME', 'task_db'),
    'user': os.environ.get('DB_USER', 'postgres'),
    'password': os.environ.get('DB_PASSWORD', 'postgres'),
    'host': os.environ.get('DB_HOST', 'db'),
    'port': os.environ.get('DB_PORT', '5432'),
}

for attempt in range(30):
    try:
        conn = psycopg2.connect(**db)
        conn.close()
        break
    except Exception:
        time.sleep(1)
else:
    sys.exit('Database is not ready')
PY

python manage.py migrate --noinput
python manage.py seed_if_empty

exec "$@"

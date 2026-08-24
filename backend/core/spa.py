from pathlib import Path

from django.conf import settings
from django.http import Http404, HttpResponse


def spa_index(request):
    index = Path(settings.FRONTEND_DIR) / 'index.html'
    if not index.exists():
        raise Http404('Frontend is not built')
    return HttpResponse(index.read_bytes(), content_type='text/html; charset=utf-8')

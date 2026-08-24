from pathlib import Path

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as static_serve
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .spa import spa_index

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('api.urls')),
]

frontend_dir = Path(settings.FRONTEND_DIR)
if (frontend_dir / 'index.html').exists():
    urlpatterns += [
        re_path(
            r'^assets/(?P<path>.*)$',
            static_serve,
            {'document_root': frontend_dir / 'assets'},
        ),
        re_path(r'^(?!api/|admin/|static/).*$', spa_index),
    ]

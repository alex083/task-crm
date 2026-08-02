from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DepartmentViewSet, UserViewSet, TaskViewSet, MeView

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DepartmentViewSet,
    UserViewSet,
    TaskViewSet,
    MeView,
    RegisterView,
    PublicDepartmentListView,
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('register/', RegisterView.as_view(), name='register'),
    path('public/departments/', PublicDepartmentListView.as_view(), name='public-departments'),
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, DepartmentViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'departments', DepartmentViewSet, basename='department')

urlpatterns = [
    path('', include(router.urls)),
]
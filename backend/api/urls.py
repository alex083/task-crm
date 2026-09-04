from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DepartmentViewSet,
    PositionViewSet,
    UserViewSet,
    TaskViewSet,
    MeView,
    ChangePasswordView,
    RegisterView,
    PublicDepartmentListView,
    PublicPositionListView,
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'positions', PositionViewSet, basename='position')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('register/', RegisterView.as_view(), name='register'),
    path('public/departments/', PublicDepartmentListView.as_view(), name='public-departments'),
    path('public/positions/', PublicPositionListView.as_view(), name='public-positions'),
    path('', include(router.urls)),
]

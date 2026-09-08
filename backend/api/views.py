from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Department, Position, User, Task, InternalMessage
from .serializers import (
    ChangePasswordSerializer,
    ColleagueSerializer,
    DepartmentSerializer,
    InternalMessageSerializer,
    PositionSerializer,
    RegisterSerializer,
    TaskCommentSerializer,
    UserSerializer,
    TaskSerializer,
)
from .notifications import (
    notify_registration,
    notify_task_assigned,
    notify_user_approved,
)
from .permissions import (
    IsSuperAdmin,
    IsManagerOrSuperAdmin,
    IsApprovedUser,
    is_super_admin,
    is_manager,
)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password changed successfully.'})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        notify_registration(user)
        return Response(
            {
                'id': user.id,
                'username': user.username,
                'status': user.status,
                'detail': 'Registration successful. Waiting for approval.',
            },
            status=status.HTTP_201_CREATED,
        )


class PublicDepartmentListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        departments = Department.objects.all().order_by('name')
        return Response(DepartmentSerializer(departments, many=True).data)


class PublicPositionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        positions = Position.objects.all().order_by('name')
        return Response(PositionSerializer(positions, many=True).data)


class ColleagueListView(APIView):
    permission_classes = [IsApprovedUser]

    def get(self, request):
        colleagues = (
            User.objects.filter(is_active=True, status='approved')
            .exclude(pk=request.user.pk)
            .select_related('department')
            .order_by('username')
        )
        return Response(ColleagueSerializer(colleagues, many=True).data)


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsSuperAdmin()]
        return [IsApprovedUser()]

    def get_queryset(self):
        user = self.request.user
        if is_super_admin(user):
            return Department.objects.all()
        if user.department_id:
            return Department.objects.filter(pk=user.department_id)
        return Department.objects.none()


class PositionViewSet(viewsets.ModelViewSet):
    serializer_class = PositionSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsSuperAdmin()]
        return [IsApprovedUser()]

    def get_queryset(self):
        return Position.objects.all().order_by('name')


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsManagerOrSuperAdmin]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related('department', 'position')
        if is_super_admin(user):
            return qs.all()
        if is_manager(user) and user.department_id:
            return qs.filter(department_id=user.department_id)
        return qs.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        user = serializer.save()
        if previous_status != 'approved' and user.status == 'approved':
            notify_user_approved(user)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsApprovedUser]

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.select_related(
            'department', 'created_by', 'assigned_to'
        )
        if is_super_admin(user):
            return qs.all()
        if is_manager(user) and user.department_id:
            return qs.filter(department_id=user.department_id)
        return qs.filter(Q(assigned_to=user) | Q(created_by=user))

    def perform_create(self, serializer):
        user = self.request.user
        extra = {'created_by': user}
        if is_manager(user) and user.department_id:
            extra['department'] = user.department
        task = serializer.save(**extra)
        notify_task_assigned(task, actor=user)

    def perform_update(self, serializer):
        previous_assignee_id = serializer.instance.assigned_to_id
        task = serializer.save()
        if task.assigned_to_id and task.assigned_to_id != previous_assignee_id:
            notify_task_assigned(task, actor=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            comments = task.comments.select_related('author')
            return Response(TaskCommentSerializer(comments, many=True).data)

        serializer = TaskCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(author=request.user, task=task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InternalMessageViewSet(viewsets.ModelViewSet):
    serializer_class = InternalMessageSerializer
    permission_classes = [IsApprovedUser]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        return InternalMessage.objects.filter(
            Q(sender=user) | Q(receipts__recipient=user)
        ).select_related(
            'sender',
            'recipient_user',
            'recipient_department',
            'recipient_position',
        ).prefetch_related('receipts').distinct()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        message = self.get_object()
        receipt = message.receipts.filter(recipient=request.user).first()
        if receipt is None:
            return Response(
                {'detail': 'Message is not in your inbox.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if receipt.read_at is None:
            receipt.read_at = timezone.now()
            receipt.save(update_fields=['read_at'])
        return Response(self.get_serializer(message).data)
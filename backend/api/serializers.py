from rest_framework import serializers

from .models import User, Department, Position, Task, TaskComment, InternalMessage, MessageReceipt
from .permissions import is_super_admin, is_manager


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = ['id', 'name']


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.check_password(attrs['current_password']):
            raise serializers.ValidationError({
                'current_password': 'Current password is incorrect.',
            })
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'New passwords do not match.',
            })
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError({
                'new_password': 'New password must be different from the current one.',
            })
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=True,
    )
    position = serializers.PrimaryKeyRelatedField(
        queryset=Position.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password',
            'first_name', 'last_name', 'department', 'position',
        ]

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError('Email is required.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(
            password=password,
            role='employee',
            status='pending',
            **validated_data,
        )


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    position_name = serializers.ReadOnlyField(source='position.name')
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password',
            'role', 'department', 'department_name',
            'position', 'position_name',
            'status', 'first_name', 'last_name',
            'is_staff', 'is_superuser',
        ]
        read_only_fields = ['id', 'is_staff', 'is_superuser']

    def validate(self, attrs):
        request = self.context.get('request')
        actor = request.user if request else None

        if actor and is_manager(actor) and not is_super_admin(actor):
            role = attrs.get('role', getattr(self.instance, 'role', 'employee'))
            if role == 'super_admin':
                raise serializers.ValidationError({
                    'role': 'Managers cannot assign the super_admin role.',
                })

            department = attrs.get(
                'department',
                getattr(self.instance, 'department', None),
            )
            if department and department.id != actor.department_id:
                raise serializers.ValidationError({
                    'department': 'Managers can only manage their own department.',
                })

            if self.instance and self.instance.role == 'super_admin':
                raise serializers.ValidationError(
                    'Managers cannot edit super_admin users.'
                )

            if self.instance is None and 'department' not in attrs:
                attrs['department'] = actor.department

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({
                'password': 'Password is required when creating a user.',
            })
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class TaskCommentSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = TaskComment
        fields = ['id', 'author', 'author_username', 'text', 'created_at']
        read_only_fields = ['author', 'created_at']

    def validate_text(self, value):
        text = (value or '').strip()
        if not text:
            raise serializers.ValidationError('Comment cannot be empty.')
        return text


class TaskSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    assigned_to_username = serializers.ReadOnlyField(source='assigned_to.username')
    department_name = serializers.ReadOnlyField(source='department.name')
    due_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

    def validate(self, attrs):
        request = self.context.get('request')
        actor = request.user if request else None

        if actor and is_manager(actor) and not is_super_admin(actor):
            department = attrs.get(
                'department',
                getattr(self.instance, 'department', None),
            )
            if department and department.id != actor.department_id:
                raise serializers.ValidationError({
                    'department': 'Managers can only manage tasks in their own department.',
                })

            assigned_to = attrs.get(
                'assigned_to',
                getattr(self.instance, 'assigned_to', None),
            )
            if assigned_to and assigned_to.department_id != actor.department_id:
                raise serializers.ValidationError({
                    'assigned_to': 'You can only assign employees from your own department.',
                })

        return attrs


class ColleagueSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'role', 'department', 'department_name',
        ]


class InternalMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')
    recipient_user_username = serializers.ReadOnlyField(source='recipient_user.username')
    recipient_department_name = serializers.ReadOnlyField(source='recipient_department.name')
    recipient_position_name = serializers.ReadOnlyField(source='recipient_position.name')
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = InternalMessage
        fields = [
            'id',
            'sender',
            'sender_username',
            'recipient_type',
            'recipient_user',
            'recipient_user_username',
            'recipient_department',
            'recipient_department_name',
            'recipient_position',
            'recipient_position_name',
            'title',
            'text',
            'created_at',
            'is_read',
        ]
        read_only_fields = ['sender', 'created_at', 'is_read']
        extra_kwargs = {
            'recipient_user': {'required': False, 'allow_null': True},
            'recipient_department': {'required': False, 'allow_null': True},
            'recipient_position': {'required': False, 'allow_null': True},
        }

    def get_is_read(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        receipt = next(
            (item for item in obj.receipts.all() if item.recipient_id == user.id),
            None,
        )
        if receipt is None:
            return False
        return receipt.read_at is not None
    def validate_text(self, value):
        text = (value or '').strip()
        if not text:
            raise serializers.ValidationError('Message cannot be empty.')
        return text
    def validate(self, attrs):
        request = self.context.get('request')
        actor = request.user if request else None
        recipient_type = attrs.get('recipient_type', 'user')
        recipient_user = attrs.get('recipient_user')
        recipient_department = attrs.get('recipient_department')
        recipient_position = attrs.get('recipient_position')
        if recipient_type == 'user':
            if not recipient_user:
                raise serializers.ValidationError({
                    'recipient_user': 'Select a user.',
                })
            attrs['recipient_department'] = None
            attrs['recipient_position'] = None
        elif recipient_type == 'department':
            if not recipient_department:
                raise serializers.ValidationError({
                    'recipient_department': 'Select a department.',
                })
            attrs['recipient_user'] = None
            attrs['recipient_position'] = None
        elif recipient_type == 'position':
            if not recipient_position:
                raise serializers.ValidationError({
                    'recipient_position': 'Select a position.',
                })
            attrs['recipient_user'] = None
            attrs['recipient_department'] = None
        elif recipient_type == 'all':
            attrs['recipient_user'] = None
            attrs['recipient_department'] = None
            attrs['recipient_position'] = None
        if actor and not is_super_admin(actor):
            if recipient_type in ('all', 'position'):
                raise serializers.ValidationError({
                    'recipient_type': 'Only a super admin can send this type of message.',
                })
            if recipient_type == 'department':
                if not is_manager(actor):
                    raise serializers.ValidationError({
                        'recipient_type': 'Only managers can message a department.',
                    })
                if recipient_department and recipient_department.id != actor.department_id:
                    raise serializers.ValidationError({
                        'recipient_department': 'Managers can only message their own department.',
                    })
        return attrs
    def create(self, validated_data):
        message = InternalMessage.objects.create(**validated_data)
        recipients = self._resolve_recipients(message)
        MessageReceipt.objects.bulk_create([
            MessageReceipt(message=message, recipient=user)
            for user in recipients
            if user.id != message.sender_id
        ])
        return message
    def _resolve_recipients(self, message):
        users = User.objects.filter(status='approved').exclude(role='super_admin')
        if message.recipient_type == 'user' and message.recipient_user_id:
            return User.objects.filter(pk=message.recipient_user_id)
        if message.recipient_type == 'department' and message.recipient_department_id:
            return users.filter(department_id=message.recipient_department_id)
        if message.recipient_type == 'position' and message.recipient_position_id:
            return users.filter(position_id=message.recipient_position_id)
        if message.recipient_type == 'all':
            return users
        return User.objects.none()
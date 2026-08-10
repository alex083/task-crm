from rest_framework import serializers

from .models import User, Department, Task
from .permissions import is_super_admin, is_manager


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=True,
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password',
            'first_name', 'last_name', 'department',
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
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password',
            'role', 'department', 'department_name',
            'status', 'first_name', 'last_name',
        ]
        read_only_fields = ['id']

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


class TaskSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    assigned_to_username = serializers.ReadOnlyField(source='assigned_to.username')
    department_name = serializers.ReadOnlyField(source='department.name')

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

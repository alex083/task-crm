from rest_framework import serializers
from .models import Task, Department, User

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class TaskSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    assigned_to_username = serializers.ReadOnlyField(source='assigned_to.username', allow_null=True)
    department_name = serializers.ReadOnlyField(source='department.name', allow_null=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority', 'status', 
            'department', 'department_name', 
            'created_by', 'created_by_username', 
            'assigned_to', 'assigned_to_username', 
            'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    """Read serializer. Role is NEVER writable here - privilege changes go
    through the admin-only UserViewSet via AdminUserSerializer."""
    firstName = serializers.SerializerMethodField()
    lastName = serializers.SerializerMethodField()
    avatar = serializers.CharField(source='avatar_url', read_only=True)
    createdAt = serializers.DateTimeField(source='date_joined', read_only=True)
    isActive = serializers.BooleanField(source='is_active', read_only=True)
    isEmailVerified = serializers.BooleanField(source='is_email_verified', read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'email', 'name', 'first_name', 'last_name',
            'firstName', 'lastName', 'role', 'phone', 'avatar_url',
            'avatar', 'is_active', 'isActive', 'is_email_verified', 'isEmailVerified',
            'date_joined', 'createdAt'
        )
        read_only_fields = ('id', 'date_joined', 'role', 'email', 'is_active', 'is_email_verified')


    def get_firstName(self, obj):
        if obj.first_name:
            return obj.first_name
        parts = (obj.name or '').strip().split(' ', 1)
        return parts[0] if parts else ''

    def get_lastName(self, obj):
        if obj.last_name:
            return obj.last_name
        parts = (obj.name or '').strip().split(' ', 1)
        return parts[1] if len(parts) > 1 else ''

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and request.data:
            if 'isActive' in request.data:
                instance.is_active = bool(request.data['isActive'])
            first = request.data.get('firstName')
            last = request.data.get('lastName')
            if first is not None or last is not None:
                if first is not None:
                    instance.first_name = first
                if last is not None:
                    instance.last_name = last
                instance.name = f"{instance.first_name} {instance.last_name}".strip()
        validated_data.pop('role', None)
        validated_data.pop('is_active', None)
        return super().update(instance, validated_data)


class AdminUserSerializer(UserSerializer):
    """Write serializer used only by admin-gated endpoints."""

    class Meta(UserSerializer.Meta):
        read_only_fields = ('id', 'date_joined', 'email')


class StaffUserSerializer(UserSerializer):
    """Read serializer for staff. Role is omitted - staff may only ever see
    students, so exposing it would be misleading rather than useful."""

    class Meta(UserSerializer.Meta):
        fields = tuple(f for f in UserSerializer.Meta.fields if f != 'role')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField(required=False, allow_blank=True)
    firstName = serializers.CharField(required=False, allow_blank=True, write_only=True)
    lastName = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'name', 'firstName', 'lastName', 'phone')

    def create(self, validated_data):
        first_name = validated_data.pop('firstName', '')
        last_name = validated_data.pop('lastName', '')
        name = validated_data.get('name') or f"{first_name} {last_name}".strip()
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=name,
            phone=validated_data.get('phone', ''),
            role='student',
        )
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.save()
        return user

class CreateStaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, required=False, default='Staff@123')
    name = serializers.CharField(required=False, allow_blank=True)
    firstName = serializers.CharField(required=False, allow_blank=True, write_only=True)
    lastName = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ('email', 'name', 'firstName', 'lastName', 'phone', 'password')

    def create(self, validated_data):
        password = validated_data.pop('password', 'Staff@123')
        first_name = validated_data.pop('firstName', '')
        last_name = validated_data.pop('lastName', '')
        name = validated_data.get('name') or f"{first_name} {last_name}".strip()
        user = User.objects.create_user(
            role='staff',
            is_staff=True,
            name=name,
            password=password,
            **validated_data
        )
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.save()
        return user


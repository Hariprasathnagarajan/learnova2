from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    userId = serializers.CharField(source='user_id', read_only=True)
    body = serializers.CharField(source='message', read_only=True)
    isRead = serializers.BooleanField(source='is_read', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Notification
        fields = (
            'id', 'user', 'userId', 'title', 'message', 'body',
            'type', 'is_read', 'isRead', 'course_id', 'created_at', 'createdAt'
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data


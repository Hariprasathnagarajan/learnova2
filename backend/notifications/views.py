from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        return Response(NotificationSerializer(notifications, many=True).data)

class MarkNotificationReadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def _mark_read(self, request, notification_id):
        try:
            notif = Notification.objects.get(id=notification_id, user=request.user)
            notif.is_read = True
            notif.save()
            return Response(NotificationSerializer(notif).data)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, notification_id):
        return self._mark_read(request, notification_id)

    def post(self, request, notification_id):
        return self._mark_read(request, notification_id)


class MarkAllReadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

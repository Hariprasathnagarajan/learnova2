"""Infrastructure endpoints.

Kept deliberately free of version numbers, debug flags and any other detail that
would help someone fingerprint the deployment - this is reachable without
authentication.
"""
from django.db import connection
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Liveness plus a real database round-trip.

    Reporting 200 while the database is unreachable would let a platform keep
    routing traffic to an instance that cannot serve a single request.
    """

    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
                cursor.fetchone()
        except Exception:
            return Response(
                {'status': 'unavailable', 'database': 'down'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({'status': 'ok', 'database': 'up'})
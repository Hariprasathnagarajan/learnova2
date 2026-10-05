"""Centralized role-based permissions for the Learnova API.

Every view must declare an explicit role requirement. There is no implicit
"IsAuthenticated means allowed" for privileged operations.
"""
from rest_framework import permissions

ROLE_ADMIN = 'admin'
ROLE_STAFF = 'staff'
ROLE_STUDENT = 'student'

PRIVILEGED_ROLES = (ROLE_ADMIN, ROLE_STAFF)


def is_admin(user):
    return bool(user and user.is_authenticated and user.role == ROLE_ADMIN)


def is_staff(user):
    return bool(user and user.is_authenticated and user.role == ROLE_STAFF)


def is_student(user):
    return bool(user and user.is_authenticated and user.role == ROLE_STUDENT)


def is_privileged(user):
    """Admin or staff - i.e. anyone who is not a plain student."""
    return is_admin(user) or is_staff(user)


class IsAdmin(permissions.BasePermission):
    message = "You don't have permission to access this content."

    def has_permission(self, request, view):
        return is_admin(request.user)


class IsAdminOrStaff(permissions.BasePermission):
    message = "You don't have permission to access this content."

    def has_permission(self, request, view):
        return is_privileged(request.user)


class IsStudent(permissions.BasePermission):
    message = "You don't have permission to access this content."

    def has_permission(self, request, view):
        return is_student(request.user)


class IsSelfOrAdmin(permissions.BasePermission):
    """Allow access to your own record, or full access for admins.

    Staff may read student records but may never mutate them.
    """
    message = "You don't have permission to access this content."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if is_admin(user):
            return True
        if request.method in permissions.SAFE_METHODS:
            return is_privileged(user) or obj == user
        return obj == user
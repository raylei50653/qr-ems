from rest_framework import permissions
from .models import User

class IsManagerOrAdmin(permissions.BasePermission):
    """
    Allows access only to users with MANAGER or ADMIN roles, or superusers.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or 
            request.user.is_staff or 
            request.user.is_superuser
        )

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to users with ADMIN role or superusers.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            request.user.role == User.Role.ADMIN or 
            request.user.is_staff or 
            request.user.is_superuser
        )

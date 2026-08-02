from rest_framework.permissions import BasePermission, SAFE_METHODS


def is_super_admin(user):
    return bool(
        user
        and user.is_authenticated
        and (
            getattr(user, 'role', None) == 'super_admin'
            or user.is_staff
        )
    )


def is_manager(user):
    return bool(
        user
        and user.is_authenticated
        and getattr(user, 'role', None) == 'manager'
    )


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_super_admin(request.user)


class IsManagerOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_super_admin(request.user) or is_manager(request.user)


class IsApprovedUser(BasePermission):
    """Access for approved users only (super_admin always allowed)."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if is_super_admin(user):
            return True
        return getattr(user, 'status', None) == 'approved'

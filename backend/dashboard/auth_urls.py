from django.urls import path

from . import auth_views

urlpatterns = [
    path("login", auth_views.login),
    path("admin/login", auth_views.admin_login),
    path("register", auth_views.register),
    path("logout", auth_views.logout),
    path("user", auth_views.me),
    path("password-change", auth_views.change_password),
    path("password-reset", auth_views.password_reset_request),
    path("password-reset/confirm", auth_views.password_reset_confirm),
]

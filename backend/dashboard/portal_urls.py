from django.urls import path

from . import portal_views

urlpatterns = [
    path("me", portal_views.portal_me),
]

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import NewsletterSubscriber


@api_view(["POST"])
@permission_classes([AllowAny])
def newsletter_subscribe(request):
    email = (request.data.get("email") or "").strip().lower()
    name = (request.data.get("name") or "").strip()[:255]
    if not email:
        return Response(
            {"detail": "email is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    sub = NewsletterSubscriber.objects.filter(email=email).first()
    created = sub is None
    if created:
        sub = NewsletterSubscriber.objects.create(email=email, name=name)
    else:
        sub.name = name or sub.name
        sub.is_subscribed = True
        sub.deleted_at = None
        sub.save(update_fields=["name", "is_subscribed", "deleted_at", "updated_at"])
    return Response(
        {"ok": True, "email": sub.email, "created": created},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def newsletter_unsubscribe(request):
    token = (request.query_params.get("token") or "").strip()
    if not token:
        return Response(
            {"detail": "token query parameter is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    sub = NewsletterSubscriber.objects.filter(unsubscribe_token=token).first()
    if sub is None:
        return Response(
            {"detail": "Invalid or expired link."},
            status=status.HTTP_404_NOT_FOUND,
        )
    sub.is_subscribed = False
    sub.save(update_fields=["is_subscribed", "updated_at"])
    return Response({"ok": True, "detail": "You are unsubscribed."})

import logging
import smtplib
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication

from mailing.email_logging import record_outbound_email
from mailing.models import OutboundEmailLog
from mailing.smtp_helpers import smtp_failure_user_message

User = get_user_model()

logger = logging.getLogger(__name__)


def _serialize_user(user):
    requires_super = getattr(settings, "DASHBOARD_REQUIRES_SUPERUSER", True)
    allow_managers = getattr(settings, "DASHBOARD_ALLOW_STAFF_MANAGERS", True)
    if requires_super and allow_managers and user.is_staff and not user.is_superuser:
        can_admin = True
    elif requires_super:
        can_admin = bool(user.is_superuser)
    else:
        can_admin = bool(user.is_staff)
    is_manager = bool(user.is_staff) and not bool(user.is_superuser)
    dashboard_role = "admin" if user.is_superuser else ("manager" if is_manager else "user")
    return {
        "id": user.id,
        "email": user.email or "",
        "first_name": (user.first_name or "").strip(),
        "last_name": (user.last_name or "").strip(),
        "name": (user.get_full_name() or user.username or "").strip(),
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_manager": is_manager,
        "dashboard_role": dashboard_role,
        # Backward compat: same meaning as can_access_admin_dashboard
        "can_access_dashboard": bool(can_admin),
        "can_access_admin_dashboard": bool(can_admin),
        "can_access_client_portal": bool(user.is_active),
    }


def _registration_allowed():
    return getattr(settings, "DASHBOARD_ALLOW_PUBLIC_REGISTRATION", True)


def _register_grants_staff():
    return getattr(settings, "DASHBOARD_REGISTER_GRANTS_STAFF", False)


def _member_password_reset_eligible(user):
    """Members only: not staff or superuser (Django Admin / dashboard accounts)."""
    return (
        user.is_active
        and not user.is_staff
        and not user.is_superuser
        and bool((user.email or "").strip())
    )


PASSWORD_RESET_GENERIC_MESSAGE = (
    "If an account exists with that email, we've sent password reset instructions."
)


def _password_reset_success_response() -> Response:
    """When SMTP is not configured, tell the client instead of implying mail was sent."""
    if getattr(settings, "EMAIL_BACKEND", "") == "django.core.mail.backends.console.EmailBackend":
        return Response(
            {
                "detail": (
                    "Mail is not configured on the server (EMAIL_HOST is unset), so no email was sent. "
                    "Add SMTP settings to backend/.env or set EMAIL_* in the environment, then restart."
                ),
                "email_delivery": "console",
            },
            status=status.HTTP_200_OK,
        )
    return Response({"detail": PASSWORD_RESET_GENERIC_MESSAGE})


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """
    Member / client sign-in: any active user with valid credentials receives a token.
    """
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    authenticated = authenticate(
        request, username=user.get_username(), password=password
    )
    if authenticated is None:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not authenticated.is_active:
        return Response(
            {"detail": "This account is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )
    token, _ = Token.objects.get_or_create(user=authenticated)
    return Response({"token": token.key, "user": _serialize_user(authenticated)})


@api_view(["POST"])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Staff / Next.js admin dashboard sign-in: superuser (or staff when configured).
    """
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    authenticated = authenticate(
        request, username=user.get_username(), password=password
    )
    if authenticated is None:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not authenticated.is_active:
        return Response(
            {"detail": "This account is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )
    if getattr(settings, "DASHBOARD_REQUIRES_SUPERUSER", True):
        if authenticated.is_superuser:
            pass
        elif (
            getattr(settings, "DASHBOARD_ALLOW_STAFF_MANAGERS", True)
            and authenticated.is_staff
        ):
            pass
        else:
            return Response(
                {
                    "detail": "Only administrator or manager (staff) accounts can sign in here. "
                    "Use createsuperuser or ask an admin to grant staff access.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
    elif not authenticated.is_staff:
        return Response(
            {
                "detail": "This account does not have dashboard access. Ask an administrator to grant staff access.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    token, _ = Token.objects.get_or_create(user=authenticated)
    return Response({"token": token.key, "user": _serialize_user(authenticated)})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    if not _registration_allowed():
        return Response(
            {"detail": "Registration is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    password_confirmation = request.data.get("password_confirmation") or ""
    first_name = (request.data.get("first_name") or request.data.get("firstName") or "").strip()
    last_name = (request.data.get("last_name") or request.data.get("lastName") or "").strip()
    name = (request.data.get("name") or "").strip()
    if name and not first_name:
        parts = name.split(None, 1)
        first_name = parts[0]
        last_name = last_name or (parts[1] if len(parts) > 1 else "")
    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if password != password_confirmation:
        return Response(
            {"detail": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"detail": "An account with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    username_base = email.replace("@", "_").replace(".", "_")[:140]
    username = username_base
    n = 0
    while User.objects.filter(username=username).exists():
        n += 1
        username = f"{username_base[:130]}_{n}"
    grants_staff = _register_grants_staff()
    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name[:150],
            last_name=last_name[:150],
            is_staff=grants_staff,
            is_active=True,
        )
        token = Token.objects.create(user=user)
    return Response(
        {"token": token.key, "user": _serialize_user(user)},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"success": True})


@api_view(["GET", "PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    """Return or update the current user (token holder). UI uses can_access_* flags."""
    user = request.user
    if request.method == "GET":
        return Response({"user": _serialize_user(user)})

    # Display name: split to first/last (same as registration). Omitted = use first_name/last_name only.
    if "name" in request.data:
        s = str(request.data.get("name") or "").strip()
        if s:
            parts = s.split(None, 1)
            user.first_name = (parts[0] or "")[:150]
            user.last_name = (parts[1] if len(parts) > 1 else "")[:150]
        else:
            user.first_name = ""
            user.last_name = ""
    else:
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        if first_name is None and last_name is None:
            return Response(
                {
                    "detail": "No valid fields to update. Send name, or first_name and/or last_name.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if first_name is not None:
            user.first_name = str(first_name).strip()[:150]
        if last_name is not None:
            user.last_name = str(last_name).strip()[:150]
    user.save(update_fields=["first_name", "last_name"])
    return Response({"user": _serialize_user(user)})


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Update password for the signed-in user (requires current password)."""
    current = (request.data.get("current_password") or "").strip()
    new_pw = (request.data.get("new_password") or "").strip()
    new_confirm = (request.data.get("new_password_confirmation") or "").strip()
    if not current or not new_pw or not new_confirm:
        return Response(
            {
                "detail": "current_password, new_password, and new_password_confirmation are required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    if new_pw != new_confirm:
        return Response(
            {"detail": "New passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = request.user
    if not user.check_password(current):
        return Response(
            {"detail": "Current password is incorrect."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        validate_password(new_pw, user=user)
    except ValidationError as e:
        return Response(
            {"detail": " ".join(e.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user.set_password(new_pw)
    user.save(update_fields=["password"])
    return Response({"detail": "Your password has been updated."})


def _password_reset_log_to(user, email: str) -> str:
    if user and _member_password_reset_eligible(user):
        return (user.email or "").strip().lower()
    return email


def _password_reset_log_subject(user) -> str:
    if user and _member_password_reset_eligible(user):
        return str(
            getattr(settings, "MEMBER_PASSWORD_RESET_EMAIL_SUBJECT", None)
            or "Password reset — The Swole Republic"
        )
    return "Password reset — The Swole Republic"


def _send_password_reset_mail_or_probe(email: str, user) -> None:
    """
    Always sends to ``email`` when SMTP is configured: reset link for eligible members,
    otherwise a short probe message (for testing / clarity) if settings allow.
    """
    if user and _member_password_reset_eligible(user):
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        base = getattr(settings, "PUBLIC_SITE_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
        query = urlencode({"uid": uid, "token": token})
        reset_link = f"{base}/reset-password?{query}"
        subject = settings.MEMBER_PASSWORD_RESET_EMAIL_SUBJECT
        body = (
            "Hi,\n\n"
            "We received a request to reset your password for The Swole Republic. "
            "Open this link to choose a new password:\n\n"
            f"{reset_link}\n\n"
            "If you did not request this, you can ignore this email.\n"
        )
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        return

    if not getattr(settings, "PASSWORD_RESET_SEND_PROBE_FOR_UNKNOWN", True):
        return

    if user and (user.is_staff or user.is_superuser):
        subject = "Password reset — The Swole Republic"
        body = (
            "Hi,\n\n"
            "We received a password reset request for this address. "
            "Staff and administrator accounts do not use the member self-service reset flow. "
            "Use Admin sign-in or Django Admin to manage your password.\n\n"
            "This message confirms outbound mail from The Swole Republic.\n"
        )
    elif user and not user.is_active:
        subject = "Password reset — The Swole Republic"
        body = (
            "Hi,\n\n"
            "We received a password reset request for this address. "
            "This account is not active, so a reset link was not issued.\n\n"
            "This message confirms outbound mail from The Swole Republic.\n"
        )
    else:
        subject = "Password reset — The Swole Republic"
        body = (
            "Hi,\n\n"
            "We received a password reset request for this address. "
            "No member account was found with this email, so no reset link was sent.\n\n"
            "This message confirms outbound mail from The Swole Republic.\n"
        )
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    Sends email for every valid request: reset link for eligible members; otherwise a
    short probe email when PASSWORD_RESET_SEND_PROBE_FOR_UNKNOWN is enabled (default on).
    """
    email = (request.data.get("email") or "").strip().lower()
    if not email:
        return Response(
            {"detail": "Email is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = User.objects.filter(email__iexact=email).first()
    log_to = _password_reset_log_to(user, email)
    log_subj = _password_reset_log_subject(user)[:998]
    try:
        _send_password_reset_mail_or_probe(email, user)
    except (OSError, smtplib.SMTPException) as e:
        logger.exception("password_reset send_mail failed (SMTP / network)")
        record_outbound_email(
            source=OutboundEmailLog.Source.PASSWORD_RESET,
            to_email=log_to,
            subject=log_subj,
            success=False,
            error_message=smtp_failure_user_message(e),
            error_type=type(e).__name__,
        )
        return Response(
            {"detail": smtp_failure_user_message(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    record_outbound_email(
        source=OutboundEmailLog.Source.PASSWORD_RESET,
        to_email=log_to,
        subject=log_subj,
        success=True,
    )
    return _password_reset_success_response()


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Complete password reset using uid + token from the email link (members only)."""
    uid_b64 = (request.data.get("uid") or "").strip()
    token = (request.data.get("token") or "").strip()
    password = request.data.get("password") or ""
    password_confirmation = request.data.get("password_confirmation") or ""
    if not uid_b64 or not token:
        return Response(
            {"detail": "Invalid or expired reset link."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not password or not password_confirmation:
        return Response(
            {"detail": "Password and confirmation are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if password != password_confirmation:
        return Response(
            {"detail": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        uid = force_str(urlsafe_base64_decode(uid_b64))
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return Response(
            {"detail": "Invalid or expired reset link."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not _member_password_reset_eligible(user):
        return Response(
            {"detail": "Invalid or expired reset link."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not default_token_generator.check_token(user, token):
        return Response(
            {"detail": "Invalid or expired reset link."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        validate_password(password, user=user)
    except ValidationError as e:
        return Response(
            {"detail": " ".join(e.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user.set_password(password)
    user.save(update_fields=["password"])
    Token.objects.filter(user=user).delete()
    return Response(
        {
            "detail": "Your password has been reset. You can sign in with your new password.",
        }
    )

from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from dashboard.permissions import DashboardAccess
from dashboard.views import require_full_admin

from .branding_utils import prepare_favicon_file, validate_favicon_upload, validate_logo_upload
from .models import SiteBrandingSettings
from .serializers_branding import SiteBrandingSerializer


def _get_branding() -> SiteBrandingSettings:
    obj, _ = SiteBrandingSettings.objects.get_or_create(pk=1)
    return obj


def _serialize_branding(obj, request):
    return SiteBrandingSerializer(obj, context={"request": request}).data


@api_view(["GET"])
@permission_classes([AllowAny])
def site_branding_public(request):
    return Response(_serialize_branding(_get_branding(), request))


@api_view(["GET", "PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def site_branding_dashboard(request):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    obj = _get_branding()
    if request.method == "GET":
        return Response(_serialize_branding(obj, request))
    serializer = SiteBrandingSerializer(obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(_serialize_branding(obj, request))


@api_view(["POST", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def site_branding_logo(request):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    obj = _get_branding()

    if request.method == "DELETE":
        if obj.logo:
            obj.logo.delete(save=True)
        else:
            obj.save()
        return Response(_serialize_branding(obj, request))

    uploaded = request.FILES.get("logo") or request.FILES.get("file")
    if not uploaded:
        return Response(
            {"detail": "Upload a file in the `logo` field."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        validate_logo_upload(uploaded)
    except ValidationError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    if obj.logo:
        obj.logo.delete(save=False)
    obj.logo = uploaded
    obj.save(update_fields=["logo", "updated_at"])
    return Response(_serialize_branding(obj, request))


@api_view(["POST", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def site_branding_favicon(request):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    obj = _get_branding()

    if request.method == "DELETE":
        if obj.favicon:
            obj.favicon.delete(save=True)
        else:
            obj.save()
        return Response(_serialize_branding(obj, request))

    uploaded = request.FILES.get("favicon") or request.FILES.get("file")
    if not uploaded:
        return Response(
            {"detail": "Upload a file in the `favicon` field."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        validate_favicon_upload(uploaded)
    except ValidationError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    if obj.favicon:
        obj.favicon.delete(save=False)
    try:
        obj.favicon = prepare_favicon_file(uploaded)
    except ValidationError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    obj.save(update_fields=["favicon", "updated_at"])
    return Response(_serialize_branding(obj, request))

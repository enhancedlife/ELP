from django.http import HttpResponse
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    parser_classes,
    permission_classes,
)
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .db_backup import DbBackupError, database_backup_info, export_database_backup, import_database_backup
from .permissions import DashboardAccess
from .role_utils import require_superuser


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def database_backup_info_view(request):
    denied = require_superuser(request)
    if denied:
        return denied
    return Response(database_backup_info())


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def database_backup_export_view(request):
    denied = require_superuser(request)
    if denied:
        return denied
    try:
        payload, filename, content_type = export_database_backup()
    except DbBackupError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:  # noqa: BLE001
        return Response(
            {"detail": f"Export failed: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    response = HttpResponse(payload, content_type=content_type)
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response["Content-Length"] = str(len(payload))
    return response


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
@parser_classes([MultiPartParser, FormParser])
def database_backup_import_view(request):
    denied = require_superuser(request)
    if denied:
        return denied
    upload = request.FILES.get("file")
    if not upload:
        return Response(
            {"detail": "Multipart field `file` is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    confirm = (request.data.get("confirm") or "").strip().upper()
    if confirm != "REPLACE":
        return Response(
            {
                "detail": "Import requires confirm=REPLACE in the form body (this replaces all data)."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        result = import_database_backup(upload)
    except DbBackupError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:  # noqa: BLE001
        return Response(
            {"detail": f"Import failed: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return Response(result)

"""Dashboard APIs for contact IP bans and Cloudflare site-wide IP block."""

from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from dashboard.permissions import DashboardAccess
from mailing.cloudflare_blocks import (
    enabled as cloudflare_enabled,
    configured as cloudflare_configured,
    queue_enforce_current,
    queue_lift,
    save_enabled,
    status_payload,
)
from mailing.contact_blocks import (
    active_blocked_rows,
    ban_policy,
    expires_at,
    save_ban_policy,
)
from mailing.models import ContactIpBlock


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def contact_ip_blocks_view(request):
    rows = active_blocked_rows()
    policy = ban_policy()
    data = []
    for row in rows:
        until = expires_at(row)
        data.append(
            {
                "id": row.id,
                "ip_address": row.ip_address,
                "rejected_count": row.rejected_count,
                "blocked_at": row.blocked_at.isoformat() if row.blocked_at else None,
                "blocked_until": until.isoformat() if until else None,
                "permanent": until is None,
                "block_minutes": policy["minutes"] if policy["autoExpire"] else None,
            }
        )
    return Response({"ok": True, "settings": policy, "data": data})


@api_view(["GET", "PUT"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def contact_ip_ban_settings_view(request):
    if request.method == "GET":
        return Response({"ok": True, "data": ban_policy()})
    auto_expire = request.data.get("autoExpire")
    if not isinstance(auto_expire, bool):
        return Response({"detail": "autoExpire must be true or false."}, status=400)
    minutes = request.data.get("minutes", ban_policy()["minutes"])
    saved = save_ban_policy(auto_expire, minutes)
    return Response(
        {
            "ok": True,
            "detail": (
                f"Contact bans auto-expire after {saved['minutes']} minutes."
                if saved["autoExpire"]
                else "Contact bans stay until removed manually."
            ),
            "data": saved,
        }
    )


@api_view(["DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def contact_ip_block_delete_view(request, pk):
    row = ContactIpBlock.objects.filter(pk=pk, blocked_at__isnull=False).first()
    if not row:
        return Response({"detail": "Not found."}, status=404)
    ip = row.ip_address
    rule_id = row.cloudflare_rule_id
    row.delete()
    queue_lift(ip, rule_id if isinstance(rule_id, str) else None)
    return Response({"ok": True, "detail": "Contact form block removed."})


@api_view(["GET", "PUT"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def cloudflare_ip_block_setting_view(request):
    if request.method == "GET":
        return Response({"ok": True, "data": status_payload()})
    enabled_value = request.data.get("enabled")
    if not isinstance(enabled_value, bool):
        return Response({"detail": "enabled must be true or false."}, status=400)
    was_enabled = cloudflare_enabled()
    save_enabled(enabled_value)
    ready = cloudflare_configured()
    if enabled_value and not was_enabled and ready:
        queue_enforce_current()
    detail = "Site-wide IP block saved."
    if enabled_value and not ready:
        detail = (
            "Saved. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in the server "
            "env file before blocked IPs can be sent."
        )
    elif enabled_value and not was_enabled and ready:
        detail = "Saved. Current blocked IPs will be sent from the server."
    return Response({"ok": True, "detail": detail, "data": status_payload()})

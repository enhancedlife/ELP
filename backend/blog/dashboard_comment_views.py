from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from dashboard.permissions import DashboardAccess
from dashboard.views import _truthy_query_param, require_full_admin

from .comment_serializers import BlogCommentDashboardSerializer
from .models import BlogComment


def _dashboard_qs(request):
    qs = BlogComment.objects.select_related("post", "author").order_by("-created_at")
    status_filter = (request.query_params.get("status") or "").strip().lower()
    if status_filter in (
        BlogComment.Status.PENDING,
        BlogComment.Status.APPROVED,
        BlogComment.Status.REJECTED,
    ):
        qs = qs.filter(status=status_filter)
    try:
        post_id = request.query_params.get("post_id")
        if post_id:
            qs = qs.filter(post_id=int(post_id))
    except (TypeError, ValueError):
        pass
    return qs


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def blog_comments_collection(request):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    qs = _dashboard_qs(request)
    try:
        limit = int(request.query_params.get("limit", "200"))
    except (TypeError, ValueError):
        limit = 200
    limit = max(1, min(limit, 500))
    if _truthy_query_param(request.query_params.get("count_only")):
        return Response(
            {
                "pending_count": BlogComment.objects.filter(
                    status=BlogComment.Status.PENDING
                ).count()
            }
        )
    items = qs[:limit]
    return Response(
        {
            "comments": BlogCommentDashboardSerializer(items, many=True).data,
            "pending_count": BlogComment.objects.filter(
                status=BlogComment.Status.PENDING
            ).count(),
        }
    )


@api_view(["GET", "PATCH", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def blog_comment_detail(request, pk: int):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    comment = get_object_or_404(
        BlogComment.objects.select_related("post", "author"),
        pk=pk,
    )
    if request.method == "GET":
        return Response(BlogCommentDashboardSerializer(comment).data)
    if request.method == "DELETE":
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    new_status = (request.data.get("status") or "").strip().lower()
    if new_status not in (
        BlogComment.Status.PENDING,
        BlogComment.Status.APPROVED,
        BlogComment.Status.REJECTED,
    ):
        return Response(
            {"detail": "status must be pending, approved, or rejected."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    comment.status = new_status
    comment.save(update_fields=["status", "updated_at"])
    return Response(BlogCommentDashboardSerializer(comment).data)

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from common.soft_delete import soft_delete
from dashboard.permissions import DashboardAccess
from dashboard.views import _truthy_query_param, require_full_admin

from .models import BlogPost
from .serializers import BlogPostDashboardSerializer


def _dashboard_qs(request):
    qs = BlogPost.objects.all().order_by("-published_at", "sort_order")
    if _truthy_query_param(request.query_params.get("include_deleted")):
        return qs
    return qs.filter(deleted_at__isnull=True)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def blog_posts_collection(request):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    if request.method == "GET":
        qs = _dashboard_qs(request)
        if _truthy_query_param(request.query_params.get("featured_only")):
            qs = qs.filter(is_featured=True)
        return Response({"posts": BlogPostDashboardSerializer(qs, many=True).data})
    serializer = BlogPostDashboardSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def blog_post_detail(request, pk):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    post = get_object_or_404(BlogPost, pk=pk)
    if request.method == "GET":
        return Response(BlogPostDashboardSerializer(post).data)
    if request.method == "PATCH":
        serializer = BlogPostDashboardSerializer(post, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    soft_delete(post)
    return Response(status=status.HTTP_204_NO_CONTENT)

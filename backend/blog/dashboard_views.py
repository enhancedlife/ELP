from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from dashboard.permissions import DashboardAccess
from dashboard.views import _truthy_query_param, require_full_admin

from .image_utils import validate_thumbnail_upload
from .models import BlogPost
from .serializers import BlogPostDashboardSerializer


def _dashboard_qs(request):
    qs = BlogPost.objects.all().order_by("-published_at", "sort_order")
    listing = (request.query_params.get("listing") or "").strip().lower()
    if listing == "featured":
        qs = qs.filter(is_published=True, is_featured=True)
    elif listing in ("older", "archive"):
        qs = qs.filter(is_published=True, is_featured=False)
    elif listing == "draft":
        qs = qs.filter(is_published=False)
    elif _truthy_query_param(request.query_params.get("featured_only")):
        qs = qs.filter(is_featured=True)
    return qs


def _serialize_post(post, request):
    return BlogPostDashboardSerializer(post, context={"request": request}).data


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def blog_posts_collection(request):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    if request.method == "GET":
        qs = _dashboard_qs(request)
        return Response(
            {
                "posts": BlogPostDashboardSerializer(
                    qs, many=True, context={"request": request}
                ).data
            }
        )
    serializer = BlogPostDashboardSerializer(
        data=request.data, context={"request": request}
    )
    serializer.is_valid(raise_exception=True)
    post = serializer.save()
    return Response(_serialize_post(post, request), status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def blog_post_detail(request, pk):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    post = get_object_or_404(BlogPost, pk=pk)
    if request.method == "GET":
        return Response(_serialize_post(post, request))
    if request.method == "PATCH":
        serializer = BlogPostDashboardSerializer(
            post, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        return Response(_serialize_post(post, request))
    if request.method == "DELETE":
        if post.thumbnail:
            post.thumbnail.delete(save=False)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def blog_post_thumbnail(request, pk):
    """Upload or remove the card thumbnail image (multipart field name: thumbnail)."""
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    post = get_object_or_404(BlogPost, pk=pk)

    if request.method == "DELETE":
        if post.thumbnail:
            post.thumbnail.delete(save=True)
        else:
            post.save()
        return Response(_serialize_post(post, request))

    uploaded = request.FILES.get("thumbnail") or request.FILES.get("file")
    if not uploaded:
        return Response(
            {"detail": "Upload a file in the `thumbnail` field."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        validate_thumbnail_upload(uploaded)
    except ValidationError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    if post.thumbnail:
        post.thumbnail.delete(save=False)
    post.thumbnail = uploaded
    post.save(update_fields=["thumbnail"])
    return Response(_serialize_post(post, request))

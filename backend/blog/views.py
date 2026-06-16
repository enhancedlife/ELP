import math

from django.shortcuts import get_object_or_404
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import BlogPost
from .serializers import BlogPostDetailSerializer, BlogPostPublicSerializer


def _truthy(raw) -> bool:
    if raw is None:
        return False
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


def _published_qs(request=None):
    qs = BlogPost.objects.filter(is_published=True, deleted_at__isnull=True)
    user = getattr(request, "user", None) if request else None
    if user is not None and user.is_authenticated and user.is_active:
        return qs
    return qs.filter(is_public=True)


def _blog_listing_qs():
    """Published posts for public listings (drafts excluded). Archive = all of these; /blog = featured subset."""
    return BlogPost.objects.filter(is_published=True, deleted_at__isnull=True)


def _paginate_posts(request, qs, page_param="page", page_size_param="page_size", default_page_size=6):
    try:
        page = max(1, int(request.query_params.get(page_param, "1")))
    except ValueError:
        page = 1
    try:
        page_size = min(24, max(1, int(request.query_params.get(page_size_param, str(default_page_size)))))
    except ValueError:
        page_size = default_page_size

    qs = qs.order_by("-published_at", "sort_order")
    total = qs.count()
    total_pages = max(1, math.ceil(total / page_size)) if total else 1
    page = min(page, total_pages)
    start = (page - 1) * page_size
    items = qs[start : start + page_size]

    return Response(
        {
            "count": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "results": BlogPostPublicSerializer(items, many=True, context={"request": request}).data,
        }
    )


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def blog_posts_list(request):
    """
    GET /api/blog/posts
    ?featured=1 — main /blog grid (published featured, max 6)
    ?archived=1&page=1&page_size=6 — older posts (/blog/archive): all published posts incl. featured
    ?page=1&page_size=6 — legacy non-featured pagination

    Drafts and admin-archived (soft-deleted) posts are never listed publicly.
    """
    if _truthy(request.query_params.get("featured")):
        qs = (
            _blog_listing_qs()
            .filter(is_featured=True)
            .order_by("sort_order", "-published_at")[:6]
        )
        return Response(
            BlogPostPublicSerializer(qs, many=True, context={"request": request}).data
        )

    if _truthy(request.query_params.get("archived")):
        return _paginate_posts(request, _blog_listing_qs())

    qs = _published_qs(request).order_by("-published_at", "sort_order")
    if not _truthy(request.query_params.get("include_featured")):
        qs = qs.filter(is_featured=False)

    try:
        page = max(1, int(request.query_params.get("page", "1")))
    except ValueError:
        page = 1
    try:
        page_size = min(24, max(1, int(request.query_params.get("page_size", "6"))))
    except ValueError:
        page_size = 6

    total = qs.count()
    total_pages = max(1, math.ceil(total / page_size)) if total else 1
    page = min(page, total_pages)
    start = (page - 1) * page_size
    items = qs[start : start + page_size]

    return Response(
        {
            "count": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "results": BlogPostPublicSerializer(items, many=True, context={"request": request}).data,
        }
    )


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def blog_post_by_slug(request, slug: str):
    post = get_object_or_404(
        BlogPost,
        slug=slug,
        is_published=True,
        deleted_at__isnull=True,
    )
    user = getattr(request, "user", None)
    if not post.is_public:
        if not user or not user.is_authenticated or not user.is_active:
            pass  # serializer strips body
    return Response(
        BlogPostDetailSerializer(post, context={"request": request}).data
    )

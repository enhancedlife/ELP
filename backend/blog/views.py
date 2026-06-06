import math

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import BlogPost
from .serializers import BlogPostDetailSerializer, BlogPostPublicSerializer


def _truthy(raw) -> bool:
    if raw is None:
        return False
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


def _published_qs():
    return BlogPost.objects.filter(is_published=True, deleted_at__isnull=True)


@api_view(["GET"])
def blog_posts_list(request):
    """
    GET /api/blog/posts
    ?featured=1 — main /blog grid (featured, max 6)
    ?page=1&page_size=6 — archive pagination (non-featured by default)
    ?include_featured=1 — archive includes featured posts too
    """
    if _truthy(request.query_params.get("featured")):
        qs = (
            _published_qs()
            .filter(is_featured=True)
            .order_by("sort_order", "-published_at")[:6]
        )
        return Response(BlogPostPublicSerializer(qs, many=True).data)

    try:
        page = max(1, int(request.query_params.get("page", "1")))
    except ValueError:
        page = 1
    try:
        page_size = min(24, max(1, int(request.query_params.get("page_size", "6"))))
    except ValueError:
        page_size = 6

    qs = _published_qs().order_by("-published_at", "sort_order")
    if not _truthy(request.query_params.get("include_featured")):
        qs = qs.filter(is_featured=False)

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
            "results": BlogPostPublicSerializer(items, many=True).data,
        }
    )


@api_view(["GET"])
def blog_post_by_slug(request, slug: str):
    post = get_object_or_404(
        BlogPost,
        slug=slug,
        is_published=True,
        deleted_at__isnull=True,
    )
    return Response(BlogPostDetailSerializer(post).data)

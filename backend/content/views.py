from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import LandingPage
from .serializers import LandingPageSerializer, LandingPageSummarySerializer


def _truthy_query_param(raw) -> bool:
    if raw is None:
        return False
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


def _sponsor_faq_header_filter():
    """
    Header “Sponsors' FAQ” submenu:
    - Explicit CMS flag faq_nav_group=sponsors, or
    - Slug ends with “-faq” (e.g. aquila-faq) with is_faq set — convention when the nav flag
      was not persisted yet.
    Does not match the main hub slug “faq”.
    """
    slug_convention = Q(slug__iendswith="-faq") & ~Q(slug__iexact="faq")
    return Q(faq_nav_group__iexact="sponsors") | slug_convention


@api_view(["GET"])
def landing_pages_list(request):
    """
    Public catalog of landing pages (for FAQ hub, etc.).
    Query: faq=1 — only is_faq pages.
    Query: faq_sponsors=1 — only pages shown under “Sponsors' FAQ” in the site header
    (is_faq + faq_nav_group=sponsors), ordered by faq_nav_order.
    Default: active, non-deleted only.
    """
    qs = LandingPage.objects.filter(is_active=True, deleted_at__isnull=True)
    if _truthy_query_param(request.query_params.get("faq_sponsors")):
        qs = qs.filter(is_faq=True).filter(_sponsor_faq_header_filter())
        qs = qs.order_by("faq_nav_order", "sort_order", "-updated_at")
    elif _truthy_query_param(request.query_params.get("faq")):
        qs = qs.filter(is_faq=True)
        qs = qs.order_by("sort_order", "-updated_at")
    else:
        qs = qs.order_by("sort_order", "-updated_at")
    return Response(LandingPageSummarySerializer(qs, many=True).data)


@api_view(["GET"])
def landing_page_by_slug(request, slug: str):
    page = get_object_or_404(
        LandingPage,
        slug=slug,
        is_active=True,
        deleted_at__isnull=True,
    )
    return Response(LandingPageSerializer(page).data)


from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import PartnersPageSettings, Sponsor
from .serializers import PartnersPageSettingsSerializer, SponsorSerializer


def _partners_page_or_default():
    obj, _ = PartnersPageSettings.objects.get_or_create(
        pk=1,
        defaults={
            "banner_kicker": "SPONSORS",
            "hero_title": "Your Enhanced Life Sponsors",
        },
    )
    return obj


@api_view(["GET"])
def sponsors_list(request):
    sponsors = (
        Sponsor.objects.filter(
            is_active=True,
            deleted_at__isnull=True,
        )
        .order_by("category", "sort_order", "-updated_at")
    )
    page = _partners_page_or_default()
    return Response(
        {
            "sponsors": SponsorSerializer(sponsors, many=True).data,
            "page": PartnersPageSettingsSerializer(page).data,
        }
    )

"""
URL configuration for theswolerepublic project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as media_serve

from blog.views import blog_post_by_slug, blog_posts_list
from content.views import landing_page_by_slug, landing_pages_list
from dashboard.views import backend_root, health, record_site_visit
from mailing.contact_views import contact_submit
from mailing.public_views import newsletter_subscribe, newsletter_unsubscribe
from sponsors.views import sponsors_list

urlpatterns = [
    path('', backend_root),
    path('admin/', admin.site.urls),
    path('api/health', health),
    path('api/analytics/visit', record_site_visit),
    path('api/auth/', include('dashboard.auth_urls')),
    path('api/portal/', include('dashboard.portal_urls')),
    path('api/landing-pages', landing_pages_list),
    path('api/landing-pages/<str:slug>', landing_page_by_slug),
    path('api/sponsors', sponsors_list),
    path('api/newsletter/subscribe', newsletter_subscribe),
    path('api/newsletter/unsubscribe', newsletter_unsubscribe),
    path('api/contact', contact_submit),
    path('api/blog/posts', blog_posts_list),
    path('api/blog/posts/<str:slug>', blog_post_by_slug),
    path('api/dashboard/', include('dashboard.urls')),
]

urlpatterns += [
    re_path(
        r"^media/(?P<path>.*)$",
        media_serve,
        {"document_root": settings.MEDIA_ROOT},
    ),
]

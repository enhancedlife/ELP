from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .comment_serializers import BlogCommentPublicSerializer
from .models import BlogComment, BlogPost


def _published_post(slug: str) -> BlogPost:
    return get_object_or_404(
        BlogPost,
        slug=slug,
        is_published=True,
        deleted_at__isnull=True,
    )


def _comments_visible_to_user(post: BlogPost, user):
    base = BlogComment.objects.filter(post=post).select_related("author")
    if user is not None and user.is_authenticated and user.is_active:
        return base.filter(Q(status=BlogComment.Status.APPROVED) | Q(author=user))
    return base.filter(status=BlogComment.Status.APPROVED)


def _normalize_body(raw) -> str:
    return (raw or "").strip()


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def blog_post_comments(request, slug: str):
    post = _published_post(slug)
    user = getattr(request, "user", None)

    if request.method == "GET":
        qs = _comments_visible_to_user(post, user).order_by("-created_at")
        data = BlogCommentPublicSerializer(
            qs, many=True, context={"request": request}
        ).data
        return Response({"comments": data})

    if not user or not user.is_authenticated or not user.is_active:
        return Response(
            {"detail": "Sign in to post a comment."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    body = _normalize_body(request.data.get("body"))
    if not body:
        return Response(
            {"detail": "Comment cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(body) > 2000:
        return Response(
            {"detail": "Comment must be 2000 characters or fewer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    comment = BlogComment.objects.create(
        post=post,
        author=user,
        body=body,
        status=BlogComment.Status.PENDING,
    )
    return Response(
        BlogCommentPublicSerializer(comment, context={"request": request}).data,
        status=status.HTTP_201_CREATED,
    )

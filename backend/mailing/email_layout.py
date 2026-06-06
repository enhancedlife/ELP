import html as html_module

from .default_layout import (
    DEFAULT_SYSTEM_EMAIL_TEMPLATE,
    PLACEHOLDER_BODY,
    PLACEHOLDER_TITLE,
)
from .layout_config import build_template_from_config, normalize_layout_config


def get_active_layout_html() -> str:
    from .models import SystemEmailLayout

    row = SystemEmailLayout.objects.order_by("pk").first()
    if row and row.layout_config:
        return build_template_from_config(normalize_layout_config(row.layout_config))
    if row and row.template_html.strip():
        return row.template_html.strip()
    return DEFAULT_SYSTEM_EMAIL_TEMPLATE


def looks_like_full_html_document(fragment: str) -> bool:
    t = (fragment or "").strip().lower()
    return t.startswith("<!doctype") or t.startswith("<html")


def render_email_layout(template_html: str, *, title: str, body_html: str) -> str:
    """
    Insert plain-text title (escaped) and trusted HTML body into the system layout.
    """
    tpl = template_html or ""
    safe_title = html_module.escape((title or "").strip() or " ")
    body = body_html or ""
    if PLACEHOLDER_TITLE not in tpl or PLACEHOLDER_BODY not in tpl:
        # Avoid broken sends if admin removed placeholders
        return tpl.replace(PLACEHOLDER_TITLE, safe_title).replace(PLACEHOLDER_BODY, body)
    return tpl.replace(PLACEHOLDER_TITLE, safe_title).replace(PLACEHOLDER_BODY, body)


def compose_broadcast_html(*, headline: str, subject: str, body_html: str) -> str:
    """
    Wrap inner HTML with the stored system layout unless body_html is already a full document.
    """
    inner = (body_html or "").strip()
    if not inner:
        inner = "<p></p>"
    if looks_like_full_html_document(inner):
        return inner
    line = (headline or "").strip() or (subject or "").strip() or " "
    return render_email_layout(get_active_layout_html(), title=line, body_html=inner)

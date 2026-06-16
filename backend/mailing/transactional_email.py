"""Branded transactional messages using the shared system email layout (header/footer)."""

from __future__ import annotations

import html as html_module

from .email_layout import compose_broadcast_html
from .layout_config import normalize_layout_config


def _active_layout_colors() -> dict[str, str]:
    from .models import SystemEmailLayout

    row = SystemEmailLayout.objects.order_by("pk").first()
    raw = row.layout_config if row and row.layout_config else None
    return normalize_layout_config(raw)


def _esc(value: str) -> str:
    return html_module.escape((value or "").strip())


def _inner_body_html(*, paragraphs: list[str], cta_href: str = "", cta_label: str = "") -> str:
    cfg = _active_layout_colors()
    text = _esc(cfg["body_text_color"])
    title = _esc(cfg["title_text_color"])
    accent = _esc(cfg["header_heading_color"])
    muted = "#9ca3af"

    parts: list[str] = []
    for i, para in enumerate(paragraphs):
        if not para.strip():
            continue
        style = f"margin:0 0 16px;color:{text};font-size:16px;line-height:1.7;"
        if i == 0:
            style = f"margin:0 0 20px;color:{title};font-size:16px;line-height:1.7;"
        parts.append(f'<p style="{style}">{_esc(para)}</p>')

    if cta_href and cta_label:
        parts.append(
            f'<p style="margin:28px 0;text-align:center;">'
            f'<a href="{_esc(cta_href)}" '
            f'style="display:inline-block;padding:12px 28px;background-color:{accent};'
            f'color:#0a0c0f;text-decoration:none;font-weight:600;font-size:16px;'
            f'border-radius:6px;">{_esc(cta_label)}</a></p>'
        )
        parts.append(
            f'<p style="margin:0 0 16px;color:{muted};font-size:14px;line-height:1.6;">'
            f"Or copy and paste this link into your browser:<br/>"
            f'<a href="{_esc(cta_href)}" style="color:{accent};word-break:break-all;">'
            f"{_esc(cta_href)}</a></p>"
        )

    return "\n".join(parts)


def _field_block(*, label: str, value: str, preformatted: bool = False) -> str:
    cfg = _active_layout_colors()
    text = _esc(cfg["body_text_color"])
    label_esc = _esc(label)
    value_esc = _esc(value)
    white_space = "white-space:pre-wrap;" if preformatted else ""
    return (
        f'<p style="margin:0 0 6px;font-size:13px;color:#9ca3af;text-transform:uppercase;'
        f'letter-spacing:0.04em;">{label_esc}</p>'
        f'<p style="margin:0 0 18px;color:{text};font-size:16px;line-height:1.7;{white_space}">'
        f"{value_esc}</p>"
    )


def _wrap_transactional(*, headline: str, inner_html: str) -> str:
    return compose_broadcast_html(
        headline=headline,
        subject=headline,
        body_html=inner_html,
    )


def build_contact_form_bodies(
    *,
    issue_label: str,
    name: str,
    email: str,
    message: str,
    sponsor_line: str = "",
    related_username: str = "",
) -> tuple[str, str]:
    """Plain text and full HTML for an inbound contact-form notification."""
    plain_lines = [
        "New message from the website contact form",
        "",
        f"Issue type: {issue_label}",
    ]
    if sponsor_line:
        plain_lines.append(sponsor_line)
    if related_username:
        plain_lines.append(f"Username (for this issue): {related_username}")
    plain_lines.extend(
        [
            "",
            f"Name: {name}",
            f"Email: {email}",
            "",
            "Message:",
            message,
            "",
            "---",
            f"Reply directly to this email to reach {email}.",
        ]
    )
    plain = "\n".join(plain_lines)

    inner_parts = [
        _field_block(label="Issue type", value=issue_label),
        _field_block(label="Name", value=name),
        _field_block(label="Email", value=email),
    ]
    if sponsor_line:
        inner_parts.append(_field_block(label="Sponsor", value=sponsor_line.replace("Sponsor: ", "", 1)))
    if related_username:
        inner_parts.append(_field_block(label="Username", value=related_username))
    inner_parts.append(_field_block(label="Message", value=message, preformatted=True))
    inner_parts.append(
        f'<p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.6;">'
        f"Reply directly to this email to reach {_esc(name)}.</p>"
    )
    inner = "\n".join(inner_parts)
    html = _wrap_transactional(headline=f"Contact: {issue_label}", inner_html=inner)
    return plain, html


def build_member_password_reset_bodies(*, reset_link: str) -> tuple[str, str]:
    """Plain text and full HTML for an eligible member password-reset email."""
    link = (reset_link or "").strip()
    plain = (
        "Hi,\n\n"
        "We received a request to reset your password for Your Enhanced Life. "
        "Open this link to choose a new password:\n\n"
        f"{link}\n\n"
        "If you did not request this, you can ignore this email.\n"
    )
    inner = _inner_body_html(
        paragraphs=[
            "Hi,",
            "We received a request to reset your password for Your Enhanced Life. "
            "Use the button below to choose a new password.",
            "If you did not request this, you can ignore this email.",
        ],
        cta_href=link,
        cta_label="Reset password",
    )
    html = _wrap_transactional(headline="Reset your password", inner_html=inner)
    return plain, html


def build_password_reset_notice_bodies(*, message: str) -> tuple[str, str]:
    """Plain text and full HTML for probe / notice emails (no reset link)."""
    msg = (message or "").strip()
    plain = f"Hi,\n\n{msg}\n"
    inner = _inner_body_html(paragraphs=["Hi,", msg])
    html = _wrap_transactional(headline="Password reset request", inner_html=inner)
    return plain, html

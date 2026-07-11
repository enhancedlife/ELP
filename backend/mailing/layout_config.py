"""Structured header/footer settings for system email layout."""

from __future__ import annotations

import html as html_module
import re
from copy import deepcopy
from typing import Any

from .default_layout import PLACEHOLDER_BODY, PLACEHOLDER_TITLE

HEX_COLOR_RE = re.compile(r"^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$")

DEFAULT_EMAIL_LAYOUT_CONFIG: dict[str, str] = {
    "header_bg_color": "#000000",
    "header_logo_url": "https://yourenhancedlife.com/logoYEL.png",
    "header_heading": "Your Enhanced Life",
    "header_heading_color": "#4ade80",
    "header_tagline": "Enhance. Optimize. Thrive.",
    "header_tagline_color": "#9ca3af",
    "footer_bg_color": "#000000",
    "footer_contact_email": "admin@yourenhancedlife.com",
    "footer_copyright": "© 2026 Your Enhanced Life. All rights reserved.",
    "footer_disclaimer": "Educational content only. Not medical advice.",
    "footer_site_url": "",
    "body_bg_color": "#111827",
    "body_text_color": "#d1d5db",
    "title_text_color": "#f9fafb",
    "outer_bg_color": "#ffffff",
}


def normalize_layout_config(raw: dict[str, Any] | None) -> dict[str, str]:
    out = deepcopy(DEFAULT_EMAIL_LAYOUT_CONFIG)
    if not raw:
        return out
    for key in DEFAULT_EMAIL_LAYOUT_CONFIG:
        val = raw.get(key)
        if val is None:
            continue
        out[key] = str(val).strip()
    if not out["footer_bg_color"]:
        out["footer_bg_color"] = out["header_bg_color"]
    return out


def validate_hex_color(value: str, field_name: str) -> str:
    v = (value or "").strip()
    if not v:
        raise ValueError(f"{field_name} is required.")
    if not HEX_COLOR_RE.match(v):
        raise ValueError(f"{field_name} must be a hex color (e.g. #0a0c0f).")
    return v


def validate_layout_config(raw: dict[str, Any] | None) -> dict[str, str]:
    cfg = normalize_layout_config(raw)
    for key in (
        "header_bg_color",
        "header_heading_color",
        "header_tagline_color",
        "footer_bg_color",
        "body_bg_color",
        "body_text_color",
        "title_text_color",
        "outer_bg_color",
    ):
        cfg[key] = validate_hex_color(cfg[key], key.replace("_", " "))
    if not cfg["header_heading"]:
        raise ValueError("Header heading is required.")
    if not cfg["footer_copyright"]:
        raise ValueError("Footer copyright line is required.")
    if not cfg["footer_disclaimer"]:
        raise ValueError("Footer disclaimer is required.")
    logo = cfg["header_logo_url"]
    if logo and not (logo.startswith("http://") or logo.startswith("https://") or logo.startswith("/")):
        raise ValueError("Logo URL must be http(s) or a site path starting with /.")
    return cfg


def _esc(value: str) -> str:
    return html_module.escape((value or "").strip())


def _bg_attrs(color: str) -> str:
    """bgcolor + inline style — required for Outlook, Apple Mail, and many web clients."""
    c = _esc(color)
    return f'bgcolor="{c}" style="background-color:{c};"'


def _section_wrapper(
    bg_color: str,
    inner: str,
    *,
    padding: str,
    align: str = "center",
    text_color: str | None = None,
) -> str:
    """Nested tables so background fills reliably in Outlook and Gmail."""
    c = _esc(bg_color)
    bg_style = f"background-color:{c};"
    color_style = f"color:{text_color};" if text_color else ""
    cell_style = f"{bg_style}{color_style}padding:{padding};"
    return (
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" '
        f'bgcolor="{c}" style="{bg_style}">'
        f'<tr><td align="{align}" valign="top" bgcolor="{c}" style="{cell_style}">{inner}</td></tr>'
        f"</table>"
    )


def build_template_from_config(config: dict[str, str] | None) -> str:
    cfg = normalize_layout_config(config)
    logo = cfg["header_logo_url"].strip()
    heading = _esc(cfg["header_heading"])
    tagline = cfg["header_tagline"].strip()
    tagline_esc = _esc(tagline)
    alt_parts = [cfg["header_heading"].strip()]
    if tagline:
        alt_parts.append(tagline)
    logo_alt = _esc(" — ".join(alt_parts))

    if logo:
        header_block = (
            f'<img src="{_esc(logo)}" alt="{logo_alt}" width="520" '
            f'style="max-width:100%;width:520px;height:auto;margin:0 auto;display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />'
        )
    else:
        tagline_block = ""
        if tagline:
            tagline_block = (
                f'<p style="color:{_esc(cfg["header_tagline_color"])};margin:12px 0 0;'
                f'font-size:15px;line-height:1.5;">{tagline_esc}</p>'
            )
        header_block = (
            f'<h1 style="color:{_esc(cfg["header_heading_color"])};margin:0;font-size:26px;'
            f'font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">{heading}</h1>'
            f"{tagline_block}"
        )

    outer = _esc(cfg["outer_bg_color"])
    header_bg = _esc(cfg["header_bg_color"])
    body_bg = _esc(cfg["body_bg_color"])
    footer_bg = _esc(cfg["footer_bg_color"])
    body_text = _esc(cfg["body_text_color"])
    title_text = _esc(cfg["title_text_color"])
    accent = _esc(cfg["header_heading_color"])
    section_border = "1px solid #333333"
    outer_bg = _bg_attrs(outer)
    card_bg = _bg_attrs(body_bg)

    body_content = (
        f'<div class="email-body" style="color:{body_text};font-size:16px;line-height:1.7;">'
        f'<h2 style="margin:0 0 20px;color:{title_text};font-size:22px;line-height:1.35;">'
        f"{PLACEHOLDER_TITLE}"
        f"</h2>"
        f'<div class="email-body-inner" style="color:{body_text};font-size:16px;line-height:1.7;">'
        f"{PLACEHOLDER_BODY}"
        f"</div>"
        f"</div>"
    )
    header_inner = _section_wrapper(header_bg, header_block, padding="28px 24px", align="center")
    body_inner = _section_wrapper(
        body_bg,
        body_content,
        padding="28px 24px",
        align="left",
        text_color=body_text,
    )
    footer_inner = _section_wrapper(
        footer_bg,
        (
            f'<p style="margin:0 0 8px;font-size:13px;color:#9ca3af;line-height:1.6;">'
            f'{_esc(cfg["footer_copyright"])}</p>'
            f'<p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">'
            f'{_esc(cfg["footer_disclaimer"])}</p>'
        ),
        padding="22px 24px",
        align="center",
    )

    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>{_esc(cfg["header_heading"])}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, p, a, li, blockquote {{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
    table, td {{ mso-table-lspace:0pt; mso-table-rspace:0pt; }}
    img {{ -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }}
    table {{ border-collapse:collapse !important; }}
    body {{ margin:0 !important; padding:0 !important; width:100% !important; }}
    .email-body, .email-body p, .email-body li, .email-body span, .email-body td, .email-body div {{
      color:{body_text} !important;
    }}
    .email-body h1, .email-body h2, .email-body h3, .email-body h4 {{
      color:{title_text} !important;
    }}
    .email-body a {{ color:{accent} !important; }}
  </style>
</head>
<body {outer_bg} style="margin:0;padding:0;width:100% !important;background-color:{outer};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" {outer_bg}>
    <tr>
      <td align="center" valign="top" {outer_bg} style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" {card_bg} style="width:100%;max-width:600px;border-collapse:collapse;border:{section_border};">
          <tr>
            <td valign="top" {_bg_attrs(header_bg)} style="border-bottom:{section_border};">
              {header_inner}
            </td>
          </tr>
          <tr>
            <td valign="top" {_bg_attrs(body_bg)} style="color:{body_text};font-size:16px;line-height:1.7;border-bottom:{section_border};">
              {body_inner}
            </td>
          </tr>
          <tr>
            <td valign="top" {_bg_attrs(footer_bg)}>
              {footer_inner}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

"""Structured header/footer settings for system email layout."""

from __future__ import annotations

import html as html_module
import re
from copy import deepcopy
from typing import Any

from .default_layout import PLACEHOLDER_BODY, PLACEHOLDER_FOOTER_EXTRA, PLACEHOLDER_TITLE

HEX_COLOR_RE = re.compile(r"^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$")

DEFAULT_EMAIL_LAYOUT_CONFIG: dict[str, str] = {
    "header_bg_color": "#0a0c0f",
    "header_logo_url": "https://yourenhancedlife.com/logoYEL.png",
    "header_heading": "Your Enhanced Life",
    "header_heading_color": "#4ade80",
    "header_tagline": "Enhance. Optimize. Thrive.",
    "header_tagline_color": "#9ca3af",
    "footer_bg_color": "#0a0c0f",
    "footer_contact_email": "admin@yourenhancedlife.com",
    "footer_copyright": "© 2026 Your Enhanced Life. All rights reserved.",
    "footer_disclaimer": "Educational content only. Not medical advice.",
    "footer_site_url": "https://yourenhancedlife.com",
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
    email = cfg["footer_contact_email"]
    if not email or "@" not in email:
        raise ValueError("Footer contact email is invalid.")
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
    site_url = (cfg["footer_site_url"].strip() or "https://yourenhancedlife.com").rstrip("/")

    if logo:
        logo_img = (
            f'<img src="{_esc(logo)}" alt="{logo_alt}" width="520" '
            f'style="max-width:100%;width:520px;height:auto;margin:0 auto;display:block;border:0;" />'
        )
        header_block = (
            f'<a href="{_esc(site_url)}" style="text-decoration:none;display:inline-block;">'
            f"{logo_img}</a>"
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

    site_link = ""
    footer_site = cfg["footer_site_url"].strip()
    if footer_site:
        site_link = (
            f'<p style="margin:8px 0;">'
            f'<a href="{_esc(footer_site)}" style="color:{_esc(cfg["header_heading_color"])};'
            f'text-decoration:none;">{_esc(footer_site.replace("https://", "").replace("http://", ""))}</a>'
            f"</p>"
        )
    contact = _esc(cfg["footer_contact_email"])
    outer = _esc(cfg["outer_bg_color"])
    header_bg = _esc(cfg["header_bg_color"])
    body_bg = _esc(cfg["body_bg_color"])
    footer_bg = _esc(cfg["footer_bg_color"])
    section_border = "1px solid rgba(255,255,255,0.12)"
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{_esc(cfg["header_heading"])}</title>
</head>
<body style="margin:0;padding:0;background-color:{outer};font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:{outer};">
    <tr>
      <td align="center" style="padding:32px 16px;background-color:{outer};">
        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;border:{section_border};border-radius:12px;overflow:hidden;background-color:{body_bg};">
          <tr>
            <td style="background-color:{header_bg};padding:28px 24px;text-align:center;border-bottom:{section_border};">
              {header_block}
            </td>
          </tr>
          <tr>
            <td style="background-color:{body_bg};padding:28px 24px;color:{_esc(cfg["body_text_color"])};font-size:16px;line-height:1.7;border-bottom:{section_border};">
              <h2 style="margin:0 0 20px;color:{_esc(cfg["title_text_color"])};font-size:22px;line-height:1.35;">
                {PLACEHOLDER_TITLE}
              </h2>
              {PLACEHOLDER_BODY}
            </td>
          </tr>
          <tr>
            <td style="background-color:{footer_bg};padding:22px 24px;text-align:center;color:#9ca3af;font-size:14px;line-height:1.6;">
              {site_link}
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">{_esc(cfg["footer_copyright"])}</p>
              <p style="margin:0 0 10px;font-size:12px;color:#6b7280;">{_esc(cfg["footer_disclaimer"])}</p>
              <p style="margin:0;">
                <a href="mailto:{contact}" style="color:{_esc(cfg["header_heading_color"])};text-decoration:none;">{contact}</a>
              </p>
              {PLACEHOLDER_FOOTER_EXTRA}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

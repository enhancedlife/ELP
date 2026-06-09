"""Default HTML layout for marketing/broadcast email; includes {{email_title}} and {{email_body}}."""

DEFAULT_SYSTEM_EMAIL_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>The Swole Republic</title>
  <style>
    body, table, td, p, a, h1, h2 {
      font-family: Garamond, "Times New Roman", Times, serif !important;
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F9F9F9; font-family:Garamond, 'Times New Roman', Times, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
          <tr>
            <td style="background-color:#002366; padding:35px; text-align:center;">
              <h1 style="color:#D9CDB8; margin:0; font-size:30px; letter-spacing:1px;">
                The Swole Republic
              </h1>
              <p style="color:#D9CDB8; margin:12px 0 0; font-size:16px;">
                Strength • Discipline • Performance
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px; color:#1A1A1A; font-size:16px; line-height:1.7;">
              <h2 style="margin-top:0; font-size:22px;">
                {{email_title}}
              </h2>
              {{email_body}}
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:25px 0;">
                <tr>
                  <td align="center" bgcolor="#002366" style="border-radius:6px;">
                    <a href="https://theswolerepublic.com"
                       style="display:inline-block; padding:12px 28px; color:#D9CDB8; text-decoration:none; font-size:16px;">
                      Visit Website
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#002366; padding:22px; text-align:center; color:#D9CDB8; font-size:14px;">
              <p style="margin:0;"><strong>The Swole Republic</strong></p>
              <p style="margin:6px 0;">
                <a href="https://theswolerepublic.com" style="color:#D9CDB8; text-decoration:none;">
                  theswolerepublic.com
                </a>
              </p>
              <p style="margin:6px 0;">
                <a href="mailto:admin@yourenhancedlife.com" style="color:#D9CDB8; text-decoration:none;">
                  admin@yourenhancedlife.com
                </a>
              </p>
              <p style="margin-top:10px; font-size:12px;">
                © 2026 The Swole Republic. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

PLACEHOLDER_TITLE = "{{email_title}}"
PLACEHOLDER_BODY = "{{email_body}}"

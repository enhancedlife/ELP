export type EmailLayoutConfig = {
	header_bg_color: string;
	header_logo_url: string;
	header_heading: string;
	header_heading_color: string;
	header_tagline: string;
	header_tagline_color: string;
	footer_bg_color: string;
	footer_contact_email: string;
	footer_copyright: string;
	footer_disclaimer: string;
	footer_site_url: string;
	body_bg_color: string;
	body_text_color: string;
	title_text_color: string;
	outer_bg_color: string;
};

export const DEFAULT_EMAIL_LAYOUT_CONFIG: EmailLayoutConfig = {
	header_bg_color: "#0a0c0f",
	header_logo_url: "https://yourenhancedlife.com/logoYEL.png",
	header_heading: "Your Enhanced Life",
	header_heading_color: "#4ade80",
	header_tagline: "Enhance. Optimize. Thrive.",
	header_tagline_color: "#9ca3af",
	footer_bg_color: "#0a0c0f",
	footer_contact_email: "admin@yourenhancedlife.com",
	footer_copyright: "© 2026 Your Enhanced Life. All rights reserved.",
	footer_disclaimer: "Educational content only. Not medical advice.",
	footer_site_url: "",
	body_bg_color: "#111827",
	body_text_color: "#d1d5db",
	title_text_color: "#f9fafb",
	outer_bg_color: "#ffffff",
};

export function normalizeEmailLayoutConfig(
	raw: Partial<EmailLayoutConfig> | null | undefined,
): EmailLayoutConfig {
	const out = { ...DEFAULT_EMAIL_LAYOUT_CONFIG };
	if (!raw) return out;
	for (const key of Object.keys(DEFAULT_EMAIL_LAYOUT_CONFIG) as (keyof EmailLayoutConfig)[]) {
		const val = raw[key];
		if (val !== undefined && val !== null) {
			out[key] = String(val).trim();
		}
	}
	if (!out.footer_bg_color) {
		out.footer_bg_color = out.header_bg_color;
	}
	return out;
}

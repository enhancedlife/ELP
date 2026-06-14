import type { Metadata } from "next";
import type { SiteBranding } from "@/lib/types";

export const DEFAULT_SITE_NAME = "Your Enhanced Life";
export const FALLBACK_LOGO_URL = "/logoYEL.png";
export const FALLBACK_FAVICON_URL = "/siteIconYEL.png";

export function siteDisplayName(branding?: SiteBranding | null): string {
	const name = branding?.site_name?.trim();
	return name || DEFAULT_SITE_NAME;
}

/** Custom upload from dashboard, otherwise bundled default logo. */
export function resolveLogoUrl(branding?: SiteBranding | null): string {
	const custom = branding?.logo_url?.trim();
	return custom || FALLBACK_LOGO_URL;
}

export function hasCustomLogo(branding?: SiteBranding | null): boolean {
	return Boolean(branding?.logo_url?.trim());
}

/** Custom upload from dashboard, otherwise bundled default favicon. */
export function resolveFaviconUrl(branding?: SiteBranding | null): string {
	const custom = branding?.favicon_url?.trim();
	return custom || FALLBACK_FAVICON_URL;
}

export function hasCustomFavicon(branding?: SiteBranding | null): boolean {
	return Boolean(branding?.favicon_url?.trim());
}

function faviconHref(branding?: SiteBranding | null): string {
	const favicon = resolveFaviconUrl(branding);
	if (!branding?.updated_at) return favicon;
	const sep = favicon.includes("?") ? "&" : "?";
	return `${favicon}${sep}v=${encodeURIComponent(branding.updated_at)}`;
}

export function brandingMetadataIcons(
	branding?: SiteBranding | null,
): NonNullable<Metadata["icons"]> {
	const href = faviconHref(branding);
	return {
		icon: [
			{ url: href, sizes: "32x32", type: "image/png" },
			{ url: href, sizes: "192x192", type: "image/png" },
		],
		apple: [{ url: href, sizes: "180x180", type: "image/png" }],
		shortcut: href,
	};
}

export async function fetchSiteBranding(): Promise<SiteBranding> {
	try {
		const res = await fetch("/api/site-branding", {
			method: "GET",
			headers: { Accept: "application/json" },
			next: { revalidate: 60 },
		});
		if (!res.ok) {
			return { site_name: DEFAULT_SITE_NAME, logo_url: "", favicon_url: "" };
		}
		const data = (await res.json()) as SiteBranding;
		return {
			site_name: data.site_name || DEFAULT_SITE_NAME,
			logo_url: data.logo_url || "",
			favicon_url: data.favicon_url || "",
			updated_at: data.updated_at,
		};
	} catch {
		return { site_name: DEFAULT_SITE_NAME, logo_url: "", favicon_url: "" };
	}
}

/** Server-side fetch using BACKEND_URL (SSR / generateMetadata). */
export async function fetchSiteBrandingServer(): Promise<SiteBranding> {
	const raw =
		process.env.BACKEND_URL ||
		process.env.API_REWRITE_TARGET ||
		"http://127.0.0.1:8000";
	const origin = raw
		.replace(/\/$/, "")
		.replace(/(^https?:\/\/)localhost\b/i, (_, scheme: string) => `${scheme}127.0.0.1`);
	try {
		const res = await fetch(`${origin}/api/site-branding`, {
			method: "GET",
			headers: { Accept: "application/json" },
			next: { revalidate: 60 },
		});
		if (!res.ok) {
			return { site_name: DEFAULT_SITE_NAME, logo_url: "", favicon_url: "" };
		}
		const data = (await res.json()) as SiteBranding;
		return {
			site_name: data.site_name || DEFAULT_SITE_NAME,
			logo_url: data.logo_url || "",
			favicon_url: data.favicon_url || "",
			updated_at: data.updated_at,
		};
	} catch {
		return { site_name: DEFAULT_SITE_NAME, logo_url: "", favicon_url: "" };
	}
}

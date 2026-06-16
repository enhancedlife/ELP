import { dashboardClientFetchUrl } from "@/lib/backend-public";
import {
	dashboardAuthHeaders,
	dashboardAuthHeadersJson,
} from "@/lib/auth";
import type { LandingPageRecord, PartnersPageSettings, BlogPostRecord, SiteBranding } from "@/lib/types";
import type {
	DashboardAnalyticsResponse,
	DashboardBlogComment,
	DashboardBlogCommentsResponse,
	DashboardBlogPostsResponse,
	DashboardCalendarResponse,
	DashboardConversationDetailResponse,
	DashboardDatabaseBackupInfo,
	DashboardDatabaseImportResult,
	DashboardEmailBroadcast,
	DashboardEmailBroadcastRecipient,
	DashboardEmailBroadcastRecipientsResponse,
	DashboardEmailBroadcastsResponse,
	DashboardEmailDeliveryStatus,
	DashboardEmailSendLogsResponse,
	DashboardSmtpProfile,
	DashboardSmtpProfilesResponse,
	DashboardLandingPagesResponse,
	DashboardMessagesInboxResponse,
	DashboardNewsletterSubscriber,
	DashboardNewsletterSubscribersResponse,
	DashboardNotificationsResponse,
	DashboardNotificationPrefsResponse,
	DashboardOverviewResponse,
	DashboardProjectsResponse,
	DashboardSponsorsResponse,
	DashboardSystemEmailLayout,
	DashboardUserDetail,
	DashboardUserRow,
	DashboardUsersBulkResult,
	DashboardUsersResponse,
} from "@/lib/types/dashboard";

export type DashboardJsonResult<T> = {
	ok: boolean;
	data: T | null;
	/** HTTP status from BFF, or null if the request failed before a response (network/CORS). */
	status: number | null;
	/** Set by `mutateDashboardJson` when the API returns an error body. */
	errorMessage?: string | null;
};

async function fetchDashboardJson<T>(path: string): Promise<DashboardJsonResult<T>> {
	try {
		const res = await fetch(dashboardClientFetchUrl(path), {
			method: "GET",
			headers: dashboardAuthHeaders(),
			cache: "no-store",
		});
		const text = await res.text();
		if (!res.ok) {
			return {
				ok: false,
				data: null,
				status: res.status,
				errorMessage: parseDashboardApiErrorText(text),
			};
		}
		if (!text) {
			return { ok: true, data: null as T, status: res.status };
		}
		return { ok: true, data: JSON.parse(text) as T, status: res.status };
	} catch {
		return { ok: false, data: null, status: null };
	}
}

/** Shown when `fetchDashboardJson` returns `ok: false`. */
export function describeDashboardFetchFailure(
	status: number | null,
	apiDetail?: string | null,
): string {
	let base: string;
	if (status == null) {
		base =
			"Could not reach the dashboard API. Start Django on port 8000 and set BACKEND_URL (or API_REWRITE_TARGET) on Next.js so the server can reach it (e.g. http://127.0.0.1:8000).";
	} else if (status === 401 || status === 403) {
		base =
			"Access denied. Sign in with a superuser at /auth/admin/login, or set the same DASHBOARD_SERVER_SECRET in root .env for frontend and backend.";
	} else if (status === 500) {
		base =
			"Dashboard API error (HTTP 500). Check backend logs: docker compose logs backend --tail=100";
	} else {
		base = `Dashboard API returned HTTP ${status}. See backend logs for details.`;
	}
	const extra = apiDetail?.trim();
	if (!extra || base.includes(extra)) return base;
	return `${base} ${extra}`;
}

/** Extract human-readable message from Django/DRF JSON error bodies. */
export function parseDashboardApiErrorText(text: string): string | null {
	const raw = text.trim();
	if (!raw) return null;
	try {
		const j = JSON.parse(raw) as {
			detail?: unknown;
			message?: unknown;
			error?: unknown;
		};
		const pick = j.detail ?? j.message ?? j.error;
		if (typeof pick === "string" && pick.trim()) return pick.trim();
		if (Array.isArray(pick)) {
			const parts = pick.map((item) => {
				if (typeof item === "string") return item;
				if (item && typeof item === "object" && "string" in item) {
					const s = (item as { string?: unknown }).string;
					if (typeof s === "string") return s;
				}
				return JSON.stringify(item);
			});
			const joined = parts.join("; ").trim();
			return joined || null;
		}
		if (pick && typeof pick === "object") {
			return JSON.stringify(pick);
		}
	} catch {
		/* not JSON */
	}
	return raw.length > 2000 ? `${raw.slice(0, 2000)}…` : raw;
}

export async function mutateDashboardJson<T>(
	method: "POST" | "PATCH" | "DELETE",
	path: string,
	body?: Record<string, unknown>,
): Promise<DashboardJsonResult<T>> {
	try {
		const res = await fetch(dashboardClientFetchUrl(path), {
			method,
			headers: dashboardAuthHeadersJson(),
			body: body != null ? JSON.stringify(body) : undefined,
			cache: "no-store",
		});
		const text = await res.text();
		if (!res.ok) {
			const detail = parseDashboardApiErrorText(text);
			return {
				ok: false,
				data: null,
				status: res.status,
				errorMessage: detail,
			};
		}
		if (method === "DELETE" && res.status === 204) {
			return { ok: true, data: null as T, status: res.status, errorMessage: null };
		}
		if (!text) {
			return { ok: true, data: null as T, status: res.status, errorMessage: null };
		}
		try {
			return {
				ok: true,
				data: JSON.parse(text) as T,
				status: res.status,
				errorMessage: null,
			};
		} catch {
			return { ok: true, data: null as T, status: res.status, errorMessage: null };
		}
	} catch {
		return {
			ok: false,
			data: null,
			status: null,
			errorMessage: "Network error — could not reach the dashboard API.",
		};
	}
}

export function getDashboardOverview() {
	return fetchDashboardJson<DashboardOverviewResponse>("overview");
}

export function getDashboardAnalytics() {
	return fetchDashboardJson<DashboardAnalyticsResponse>("analytics");
}

export function getDashboardUsers(limit = 5000, options?: { trash?: boolean }) {
	const params = new URLSearchParams();
	if (limit > 0) params.set("limit", String(limit));
	if (options?.trash) params.set("trash", "1");
	const q = params.toString() ? `?${params.toString()}` : "";
	return fetchDashboardJson<DashboardUsersResponse>(`users${q}`);
}

export function getDashboardUser(id: number) {
	return fetchDashboardJson<DashboardUserDetail>(`users/${id}`);
}

export function getDashboardProjects() {
	return fetchDashboardJson<DashboardProjectsResponse>("projects");
}

export function getDashboardSponsors(includeDeleted?: boolean) {
	const q = includeDeleted === true ? "?include_deleted=1" : "";
	return fetchDashboardJson<DashboardSponsorsResponse>(`sponsors${q}`);
}

export function getDashboardPartnersPage() {
	return fetchDashboardJson<PartnersPageSettings>("partners-page");
}

export function patchDashboardPartnersPage(payload: Record<string, unknown>) {
	return mutateDashboardJson<PartnersPageSettings>("PATCH", "partners-page", payload);
}

export function getDashboardMessagesInbox() {
	return fetchDashboardJson<DashboardMessagesInboxResponse>("messages");
}

export function getDashboardConversation(conversationId: number) {
	return fetchDashboardJson<DashboardConversationDetailResponse>(
		`messages/${conversationId}`,
	);
}

export function postDashboardNewConversation(payload: {
	subject?: string;
	body: string;
	author_label?: string;
}) {
	return mutateDashboardJson<{ id: number; subject: string }>("POST", "messages", payload);
}

export function postDashboardConversationReply(
	conversationId: number,
	payload: { body: string; author_label?: string },
) {
	return mutateDashboardJson<DashboardConversationDetailResponse>(
		"POST",
		`messages/${conversationId}`,
		payload,
	);
}

export function deleteDashboardConversation(conversationId: number) {
	return mutateDashboardJson<null>("DELETE", `messages/${conversationId}`);
}

export function deleteDashboardMessage(
	conversationId: number,
	messageId: number,
) {
	return mutateDashboardJson<null>(
		"DELETE",
		`messages/${conversationId}/items/${messageId}`,
	);
}

export function getDashboardNotifications() {
	return fetchDashboardJson<DashboardNotificationsResponse>("notifications");
}

export function patchDashboardNotification(
	id: number,
	payload: { is_read?: boolean; deleted_at?: null },
) {
	return mutateDashboardJson<{ id: number; is_read: boolean }>(
		"PATCH",
		`notifications/${id}`,
		payload,
	);
}

export function deleteDashboardNotification(id: number) {
	return mutateDashboardJson<null>("DELETE", `notifications/${id}`);
}

export function postDashboardNotification(payload: {
	title: string;
	body?: string;
	category?: string;
	link_url?: string;
}) {
	return mutateDashboardJson<{ id: number }>("POST", "notifications", payload);
}

export function getDashboardCalendar() {
	return fetchDashboardJson<DashboardCalendarResponse>("calendar");
}

export function getDashboardLandingPages(options?: {
	faqOnly?: boolean;
	includeDeleted?: boolean;
}) {
	const params = new URLSearchParams();
	if (options?.faqOnly === true) params.set("faq", "1");
	if (options?.includeDeleted === true) params.set("include_deleted", "1");
	const q = params.toString();
	return fetchDashboardJson<DashboardLandingPagesResponse>(
		q ? `landing-pages?${q}` : "landing-pages",
	);
}

export function postDashboardLandingPage(
	body: Partial<LandingPageRecord> & { slug: string; title: string },
) {
	return mutateDashboardJson<LandingPageRecord>(
		"POST",
		"landing-pages",
		body as Record<string, unknown>,
	);
}

export function patchDashboardLandingPage(
	id: number,
	body: Partial<LandingPageRecord>,
) {
	return mutateDashboardJson<LandingPageRecord>(
		"PATCH",
		`landing-pages/${id}`,
		body as Record<string, unknown>,
	);
}

export function deleteDashboardLandingPage(id: number) {
	return mutateDashboardJson<null>("DELETE", `landing-pages/${id}`);
}

export type DashboardBlogListingFilter = "all" | "featured" | "older" | "draft";

export function getDashboardBlogPosts(options?: {
	featuredOnly?: boolean;
	listing?: DashboardBlogListingFilter;
}) {
	const params = new URLSearchParams();
	if (options?.listing && options.listing !== "all") {
		params.set("listing", options.listing);
	} else if (options?.featuredOnly === true) {
		params.set("featured_only", "1");
	}
	const q = params.toString();
	return fetchDashboardJson<DashboardBlogPostsResponse>(
		q ? `blog-posts?${q}` : "blog-posts",
	);
}

export function postDashboardBlogPost(
	body: Partial<BlogPostRecord> & { slug: string; title: string; excerpt: string },
) {
	return mutateDashboardJson<BlogPostRecord>(
		"POST",
		"blog-posts",
		body as Record<string, unknown>,
	);
}

export function patchDashboardBlogPost(id: number, body: Partial<BlogPostRecord>) {
	return mutateDashboardJson<BlogPostRecord>(
		"PATCH",
		`blog-posts/${id}`,
		body as Record<string, unknown>,
	);
}

export function deleteDashboardBlogPost(id: number) {
	return mutateDashboardJson<null>("DELETE", `blog-posts/${id}`);
}

export async function uploadDashboardBlogPostThumbnail(
	id: number,
	file: File,
): Promise<DashboardJsonResult<BlogPostRecord>> {
	try {
		const form = new FormData();
		form.append("thumbnail", file);
		const res = await fetch(dashboardClientFetchUrl(`blog-posts/${id}/thumbnail`), {
			method: "POST",
			headers: dashboardAuthHeaders(),
			body: form,
			cache: "no-store",
		});
		const text = await res.text();
		if (!res.ok) {
			return {
				ok: false,
				data: null,
				status: res.status,
				errorMessage: parseDashboardApiErrorText(text),
			};
		}
		return {
			ok: true,
			data: JSON.parse(text) as BlogPostRecord,
			status: res.status,
		};
	} catch {
		return { ok: false, data: null, status: null };
	}
}

export function deleteDashboardBlogPostThumbnail(id: number) {
	return mutateDashboardJson<BlogPostRecord>("DELETE", `blog-posts/${id}/thumbnail`);
}

export function getDashboardNewsletterSubscribers(includeDeleted?: boolean) {
	const q = includeDeleted === true ? "?include_deleted=1" : "";
	return fetchDashboardJson<DashboardNewsletterSubscribersResponse>(
		`email/subscribers${q}`,
	);
}

export function postDashboardNewsletterSubscriber(body: {
	email: string;
	name?: string;
}) {
	return mutateDashboardJson<DashboardNewsletterSubscriber>(
		"POST",
		"email/subscribers",
		body as Record<string, unknown>,
	);
}

export function patchDashboardNewsletterSubscriber(
	id: number,
	body: Partial<Pick<DashboardNewsletterSubscriber, "name" | "is_subscribed" | "deleted_at">>,
) {
	return mutateDashboardJson<DashboardNewsletterSubscriber>(
		"PATCH",
		`email/subscribers/${id}`,
		body as Record<string, unknown>,
	);
}

export function deleteDashboardNewsletterSubscriber(id: number) {
	return mutateDashboardJson<null>("DELETE", `email/subscribers/${id}`);
}

export function getDashboardEmailBroadcasts() {
	return fetchDashboardJson<DashboardEmailBroadcastsResponse>("email/broadcasts");
}

export function getDashboardEmailSendLogs(options?: {
	limit?: number;
	offset?: number;
	source?: string;
	success?: boolean | null;
}) {
	const params = new URLSearchParams();
	if (options?.limit != null) params.set("limit", String(options.limit));
	if (options?.offset != null) params.set("offset", String(options.offset));
	if (options?.source) params.set("source", options.source);
	if (options?.success === true) params.set("success", "1");
	if (options?.success === false) params.set("success", "0");
	const q = params.toString();
	return fetchDashboardJson<DashboardEmailSendLogsResponse>(
		q ? `email/send-logs?${q}` : "email/send-logs",
	);
}

export function getDashboardEmailTemplate() {
	return fetchDashboardJson<DashboardSystemEmailLayout>("email/template");
}

export function getDashboardEmailDeliveryStatus() {
	return fetchDashboardJson<DashboardEmailDeliveryStatus>("email/delivery-status");
}

export function getDashboardSmtpProfiles() {
	return fetchDashboardJson<DashboardSmtpProfilesResponse>("email/smtp-profiles");
}

export function postDashboardSmtpProfile(
	body: Partial<DashboardSmtpProfile> & {
		name: string;
		host: string;
		from_email: string;
	},
) {
	return mutateDashboardJson<DashboardSmtpProfile>(
		"POST",
		"email/smtp-profiles",
		body as Record<string, unknown>,
	);
}

export function patchDashboardSmtpProfile(
	id: number,
	body: Partial<DashboardSmtpProfile>,
) {
	return mutateDashboardJson<DashboardSmtpProfile>(
		"PATCH",
		`email/smtp-profiles/${id}`,
		body as Record<string, unknown>,
	);
}

export function deleteDashboardSmtpProfile(id: number) {
	return mutateDashboardJson<null>("DELETE", `email/smtp-profiles/${id}`);
}

export function postDashboardSmtpProfileActivate(id: number) {
	return mutateDashboardJson<DashboardSmtpProfile>(
		"POST",
		`email/smtp-profiles/${id}/activate`,
		{},
	);
}

export function postDashboardSmtpProfileTestSend(id: number, to: string) {
	return mutateDashboardJson<{ detail: string }>(
		"POST",
		`email/smtp-profiles/${id}/test-send`,
		{ to },
	);
}

export function postDashboardSmtpProfilesImportEnv() {
	return mutateDashboardJson<DashboardSmtpProfile>(
		"POST",
		"email/smtp-profiles/import-env",
		{},
	);
}

import type { EmailLayoutConfig } from "@/lib/email-layout-config";

export function patchDashboardEmailTemplate(body: { layout_config: EmailLayoutConfig }) {
	return mutateDashboardJson<DashboardSystemEmailLayout>(
		"PATCH",
		"email/template",
		body as Record<string, unknown>,
	);
}

export function postDashboardEmailTemplateTestSend(body: {
	to: string;
	subject?: string;
	headline?: string;
	body_html?: string;
	body_text?: string;
}) {
	return mutateDashboardJson<{ ok: boolean; to: string }>(
		"POST",
		"email/template/test-send",
		body as Record<string, unknown>,
	);
}

export function postDashboardEmailBroadcast(body: {
	subject: string;
	headline?: string;
	body_text: string;
	body_html?: string;
	audience?: "newsletter" | "all_site_users" | "selected_site_users" | "manual_emails";
	audience_user_ids?: number[];
	audience_emails?: string[];
}) {
	return mutateDashboardJson<DashboardEmailBroadcast>(
		"POST",
		"email/broadcasts",
		body as Record<string, unknown>,
	);
}

export function getDashboardEmailBroadcast(id: number) {
	return fetchDashboardJson<DashboardEmailBroadcast>(`email/broadcasts/${id}`);
}

export function patchDashboardEmailBroadcast(
	id: number,
	body: Partial<{
		subject: string;
		headline: string;
		body_text: string;
		body_html: string;
		audience: "newsletter" | "all_site_users" | "selected_site_users" | "manual_emails";
		audience_user_ids: number[];
		audience_emails: string[];
	}>,
) {
	return mutateDashboardJson<DashboardEmailBroadcast>(
		"PATCH",
		`email/broadcasts/${id}`,
		body as Record<string, unknown>,
	);
}

export function getDashboardEmailBroadcastRecipients(
	id: number,
	options?: {
		status?: "pending" | "sent" | "failed" | "skipped";
		limit?: number;
		offset?: number;
	},
) {
	const params = new URLSearchParams();
	if (options?.status) params.set("status", options.status);
	if (options?.limit != null) params.set("limit", String(options.limit));
	if (options?.offset != null) params.set("offset", String(options.offset));
	const q = params.toString();
	return fetchDashboardJson<DashboardEmailBroadcastRecipientsResponse>(
		q ? `email/broadcasts/${id}/recipients?${q}` : `email/broadcasts/${id}/recipients`,
	);
}

export function postDashboardEmailBroadcastSend(
	id: number,
	options: {
		audience?: "newsletter" | "all_site_users" | "selected_site_users" | "manual_emails";
		userIds?: number[];
		audienceEmails?: string[];
	} = {},
) {
	const payload: Record<string, unknown> = {};
	if (options.audience) payload.audience = options.audience;
	if (options.userIds?.length) {
		payload.user_ids = options.userIds;
	}
	if (options.audienceEmails?.length) {
		payload.audience_emails = options.audienceEmails;
	}
	return mutateDashboardJson<DashboardEmailBroadcast>(
		"POST",
		`email/broadcasts/${id}/send`,
		payload,
	);
}

export function postDashboardEmailBroadcastProcess(id: number) {
	return mutateDashboardJson<DashboardEmailBroadcast>(
		"POST",
		`email/broadcasts/${id}/process`,
		{},
	);
}

export function postDashboardEmailBroadcastPause(id: number) {
	return mutateDashboardJson<DashboardEmailBroadcast>(
		"POST",
		`email/broadcasts/${id}/pause`,
		{},
	);
}

export function postDashboardEmailBroadcastResume(id: number) {
	return mutateDashboardJson<DashboardEmailBroadcast>(
		"POST",
		`email/broadcasts/${id}/resume`,
		{},
	);
}

export function postDashboardEmailBroadcastStop(id: number) {
	return mutateDashboardJson<DashboardEmailBroadcast>(
		"POST",
		`email/broadcasts/${id}/stop`,
		{},
	);
}

export function getNotificationPreferences() {
	return fetchDashboardJson<DashboardNotificationPrefsResponse>(
		"notification-preferences",
	);
}

export function patchNotificationPreferences(
	body: Partial<
		Pick<
			DashboardNotificationPrefsResponse,
			| "email_product_updates"
			| "email_security_alerts"
			| "browser_push"
		>
	>,
) {
	return mutateDashboardJson<DashboardNotificationPrefsResponse>(
		"PATCH",
		"notification-preferences",
		body as Record<string, unknown>,
	);
}

export function postDashboardUser(payload: {
	email: string;
	password: string;
	name?: string;
	is_staff?: boolean;
	/** Super admin only; managers cannot set this. */
	is_superuser?: boolean;
}) {
	return mutateDashboardJson<DashboardUserRow>("POST", "users", payload);
}

export function patchDashboardUser(
	id: number,
	payload: Partial<{
		is_active: boolean;
		is_staff: boolean;
		is_superuser: boolean;
		first_name: string;
		last_name: string;
		password: string;
		password_confirmation: string;
	}>,
) {
	return mutateDashboardJson<DashboardUserDetail>(
		"PATCH",
		`users/${id}`,
		payload as Record<string, unknown>,
	);
}

export function deleteDashboardUser(id: number) {
	return mutateDashboardJson<null>("DELETE", `users/${id}`);
}

export type DashboardUsersBulkAction = "soft_delete" | "restore" | "permanent_delete";

export function bulkDashboardUsers(action: DashboardUsersBulkAction, ids: number[]) {
	return mutateDashboardJson<DashboardUsersBulkResult>("POST", "users/bulk", {
		action,
		ids,
	});
}

export function getDashboardDatabaseBackupInfo() {
	return fetchDashboardJson<DashboardDatabaseBackupInfo>("database/backup");
}

function parseContentDispositionFilename(header: string | null): string | null {
	if (!header) return null;
	const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(header);
	return match?.[1]?.replace(/"/g, "").trim() || null;
}

export async function exportDashboardDatabaseBackup(): Promise<{
	ok: boolean;
	errorMessage?: string;
}> {
	try {
		const res = await fetch(dashboardClientFetchUrl("database/backup/export"), {
			method: "POST",
			headers: dashboardAuthHeaders(),
			cache: "no-store",
		});
		if (!res.ok) {
			const text = await res.text();
			return {
				ok: false,
				errorMessage: parseDashboardApiErrorText(text) || `HTTP ${res.status}`,
			};
		}
		const blob = await res.blob();
		const filename =
			parseContentDispositionFilename(res.headers.get("Content-Disposition")) ||
			"database_backup.sql.gz";
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
		return { ok: true };
	} catch {
		return {
			ok: false,
			errorMessage: "Network error — could not export database backup.",
		};
	}
}

export async function importDashboardDatabaseBackup(
	file: File,
): Promise<DashboardJsonResult<DashboardDatabaseImportResult>> {
	try {
		const form = new FormData();
		form.append("file", file);
		form.append("confirm", "REPLACE");
		const res = await fetch(dashboardClientFetchUrl("database/backup/import"), {
			method: "POST",
			headers: dashboardAuthHeaders(),
			body: form,
			cache: "no-store",
		});
		const text = await res.text();
		if (!res.ok) {
			return {
				ok: false,
				data: null,
				status: res.status,
				errorMessage: parseDashboardApiErrorText(text),
			};
		}
		return {
			ok: true,
			data: text ? (JSON.parse(text) as DashboardDatabaseImportResult) : null,
			status: res.status,
			errorMessage: null,
		};
	} catch {
		return {
			ok: false,
			data: null,
			status: null,
			errorMessage: "Network error — could not import database backup.",
		};
	}
}

export function getDashboardSiteBranding() {
	return fetchDashboardJson<SiteBranding>("site-branding");
}

export function patchDashboardSiteBranding(body: { site_name?: string }) {
	return mutateDashboardJson<SiteBranding>("PATCH", "site-branding", body);
}

async function uploadDashboardBrandingAsset(
	path: string,
	field: string,
	file: File,
): Promise<DashboardJsonResult<SiteBranding>> {
	try {
		const form = new FormData();
		form.append(field, file);
		const res = await fetch(dashboardClientFetchUrl(path), {
			method: "POST",
			headers: dashboardAuthHeaders(),
			body: form,
			cache: "no-store",
		});
		const text = await res.text();
		if (!res.ok) {
			return {
				ok: false,
				data: null,
				status: res.status,
				errorMessage: parseDashboardApiErrorText(text),
			};
		}
		return {
			ok: true,
			data: JSON.parse(text) as SiteBranding,
			status: res.status,
		};
	} catch {
		return { ok: false, data: null, status: null };
	}
}

export function uploadDashboardSiteLogo(file: File) {
	return uploadDashboardBrandingAsset("site-branding/logo", "logo", file);
}

export function uploadDashboardSiteFavicon(file: File) {
	return uploadDashboardBrandingAsset("site-branding/favicon", "favicon", file);
}

export function deleteDashboardSiteLogo() {
	return mutateDashboardJson<SiteBranding>("DELETE", "site-branding/logo");
}

export function deleteDashboardSiteFavicon() {
	return mutateDashboardJson<SiteBranding>("DELETE", "site-branding/favicon");
}

export function getDashboardBlogComments(options?: {
	status?: "pending" | "approved" | "rejected";
	postId?: number;
	limit?: number;
}) {
	const params = new URLSearchParams();
	if (options?.status) params.set("status", options.status);
	if (options?.postId != null) params.set("post_id", String(options.postId));
	if (options?.limit != null) params.set("limit", String(options.limit));
	const q = params.toString();
	return fetchDashboardJson<DashboardBlogCommentsResponse>(
		q ? `blog-comments?${q}` : "blog-comments",
	);
}

export function getDashboardBlogCommentsPendingCount() {
	return fetchDashboardJson<{ pending_count: number }>("blog-comments?count_only=1");
}

export function patchDashboardBlogComment(
	id: number,
	body: { status: "pending" | "approved" | "rejected" },
) {
	return mutateDashboardJson<DashboardBlogComment>("PATCH", `blog-comments/${id}`, body);
}

export function deleteDashboardBlogComment(id: number) {
	return mutateDashboardJson<null>("DELETE", `blog-comments/${id}`);
}

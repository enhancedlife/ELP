import type { BlogPostRecord, LandingPageRecord, Sponsor } from "@/lib/types";
import type { EmailLayoutConfig } from "@/lib/email-layout-config";

export type DashboardStat = {
	title: string;
	value: string;
	description: string;
	trend: "up" | "down" | "neutral";
	iconKey: string;
};

export type DashboardActivity = {
	kind: string;
	label: string;
	detail: string;
	relativeTime: string;
};

export type DashboardOverviewResponse = {
	stats: DashboardStat[];
	activities: DashboardActivity[];
};

export type DashboardMetric = {
	title: string;
	value: string;
	change: string;
	trend: "up" | "down" | "neutral";
	iconKey: string;
};

export type DashboardTopSource = {
	name: string;
	value: number;
	count: string;
};

export type DashboardTopPage = {
	id: number;
	slug: string;
	title: string;
	page: string;
	views: string;
	bounce: string;
	time: string;
};

export type DashboardAnalyticsResponse = {
	metrics: DashboardMetric[];
	topSources: DashboardTopSource[];
	topPages: DashboardTopPage[];
	chartNote?: string;
};

export type DashboardUserRow = {
	id: number;
	name: string;
	email: string;
	role: string;
	status: string;
	avatar: string;
	lastSeen: string;
	/** ISO datetime when soft-deleted; null when active. */
	deletedAt?: string | null;
};

export type DashboardUsersBulkResult = {
	ok: number[];
	failed: { id: number; detail: string }[];
};

/** WooCommerce-style blocks from WordPress export / MemberProfile. */
export type DashboardMemberProfile = {
	billing: Record<string, string>;
	shipping: Record<string, string>;
} | null;

/** GET/PATCH /api/dashboard/users/:id — superset of list row. */
export type DashboardUserDetail = DashboardUserRow & {
	username: string;
	first_name: string;
	last_name: string;
	is_superuser: boolean;
	is_staff: boolean;
	is_active: boolean;
	date_joined: string | null;
	last_login_iso: string | null;
	member_profile: DashboardMemberProfile;
};

export type DashboardUsersResponse = {
	users: DashboardUserRow[];
};

export type DashboardProjectRow = {
	id: number;
	name: string;
	description: string;
	progress: number;
	status: string;
	team: string[];
	dueDate: string;
	priority: string;
	slug: string;
};

export type DashboardProjectsResponse = {
	projects: DashboardProjectRow[];
};

export type DashboardSponsorsResponse = {
	sponsors: Sponsor[];
};

export type DashboardConversationRow = {
	id: number;
	subject: string;
	updated_at: string;
	preview: string;
	message_count: number;
};

/** GET /api/dashboard/messages */
export type DashboardMessagesInboxResponse = {
	conversations: DashboardConversationRow[];
	notice?: string | null;
};

export type DashboardMessageRow = {
	id: number;
	body: string;
	author_label: string;
	author_user_id: number | null;
	created_at: string;
	deleted_at?: string | null;
};

/** GET or POST /api/dashboard/messages/:id */
export type DashboardConversationDetailResponse = {
	conversation: { id: number; subject: string };
	messages: DashboardMessageRow[];
};

export type DashboardNotificationRow = {
	id: number;
	title: string;
	body: string;
	category: string;
	link_url: string;
	is_read: boolean;
	recipient_id: number | null;
	created_at: string;
	deleted_at?: string | null;
};

export type DashboardNotificationPrefsResponse = {
	email_product_updates: boolean;
	email_security_alerts: boolean;
	browser_push: boolean;
	updated_at: string;
};

/** GET /api/dashboard/notifications */
export type DashboardNotificationsResponse = {
	notifications: DashboardNotificationRow[];
	unread_count: number;
};

export type DashboardCalendarResponse = {
	events: unknown[];
	notice?: string;
};

export type DashboardLandingPagesResponse = {
	pages: LandingPageRecord[];
};

export type DashboardBlogPostsResponse = {
	posts: BlogPostRecord[];
};

export type DashboardNewsletterSubscriber = {
	id: number;
	email: string;
	name: string;
	is_subscribed: boolean;
	created_at: string;
	updated_at: string;
	deleted_at?: string | null;
};

export type DashboardNewsletterSubscribersResponse = {
	subscribers: DashboardNewsletterSubscriber[];
};

export type DashboardSystemEmailLayout = {
	id: number;
	template_html: string;
	layout_config: EmailLayoutConfig;
	updated_at: string;
};

export type DashboardEmailDeliveryStatus = {
	smtp_ready: boolean;
	backend: string;
	email_host: string;
	email_port: number;
	email_use_tls: boolean;
	email_use_ssl: boolean;
	default_from_email: string;
	email_host_user_set: boolean;
	email_host_password_set: boolean;
	debug_mode: boolean;
	message: string;
};

export type DashboardEmailBroadcastStatus =
	| "draft"
	| "sending"
	| "paused"
	| "stopped"
	| "sent"
	| "failed";

export type DashboardEmailBroadcastAudience =
	| "newsletter"
	| "all_site_users"
	| "selected_site_users"
	| "manual_emails";

export type DashboardEmailBroadcast = {
	id: number;
	subject: string;
	headline: string;
	body_text: string;
	body_html: string;
	status: DashboardEmailBroadcastStatus;
	audience: DashboardEmailBroadcastAudience;
	audience_user_ids: number[];
	audience_emails: string[];
	recipient_count: number;
	sent_ok_count: number;
	sent_fail_count: number;
	pending_count: number;
	skipped_count: number;
	progress_percent: number;
	error_summary: string;
	/** Present when send succeeded but some recipients failed (SMTP errors per address). */
	send_warning?: string;
	created_at: string;
	started_at: string | null;
	completed_at: string | null;
	sent_at: string | null;
};

export type DashboardEmailBroadcastRecipient = {
	id: number;
	email: string;
	status: "pending" | "sent" | "failed" | "skipped";
	error_message: string;
	sent_at: string | null;
	created_at: string;
};

export type DashboardEmailBroadcastRecipientsResponse = {
	total: number;
	limit: number;
	offset: number;
	recipients: DashboardEmailBroadcastRecipient[];
};

export type DashboardEmailBroadcastsResponse = {
	broadcasts: DashboardEmailBroadcast[];
};

export type DashboardDatabaseBackupInfo = {
	engine: "mysql" | "sqlite" | "other";
	database_name: string;
	host: string;
	can_export: boolean;
	can_import: boolean;
	export_format: string;
	tools: Record<string, boolean>;
	max_import_mb: number;
};

export type DashboardDatabaseImportResult = {
	ok: boolean;
	engine: string;
	database_name: string;
	bytes_restored: number;
	previous_saved_to?: string | null;
};

export type DashboardOutboundEmailSource =
	| "broadcast"
	| "template_test"
	| "password_reset"
	| "contact_form"
	| "smtp_cli";

export type DashboardOutboundEmailLog = {
	id: number;
	source: DashboardOutboundEmailSource;
	to_email: string;
	subject: string;
	success: boolean;
	error_message: string;
	error_type: string;
	broadcast_id: number | null;
	meta: Record<string, unknown>;
	created_at: string;
};

export type DashboardEmailSendLogsResponse = {
	total: number;
	limit: number;
	offset: number;
	logs: DashboardOutboundEmailLog[];
};


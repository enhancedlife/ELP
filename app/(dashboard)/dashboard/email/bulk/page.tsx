"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
	Eye,
	Code2,
	Send,
	Loader2,
	Save,
	Pause,
	Play,
	Square,
	RefreshCw,
	Copy,
	History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	describeDashboardFetchFailure,
	getDashboardEmailBroadcast,
	getDashboardEmailBroadcastRecipients,
	getDashboardEmailBroadcasts,
	getDashboardEmailDeliveryStatus,
	getDashboardEmailTemplate,
	getDashboardUsers,
	patchDashboardEmailBroadcast,
	postDashboardEmailBroadcast,
	postDashboardEmailBroadcastPause,
	postDashboardEmailBroadcastProcess,
	postDashboardEmailBroadcastResume,
	postDashboardEmailBroadcastSend,
	postDashboardEmailBroadcastStop,
} from "@/lib/api/dashboard";
import type {
	DashboardEmailBroadcast,
	DashboardEmailBroadcastRecipient,
	DashboardEmailDeliveryStatus,
	DashboardUserRow,
} from "@/lib/types/dashboard";
import { EmailSectionNav } from "@/components/dashboard/email-section-nav";
import {
	formatEmailListForInput,
	parseEmailListInput,
} from "@/lib/parse-email-list";

type EditorMode = "visual" | "html";
type Audience = "newsletter" | "all_site_users" | "selected_site_users" | "manual_emails";
type RecipientTab = "pending" | "sent" | "failed" | "skipped";

const RECIPIENT_TABS: RecipientTab[] = ["pending", "sent", "failed", "skipped"];

const HTML_BODY_STARTER = "<p>Your message here.</p>";
const TERMINAL_STATUSES = new Set(["sent", "failed", "stopped"]);

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function visualBodyToHtml(body: string): string {
	const parts = body.split(/\n\n+/).filter((p) => p.trim().length > 0);
	if (!parts.length) return "";
	return parts.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`).join("");
}

function plainFromHtml(html: string): string {
	if (typeof window === "undefined") return html;
	const doc = new DOMParser().parseFromString(html || "", "text/html");
	return (doc.body.textContent || "").trim();
}

function looksLikeFullHtmlDocument(s: string): boolean {
	const t = s.trim().toLowerCase();
	return t.startsWith("<!doctype") || t.startsWith("<html");
}

function previewDocumentFromInner(headlineEscaped: string, inner: string): string {
	const bodyHtml = inner.trim() || "<p></p>";
	return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:system-ui,sans-serif;padding:24px;margin:0;line-height:1.5;}</style></head><body><h2 style="margin-top:0;font-size:22px;">${headlineEscaped}</h2>${bodyHtml}</body></html>`;
}

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

function statusLabel(status: string): string {
	switch (status) {
		case "draft":
			return "Draft";
		case "sending":
			return "Sending";
		case "paused":
			return "Paused";
		case "stopped":
			return "Stopped";
		case "sent":
			return "Sent";
		case "failed":
			return "Failed";
		default:
			return status;
	}
}

function loadMessageContentOnly(
	broadcast: DashboardEmailBroadcast,
	setters: {
		setSubject: (v: string) => void;
		setHeadline: (v: string) => void;
		setVisualBody: (v: string) => void;
		setHtmlSource: (v: string) => void;
		setPlainText: (v: string) => void;
		setEditorMode: (v: EditorMode) => void;
	},
) {
	setters.setSubject(broadcast.subject);
	setters.setHeadline(broadcast.headline || "");
	const html = (broadcast.body_html || "").trim();
	if (html) {
		setters.setEditorMode("html");
		setters.setHtmlSource(html);
		setters.setPlainText(broadcast.body_text || "");
		setters.setVisualBody("");
	} else {
		setters.setEditorMode("visual");
		setters.setVisualBody(broadcast.body_text || "");
		setters.setHtmlSource("");
		setters.setPlainText("");
	}
}

function loadMessageIntoEditor(
	broadcast: DashboardEmailBroadcast,
	setters: {
		setSubject: (v: string) => void;
		setHeadline: (v: string) => void;
		setVisualBody: (v: string) => void;
		setHtmlSource: (v: string) => void;
		setPlainText: (v: string) => void;
		setEditorMode: (v: EditorMode) => void;
		setAudience: (v: Audience) => void;
		setSelectedIds: (v: Set<number>) => void;
		setManualEmailsText: (v: string) => void;
	},
) {
	loadMessageContentOnly(broadcast, setters);
	setters.setAudience((broadcast.audience as Audience) || "newsletter");
	setters.setSelectedIds(new Set(broadcast.audience_user_ids || []));
	setters.setManualEmailsText(formatEmailListForInput(broadcast.audience_emails));
}

export default function BulkMailPage() {
	const [editorMode, setEditorMode] = useState<EditorMode>("visual");
	const [showPreview, setShowPreview] = useState(true);
	const [subject, setSubject] = useState("");
	const [headline, setHeadline] = useState("");
	const [visualBody, setVisualBody] = useState("");
	const [htmlSource, setHtmlSource] = useState("");
	const [plainText, setPlainText] = useState("");
	const [layoutTemplate, setLayoutTemplate] = useState("");
	const [audience, setAudience] = useState<Audience>("newsletter");
	const [users, setUsers] = useState<DashboardUserRow[]>([]);
	const [userPickQuery, setUserPickQuery] = useState("");
	const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
	const [manualEmailsText, setManualEmailsText] = useState("");
	const [usersBanner, setUsersBanner] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [sending, setSending] = useState(false);
	const [draftId, setDraftId] = useState<number | null>(null);
	const [drafts, setDrafts] = useState<DashboardEmailBroadcast[]>([]);
	const [activeBatch, setActiveBatch] = useState<DashboardEmailBroadcast | null>(null);
	const [recipientTab, setRecipientTab] = useState<RecipientTab>("pending");
	const [recipients, setRecipients] = useState<DashboardEmailBroadcastRecipient[]>([]);
	const [recipientsTotal, setRecipientsTotal] = useState(0);
	const [loadingRecipients, setLoadingRecipients] = useState(false);
	const pollRef = useRef(false);
	const recipientFetchRef = useRef(0);
	const [deliveryStatus, setDeliveryStatus] = useState<DashboardEmailDeliveryStatus | null>(
		null,
	);

	const loadDrafts = useCallback(async () => {
		const res = await getDashboardEmailBroadcasts();
		if (!res.ok || !res.data) return;
		setDrafts(Array.isArray(res.data.broadcasts) ? res.data.broadcasts : []);
	}, []);

	const loadUsers = useCallback(async () => {
		const { ok, data, status, errorMessage } = await getDashboardUsers(8000);
		if (!ok || !data) {
			setUsersBanner(describeDashboardFetchFailure(status, errorMessage));
			setUsers([]);
			return;
		}
		setUsersBanner(null);
		setUsers(Array.isArray(data.users) ? data.users : []);
	}, []);

	const loadRecipients = useCallback(async (batchId: number, tab: RecipientTab) => {
		const fetchId = ++recipientFetchRef.current;
		setLoadingRecipients(true);
		setRecipients([]);
		setRecipientsTotal(0);
		const res = await getDashboardEmailBroadcastRecipients(batchId, {
			status: tab,
			limit: 200,
			offset: 0,
		});
		if (fetchId !== recipientFetchRef.current) return;
		setLoadingRecipients(false);
		if (!res.ok || !res.data) {
			setRecipients([]);
			setRecipientsTotal(0);
			return;
		}
		const rows = res.data.recipients.filter((r) => r.status === tab);
		setRecipients(rows);
		setRecipientsTotal(res.data.total);
	}, []);

	const refreshBatch = useCallback(async (id: number) => {
		const res = await getDashboardEmailBroadcast(id);
		if (res.ok && res.data) {
			setActiveBatch(res.data);
			return res.data;
		}
		return null;
	}, []);

	const runSendLoop = useCallback(
		async (id: number) => {
			if (pollRef.current) return;
			pollRef.current = true;
			setSending(true);
			try {
				while (true) {
					const batch = await refreshBatch(id);
					if (!batch) break;
					if (batch.status !== "sending") break;
					const proc = await postDashboardEmailBroadcastProcess(id);
					if (proc.ok && proc.data) {
						setActiveBatch(proc.data);
						if (proc.data.status !== "sending") break;
					}
					await sleep(600);
				}
				await loadDrafts();
				const finalBatch = await refreshBatch(id);
				if (finalBatch) {
					void loadRecipients(id, recipientTab);
					if (finalBatch.status === "sent") {
						toast.success(
							`Batch complete: ${finalBatch.sent_ok_count} sent, ${finalBatch.sent_fail_count} failed.`,
						);
					} else if (finalBatch.status === "failed") {
						toast.error("Batch failed", {
							description: finalBatch.error_summary || undefined,
						});
					}
				}
			} finally {
				pollRef.current = false;
				setSending(false);
			}
		},
		[loadDrafts, loadRecipients, recipientTab, refreshBatch],
	);

	useEffect(() => {
		void loadUsers();
		void loadDrafts();
		void (async () => {
			const res = await getDashboardEmailDeliveryStatus();
			if (res.ok && res.data) setDeliveryStatus(res.data);
		})();
	}, [loadUsers, loadDrafts]);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			const res = await getDashboardEmailTemplate();
			if (cancelled || !res.ok || !res.data) return;
			setLayoutTemplate(res.data.template_html);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!activeBatch?.id || activeBatch.status === "draft") return;
		void loadRecipients(activeBatch.id, recipientTab);
	}, [
		activeBatch?.id,
		activeBatch?.status,
		activeBatch?.sent_ok_count,
		activeBatch?.sent_fail_count,
		activeBatch?.pending_count,
		activeBatch?.skipped_count,
		recipientTab,
		loadRecipients,
	]);

	const parsedManualEmails = useMemo(
		() => parseEmailListInput(manualEmailsText),
		[manualEmailsText],
	);

	const filteredUsers = useMemo(() => {
		const q = userPickQuery.trim().toLowerCase();
		if (!q) return users;
		return users.filter(
			(u) =>
				u.email.toLowerCase().includes(q) ||
				u.name.toLowerCase().includes(q) ||
				String(u.id).includes(q),
		);
	}, [users, userPickQuery]);

	const innerHtmlForSend = useMemo(() => {
		if (editorMode === "visual") {
			return visualBodyToHtml(visualBody);
		}
		return htmlSource;
	}, [editorMode, visualBody, htmlSource]);

	const headlineEscapedPreview = useMemo(
		() => escapeHtml((headline.trim() || subject.trim() || " ").trim()),
		[headline, subject],
	);

	const previewIframeSrcDoc = useMemo(() => {
		const inner = innerHtmlForSend.trim() || "<p></p>";
		if (looksLikeFullHtmlDocument(inner)) {
			return inner;
		}
		const tpl = layoutTemplate.trim();
		if (!tpl) {
			return previewDocumentFromInner(headlineEscapedPreview, inner);
		}
		return tpl
			.replace(/\{\{email_title\}\}/g, headlineEscapedPreview)
			.replace(/\{\{email_body\}\}/g, inner);
	}, [innerHtmlForSend, layoutTemplate, headlineEscapedPreview]);

	const composedPlain = useMemo(() => {
		const h = headline.trim();
		if (editorMode === "visual") {
			const b = visualBody.trim();
			if (h && b) return `${h}\n\n${b}`;
			return h || b;
		}
		return plainText;
	}, [editorMode, headline, visualBody, plainText]);

	const formLocked =
		activeBatch != null &&
		(activeBatch.status === "sending" || activeBatch.status === "paused");

	function toggleEditorMode(next: EditorMode) {
		if (formLocked) return;
		if (next === editorMode) return;
		if (next === "html") {
			const fragment = visualBodyToHtml(visualBody);
			setHtmlSource(fragment.trim() ? fragment : HTML_BODY_STARTER);
			setPlainText(
				`${headline.trim() ? `${headline.trim()}\n\n` : ""}${visualBody}`.trim(),
			);
		} else {
			setVisualBody(plainFromHtml(`<div>${htmlSource}</div>`));
		}
		setEditorMode(next);
	}

	function toggleUser(id: number) {
		if (formLocked) return;
		setSelectedIds((prev) => {
			const n = new Set(prev);
			if (n.has(id)) n.delete(id);
			else n.add(id);
			return n;
		});
	}

	function selectAllFiltered() {
		if (formLocked) return;
		setSelectedIds((prev) => {
			const n = new Set(prev);
			for (const u of filteredUsers) n.add(u.id);
			return n;
		});
	}

	function clearSelection() {
		if (formLocked) return;
		setSelectedIds(new Set());
	}

	function validateForm(): boolean {
		if (!subject.trim()) {
			toast.error("Subject is required.");
			return false;
		}
		if (!composedPlain.trim()) {
			toast.error("Message body is required (plain text or visual content).");
			return false;
		}
		if (audience === "manual_emails" && parsedManualEmails.valid.length === 0) {
			toast.error("Enter at least one valid email address.");
			return false;
		}
		if (audience === "selected_site_users" && selectedIds.size === 0 && parsedManualEmails.valid.length === 0) {
			toast.error("Select at least one user or add manual email addresses.");
			return false;
		}
		if (
			(audience === "manual_emails" || audience === "selected_site_users") &&
			manualEmailsText.trim() &&
			parsedManualEmails.invalid.length > 0
		) {
			toast.error("Some email addresses are invalid.", {
				description: parsedManualEmails.invalid.slice(0, 5).join(", "),
			});
			return false;
		}
		return true;
	}

	function manualEmailsForPayload(): string[] {
		if (audience === "manual_emails" || audience === "selected_site_users") {
			return parsedManualEmails.valid;
		}
		return [];
	}

	function buildPayload() {
		const html = innerHtmlForSend.trim();
		const emails = manualEmailsForPayload();
		return {
			subject: subject.trim(),
			headline: headline.trim() || undefined,
			body_text: composedPlain.trim(),
			body_html: html || undefined,
			audience,
			audience_user_ids:
				audience === "selected_site_users" ? Array.from(selectedIds) : [],
			audience_emails: emails,
		};
	}

	async function saveDraft() {
		if (!validateForm()) return;
		setSaving(true);
		const payload = buildPayload();
		const res = draftId
			? await patchDashboardEmailBroadcast(draftId, payload)
			: await postDashboardEmailBroadcast(payload);
		setSaving(false);
		if (!res.ok || !res.data) {
			toast.error("Could not save draft", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setDraftId(res.data.id);
		setActiveBatch(res.data.status === "draft" ? null : res.data);
		await loadDrafts();
		toast.success("Draft saved.");
	}

	function startNewDraft() {
		setDraftId(null);
		setActiveBatch(null);
		setSubject("");
		setHeadline("");
		setVisualBody("");
		setHtmlSource("");
		setPlainText("");
		setEditorMode("visual");
		setAudience("newsletter");
		setSelectedIds(new Set());
		setManualEmailsText("");
		setRecipients([]);
		setRecipientsTotal(0);
	}

	async function reuseBatchMessage(b: DashboardEmailBroadcast) {
		let source = b;
		if (!b.body_html?.trim() && !b.body_text?.trim()) {
			const res = await getDashboardEmailBroadcast(b.id);
			if (res.ok && res.data) source = res.data;
		}
		setDraftId(null);
		setActiveBatch(null);
		loadMessageContentOnly(source, {
			setSubject,
			setHeadline,
			setVisualBody,
			setHtmlSource,
			setPlainText,
			setEditorMode,
		});
		setAudience("newsletter");
		setSelectedIds(new Set());
		setManualEmailsText("");
		setRecipients([]);
		setRecipientsTotal(0);
		toast.success("Message loaded — choose new recipients and send.");
	}

	async function viewBatchHistory(b: DashboardEmailBroadcast) {
		setDraftId(null);
		setActiveBatch(b);
		void loadRecipients(b.id, recipientTab);
		if (b.status === "sending" && !pollRef.current) {
			void runSendLoop(b.id);
		}
	}

	async function openDraft(b: DashboardEmailBroadcast) {
		if (TERMINAL_STATUSES.has(b.status)) {
			await reuseBatchMessage(b);
			return;
		}
		setDraftId(b.status === "draft" ? b.id : null);
		setActiveBatch(b.status === "draft" ? null : b);
		loadMessageIntoEditor(b, {
			setSubject,
			setHeadline,
			setVisualBody,
			setHtmlSource,
			setPlainText,
			setEditorMode,
			setAudience,
			setSelectedIds,
			setManualEmailsText,
		});
		if (b.status !== "draft") {
			void loadRecipients(b.id, recipientTab);
			if (b.status === "sending" && !pollRef.current) {
				void runSendLoop(b.id);
			}
		}
	}

	async function sendBulk() {
		if (!validateForm()) return;

		const emails = manualEmailsForPayload();
		const recipientLabel =
			audience === "newsletter"
				? "all subscribed newsletter addresses"
				: audience === "all_site_users"
					? "every active site user with an email"
					: audience === "manual_emails"
						? `${emails.length} manual email address(es)`
						: `${selectedIds.size} selected user(s)${emails.length ? ` plus ${emails.length} manual email(s)` : ""}`;

		if (
			!window.confirm(
				`Send this message to ${recipientLabel}? You can pause or stop while sending.`,
			)
		) {
			return;
		}

		setSending(true);
		let id = draftId;
		if (!id) {
			const create = await postDashboardEmailBroadcast(buildPayload());
			if (!create.ok || !create.data?.id) {
				setSending(false);
				toast.error("Could not create draft", {
					description: create.errorMessage || `HTTP ${create.status}`,
				});
				return;
			}
			id = create.data.id;
			setDraftId(id);
		} else {
			const patch = await patchDashboardEmailBroadcast(id, buildPayload());
			if (!patch.ok) {
				setSending(false);
				toast.error("Could not update draft before send", {
					description: patch.errorMessage,
				});
				return;
			}
		}

		const send = await postDashboardEmailBroadcastSend(id, {
			audience,
			userIds: audience === "selected_site_users" ? Array.from(selectedIds) : undefined,
			audienceEmails: emails.length ? emails : undefined,
		});
		if (!send.ok || !send.data) {
			setSending(false);
			toast.error("Send failed", {
				description: send.errorMessage || `HTTP ${send.status ?? "—"}`,
			});
			return;
		}
		setActiveBatch(send.data);
		setDraftId(null);
		await loadDrafts();
		if (send.data.status === "sending") {
			void runSendLoop(id);
		} else {
			setSending(false);
			if (send.data.send_warning?.trim()) {
				toast.warning("Some recipients failed", {
					description: send.data.send_warning,
				});
			}
		}
	}

	async function pauseBatch() {
		if (!activeBatch?.id) return;
		const res = await postDashboardEmailBroadcastPause(activeBatch.id);
		if (res.ok && res.data) {
			setActiveBatch(res.data);
			pollRef.current = false;
			setSending(false);
			toast.message("Batch paused.");
		}
	}

	async function resumeBatch() {
		if (!activeBatch?.id) return;
		setSending(true);
		const res = await postDashboardEmailBroadcastResume(activeBatch.id);
		if (res.ok && res.data) {
			setActiveBatch(res.data);
			if (res.data.status === "sending") {
				void runSendLoop(activeBatch.id);
			} else {
				setSending(false);
			}
			toast.message("Batch resumed.");
		} else {
			setSending(false);
		}
	}

	async function stopBatch() {
		if (!activeBatch?.id) return;
		if (!window.confirm("Stop this batch? Remaining recipients will be skipped.")) return;
		pollRef.current = false;
		const res = await postDashboardEmailBroadcastStop(activeBatch.id);
		if (res.ok && res.data) {
			setActiveBatch(res.data);
			setSending(false);
			await loadDrafts();
			void loadRecipients(res.data.id, recipientTab);
			toast.message("Batch stopped.");
		}
	}

	const showBatchPanel =
		activeBatch != null && activeBatch.status !== "draft" && activeBatch.recipient_count > 0;

	return (
		<div className="space-y-8">
			<EmailSectionNav />
			{deliveryStatus && !deliveryStatus.smtp_ready ? (
				<p className="text-sm text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-lg px-4 py-3">
					<strong>Email will not be delivered.</strong> {deliveryStatus.message}
					{deliveryStatus.backend.includes("console") ? (
						<>
							{" "}
							On the live server, copy your SMTP settings from{" "}
							<code className="rounded bg-muted px-1">backend/.env</code> into the{" "}
							<strong>root</strong> <code className="rounded bg-muted px-1">.env</code> next to{" "}
							<code className="rounded bg-muted px-1">docker-compose.yml</code>, then run{" "}
							<code className="rounded bg-muted px-1">docker compose up -d backend</code>.
						</>
					) : null}
				</p>
			) : null}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Bulk mail</h2>
					<p className="text-muted-foreground mt-1 max-w-2xl text-sm">
						Save drafts with your audience selection, send in batches with pause/resume/stop, and
						track per-recipient status. Uses the shared{" "}
						<Link href="/dashboard/email/template" className="text-primary underline-offset-4 hover:underline">
							email template
						</Link>
						.
					</p>
				</div>
				<Button type="button" variant="outline" size="sm" onClick={startNewDraft}>
					New message
				</Button>
			</div>

			{drafts.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Saved drafts & past sends</CardTitle>
						<p className="text-sm text-muted-foreground font-normal">
							Click a sent batch to load its message into a new send. Use View to see delivery
							history without changing the editor.
						</p>
					</CardHeader>
					<CardContent>
						<div className="max-h-64 overflow-y-auto rounded-md border divide-y">
							{drafts.map((b) => {
								const isTerminal = TERMINAL_STATUSES.has(b.status);
								return (
									<div
										key={b.id}
										className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/50"
									>
										<button
											type="button"
											className="min-w-0 flex-1 text-left text-sm"
											onClick={() => void openDraft(b)}
										>
											<span className="block truncate font-medium">
												{b.subject || "(no subject)"}
											</span>
											<span className="text-xs text-muted-foreground">
												{statusLabel(b.status)}
												{b.recipient_count > 0
													? ` · ${b.sent_ok_count}/${b.recipient_count} sent`
													: ""}
												{b.created_at
													? ` · ${new Date(b.created_at).toLocaleDateString()}`
													: ""}
											</span>
										</button>
										<div className="flex shrink-0 items-center gap-1">
											{isTerminal ? (
												<>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-8 px-2"
														title="Load message into editor"
														onClick={() => void reuseBatchMessage(b)}
													>
														<Copy className="h-4 w-4" />
														<span className="sr-only">Reuse message</span>
													</Button>
													{b.recipient_count > 0 ? (
														<Button
															type="button"
															variant="ghost"
															size="sm"
															className="h-8 px-2"
															title="View send history"
															onClick={() => void viewBatchHistory(b)}
														>
															<History className="h-4 w-4" />
															<span className="sr-only">View batch</span>
														</Button>
													) : null}
												</>
											) : null}
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			) : null}

			{showBatchPanel && activeBatch ? (
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0">
						<CardTitle className="text-lg">Batch progress</CardTitle>
						<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
							{statusLabel(activeBatch.status)}
						</span>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>{activeBatch.progress_percent}% complete</span>
								<span className="text-muted-foreground">
									{activeBatch.sent_ok_count} sent · {activeBatch.sent_fail_count} failed ·{" "}
									{activeBatch.pending_count} pending
									{activeBatch.skipped_count > 0
										? ` · ${activeBatch.skipped_count} skipped`
										: ""}
								</span>
							</div>
							<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									className="h-full bg-primary transition-all duration-300"
									style={{ width: `${activeBatch.progress_percent}%` }}
								/>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							{activeBatch.status === "sending" ? (
								<Button type="button" variant="outline" size="sm" onClick={() => void pauseBatch()}>
									<Pause className="mr-1 h-4 w-4" />
									Pause
								</Button>
							) : null}
							{activeBatch.status === "paused" || activeBatch.status === "stopped" ? (
								<Button type="button" size="sm" onClick={() => void resumeBatch()} disabled={sending}>
									<Play className="mr-1 h-4 w-4" />
									Resume
								</Button>
							) : null}
							{activeBatch.status === "sending" || activeBatch.status === "paused" ? (
								<Button type="button" variant="destructive" size="sm" onClick={() => void stopBatch()}>
									<Square className="mr-1 h-4 w-4" />
									Stop
								</Button>
							) : null}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => void refreshBatch(activeBatch.id)}
							>
								<RefreshCw className="mr-1 h-4 w-4" />
								Refresh
							</Button>
						</div>
						<Tabs
							value={recipientTab}
							onValueChange={(v) => setRecipientTab(v as RecipientTab)}
							className="space-y-3"
						>
							<TabsList className="flex h-auto flex-wrap gap-1">
								{RECIPIENT_TABS.map((tab) => (
									<TabsTrigger key={tab} value={tab} className="capitalize">
										{tab}
										{tab === "pending" && activeBatch.pending_count > 0
											? ` (${activeBatch.pending_count})`
											: ""}
										{tab === "sent" && activeBatch.sent_ok_count > 0
											? ` (${activeBatch.sent_ok_count})`
											: ""}
										{tab === "failed" && activeBatch.sent_fail_count > 0
											? ` (${activeBatch.sent_fail_count})`
											: ""}
										{tab === "skipped" && activeBatch.skipped_count > 0
											? ` (${activeBatch.skipped_count})`
											: ""}
									</TabsTrigger>
								))}
							</TabsList>
							{RECIPIENT_TABS.map((tab) => (
								<TabsContent key={tab} value={tab} className="mt-0">
									{recipientTab !== tab ? null : loadingRecipients ? (
										<p className="text-sm text-muted-foreground flex items-center gap-2">
											<Loader2 className="h-4 w-4 animate-spin" />
											Loading…
										</p>
									) : (
										<div className="max-h-56 overflow-y-auto rounded-md border">
											{recipients.length === 0 ? (
												<p className="p-4 text-sm text-muted-foreground">
													No {tab} recipients.
												</p>
											) : (
												<ul className="divide-y text-sm">
													{recipients.map((r) => (
														<li key={r.id} className="px-3 py-2">
															<span className="font-mono">{r.email}</span>
															{r.error_message ? (
																<p className="mt-0.5 text-xs text-destructive">
																	{r.error_message}
																</p>
															) : null}
														</li>
													))}
												</ul>
											)}
											{recipientsTotal > recipients.length ? (
												<p className="border-t px-3 py-2 text-xs text-muted-foreground">
													Showing {recipients.length} of {recipientsTotal}
												</p>
											) : null}
										</div>
									)}
								</TabsContent>
							))}
						</Tabs>
					</CardContent>
				</Card>
			) : null}

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Recipients</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2 max-w-md">
						<Label htmlFor="bulk-audience">Audience</Label>
						<select
							id="bulk-audience"
							disabled={formLocked}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
							value={audience}
							onChange={(e) => setAudience(e.target.value as Audience)}
						>
							<option value="newsletter">Newsletter subscribers (subscribed, not archived)</option>
							<option value="all_site_users">All site users (active accounts with email)</option>
							<option value="selected_site_users">Selected users (+ optional manual emails)</option>
							<option value="manual_emails">Manual email list only</option>
						</select>
					</div>

					{audience === "manual_emails" ? (
						<div className="space-y-2 rounded-lg border p-4">
							<Label htmlFor="bulk-manual-emails">Email addresses</Label>
							<Textarea
								id="bulk-manual-emails"
								rows={8}
								disabled={formLocked}
								value={manualEmailsText}
								onChange={(e) => setManualEmailsText(e.target.value)}
								placeholder={"one@example.com\nother@example.com\n(or comma-separated)"}
								className="font-mono text-sm"
							/>
							<p className="text-xs text-muted-foreground">
								{parsedManualEmails.valid.length} valid
								{parsedManualEmails.invalid.length > 0
									? ` · ${parsedManualEmails.invalid.length} invalid`
									: ""}
								. One per line, or separated by commas.
							</p>
						</div>
					) : null}

					{audience === "selected_site_users" ? (
						<div className="space-y-3 rounded-lg border p-4">
							{usersBanner ? (
								<p className="text-sm text-amber-800 dark:text-amber-200">{usersBanner}</p>
							) : null}
							<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
								<div className="flex-1">
									<Label htmlFor="bulk-user-filter">Search users</Label>
									<Input
										id="bulk-user-filter"
										disabled={formLocked}
										value={userPickQuery}
										onChange={(e) => setUserPickQuery(e.target.value)}
										placeholder="Name, email, or id"
									/>
								</div>
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={formLocked}
										onClick={selectAllFiltered}
									>
										Select all in list
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										disabled={formLocked}
										onClick={clearSelection}
									>
										Clear
									</Button>
								</div>
							</div>
							<p className="text-xs text-muted-foreground">
								{selectedIds.size} selected · showing {filteredUsers.length} of {users.length}{" "}
								loaded
							</p>
							<div className="max-h-64 overflow-y-auto rounded-md border">
								{filteredUsers.length === 0 ? (
									<p className="p-4 text-sm text-muted-foreground">No users match.</p>
								) : (
									<ul className="divide-y">
										{filteredUsers.map((u) => (
											<li
												key={u.id}
												className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50"
											>
												<input
													type="checkbox"
													className="h-4 w-4 rounded border-input"
													checked={selectedIds.has(u.id)}
													disabled={formLocked}
													onChange={() => toggleUser(u.id)}
													id={`bulk-u-${u.id}`}
												/>
												<label htmlFor={`bulk-u-${u.id}`} className="flex-1 cursor-pointer">
													<span className="font-medium">{u.name}</span>
													<span className="ml-2 font-mono text-xs text-muted-foreground">
														{u.email}
													</span>
												</label>
											</li>
										))}
									</ul>
								)}
							</div>
							<div className="space-y-2 border-t pt-4">
								<Label htmlFor="bulk-extra-emails">Additional emails (not in user list)</Label>
								<Textarea
									id="bulk-extra-emails"
									rows={4}
									disabled={formLocked}
									value={manualEmailsText}
									onChange={(e) => setManualEmailsText(e.target.value)}
									placeholder="Optional: paste emails for people without site accounts"
									className="font-mono text-sm"
								/>
								{manualEmailsText.trim() ? (
									<p className="text-xs text-muted-foreground">
										{parsedManualEmails.valid.length} additional valid
										{parsedManualEmails.invalid.length > 0
											? ` · ${parsedManualEmails.invalid.length} invalid`
											: ""}
									</p>
								) : null}
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
					<CardTitle className="text-lg">Message</CardTitle>
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5">
							<Button
								type="button"
								variant={editorMode === "visual" ? "default" : "ghost"}
								size="sm"
								className="gap-1"
								disabled={formLocked}
								onClick={() => toggleEditorMode("visual")}
							>
								<Eye className="h-4 w-4" />
								Visual
							</Button>
							<Button
								type="button"
								variant={editorMode === "html" ? "default" : "ghost"}
								size="sm"
								className="gap-1"
								disabled={formLocked}
								onClick={() => toggleEditorMode("html")}
							>
								<Code2 className="h-4 w-4" />
								HTML body
							</Button>
						</div>
						{editorMode === "visual" ? (
							<div className="flex items-center gap-2">
								<Switch
									id="bulk-preview"
									checked={showPreview}
									onCheckedChange={setShowPreview}
								/>
								<Label htmlFor="bulk-preview" className="text-sm font-normal cursor-pointer">
									Preview below
								</Label>
							</div>
						) : null}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2">
						<Label htmlFor="bulk-subject">Email subject</Label>
						<Input
							id="bulk-subject"
							disabled={formLocked}
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="Appears in the inbox"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="bulk-headline">Headline ({"{{email_title}}"})</Label>
						<Input
							id="bulk-headline"
							disabled={formLocked}
							value={headline}
							onChange={(e) => setHeadline(e.target.value)}
							placeholder="Main heading inside the branded template"
						/>
					</div>

					{editorMode === "visual" ? (
						<div className="grid gap-2">
							<Label htmlFor="bulk-vbody">Body (plain paragraphs)</Label>
							<Textarea
								id="bulk-vbody"
								rows={10}
								disabled={formLocked}
								value={visualBody}
								onChange={(e) => setVisualBody(e.target.value)}
								placeholder="Write your message. Blank line between paragraphs."
							/>
						</div>
					) : (
						<div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
							<div className="flex min-h-[420px] flex-col gap-2 lg:min-h-[min(70vh,640px)]">
								<Label htmlFor="bulk-html">Body HTML ({"{{email_body}}"})</Label>
								<Textarea
									id="bulk-html"
									spellCheck={false}
									disabled={formLocked}
									className="min-h-[360px] flex-1 resize-y font-mono text-sm leading-relaxed"
									value={htmlSource}
									onChange={(e) => setHtmlSource(e.target.value)}
									placeholder="<p>…</p>"
								/>
								<div className="grid gap-2">
									<Label htmlFor="bulk-plain">Plain text body</Label>
									<Textarea
										id="bulk-plain"
										rows={4}
										disabled={formLocked}
										value={plainText}
										onChange={(e) => setPlainText(e.target.value)}
									/>
								</div>
							</div>
							<div className="flex min-h-0 flex-col gap-2">
								<Label>Live preview</Label>
								<div className="relative flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-lg border bg-muted/20">
									<iframe
										title="Email HTML preview"
										className="absolute inset-0 h-full w-full border-0 bg-white"
										sandbox="allow-same-origin"
										srcDoc={previewIframeSrcDoc}
									/>
								</div>
							</div>
						</div>
					)}

					{editorMode === "visual" && showPreview ? (
						<div className="grid gap-2">
							<Label>Preview</Label>
							<div className="rounded-lg border bg-white text-black overflow-hidden">
								<iframe
									title="Email preview"
									className="w-full min-h-[280px] border-0 bg-white"
									sandbox="allow-same-origin"
									srcDoc={previewIframeSrcDoc}
								/>
							</div>
						</div>
					) : null}

					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							disabled={saving || formLocked}
							onClick={() => void saveDraft()}
						>
							{saving ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Save className="mr-2 h-4 w-4" />
							)}
							Save draft
						</Button>
						<Button
							type="button"
							disabled={saving || sending || formLocked}
							onClick={() => void sendBulk()}
						>
							{sending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Send className="mr-2 h-4 w-4" />
							)}
							Send bulk mail
						</Button>
						{draftId ? (
							<p className="self-center text-xs text-muted-foreground">Draft #{draftId}</p>
						) : null}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

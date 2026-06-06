"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Send, Trash2, UserPlus } from "lucide-react";
import {
	deleteDashboardNewsletterSubscriber,
	describeDashboardFetchFailure,
	getDashboardEmailBroadcasts,
	getDashboardNewsletterSubscribers,
	patchDashboardNewsletterSubscriber,
	postDashboardEmailBroadcast,
	postDashboardEmailBroadcastSend,
	postDashboardNewsletterSubscriber,
} from "@/lib/api/dashboard";
import type { DashboardEmailBroadcast, DashboardNewsletterSubscriber } from "@/lib/types/dashboard";
import { EmailSectionNav } from "@/components/dashboard/email-section-nav";

export default function DashboardEmailPage() {
	const [subscribers, setSubscribers] = useState<DashboardNewsletterSubscriber[]>([]);
	const [broadcasts, setBroadcasts] = useState<DashboardEmailBroadcast[]>([]);
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [showArchivedSubs, setShowArchivedSubs] = useState(false);
	const [newEmail, setNewEmail] = useState("");
	const [newName, setNewName] = useState("");
	const [subj, setSubj] = useState("");
	const [headline, setHeadline] = useState("");
	const [bodyText, setBodyText] = useState("");
	const [bodyHtml, setBodyHtml] = useState("");
	const [sendingId, setSendingId] = useState<number | null>(null);

	const reload = useCallback(async () => {
		setLoading(true);
		const [subRes, brRes] = await Promise.all([
			getDashboardNewsletterSubscribers(showArchivedSubs),
			getDashboardEmailBroadcasts(),
		]);
		if (!subRes.ok || !subRes.data) {
			setBanner(describeDashboardFetchFailure(subRes.status));
			setSubscribers([]);
		} else {
			setBanner(null);
			setSubscribers(Array.isArray(subRes.data.subscribers) ? subRes.data.subscribers : []);
		}
		if (brRes.ok && brRes.data) {
			setBroadcasts(Array.isArray(brRes.data.broadcasts) ? brRes.data.broadcasts : []);
		}
		setLoading(false);
	}, [showArchivedSubs]);

	useEffect(() => {
		void reload();
	}, [reload]);

	async function addSubscriber() {
		const email = newEmail.trim().toLowerCase();
		if (!email) {
			toast.error("Email required");
			return;
		}
		const res = await postDashboardNewsletterSubscriber({ email, name: newName.trim() || undefined });
		if (!res.ok) {
			toast.error("Could not add subscriber", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Subscriber added");
		setNewEmail("");
		setNewName("");
		await reload();
	}

	async function toggleSub(s: DashboardNewsletterSubscriber) {
		const res = await patchDashboardNewsletterSubscriber(s.id, {
			is_subscribed: !s.is_subscribed,
		});
		if (!res.ok) {
			toast.error("Update failed", { description: res.errorMessage || undefined });
			return;
		}
		await reload();
	}

	async function archiveSub(id: number) {
		if (!window.confirm("Archive this subscriber row?")) return;
		const res = await deleteDashboardNewsletterSubscriber(id);
		if (!res.ok) {
			toast.error("Archive failed", { description: res.errorMessage || undefined });
			return;
		}
		await reload();
	}

	async function createBroadcast() {
		const subject = subj.trim();
		const text = bodyText.trim();
		if (!subject || !text) {
			toast.error("Subject and plain-text body are required.");
			return;
		}
		const res = await postDashboardEmailBroadcast({
			subject,
			headline: headline.trim() || undefined,
			body_text: text,
			body_html: bodyHtml.trim() || undefined,
		});
		if (!res.ok || !res.data) {
			toast.error("Could not save draft", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Draft saved");
		setSubj("");
		setHeadline("");
		setBodyText("");
		setBodyHtml("");
		await reload();
	}

	async function sendBroadcast(id: number) {
		if (
			!window.confirm(
				"Send this broadcast to every subscribed, non-archived address? SMTP must be configured on Django (EMAIL_HOST, etc.).",
			)
		) {
			return;
		}
		setSendingId(id);
		const res = await postDashboardEmailBroadcastSend(id, { audience: "newsletter" });
		setSendingId(null);
		if (!res.ok || !res.data) {
			toast.error("Send failed", {
				description: res.errorMessage || `HTTP ${res.status ?? "—"}`,
				duration: 25_000,
			});
			return;
		}
		if (res.data.send_warning?.trim()) {
			toast.warning("Some recipients failed (see server message)", {
				description: res.data.send_warning,
				duration: 25_000,
			});
		}
		toast.success(
			`Sent: ${res.data.sent_ok_count} ok, ${res.data.sent_fail_count} failed (${res.data.status}).`,
		);
		await reload();
	}

	const activeSubs = subscribers.filter((s) => s.is_subscribed && !s.deleted_at).length;

	return (
		<div className="space-y-8">
			<EmailSectionNav />
			<div>
				<h2 className="text-3xl font-bold tracking-tight">Email &amp; newsletter</h2>
				<p className="text-muted-foreground text-sm mt-1 max-w-2xl">
					Subscribers can join from the public site footer. Configure{" "}
					<code className="rounded bg-muted px-1">EMAIL_HOST</code>,{" "}
					<code className="rounded bg-muted px-1">DEFAULT_FROM_EMAIL</code>, and{" "}
					<code className="rounded bg-muted px-1">PUBLIC_SITE_BASE_URL</code> on Django for real delivery;
					in debug without SMTP, mail goes to the console backend.
				</p>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			<Card>
				<CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
					<CardTitle>
						Subscribers
						{loading ? "" : ` (${activeSubs} subscribed)`}
					</CardTitle>
					<div className="flex items-center gap-2">
						<Switch
							id="em-arch"
							checked={showArchivedSubs}
							onCheckedChange={(v) => setShowArchivedSubs(v)}
						/>
						<Label htmlFor="em-arch" className="text-sm font-normal cursor-pointer">
							Show archived
						</Label>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
						<div className="grid flex-1 gap-2 sm:grid-cols-2">
							<div>
								<Label htmlFor="em-mail">Email</Label>
								<Input
									id="em-mail"
									type="email"
									value={newEmail}
									onChange={(e) => setNewEmail(e.target.value)}
									placeholder="subscriber@example.com"
								/>
							</div>
							<div>
								<Label htmlFor="em-name">Name (optional)</Label>
								<Input
									id="em-name"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
								/>
							</div>
						</div>
						<Button type="button" onClick={() => void addSubscriber()}>
							<UserPlus className="mr-2 h-4 w-4" />
							Add
						</Button>
					</div>

					{subscribers.length === 0 && !loading ? (
						<p className="text-sm text-muted-foreground">No subscribers yet.</p>
					) : null}
					{subscribers.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Email</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Subscribed</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{subscribers.map((s) => (
									<TableRow key={s.id}>
										<TableCell className="font-mono text-xs">{s.email}</TableCell>
										<TableCell>{s.name || "—"}</TableCell>
										<TableCell>
											<Button variant="outline" size="sm" type="button" onClick={() => void toggleSub(s)}>
												{s.is_subscribed ? "Yes" : "No"}
											</Button>
										</TableCell>
										<TableCell className="text-right">
											{s.deleted_at ? (
												<Badge variant="outline">Archived</Badge>
											) : (
												<Button
													variant="ghost"
													size="sm"
													type="button"
													className="text-destructive"
													onClick={() => void archiveSub(s.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Bulk email (broadcasts)</CardTitle>
					<p className="text-sm font-normal text-muted-foreground">
						<Link href="/dashboard/email/log" className="text-primary underline-offset-4 hover:underline">
							Email send log
						</Link>
						{" · "}
						HTML is merged into the{" "}
						<Link href="/dashboard/email/template" className="text-primary underline-offset-4 hover:underline">
							system template
						</Link>{" "}
						(<code className="rounded bg-muted px-1">{"{{email_title}}"}</code>,{" "}
						<code className="rounded bg-muted px-1">{"{{email_body}}"}</code>).
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2">
						<Label htmlFor="bc-subj">Subject</Label>
						<Input id="bc-subj" value={subj} onChange={(e) => setSubj(e.target.value)} />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="bc-head">Headline (optional)</Label>
						<Input
							id="bc-head"
							value={headline}
							onChange={(e) => setHeadline(e.target.value)}
							placeholder="Defaults to subject if empty"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="bc-txt">Plain text body</Label>
						<Textarea
							id="bc-txt"
							rows={6}
							value={bodyText}
							onChange={(e) => setBodyText(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="bc-html">HTML body (optional, {"{{email_body}}"})</Label>
						<Textarea
							id="bc-html"
							rows={4}
							className="font-mono text-xs"
							value={bodyHtml}
							onChange={(e) => setBodyHtml(e.target.value)}
							placeholder="<p>Rich content…</p>"
						/>
					</div>
					<Button type="button" onClick={() => void createBroadcast()}>
						Save draft
					</Button>

					{broadcasts.length > 0 ? (
						<div className="border-t pt-4">
							<h3 className="text-sm font-semibold mb-2">History</h3>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Subject</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Recipients / OK / Fail</TableHead>
										<TableHead className="text-right">Send</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{broadcasts.map((b) => (
										<TableRow key={b.id}>
											<TableCell className="max-w-[200px] truncate font-medium">{b.subject}</TableCell>
											<TableCell>
												<Badge variant={b.status === "sent" ? "default" : "secondary"}>{b.status}</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{b.recipient_count} / {b.sent_ok_count} / {b.sent_fail_count}
											</TableCell>
											<TableCell className="text-right">
												{b.status === "draft" ? (
													<Button
														type="button"
														size="sm"
														disabled={sendingId === b.id}
														onClick={() => void sendBroadcast(b.id)}
													>
														<Send className="mr-1 h-3 w-3" />
														Send now
													</Button>
												) : (
													<span className="text-xs text-muted-foreground">—</span>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{broadcasts.some((b) => b.error_summary) ? (
								<p className="text-xs text-destructive mt-2 whitespace-pre-wrap">
									{broadcasts.find((b) => b.error_summary)?.error_summary}
								</p>
							) : null}
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Save, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useDashboardAuth } from "@/components/providers/dashboard-auth-provider";
import {
	describeDashboardFetchFailure,
	getDashboardEmailTemplate,
	patchDashboardEmailTemplate,
	postDashboardEmailTemplateTestSend,
} from "@/lib/api/dashboard";
import { isDashboardManager } from "@/lib/auth";
import {
	DEFAULT_EMAIL_LAYOUT_CONFIG,
	normalizeEmailLayoutConfig,
	type EmailLayoutConfig,
} from "@/lib/email-layout-config";
import { cn } from "@/lib/utils";
import { EmailSectionNav } from "@/components/dashboard/email-section-nav";

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function ColorField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="grid gap-2">
			<Label>{label}</Label>
			<div className="flex gap-2">
				<Input
					type="color"
					className="h-10 w-14 shrink-0 cursor-pointer p-1"
					value={value.startsWith("#") ? value : "#000000"}
					onChange={(e) => onChange(e.target.value)}
				/>
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="#0a0c0f"
					className="font-mono text-sm"
				/>
			</div>
		</div>
	);
}

export default function EmailTemplatePage() {
	const { user: session } = useDashboardAuth();
	const readOnly = isDashboardManager(session);
	const [layoutConfig, setLayoutConfig] = useState<EmailLayoutConfig>(
		DEFAULT_EMAIL_LAYOUT_CONFIG,
	);
	const [templateHtml, setTemplateHtml] = useState("");
	const [footerMatchesHeader, setFooterMatchesHeader] = useState(true);
	const [updatedAt, setUpdatedAt] = useState<string | null>(null);
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [testTo, setTestTo] = useState("");
	const [testSubject, setTestSubject] = useState("Test — Your Enhanced Life");
	const [testHeadline, setTestHeadline] = useState("Welcome to Your Enhanced Life");
	const [testBodyHtml, setTestBodyHtml] = useState(
		"<p>Thank you for subscribing. This sample message shows how your HTML content appears inside the branded template.</p>",
	);
	const [testBodyText, setTestBodyText] = useState(
		"Thank you for subscribing. This sample message shows how your content appears inside the branded template.",
	);
	const [testSending, setTestSending] = useState(false);

	const reload = useCallback(async () => {
		setLoading(true);
		const res = await getDashboardEmailTemplate();
		if (!res.ok || !res.data) {
			setBanner(describeDashboardFetchFailure(res.status, res.errorMessage));
		} else {
			setBanner(null);
			const cfg = normalizeEmailLayoutConfig(res.data.layout_config);
			setLayoutConfig(cfg);
			setTemplateHtml(res.data.template_html);
			setFooterMatchesHeader(cfg.footer_bg_color === cfg.header_bg_color);
			setUpdatedAt(res.data.updated_at);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	function patchConfig(patch: Partial<EmailLayoutConfig>) {
		setLayoutConfig((prev) => {
			const next = { ...prev, ...patch };
			if (footerMatchesHeader && "header_bg_color" in patch) {
				next.footer_bg_color = patch.header_bg_color ?? next.header_bg_color;
			}
			return next;
		});
	}

	const previewSrcDoc = useMemo(() => {
		const bodyHtml = testBodyHtml.trim() || "<p></p>";
		const hl = escapeHtml(testHeadline.trim() || testSubject.trim() || " ");
		const tpl = templateHtml.trim();
		if (!tpl) {
			return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="padding:24px;background:#030712;color:#d1d5db"><h2>${hl}</h2>${bodyHtml}</body></html>`;
		}
		return tpl.replace(/\{\{email_title\}\}/g, hl).replace(/\{\{email_body\}\}/g, bodyHtml);
	}, [templateHtml, testHeadline, testSubject, testBodyHtml]);

	async function save() {
		if (readOnly) return;
		const payload = normalizeEmailLayoutConfig({
			...layoutConfig,
			footer_bg_color: footerMatchesHeader
				? layoutConfig.header_bg_color
				: layoutConfig.footer_bg_color,
		});
		setSaving(true);
		const res = await patchDashboardEmailTemplate({ layout_config: payload });
		setSaving(false);
		if (!res.ok || !res.data) {
			toast.error("Save failed", {
				description: res.errorMessage || `HTTP ${res.status ?? "—"}`,
				duration: 15_000,
			});
			return;
		}
		setLayoutConfig(normalizeEmailLayoutConfig(res.data.layout_config));
		setTemplateHtml(res.data.template_html);
		setUpdatedAt(res.data.updated_at);
		toast.success("Email template saved.");
	}

	async function sendTest() {
		if (readOnly) return;
		const to = testTo.trim().toLowerCase();
		if (!to) {
			toast.error("Enter a recipient email.");
			return;
		}
		setTestSending(true);
		const res = await postDashboardEmailTemplateTestSend({
			to,
			subject: testSubject.trim() || undefined,
			headline: testHeadline.trim() || undefined,
			body_html: testBodyHtml.trim() || undefined,
			body_text: testBodyText.trim() || undefined,
		});
		setTestSending(false);
		if (!res.ok) {
			toast.error("Test send failed", {
				description: res.errorMessage || `HTTP ${res.status ?? "—"}`,
				duration: 25_000,
			});
			return;
		}
		toast.success(`Test email sent to ${to}.`);
	}

	return (
		<div className="space-y-8 max-w-6xl">
			<EmailSectionNav />
			<div>
				<h2 className="text-3xl font-bold tracking-tight">
					{readOnly ? "Email appearance preview" : "Email template"}
				</h2>
				{readOnly ? (
					<p className="text-muted-foreground mt-1 max-w-3xl text-sm">
						Preview how broadcast messages look. To change header, footer, or colors, contact the{" "}
						<span className="font-medium text-foreground">development team</span>.
					</p>
				) : (
					<p className="text-muted-foreground mt-1 max-w-3xl text-sm">
						Customize the shared header and footer for bulk/broadcast mail. Message content is HTML
						added when you send from{" "}
						<Link href="/dashboard/email/bulk" className="text-primary underline-offset-4 hover:underline">
							Bulk mail
						</Link>{" "}
						or{" "}
						<Link href="/dashboard/email" className="text-primary underline-offset-4 hover:underline">
							Email
						</Link>
						. Colors match the dark site theme by default.
					</p>
				)}
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			<div className="grid gap-6 xl:grid-cols-2 xl:items-start">
				{!readOnly ? (
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Header</CardTitle>
								{updatedAt ? (
									<p className="text-xs text-muted-foreground font-normal">
										Last saved: {new Date(updatedAt).toLocaleString()}
									</p>
								) : null}
							</CardHeader>
							<CardContent className="space-y-4">
								<ColorField
									label="Header background"
									value={layoutConfig.header_bg_color}
									onChange={(v) => patchConfig({ header_bg_color: v })}
								/>
								<div className="grid gap-2">
									<Label htmlFor="logo-url">Header logo URL</Label>
									<Input
										id="logo-url"
										value={layoutConfig.header_logo_url}
										onChange={(e) => patchConfig({ header_logo_url: e.target.value })}
										placeholder="https://yourenhancedlife.com/logoYEL.png"
										disabled={loading}
									/>
									<p className="text-xs text-muted-foreground">
										When set, only the logo is shown in the header. Heading and tagline below are used as
										image alt text if the logo cannot load.
									</p>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="hdr-heading">Heading (alt text fallback)</Label>
									<Input
										id="hdr-heading"
										value={layoutConfig.header_heading}
										onChange={(e) => patchConfig({ header_heading: e.target.value })}
										disabled={loading}
									/>
								</div>
								<ColorField
									label="Heading color"
									value={layoutConfig.header_heading_color}
									onChange={(v) => patchConfig({ header_heading_color: v })}
								/>
								<div className="grid gap-2">
									<Label htmlFor="hdr-tag">Tagline (alt text fallback, optional)</Label>
									<Input
										id="hdr-tag"
										value={layoutConfig.header_tagline}
										onChange={(e) => patchConfig({ header_tagline: e.target.value })}
										disabled={loading}
									/>
								</div>
								<ColorField
									label="Tagline color"
									value={layoutConfig.header_tagline_color}
									onChange={(v) => patchConfig({ header_tagline_color: v })}
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Footer</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<label className="flex items-center gap-2 text-sm">
									<Switch
										checked={footerMatchesHeader}
										onCheckedChange={(checked) => {
											setFooterMatchesHeader(checked);
											if (checked) {
												patchConfig({ footer_bg_color: layoutConfig.header_bg_color });
											}
										}}
									/>
									Footer background matches header
								</label>
								{!footerMatchesHeader ? (
									<ColorField
										label="Footer background"
										value={layoutConfig.footer_bg_color}
										onChange={(v) => patchConfig({ footer_bg_color: v })}
									/>
								) : null}
								<div className="grid gap-2">
									<Label htmlFor="f-contact">Footer email</Label>
									<Input
										id="f-contact"
										type="email"
										value={layoutConfig.footer_contact_email}
										onChange={(e) => patchConfig({ footer_contact_email: e.target.value })}
										disabled={loading}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="f-copy">Copyright line</Label>
									<Input
										id="f-copy"
										value={layoutConfig.footer_copyright}
										onChange={(e) => patchConfig({ footer_copyright: e.target.value })}
										disabled={loading}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="f-disc">Disclaimer</Label>
									<Input
										id="f-disc"
										value={layoutConfig.footer_disclaimer}
										onChange={(e) => patchConfig({ footer_disclaimer: e.target.value })}
										disabled={loading}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="f-site">Website URL (optional, shown in footer)</Label>
									<Input
										id="f-site"
										value={layoutConfig.footer_site_url}
										onChange={(e) => patchConfig({ footer_site_url: e.target.value })}
										placeholder="https://yourenhancedlife.com"
										disabled={loading}
									/>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Message area colors</CardTitle>
							</CardHeader>
							<CardContent className="grid gap-4 sm:grid-cols-2">
								<ColorField
									label="Outer background"
									value={layoutConfig.outer_bg_color}
									onChange={(v) => patchConfig({ outer_bg_color: v })}
								/>
								<ColorField
									label="Content background"
									value={layoutConfig.body_bg_color}
									onChange={(v) => patchConfig({ body_bg_color: v })}
								/>
								<ColorField
									label="Headline color (in message)"
									value={layoutConfig.title_text_color}
									onChange={(v) => patchConfig({ title_text_color: v })}
								/>
								<ColorField
									label="Body text color"
									value={layoutConfig.body_text_color}
									onChange={(v) => patchConfig({ body_text_color: v })}
								/>
							</CardContent>
						</Card>

						<Button type="button" disabled={loading || saving} onClick={() => void save()}>
							{saving ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Save className="mr-2 h-4 w-4" />
							)}
							Save template
						</Button>
					</div>
				) : null}

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{readOnly ? "Sample message" : "Preview"}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="grid gap-2 sm:grid-cols-2">
								<div>
									<Label htmlFor="tm-head">Message headline</Label>
									<Input
										id="tm-head"
										value={testHeadline}
										onChange={(e) => setTestHeadline(e.target.value)}
									/>
								</div>
								<div>
									<Label htmlFor="tm-sub">Inbox subject</Label>
									<Input
										id="tm-sub"
										value={testSubject}
										onChange={(e) => setTestSubject(e.target.value)}
									/>
								</div>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="tm-bodyh">Sample HTML body (content area only)</Label>
								<Textarea
									id="tm-bodyh"
									spellCheck={false}
									className={cn(
										"min-h-[100px] text-sm",
										readOnly ? "font-sans" : "font-mono text-xs",
									)}
									value={testBodyHtml}
									onChange={(e) => setTestBodyHtml(e.target.value)}
								/>
							</div>
							<Label>Live preview</Label>
							<div className="overflow-hidden rounded-lg border bg-white">
								<iframe
									title="Template preview"
									className="h-[420px] w-full border-0"
									sandbox="allow-same-origin"
									srcDoc={previewSrcDoc}
								/>
							</div>
						</CardContent>
					</Card>

					{!readOnly ? (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Send test email</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2">
									<Label htmlFor="tm-to">Recipient email</Label>
									<Input
										id="tm-to"
										type="email"
										value={testTo}
										onChange={(e) => setTestTo(e.target.value)}
										placeholder="you@example.com"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="tm-plain">Plain text body</Label>
									<Textarea
										id="tm-plain"
										rows={3}
										value={testBodyText}
										onChange={(e) => setTestBodyText(e.target.value)}
									/>
								</div>
								<Button
									type="button"
									disabled={testSending}
									onClick={() => void sendTest()}
								>
									{testSending ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Send className="mr-2 h-4 w-4" />
									)}
									Send test mail
								</Button>
								<p className="text-xs text-muted-foreground">
									Save template first, then send a test. SMTP must be configured in Django.
								</p>
							</CardContent>
						</Card>
					) : null}
				</div>
			</div>
		</div>
	);
}

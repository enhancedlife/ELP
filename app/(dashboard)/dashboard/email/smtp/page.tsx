"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Mail, Plus, Server, Trash2 } from "lucide-react";
import { EmailSectionNav } from "@/components/dashboard/email-section-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	deleteDashboardSmtpProfile,
	describeDashboardFetchFailure,
	getDashboardEmailDeliveryStatus,
	getDashboardSmtpProfiles,
	patchDashboardSmtpProfile,
	postDashboardSmtpProfile,
	postDashboardSmtpProfileActivate,
	postDashboardSmtpProfileTestSend,
	postDashboardSmtpProfilesImportEnv,
} from "@/lib/api/dashboard";
import type { DashboardEmailDeliveryStatus, DashboardSmtpProfile } from "@/lib/types/dashboard";

const emptyForm = {
	name: "",
	host: "",
	port: 587,
	username: "",
	password: "",
	use_tls: true,
	use_ssl: false,
	from_email: "",
	is_enabled: true,
};

export default function DashboardSmtpSettingsPage() {
	const [profiles, setProfiles] = useState<DashboardSmtpProfile[]>([]);
	const [delivery, setDelivery] = useState<DashboardEmailDeliveryStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [banner, setBanner] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<DashboardSmtpProfile | null>(null);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);
	const [testEmail, setTestEmail] = useState("");
	const [testingId, setTestingId] = useState<number | null>(null);

	const reload = useCallback(async () => {
		setLoading(true);
		const [profilesRes, deliveryRes] = await Promise.all([
			getDashboardSmtpProfiles(),
			getDashboardEmailDeliveryStatus(),
		]);
		if (!profilesRes.ok || !profilesRes.data) {
			setBanner(describeDashboardFetchFailure(profilesRes.status, profilesRes.errorMessage));
			setProfiles([]);
		} else {
			setBanner(null);
			setProfiles(Array.isArray(profilesRes.data.profiles) ? profilesRes.data.profiles : []);
		}
		if (deliveryRes.ok && deliveryRes.data) {
			setDelivery(deliveryRes.data);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	function openCreate() {
		setEditing(null);
		setForm({ ...emptyForm });
		setDialogOpen(true);
	}

	function openEdit(profile: DashboardSmtpProfile) {
		setEditing(profile);
		setForm({
			name: profile.name,
			host: profile.host,
			port: profile.port,
			username: profile.username,
			password: "",
			use_tls: profile.use_tls,
			use_ssl: profile.use_ssl,
			from_email: profile.from_email,
			is_enabled: profile.is_enabled,
		});
		setDialogOpen(true);
	}

	async function handleSave() {
		if (!form.name.trim() || !form.host.trim() || !form.from_email.trim()) {
			toast.error("Name, host, and from email are required.");
			return;
		}
		setSaving(true);
		const payload = {
			...form,
			name: form.name.trim(),
			host: form.host.trim(),
			from_email: form.from_email.trim(),
			port: Number(form.port) || 587,
			username: form.username.trim(),
		};
		const result = editing
			? await patchDashboardSmtpProfile(editing.id, {
					...payload,
					...(form.password ? { password: form.password } : {}),
				})
			: await postDashboardSmtpProfile({
					...payload,
					password: form.password,
				});
		setSaving(false);
		if (!result.ok || !result.data) {
			toast.error("Could not save SMTP profile", { description: result.errorMessage });
			return;
		}
		toast.success(editing ? "SMTP profile updated" : "SMTP profile added");
		setDialogOpen(false);
		void reload();
	}

	async function handleActivate(profile: DashboardSmtpProfile) {
		const res = await postDashboardSmtpProfileActivate(profile.id);
		if (!res.ok || !res.data) {
			toast.error("Could not activate profile", { description: res.errorMessage });
			return;
		}
		toast.success(`“${profile.name}” is now the active SMTP server`);
		void reload();
	}

	async function handleToggleEnabled(profile: DashboardSmtpProfile) {
		const res = await patchDashboardSmtpProfile(profile.id, {
			is_enabled: !profile.is_enabled,
		});
		if (!res.ok) {
			toast.error("Could not update profile", { description: res.errorMessage });
			return;
		}
		void reload();
	}

	async function handleDelete(profile: DashboardSmtpProfile) {
		if (!confirm(`Delete SMTP profile “${profile.name}”?`)) return;
		const res = await deleteDashboardSmtpProfile(profile.id);
		if (!res.ok) {
			toast.error("Could not delete profile", { description: res.errorMessage });
			return;
		}
		toast.success("SMTP profile deleted");
		void reload();
	}

	async function handleImportEnv() {
		const res = await postDashboardSmtpProfilesImportEnv();
		if (!res.ok || !res.data) {
			toast.error("Could not import from environment", { description: res.errorMessage });
			return;
		}
		toast.success("Imported SMTP settings from server environment");
		void reload();
	}

	async function handleTest(profile: DashboardSmtpProfile) {
		const to = testEmail.trim();
		if (!to) {
			toast.error("Enter a test email address below.");
			return;
		}
		setTestingId(profile.id);
		const res = await postDashboardSmtpProfileTestSend(profile.id, to);
		setTestingId(null);
		if (!res.ok) {
			toast.error(res.errorMessage || "Test send failed");
			return;
		}
		toast.success(res.data?.detail || "Test email sent");
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Email</h1>
				<p className="text-sm text-muted-foreground">
					SMTP servers here are used for <strong>bulk mail</strong> and template test sends. Contact
					form and password reset always use Zoho SMTP from{" "}
					<code className="rounded bg-muted px-1">backend/.env</code>.
				</p>
			</div>

			<EmailSectionNav />

			{banner ? (
				<p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					{banner}
				</p>
			) : null}

			{delivery ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Delivery status</CardTitle>
						<CardDescription>
							Bulk mail and transactional mail use separate SMTP configuration.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground space-y-3">
						<div>
							<p className="font-medium text-foreground">Bulk mail (this page)</p>
							<p>
								Status:{" "}
								{(delivery.bulk_smtp_ready ?? delivery.smtp_ready) ? (
									<span className="text-green-600 font-medium">Ready</span>
								) : (
									<span className="text-amber-600 font-medium">Not configured</span>
								)}
							</p>
							<p>{delivery.bulk_message ?? delivery.message}</p>
							{delivery.active_profile_name ? (
								<p>
									Active profile: <strong>{delivery.active_profile_name}</strong>
								</p>
							) : null}
							{delivery.profile_smtp?.host ? (
								<p>
									Host: {delivery.profile_smtp.host}:{delivery.profile_smtp.port ?? delivery.email_port}
								</p>
							) : null}
						</div>
						<div>
							<p className="font-medium text-foreground">Contact &amp; password reset (backend/.env)</p>
							<p>
								Status:{" "}
								{delivery.transactional_smtp_ready ? (
									<span className="text-green-600 font-medium">Ready</span>
								) : (
									<span className="text-amber-600 font-medium">Not configured</span>
								)}
							</p>
							<p>{delivery.transactional_message ?? "Set EMAIL_HOST, EMAIL_HOST_USER, and EMAIL_HOST_PASSWORD in backend/.env."}</p>
							{delivery.env_smtp?.host ? (
								<p>
									Host: {delivery.env_smtp.host} · From: {delivery.env_smtp.from_email}
								</p>
							) : null}
						</div>
					</CardContent>
				</Card>
			) : null}

			<div className="flex flex-wrap gap-2">
				<Button type="button" onClick={openCreate}>
					<Plus className="mr-2 h-4 w-4" />
					Add SMTP server
				</Button>
				<Button type="button" variant="outline" onClick={() => void handleImportEnv()}>
					Import from environment
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>SMTP servers</CardTitle>
					<CardDescription>
						Enable a server and set one as <strong>Active</strong> for bulk mail and newsletter
						sends. Contact form and password reset are not affected — they use{" "}
						<code className="text-xs">backend/.env</code> only.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-end max-w-md">
						<div className="grid gap-2 flex-1">
							<Label htmlFor="test-email">Test recipient</Label>
							<Input
								id="test-email"
								type="email"
								placeholder="you@example.com"
								value={testEmail}
								onChange={(e) => setTestEmail(e.target.value)}
							/>
						</div>
					</div>

					{loading ? (
						<p className="text-sm text-muted-foreground">Loading…</p>
					) : profiles.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No SMTP profiles yet. Add one or import from your server environment.
						</p>
					) : (
						<div className="space-y-4">
							{profiles.map((profile) => (
								<div
									key={profile.id}
									className="rounded-lg border p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
								>
									<div className="space-y-2 min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<Server className="h-4 w-4 text-muted-foreground" />
											<h3 className="font-semibold">{profile.name}</h3>
											{profile.is_active ? (
												<Badge className="bg-green-600 hover:bg-green-600">Active</Badge>
											) : null}
											{!profile.is_enabled ? (
												<Badge variant="outline">Disabled</Badge>
											) : null}
										</div>
										<p className="text-sm text-muted-foreground">
											{profile.host}:{profile.port} · {profile.from_email}
										</p>
										<p className="text-xs text-muted-foreground">
											{profile.use_ssl ? "SSL" : profile.use_tls ? "STARTTLS" : "No TLS"} · User:{" "}
											{profile.username || "—"} · Password:{" "}
											{profile.password_set ? "set" : "missing"}
										</p>
										<label className="flex items-center gap-2 text-sm">
											<Switch
												checked={profile.is_enabled}
												onCheckedChange={() => void handleToggleEnabled(profile)}
											/>
											Enabled
										</label>
									</div>
									<div className="flex flex-wrap gap-2 shrink-0">
										{!profile.is_active && profile.is_enabled ? (
											<Button
												type="button"
												size="sm"
												onClick={() => void handleActivate(profile)}
											>
												<Check className="mr-1 h-4 w-4" />
												Use this server
											</Button>
										) : null}
										<Button
											type="button"
											size="sm"
											variant="outline"
											disabled={testingId === profile.id}
											onClick={() => void handleTest(profile)}
										>
											<Mail className="mr-1 h-4 w-4" />
											{testingId === profile.id ? "Sending…" : "Test"}
										</Button>
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => openEdit(profile)}
										>
											Edit
										</Button>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											className="text-destructive hover:text-destructive"
											onClick={() => void handleDelete(profile)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{editing ? "Edit SMTP server" : "Add SMTP server"}</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-2">
						<div className="grid gap-2">
							<Label htmlFor="smtp-name">Name</Label>
							<Input
								id="smtp-name"
								value={form.name}
								onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
								placeholder="Zoho Mail"
							/>
						</div>
						<div className="grid grid-cols-3 gap-3">
							<div className="col-span-2 grid gap-2">
								<Label htmlFor="smtp-host">Host</Label>
								<Input
									id="smtp-host"
									value={form.host}
									onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
									placeholder="smtp.zoho.com.au"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="smtp-port">Port</Label>
								<Input
									id="smtp-port"
									type="number"
									value={form.port}
									onChange={(e) => setForm((f) => ({ ...f, port: Number(e.target.value) || 587 }))}
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="smtp-user">Username</Label>
							<Input
								id="smtp-user"
								value={form.username}
								onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
								placeholder="admin@yourenhancedlife.com"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="smtp-pass">
								Password{editing ? " (leave blank to keep current)" : ""}
							</Label>
							<Input
								id="smtp-pass"
								type="password"
								value={form.password}
								onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
								autoComplete="new-password"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="smtp-from">From email</Label>
							<Input
								id="smtp-from"
								type="email"
								value={form.from_email}
								onChange={(e) => setForm((f) => ({ ...f, from_email: e.target.value }))}
							/>
						</div>
						<div className="flex flex-wrap gap-6">
							<label className="flex items-center gap-2 text-sm">
								<Switch
									checked={form.use_tls}
									onCheckedChange={(v) => setForm((f) => ({ ...f, use_tls: v, use_ssl: v ? false : f.use_ssl }))}
								/>
								STARTTLS (port 587)
							</label>
							<label className="flex items-center gap-2 text-sm">
								<Switch
									checked={form.use_ssl}
									onCheckedChange={(v) => setForm((f) => ({ ...f, use_ssl: v, use_tls: v ? false : f.use_tls }))}
								/>
								SSL (port 465)
							</label>
							<label className="flex items-center gap-2 text-sm">
								<Switch
									checked={form.is_enabled}
									onCheckedChange={(v) => setForm((f) => ({ ...f, is_enabled: v }))}
								/>
								Enabled
							</label>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button type="button" disabled={saving} onClick={() => void handleSave()}>
							{saving ? "Saving…" : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

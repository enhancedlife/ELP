"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Shield, Cloud } from "lucide-react";
import {
	deleteDashboardContactIpBlock,
	getDashboardCloudflareIpBlock,
	getDashboardContactIpBlocks,
	putDashboardCloudflareIpBlock,
	putDashboardContactIpBanSettings,
	type CloudflareIpBlockSetting,
	type ContactIpBanSettings,
	type ContactIpBlockRow,
} from "@/lib/api/dashboard";

export default function SecurityPage() {
	const [rows, setRows] = useState<ContactIpBlockRow[]>([]);
	const [settings, setSettings] = useState<ContactIpBanSettings>({
		autoExpire: true,
		minutes: 30,
	});
	const [cloudflare, setCloudflare] = useState<CloudflareIpBlockSetting | null>(null);
	const [loading, setLoading] = useState(true);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [savingBan, setSavingBan] = useState(false);
	const [savingCf, setSavingCf] = useState(false);
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");

	async function load() {
		setLoading(true);
		setError("");
		const [blocks, cf] = await Promise.all([
			getDashboardContactIpBlocks(),
			getDashboardCloudflareIpBlock(),
		]);
		if (blocks.ok && blocks.data) {
			setRows(Array.isArray(blocks.data.data) ? blocks.data.data : []);
			if (blocks.data.settings) {
				setSettings({
					autoExpire: Boolean(blocks.data.settings.autoExpire),
					minutes: Number(blocks.data.settings.minutes) || 30,
				});
			}
		} else {
			setError(blocks.errorMessage || "Could not load contact IP blocks.");
		}
		if (cf.ok && cf.data?.data) {
			setCloudflare(cf.data.data);
		}
		setLoading(false);
	}

	useEffect(() => {
		void load();
	}, []);

	async function saveBanSettings() {
		setSavingBan(true);
		setNotice("");
		setError("");
		const result = await putDashboardContactIpBanSettings(settings);
		setSavingBan(false);
		if (!result.ok) {
			setError(result.errorMessage || "Could not save ban settings.");
			return;
		}
		if (result.data?.data) setSettings(result.data.data);
		setNotice(result.data?.detail || "Ban settings saved.");
	}

	async function saveCloudflare() {
		if (!cloudflare) return;
		setSavingCf(true);
		setNotice("");
		setError("");
		const result = await putDashboardCloudflareIpBlock(cloudflare.enabled);
		setSavingCf(false);
		if (!result.ok) {
			setError(result.errorMessage || "Could not save Cloudflare setting.");
			return;
		}
		if (result.data?.data) setCloudflare(result.data.data);
		setNotice(result.data?.detail || "Saved.");
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">Security</h2>
				<p className="text-muted-foreground">
					Contact form IP bans and optional Cloudflare site-wide blocking.
				</p>
			</div>

			{notice ? (
				<p className="text-sm text-muted-foreground">{notice}</p>
			) : null}
			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Contact form IP bans
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<p className="text-sm text-muted-foreground">
						After 3 rejected contact messages with HTML/script characters (such as &lt; or
						&gt;), the network is banned. When Cloudflare site-wide IP block is enabled, a
						Cloudflare rule is added and removed with the ban (auto-expire or manual Remove).
					</p>

					<div className="space-y-4 rounded-lg border p-4">
						<h3 className="text-sm font-medium">Ban duration</h3>
						<div className="flex items-center justify-between gap-4">
							<div className="space-y-0.5">
								<Label htmlFor="auto-expire">Auto-remove ban after a set time</Label>
								<p className="text-sm text-muted-foreground">
									{settings.autoExpire
										? "Timed bans clear automatically."
										: "Bans stay until you remove them manually."}
								</p>
							</div>
							<Switch
								id="auto-expire"
								checked={settings.autoExpire}
								onCheckedChange={(checked) =>
									setSettings((current) => ({ ...current, autoExpire: checked }))
								}
							/>
						</div>
						{settings.autoExpire ? (
							<div className="max-w-[12rem] space-y-2">
								<Label htmlFor="ban-minutes">Minutes until auto-remove</Label>
								<Input
									id="ban-minutes"
									type="number"
									min={1}
									max={43200}
									value={settings.minutes}
									onChange={(event) =>
										setSettings((current) => ({
											...current,
											minutes: Math.max(1, Number(event.target.value) || 1),
										}))
									}
								/>
							</div>
						) : null}
						<Button type="button" disabled={savingBan} onClick={() => void saveBanSettings()}>
							{savingBan ? "Saving…" : "Save ban settings"}
						</Button>
					</div>

					{loading ? (
						<p className="text-sm text-muted-foreground">Loading blocks…</p>
					) : null}
					{!loading && rows.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No IPs are blocked from the contact form.
						</p>
					) : null}
					<ul className="divide-y">
						{rows.map((row) => (
							<li
								key={row.id}
								className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
							>
								<div>
									<p className="font-medium">{row.ip_address}</p>
									<p className="text-xs text-muted-foreground">
										{row.rejected_count} rejected
										{row.blocked_at
											? ` · blocked ${new Date(row.blocked_at).toLocaleString()}`
											: ""}
										{row.permanent || !row.blocked_until
											? " · permanent until removed"
											: ` · until ${new Date(row.blocked_until).toLocaleString()}`}
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={busyId === row.id}
									onClick={() => {
										if (
											!window.confirm(
												`Remove the contact form block for ${row.ip_address}?`,
											)
										) {
											return;
										}
										setBusyId(row.id);
										void deleteDashboardContactIpBlock(row.id)
											.then((result) => {
												if (result.ok) {
													setRows((current) =>
														current.filter((item) => item.id !== row.id),
													);
												} else {
													setError(
														result.errorMessage || "Could not remove block.",
													);
												}
											})
											.finally(() => setBusyId(null));
									}}
								>
									{busyId === row.id ? "Removing…" : "Remove block"}
								</Button>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Cloud className="h-5 w-5" />
						Cloudflare site-wide IP block
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{cloudflare ? (
						<>
							<div className="flex items-center justify-between gap-4">
								<div className="space-y-0.5">
									<Label htmlFor="cf-enabled">
										Push contact bans to Cloudflare firewall
									</Label>
									<p className="text-sm text-muted-foreground">
										When on, an IP blocked from the contact form is also blocked from
										the whole site via Cloudflare account access rules. Removing a
										ban (auto or manual) lifts the Cloudflare rule.
									</p>
								</div>
								<Switch
									id="cf-enabled"
									checked={cloudflare.enabled}
									disabled={savingCf}
									onCheckedChange={(checked) =>
										setCloudflare({ ...cloudflare, enabled: checked })
									}
								/>
							</div>
							<p className="text-sm text-muted-foreground">
								{cloudflare.credentials_ready
									? "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are set on the server."
									: "You can save the toggle now. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to the backend env before any IP is sent."}
							</p>
							<Button type="button" disabled={savingCf} onClick={() => void saveCloudflare()}>
								{savingCf ? "Saving…" : "Save Cloudflare setting"}
							</Button>
						</>
					) : (
						<p className="text-sm text-muted-foreground">
							Could not load Cloudflare setting.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

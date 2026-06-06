"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	deleteDashboardNotification,
	getDashboardNotifications,
	getNotificationPreferences,
	patchDashboardNotification,
	patchNotificationPreferences,
	postDashboardNotification,
} from "@/lib/api/dashboard";
import type { DashboardNotificationRow } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

type Prefs = {
	email_product_updates: boolean;
	email_security_alerts: boolean;
	browser_push: boolean;
};

const defaultPrefs: Prefs = {
	email_product_updates: true,
	email_security_alerts: true,
	browser_push: false,
};

export default function SettingsNotificationsPage() {
	const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
	const [prefsSource, setPrefsSource] = useState<"api" | "default">("default");
	const [prefsReady, setPrefsReady] = useState(false);
	const [notifications, setNotifications] = useState<DashboardNotificationRow[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [newTitle, setNewTitle] = useState("");
	const [newBody, setNewBody] = useState("");

	const refreshFeed = useCallback(async () => {
		setLoading(true);
		const { ok, data } = await getDashboardNotifications();
		setLoading(false);
		if (!ok || !data) {
			toast.error("Could not load notifications");
			return;
		}
		setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
		setUnreadCount(typeof data.unread_count === "number" ? data.unread_count : 0);
	}, []);

	useEffect(() => {
		void refreshFeed();
	}, [refreshFeed]);

	useEffect(() => {
		void (async () => {
			const { ok, data } = await getNotificationPreferences();
			if (ok && data) {
				setPrefs({
					email_product_updates: data.email_product_updates,
					email_security_alerts: data.email_security_alerts,
					browser_push: data.browser_push,
				});
				setPrefsSource("api");
			} else {
				setPrefsSource("default");
			}
			setPrefsReady(true);
		})();
	}, []);

	async function updatePrefs(partial: Partial<Prefs>) {
		const merged = { ...prefs, ...partial };
		setPrefs(merged);
		const res = await patchNotificationPreferences(partial);
		if (!res.ok) {
			toast.error("Could not save preferences", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		if (res.data) {
			setPrefs({
				email_product_updates: res.data.email_product_updates,
				email_security_alerts: res.data.email_security_alerts,
				browser_push: res.data.browser_push,
			});
			setPrefsSource("api");
		}
	}

	async function markRead(id: number) {
		await patchDashboardNotification(id, { is_read: true });
		await refreshFeed();
	}

	async function dismissNotification(id: number) {
		const res = await deleteDashboardNotification(id);
		if (!res.ok) {
			toast.error("Could not archive notification", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Notification archived");
		await refreshFeed();
	}

	async function markAllRead() {
		const unread = notifications.filter((n) => !n.is_read);
		for (const n of unread) {
			await patchDashboardNotification(n.id, { is_read: true });
		}
		toast.success("Marked all as read");
		await refreshFeed();
	}

	async function createNotification() {
		const title = newTitle.trim();
		if (!title) {
			toast.error("Title is required");
			return;
		}
		const res = await postDashboardNotification({
			title,
			body: newBody.trim(),
			category: "info",
		});
		if (!res.ok) {
			toast.error("Could not create notification", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setNewTitle("");
		setNewBody("");
		toast.success("Notification created");
		await refreshFeed();
	}

	return (
		<div className="space-y-8">
			<div>
				<h3 className="text-lg font-medium">Notifications</h3>
				<p className="text-sm text-muted-foreground">
					Channel preferences are stored for your account in the database. In-app alerts
					appear below and in the header bell.
				</p>
			</div>

			<section className="space-y-4">
				<h4 className="text-sm font-semibold">Delivery preferences</h4>
				{prefsReady && prefsSource === "default" ? (
					<p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2">
						Could not load saved preferences from the API (defaults shown). Ensure you are
						signed in and the backend is running.
					</p>
				) : null}
				<div className="flex items-center justify-between gap-4 rounded-lg border p-4">
					<div className="space-y-0.5">
						<Label htmlFor="pref-product">Product updates</Label>
						<p className="text-xs text-muted-foreground">Tips and feature announcements</p>
					</div>
					<Switch
						id="pref-product"
						checked={prefs.email_product_updates}
						onCheckedChange={(v) => void updatePrefs({ email_product_updates: v })}
					/>
				</div>
				<div className="flex items-center justify-between gap-4 rounded-lg border p-4">
					<div className="space-y-0.5">
						<Label htmlFor="pref-security">Security alerts</Label>
						<p className="text-xs text-muted-foreground">Logins, API keys, and access changes</p>
					</div>
					<Switch
						id="pref-security"
						checked={prefs.email_security_alerts}
						onCheckedChange={(v) => void updatePrefs({ email_security_alerts: v })}
					/>
				</div>
				<div className="flex items-center justify-between gap-4 rounded-lg border p-4">
					<div className="space-y-0.5">
						<Label htmlFor="pref-push">Browser push (future)</Label>
						<p className="text-xs text-muted-foreground">Requires service worker integration</p>
					</div>
					<Switch
						id="pref-push"
						checked={prefs.browser_push}
						onCheckedChange={(v) => void updatePrefs({ browser_push: v })}
					/>
				</div>
			</section>

			<Separator />

			<section className="space-y-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h4 className="text-sm font-semibold">In-app feed</h4>
						<p className="text-xs text-muted-foreground">
							{unreadCount} unread ·{" "}
							<Link href="/dashboard/messages" className="text-primary underline">
								Open messages
							</Link>
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={unreadCount === 0}
						onClick={() => void markAllRead()}
					>
						Mark all read
					</Button>
				</div>

				{loading ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : notifications.length === 0 ? (
					<p className="text-sm text-muted-foreground border rounded-lg p-4 bg-muted/30">
						No rows yet. Create one below or use Django Admin → Dashboard notifications.
					</p>
				) : (
					<ul className="space-y-2">
						{notifications.map((n) => (
							<li
								key={n.id}
								className={cn(
									"rounded-lg border p-3 text-sm",
									!n.is_read && "border-primary/40 bg-primary/5",
								)}
							>
									<div className="flex items-start justify-between gap-2">
									<div>
										<p className="font-medium">{n.title}</p>
										{n.body ? (
											<p className="text-muted-foreground text-xs mt-1">{n.body}</p>
										) : null}
										<p className="text-[10px] text-muted-foreground mt-2">
											{new Date(n.created_at).toLocaleString()} · {n.category}
											{n.recipient_id != null ? ` · user #${n.recipient_id}` : ""}
										</p>
									</div>
									<div className="flex shrink-0 flex-col items-end gap-1">
										{n.is_read ? (
											<span className="text-[10px] text-muted-foreground">Read</span>
										) : (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-8"
												onClick={() => void markRead(n.id)}
											>
												Mark read
											</Button>
										)}
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-8 text-muted-foreground"
											onClick={() => void dismissNotification(n.id)}
										>
											Archive
										</Button>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<Separator />

			<section className="space-y-3">
				<h4 className="text-sm font-semibold">Create notification (API)</h4>
				<p className="text-xs text-muted-foreground">
					Posts to <code className="rounded bg-muted px-1">POST /api/dashboard/notifications</code>{" "}
					for testing the bell and this list.
				</p>
				<div className="grid gap-2 max-w-md">
					<Input
						placeholder="Title"
						value={newTitle}
						onChange={(e) => setNewTitle(e.target.value)}
					/>
					<Input
						placeholder="Body (optional)"
						value={newBody}
						onChange={(e) => setNewBody(e.target.value)}
					/>
					<Button type="button" className="w-fit" onClick={() => void createNotification()}>
						Send to feed
					</Button>
				</div>
			</section>
		</div>
	);
}

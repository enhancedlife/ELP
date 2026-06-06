"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { ToolbarDropdown } from "@/components/shared/toolbar-dropdown";
import {
	describeDashboardFetchFailure,
	getDashboardNotifications,
	patchDashboardNotification,
} from "@/lib/api/dashboard";
import type { DashboardNotificationRow } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";
import { backendOrigin } from "@/lib/backend-public";

export function DashboardNotificationsMenu() {
	const [items, setItems] = useState<DashboardNotificationRow[]>([]);
	const [unread, setUnread] = useState(0);
	const [apiError, setApiError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		const { ok, data, status, errorMessage } = await getDashboardNotifications();
		if (!ok || !data) {
			setApiError(describeDashboardFetchFailure(status));
			setItems([]);
			setUnread(0);
			return;
		}
		setApiError(null);
		setItems(Array.isArray(data.notifications) ? data.notifications.slice(0, 12) : []);
		setUnread(typeof data.unread_count === "number" ? data.unread_count : 0);
	}, []);

	useEffect(() => {
		void refresh();
		const t = setInterval(() => void refresh(), 60_000);
		return () => clearInterval(t);
	}, [refresh]);

	async function markRead(id: number) {
		await patchDashboardNotification(id, { is_read: true });
		await refresh();
	}

	const directHint =
		process.env.NEXT_PUBLIC_DASHBOARD_CLIENT_DIRECT !== "1" ? (
			<p className="text-[10px] text-muted-foreground px-1 pb-2">
				API via Next BFF → Django at <code className="rounded bg-muted px-0.5">{backendOrigin()}</code>.
				If you get errors, run Django and set{" "}
				<code className="rounded bg-muted px-0.5">NEXT_PUBLIC_DASHBOARD_CLIENT_DIRECT=1</code> in{" "}
				<code className="rounded bg-muted px-0.5">.env.local</code> to call the API from the browser.
			</p>
		) : (
			<p className="text-[10px] text-muted-foreground px-1 pb-2">
				Direct API: <code className="rounded bg-muted px-0.5">{backendOrigin()}</code>
			</p>
		);

	return (
		<ToolbarDropdown
			align="end"
			ariaLabel="Notifications"
			panelWidth={320}
			buttonClassName="relative h-9 w-9"
			triggerChildren={
				<>
					<Bell className="h-4 w-4" />
					{unread > 0 ? (
						<span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
							{unread > 9 ? "9+" : unread}
						</span>
					) : null}
				</>
			}
		>
			{(close) => (
				<>
					<p className="px-2 pb-1 text-sm font-medium">Notifications</p>
					{directHint}
					{apiError ? (
						<p className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
							{apiError}
						</p>
					) : null}
					{items.length === 0 && !apiError ? (
						<p className="px-2 py-4 text-center text-xs text-muted-foreground">
							No notifications yet.
						</p>
					) : null}
					{items.map((n) => (
						<button
							key={n.id}
							type="button"
							className={cn(
								"mb-1 flex w-full flex-col items-start gap-1 rounded-md p-2 text-left text-sm transition-colors hover:bg-accent",
								!n.is_read && "bg-muted/50",
							)}
							onClick={() => void markRead(n.id)}
						>
							<span className="font-medium leading-tight">{n.title}</span>
							{n.body ? (
								<span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
							) : null}
							<span className="text-[10px] text-muted-foreground">
								{new Date(n.created_at).toLocaleString()}
								{n.is_read ? "" : " · tap to mark read"}
							</span>
							{n.link_url ? (
								<a
									href={n.link_url}
									className="text-xs text-primary underline"
									target="_blank"
									rel="noreferrer"
									onClick={(e) => e.stopPropagation()}
								>
									Open link
								</a>
							) : null}
						</button>
					))}
					<div className="mt-2 border-t pt-2">
						<Link
							href="/dashboard/messages"
							className="block rounded-md px-2 py-2 text-sm hover:bg-accent"
							onClick={() => close()}
						>
							Messages inbox
						</Link>
						<Link
							href="/dashboard/settings/notifications"
							className="block rounded-md px-2 py-2 text-sm hover:bg-accent"
							onClick={() => close()}
						>
							Notification settings
						</Link>
					</div>
				</>
			)}
		</ToolbarDropdown>
	);
}

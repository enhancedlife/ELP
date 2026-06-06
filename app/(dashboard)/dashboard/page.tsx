"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CreditCard, FileText, MessageSquare, Settings } from "lucide-react";
import { useDashboardAuth } from "@/components/providers/dashboard-auth-provider";
import {
	describeDashboardFetchFailure,
	getDashboardOverview,
} from "@/lib/api/dashboard";
import { isDashboardManager } from "@/lib/auth";
import { dashboardIconForKey } from "@/lib/dashboard-icons";
import type {
	DashboardActivity,
	DashboardStat,
} from "@/lib/types/dashboard";

const fallbackStats: DashboardStat[] = [
	{
		title: "Active landing pages",
		value: "—",
		description: "Connect the API (see banner)",
		trend: "neutral",
		iconKey: "pages",
	},
];

const statAccent: Record<string, { color: string; bg: string }> = {
	pages: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
	sponsors: { color: "text-blue-600", bg: "bg-blue-50" },
	users: { color: "text-purple-600", bg: "bg-purple-50" },
	activity: { color: "text-orange-600", bg: "bg-orange-50" },
};

export default function DashboardPage() {
	const { user: session } = useDashboardAuth();
	const isMgr = isDashboardManager(session);
	const [stats, setStats] = useState<DashboardStat[] | null>(null);
	const [activities, setActivities] = useState<DashboardActivity[]>([]);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			const { ok, data, status, errorMessage } = await getDashboardOverview();
			if (cancelled) return;
			if (!ok || !data) {
				setLoadError(describeDashboardFetchFailure(status, errorMessage));
				setStats(fallbackStats);
				setActivities([]);
			} else {
				setLoadError(null);
				setStats(data.stats?.length ? data.stats : fallbackStats);
				setActivities(Array.isArray(data.activities) ? data.activities : []);
			}
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const displayStats = stats ?? fallbackStats;

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground text-lg">
					Overview of content and accounts from the Django database.
				</p>
			</div>

			{loadError ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{loadError}
				</p>
			) : null}

			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				{displayStats.map((stat) => {
					const Icon = dashboardIconForKey(stat.iconKey);
					const accent = statAccent[stat.iconKey] ?? {
						color: "text-muted-foreground",
						bg: "bg-muted",
					};

					return (
						<Card
							key={stat.title}
							className="group hover:shadow-lg transition-all duration-200"
						>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									{stat.title}
									{loading ? " …" : ""}
								</CardTitle>
								<div
									className={`p-2 rounded-lg ${accent.bg} group-hover:bg-primary/10 transition-colors`}
								>
									<Icon
										className={`h-5 w-5 ${accent.color} group-hover:text-primary transition-colors`}
									/>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="text-3xl font-bold mb-2">{stat.value}</div>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{stat.description}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-xl font-semibold">
							Recent content activity
						</CardTitle>
						<p className="text-muted-foreground">
							Latest landing page updates from the API
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						{activities.length === 0 && !loading ? (
							<p className="text-sm text-muted-foreground">
								No recent updates, or data could not be loaded.
							</p>
						) : null}
						{activities.map((a) => (
							<div
								key={`${a.kind}-${a.detail}-${a.relativeTime}`}
								className="flex items-center gap-4 p-4 rounded-lg border"
							>
								<div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
								<div className="flex-1 min-w-0">
									<p className="font-medium truncate">{a.label}</p>
									<p className="text-sm text-muted-foreground truncate">
										{a.detail} · {a.relativeTime}
									</p>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-xl font-semibold">
							Quick actions
						</CardTitle>
						<p className="text-muted-foreground">
							Open dashboard sections that load data from the API (no Django Admin links).
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							{!isMgr ? (
								<Link
									href="/dashboard/projects"
									className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors text-center"
								>
									<FileText className="h-6 w-6" />
									<span className="text-sm font-medium">Landing pages</span>
								</Link>
							) : null}
							{!isMgr ? (
								<Link
									href="/dashboard/sponsors"
									className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors text-center"
								>
									<CreditCard className="h-6 w-6" />
									<span className="text-sm font-medium">Sponsors</span>
								</Link>
							) : null}
							<Link
								href="/dashboard/messages"
								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors text-center"
							>
								<MessageSquare className="h-6 w-6" />
								<span className="text-sm font-medium">Messages</span>
							</Link>
							<Link
								href="/dashboard/users"
								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors text-center"
							>
								<Activity className="h-6 w-6" />
								<span className="text-sm font-medium">Users</span>
							</Link>
							<Link
								href="/dashboard/settings"
								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors text-center"
							>
								<Settings className="h-6 w-6" />
								<span className="text-sm font-medium">Settings</span>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

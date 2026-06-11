"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
	deleteDashboardLandingPage,
	describeDashboardFetchFailure,
	getDashboardAnalytics,
} from "@/lib/api/dashboard";
import { dashboardIconForKey, trendIcon } from "@/lib/dashboard-icons";
import type {
	DashboardMetric,
	DashboardTopPage,
	DashboardTopSource,
} from "@/lib/types/dashboard";
import {
	BarChart3,
	Calendar,
	Download,
	Filter,
	PieChart,
	Users,
	DollarSign,
	Trash2,
} from "lucide-react";

const metricStyle: Record<
	string,
	{ color: string; bg: string }
> = {
	visits: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
	users_week: { color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/40" },
	users_month: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
	users: { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
	pages: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
	sponsors: { color: "text-purple-600", bg: "bg-purple-50" },
	draft: { color: "text-orange-600", bg: "bg-orange-50" },
};

export default function AnalyticsPage() {
	const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
	const [topSources, setTopSources] = useState<DashboardTopSource[]>([]);
	const [topPages, setTopPages] = useState<DashboardTopPage[]>([]);
	const [chartNote, setChartNote] = useState<string | null>(null);
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [removingId, setRemovingId] = useState<number | null>(null);
	const [clearingAll, setClearingAll] = useState(false);

	const reload = useCallback(async () => {
		setLoading(true);
		const { ok, data, status } = await getDashboardAnalytics();
		if (!ok || !data) {
			setBanner(describeDashboardFetchFailure(status));
			setMetrics([]);
			setTopSources([]);
			setTopPages([]);
			setChartNote(null);
		} else {
			setBanner(null);
			setMetrics(Array.isArray(data.metrics) ? data.metrics : []);
			setTopSources(Array.isArray(data.topSources) ? data.topSources : []);
			setTopPages(Array.isArray(data.topPages) ? data.topPages : []);
			setChartNote(data.chartNote ?? null);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	async function handleRemovePage(page: DashboardTopPage) {
		const label = page.title || page.page;
		if (
			!window.confirm(
				`Remove "${label}" from this list? The landing page will be archived and hidden from the public site. You can restore it from FAQ pages.`,
			)
		) {
			return;
		}
		setRemovingId(page.id);
		const res = await deleteDashboardLandingPage(page.id);
		setRemovingId(null);
		if (!res.ok) {
			toast.error("Could not remove page", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Page archived");
		await reload();
	}

	async function handleClearAllPages() {
		if (topPages.length === 0) return;
		if (
			!window.confirm(
				`Archive all ${topPages.length} pages shown here? They will be removed from the public site until restored from FAQ pages.`,
			)
		) {
			return;
		}
		setClearingAll(true);
		let removed = 0;
		let failed = 0;
		for (const page of topPages) {
			const res = await deleteDashboardLandingPage(page.id);
			if (res.ok) removed += 1;
			else failed += 1;
		}
		setClearingAll(false);
		if (removed > 0) {
			toast.success(
				removed === 1 ? "1 page archived" : `${removed} pages archived`,
			);
		}
		if (failed > 0) {
			toast.error(
				failed === 1 ? "1 page could not be removed" : `${failed} pages could not be removed`,
			);
		}
		await reload();
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
					<p className="text-muted-foreground">
						Summary metrics from your CMS (landing pages, sponsors, users).
						{chartNote ? ` ${chartNote}` : ""}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" type="button" disabled>
						<Filter className="h-4 w-4 mr-2" />
						Filter
					</Button>
					<Button variant="outline" size="sm" type="button" disabled>
						<Calendar className="h-4 w-4 mr-2" />
						Last 30 days
					</Button>
					<Button variant="outline" size="sm" type="button" disabled>
						<Download className="h-4 w-4 mr-2" />
						Export
					</Button>
				</div>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{metrics.map((metric) => {
					const Icon = dashboardIconForKey(metric.iconKey);
					const TrendIc = trendIcon(metric.trend);
					const style = metricStyle[metric.iconKey] ?? {
						color: "text-muted-foreground",
						bg: "bg-muted",
					};

					return (
						<Card
							key={metric.title}
							className="hover:shadow-md transition-shadow"
						>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									{metric.title}
									{loading ? " …" : ""}
								</CardTitle>
								<div className={`p-2 rounded-lg ${style.bg}`}>
									<Icon className={`h-4 w-4 ${style.color}`} />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{metric.value}</div>
								<div className="flex items-center text-xs">
									<TrendIc
										className={cn(
											"mr-1 h-3 w-3",
											metric.trend === "up"
												? "text-green-600"
												: metric.trend === "down"
													? "text-red-600"
													: "text-muted-foreground",
										)}
									/>
									<span
										className={
											metric.trend === "up"
												? "text-green-600"
												: metric.trend === "down"
													? "text-red-600"
													: "text-muted-foreground"
										}
									>
										{metric.change}
									</span>
									<span className="text-muted-foreground ml-1">
										{metric.title === "Registered users" ? "total" : "vs prior period"}
									</span>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{metrics.length === 0 && !loading ? (
				<p className="text-sm text-muted-foreground">
					No analytics rows returned. Add content in Django Admin, then reload.
				</p>
			) : null}

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<Tabs defaultValue="overview" className="space-y-4">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="overview">Overview</TabsTrigger>
							<TabsTrigger value="revenue">Revenue</TabsTrigger>
							<TabsTrigger value="users">Users</TabsTrigger>
						</TabsList>
						<TabsContent value="overview" className="space-y-4">
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											<BarChart3 className="h-5 w-5" />
											Overview
										</CardTitle>
										<Badge variant="secondary">CMS data</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
										<div className="text-center px-4">
											<BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
											<p className="text-sm font-medium text-muted-foreground">
												{chartNote || "Traffic charts are not wired yet."}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="revenue" className="space-y-4">
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											<DollarSign className="h-5 w-5" />
											Revenue
										</CardTitle>
										<Badge variant="secondary">N/A</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-blue-950/30 dark:to-slate-950/40 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
										<div className="text-center px-4">
											<DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-2" />
											<p className="text-sm font-medium text-muted-foreground">
												Revenue is not tracked in this CMS.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="users" className="space-y-4">
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											<Users className="h-5 w-5" />
											Users
										</CardTitle>
										<Badge variant="secondary">Django auth</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
										<div className="text-center px-4">
											<Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
											<p className="text-sm font-medium text-muted-foreground">
												See the Users page for the account list from the API.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<PieChart className="h-5 w-5" />
								Content mix
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{topSources.length === 0 && !loading ? (
								<p className="text-sm text-muted-foreground">No breakdown yet.</p>
							) : null}
							{topSources.map((source) => (
								<div key={source.name} className="space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium">{source.name}</span>
										<span className="text-muted-foreground">
											{source.count}
										</span>
									</div>
									<Progress value={source.value} className="h-2" />
									<div className="text-right text-xs text-muted-foreground">
										{source.value}%
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
							<div>
								<CardTitle>Top published pages</CardTitle>
								<p className="text-xs text-muted-foreground mt-1">
									Active landing pages from the CMS. Remove unwanted entries here or manage them on{" "}
									<Link
										href="/dashboard/faq-pages"
										className="text-primary underline-offset-4 hover:underline"
									>
										FAQ pages
									</Link>
									.
								</p>
							</div>
							{topPages.length > 0 ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="shrink-0 text-destructive hover:text-destructive"
									disabled={loading || clearingAll || removingId !== null}
									onClick={() => void handleClearAllPages()}
								>
									<Trash2 className="h-4 w-4 mr-1.5" />
									{clearingAll ? "Removing…" : "Remove all"}
								</Button>
							) : null}
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{topPages.length === 0 && !loading ? (
									<p className="text-sm text-muted-foreground">
										No active landing pages yet.
									</p>
								) : null}
								{topPages.map((page) => (
									<div
										key={page.id}
										className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
									>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">
												{page.title || page.page}
											</p>
											<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
												<span className="truncate">{page.page}</span>
												<span>{page.views} views</span>
												<span>{page.bounce} bounce</span>
												<span>updated {page.time}</span>
											</div>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="shrink-0 text-muted-foreground hover:text-destructive"
											disabled={loading || clearingAll || removingId === page.id}
											aria-label={`Remove ${page.title || page.page}`}
											onClick={() => void handleRemovePage(page)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

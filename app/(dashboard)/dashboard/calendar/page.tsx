"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Plus,
	Calendar as CalendarIcon,
	Clock,
	MapPin,
	Users,
} from "lucide-react";
import Link from "next/link";
import {
	describeDashboardFetchFailure,
	getDashboardCalendar,
} from "@/lib/api/dashboard";

type CalendarEvent = {
	id: number;
	title: string;
	date: string;
	time: string;
	duration: string;
	location: string;
	attendees: string[];
	type: string;
};

export default function CalendarPage() {
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [notice, setNotice] = useState<string | null>(null);
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			const { ok, data, status } = await getDashboardCalendar();
			if (cancelled) return;
			if (!ok || !data) {
				setBanner(describeDashboardFetchFailure(status));
				setEvents([]);
				setNotice(null);
			} else {
				setBanner(null);
				setNotice(typeof data.notice === "string" ? data.notice : null);
				const raw = Array.isArray(data.events) ? data.events : [];
				setEvents(raw as CalendarEvent[]);
			}
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const label = new Date().toLocaleString(undefined, {
		month: "long",
		year: "numeric",
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
					<p className="text-muted-foreground">
						External calendar sync is not configured.{" "}
						{notice ? "" : "Events will appear here when integrated."}
					</p>
				</div>
				<Button className="flex items-center gap-2" type="button" disabled>
					<Plus className="h-4 w-4" />
					New event
				</Button>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			{notice ? (
				<p className="text-sm text-muted-foreground border rounded-lg px-4 py-3 bg-muted/40">
					{notice}
				</p>
			) : null}

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CalendarIcon className="h-5 w-5" />
								{label}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-[400px] flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
								<div className="text-center px-4">
									<CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<p className="text-muted-foreground">
										{loading ? "Loading…" : "No integrated calendar view"}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Upcoming events</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{events.length === 0 && !loading ? (
								<p className="text-sm text-muted-foreground">
									No events from the API.
								</p>
							) : null}
							{events.map((event) => (
								<div
									key={event.id}
									className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<h4 className="font-medium text-sm">{event.title}</h4>
											<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
												<Clock className="h-3 w-3 shrink-0" />
												<span>{event.time}</span>
												<span>•</span>
												<span>{event.duration}</span>
											</div>
											<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
												<MapPin className="h-3 w-3 shrink-0" />
												<span>{event.location}</span>
											</div>
											<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
												<Users className="h-3 w-3 shrink-0" />
												<span>{event.attendees.length} attendees</span>
											</div>
										</div>
										<Badge variant="secondary" className="text-xs shrink-0">
											{event.type}
										</Badge>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Quick actions</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start"
								type="button"
								disabled
							>
								<Plus className="h-4 w-4 mr-2" />
								Add event
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start"
								asChild
							>
								<Link href="/dashboard/projects">
									<CalendarIcon className="h-4 w-4 mr-2" />
									Content pages (API)
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

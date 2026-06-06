"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Calendar, Users, ArrowUpRight } from "lucide-react";
import {
	describeDashboardFetchFailure,
	getDashboardProjects,
} from "@/lib/api/dashboard";
import type { DashboardProjectRow } from "@/lib/types/dashboard";

export default function ProjectsPage() {
	const [projects, setProjects] = useState<DashboardProjectRow[]>([]);
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			const { ok, data, status, errorMessage } = await getDashboardProjects();
			if (cancelled) return;
			if (!ok || !data) {
				setBanner(describeDashboardFetchFailure(status));
				setProjects([]);
			} else {
				setBanner(null);
				setProjects(Array.isArray(data.projects) ? data.projects : []);
			}
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Content pages</h2>
					<p className="text-muted-foreground">
						Landing pages from{" "}
						<code className="rounded bg-muted px-1 text-sm">GET /api/dashboard/projects</code>. This
						view is read-only until a write API is added.
					</p>
				</div>
				<Button
					className="flex items-center gap-2"
					type="button"
					variant="secondary"
					disabled
					title="Landing page write API is not enabled yet."
				>
					<Plus className="h-4 w-4" />
					New page
				</Button>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			{projects.length === 0 && !loading ? (
				<p className="text-sm text-muted-foreground">
					No landing pages yet. Seed content from your backend or add rows in the database.
				</p>
			) : null}

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{projects.map((project) => (
					<Card key={project.id} className="hover:shadow-lg transition-shadow">
						<CardHeader>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<CardTitle className="text-lg">{project.name}</CardTitle>
									<CardDescription className="mt-2 line-clamp-3">
										{project.description}
									</CardDescription>
								</div>
								<a
									href={`/${project.slug}`}
									className="shrink-0 text-muted-foreground hover:text-foreground"
									aria-label={`Open ${project.slug}`}
								>
									<ArrowUpRight className="h-5 w-5" />
								</a>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Progress</span>
								<span className="text-sm font-medium">{project.progress}%</span>
							</div>
							<Progress value={project.progress} className="h-2" />

							<div className="flex items-center justify-between gap-2 flex-wrap">
								<Badge
									variant={
										project.status === "Published" ? "default" : "secondary"
									}
								>
									{project.status}
								</Badge>
								<Badge
									variant={
										project.priority === "High"
											? "destructive"
											: project.priority === "Medium"
												? "default"
												: "secondary"
									}
								>
									{project.priority}
								</Badge>
							</div>

							<div className="flex items-center justify-between text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4 shrink-0" />
									<span>
										{project.dueDate
											? `Updated ${new Date(project.dueDate).toLocaleDateString()}`
											: "—"}
									</span>
								</div>
								<div className="flex items-center gap-1">
									<Users className="h-4 w-4 shrink-0" />
									<span>
										{project.team.length > 0
											? `${project.team.length} members`
											: "CMS"}
									</span>
								</div>
							</div>

							{project.team.length > 0 ? (
								<div className="flex items-center gap-2">
									<div className="flex -space-x-2">
										{project.team.map((member) => (
											<Avatar
												key={member}
												className="h-8 w-8 border-2 border-background"
											>
												<AvatarFallback className="text-xs bg-blue-100 text-blue-600">
													{member}
												</AvatarFallback>
											</Avatar>
										))}
									</div>
								</div>
							) : null}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

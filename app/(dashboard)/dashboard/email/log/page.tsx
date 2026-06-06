"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	describeDashboardFetchFailure,
	getDashboardEmailSendLogs,
} from "@/lib/api/dashboard";
import type { DashboardOutboundEmailLog, DashboardOutboundEmailSource } from "@/lib/types/dashboard";
import { EmailSectionNav } from "@/components/dashboard/email-section-nav";

const SOURCE_LABELS: Record<DashboardOutboundEmailSource, string> = {
	broadcast: "Broadcast",
	template_test: "Template test",
	password_reset: "Password reset",
	contact_form: "Contact form",
	smtp_cli: "CLI test",
};

function formatWhen(iso: string): string {
	try {
		return new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return iso;
	}
}

function metaSummary(meta: Record<string, unknown>): string | null {
	if (!meta || typeof meta !== "object") return null;
	const parts: string[] = [];
	const audience = meta.audience;
	if (typeof audience === "string") parts.push(`audience: ${audience}`);
	const visitor = meta.visitor_email;
	if (typeof visitor === "string") parts.push(`from: ${visitor}`);
	const delivery = meta.delivery;
	if (typeof delivery === "string") parts.push(delivery);
	return parts.length ? parts.join(" · ") : null;
}

export default function EmailSendLogPage() {
	const [logs, setLogs] = useState<DashboardOutboundEmailLog[]>([]);
	const [total, setTotal] = useState(0);
	const [offset, setOffset] = useState(0);
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const limit = 100;

	const [sourceFilter, setSourceFilter] = useState<string>("all");
	const [successFilter, setSuccessFilter] = useState<string>("all");

	const reload = useCallback(async () => {
		setLoading(true);
		const res = await getDashboardEmailSendLogs({
			limit,
			offset,
			source: sourceFilter === "all" ? undefined : sourceFilter,
			success:
				successFilter === "ok" ? true : successFilter === "fail" ? false : null,
		});
		if (!res.ok || !res.data) {
			setBanner(describeDashboardFetchFailure(res.status, res.errorMessage));
			setLogs([]);
			setTotal(0);
		} else {
			setBanner(null);
			setLogs(Array.isArray(res.data.logs) ? res.data.logs : []);
			setTotal(typeof res.data.total === "number" ? res.data.total : 0);
		}
		setLoading(false);
	}, [offset, sourceFilter, successFilter]);

	useEffect(() => {
		void reload();
	}, [reload]);

	useEffect(() => {
		setOffset(0);
	}, [sourceFilter, successFilter]);

	const canPrev = offset > 0;
	const canNext = offset + limit < total;

	return (
		<div className="space-y-8 max-w-6xl">
			<EmailSectionNav />
			<div>
				<h2 className="text-3xl font-bold tracking-tight">Email send log</h2>
				<p className="text-muted-foreground mt-1 max-w-3xl text-sm">
					Recent outbound SMTP attempts from this site: broadcasts, template test sends, password
					reset mail, contact form notifications, and CLI tests. Use this to see whether each send
					succeeded and read error details when something failed.
				</p>
				<p className="text-sm mt-2">
					<Link href="/dashboard/email" className="text-primary underline-offset-4 hover:underline">
						Newsletter &amp; bulk
					</Link>
					{" · "}
					<Link
						href="/dashboard/email/template"
						className="text-primary underline-offset-4 hover:underline"
					>
						Template
					</Link>
				</p>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			<Card>
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<CardTitle>History</CardTitle>
					<div className="flex flex-wrap items-end gap-4">
						<div className="grid gap-1.5">
							<Label className="text-xs text-muted-foreground">Source</Label>
							<Select value={sourceFilter} onValueChange={setSourceFilter}>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="All sources" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All sources</SelectItem>
									<SelectItem value="broadcast">Broadcast</SelectItem>
									<SelectItem value="template_test">Template test</SelectItem>
									<SelectItem value="password_reset">Password reset</SelectItem>
									<SelectItem value="contact_form">Contact form</SelectItem>
									<SelectItem value="smtp_cli">CLI test</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-1.5">
							<Label className="text-xs text-muted-foreground">Result</Label>
							<Select value={successFilter} onValueChange={setSuccessFilter}>
								<SelectTrigger className="w-[160px]">
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="ok">Sent</SelectItem>
									<SelectItem value="fail">Failed</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Button type="button" variant="secondary" size="sm" onClick={() => void reload()}>
							Refresh
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground mb-3">
						Showing {logs.length} of {total} matching rows (newest first).
					</p>
					{loading ? (
						<p className="text-sm text-muted-foreground">Loading…</p>
					) : logs.length === 0 ? (
						<p className="text-sm text-muted-foreground">No log entries yet.</p>
					) : (
						<div className="rounded-md border overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="whitespace-nowrap">When</TableHead>
										<TableHead>Source</TableHead>
										<TableHead>To</TableHead>
										<TableHead className="max-w-[180px]">Subject</TableHead>
										<TableHead>Result</TableHead>
										<TableHead className="min-w-[240px]">Details</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{logs.map((row) => {
										const src = row.source in SOURCE_LABELS ? SOURCE_LABELS[row.source] : row.source;
										const extra = metaSummary(row.meta);
										return (
											<TableRow key={row.id}>
												<TableCell className="whitespace-nowrap text-muted-foreground text-xs align-top">
													{formatWhen(row.created_at)}
												</TableCell>
												<TableCell className="align-top text-sm">{src}</TableCell>
												<TableCell className="align-top text-sm font-mono text-xs">
													{row.to_email}
												</TableCell>
												<TableCell className="align-top text-xs max-w-[180px] truncate" title={row.subject}>
													{row.subject || "—"}
												</TableCell>
												<TableCell className="align-top">
													{row.success ? (
														<Badge>Sent</Badge>
													) : (
														<Badge variant="destructive">Failed</Badge>
													)}
												</TableCell>
												<TableCell className="align-top text-xs">
													{row.success ? (
														<span className="text-muted-foreground">
															{extra || (row.broadcast_id != null ? `Broadcast #${row.broadcast_id}` : "—")}
														</span>
													) : (
														<div className="space-y-1">
															{row.error_type ? (
																<p className="font-mono text-[11px] text-muted-foreground">
																	{row.error_type}
																</p>
															) : null}
															<pre className="whitespace-pre-wrap break-words font-sans text-[11px] leading-snug max-h-40 overflow-y-auto border rounded p-2 bg-muted/30">
																{row.error_message || "Unknown error"}
															</pre>
														</div>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
					{total > limit ? (
						<div className="flex items-center justify-between mt-4 gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={!canPrev || loading}
								onClick={() => setOffset((o) => Math.max(0, o - limit))}
							>
								Previous
							</Button>
							<span className="text-xs text-muted-foreground">
								Offset {offset}–{Math.min(offset + limit, total)} of {total}
							</span>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={!canNext || loading}
								onClick={() => setOffset((o) => o + limit)}
							>
								Next
							</Button>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

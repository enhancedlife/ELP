"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Database, Download, Loader2, Upload, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	describeDashboardFetchFailure,
	exportDashboardDatabaseBackup,
	getDashboardDatabaseBackupInfo,
	importDashboardDatabaseBackup,
} from "@/lib/api/dashboard";
import type { DashboardDatabaseBackupInfo } from "@/lib/types/dashboard";
import { useDashboardAuth } from "@/components/providers/dashboard-auth-provider";

export default function DatabasePage() {
	const { user, loading: authLoading } = useDashboardAuth();
	const [info, setInfo] = useState<DashboardDatabaseBackupInfo | null>(null);
	const [loadingInfo, setLoadingInfo] = useState(true);
	const [exporting, setExporting] = useState(false);
	const [importing, setImporting] = useState(false);
	const [confirmText, setConfirmText] = useState("");
	const fileRef = useRef<HTMLInputElement>(null);

	const isSuperuser = Boolean(user?.is_superuser);

	const loadInfo = useCallback(async () => {
		setLoadingInfo(true);
		const res = await getDashboardDatabaseBackupInfo();
		setLoadingInfo(false);
		if (!res.ok || !res.data) {
			setInfo(null);
			if (res.status === 401 || res.status === 403) return;
			toast.error("Could not load database info", {
				description: describeDashboardFetchFailure(res.status),
			});
			return;
		}
		setInfo(res.data);
	}, []);

	useEffect(() => {
		if (authLoading) return;
		if (!isSuperuser) {
			setLoadingInfo(false);
			return;
		}
		void loadInfo();
	}, [authLoading, isSuperuser, loadInfo]);

	async function handleExport() {
		setExporting(true);
		const res = await exportDashboardDatabaseBackup();
		setExporting(false);
		if (!res.ok) {
			toast.error("Export failed", { description: res.errorMessage });
			return;
		}
		toast.success("Database backup downloaded.");
	}

	async function handleImport() {
		const file = fileRef.current?.files?.[0];
		if (!file) {
			toast.error("Choose a backup file first.");
			return;
		}
		if (confirmText.trim().toUpperCase() !== "REPLACE") {
			toast.error('Type REPLACE in the confirmation box to continue.');
			return;
		}
		if (
			!window.confirm(
				"This will replace ALL current database data with the backup. Continue?",
			)
		) {
			return;
		}
		setImporting(true);
		const res = await importDashboardDatabaseBackup(file);
		setImporting(false);
		if (!res.ok || !res.data) {
			toast.error("Import failed", {
				description: res.errorMessage || `HTTP ${res.status ?? "—"}`,
				duration: 25_000,
			});
			return;
		}
		toast.success(
			`Database restored (${res.data.bytes_restored.toLocaleString()} bytes). Refresh the app.`,
			{ duration: 15_000 },
		);
		setConfirmText("");
		if (fileRef.current) fileRef.current.value = "";
		void loadInfo();
	}

	if (authLoading || loadingInfo) {
		return (
			<div className="flex items-center gap-2 text-muted-foreground">
				<Loader2 className="h-5 w-5 animate-spin" />
				Loading…
			</div>
		);
	}

	if (!isSuperuser) {
		return (
			<div className="space-y-4">
				<h2 className="text-3xl font-bold tracking-tight">Database</h2>
				<Card>
					<CardContent className="pt-6 text-sm text-muted-foreground">
						Database backup and restore is available to superuser accounts only.
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">Database</h2>
				<p className="text-muted-foreground mt-1">
					Export a full backup or restore from a file (replaces all existing data).
				</p>
			</div>

			{info ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Database className="h-5 w-5" />
							Current database
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
						<div>
							<span className="text-muted-foreground">Engine</span>
							<p className="font-medium capitalize">{info.engine}</p>
						</div>
						<div>
							<span className="text-muted-foreground">Name</span>
							<p className="font-medium font-mono">{info.database_name || "—"}</p>
						</div>
						<div>
							<span className="text-muted-foreground">Host / path</span>
							<p className="font-medium font-mono break-all">{info.host || "—"}</p>
						</div>
						<div>
							<span className="text-muted-foreground">Export format</span>
							<p className="font-medium">{info.export_format || "—"}</p>
						</div>
						<div className="sm:col-span-2 flex flex-wrap gap-2">
							<Badge variant={info.can_export ? "default" : "secondary"}>
								Export {info.can_export ? "ready" : "unavailable"}
							</Badge>
							<Badge variant={info.can_import ? "default" : "secondary"}>
								Import {info.can_import ? "ready" : "unavailable"}
							</Badge>
							{info.engine === "mysql" ? (
								<>
									<Badge variant={info.tools.mysqldump ? "outline" : "destructive"}>
										mysqldump {info.tools.mysqldump ? "ok" : "missing"}
									</Badge>
									<Badge variant={info.tools.mysql ? "outline" : "destructive"}>
										mysql {info.tools.mysql ? "ok" : "missing"}
									</Badge>
								</>
							) : null}
						</div>
					</CardContent>
				</Card>
			) : null}

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Download className="h-5 w-5" />
							Export backup
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Download a full database dump now. MySQL backups are gzip-compressed SQL
							(`.sql.gz`). SQLite backups are the database file.
						</p>
						<Button
							className="w-full"
							disabled={exporting || !info?.can_export}
							onClick={() => void handleExport()}
						>
							{exporting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Download className="mr-2 h-4 w-4" />
							)}
							Download backup
						</Button>
					</CardContent>
				</Card>

				<Card className="border-destructive/40">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg text-destructive">
							<AlertTriangle className="h-5 w-5" />
							Import backup
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Upload a backup file to <strong>replace the entire database</strong>.
							Accepted: `.sql`, `.sql.gz`, `.sqlite3`, `.db` (max{" "}
							{info?.max_import_mb ?? 500} MB).
						</p>
						<div className="grid gap-2">
							<Label htmlFor="db-backup-file">Backup file</Label>
							<Input
								id="db-backup-file"
								ref={fileRef}
								type="file"
								accept=".sql,.gz,.sqlite3,.db,application/gzip,application/x-gzip"
								disabled={importing || !info?.can_import}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="db-confirm">Type REPLACE to confirm</Label>
							<Input
								id="db-confirm"
								value={confirmText}
								onChange={(e) => setConfirmText(e.target.value)}
								placeholder="REPLACE"
								disabled={importing}
								autoComplete="off"
							/>
						</div>
						<Button
							variant="destructive"
							className="w-full"
							disabled={importing || !info?.can_import}
							onClick={() => void handleImport()}
						>
							{importing ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Upload className="mr-2 h-4 w-4" />
							)}
							Import and replace database
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

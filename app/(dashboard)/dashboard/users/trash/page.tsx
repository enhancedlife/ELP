"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileUp, RotateCcw, Search, Trash2 } from "lucide-react";
import { useDashboardAuth } from "@/components/providers/dashboard-auth-provider";
import {
	bulkDashboardUsers,
	describeDashboardFetchFailure,
	getDashboardUsers,
} from "@/lib/api/dashboard";
import { isDashboardFullAdmin } from "@/lib/auth";
import type { DashboardUserRow } from "@/lib/types/dashboard";

function formatDeletedAt(iso: string | null | undefined): string {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString();
}

/** Parse emails from plain text — one per line; ignores blanks and # comments. */
function parseEmailListText(text: string): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const rawLine of text.split(/\r?\n/)) {
		let line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		if (line.includes("#")) {
			line = line.split("#")[0].trim();
		}
		line = line.replace(/^["']|["']$/g, "").trim().toLowerCase();
		if (!line || !line.includes("@")) continue;
		if (!seen.has(line)) {
			seen.add(line);
			out.push(line);
		}
	}
	return out;
}

function selectUsersByEmails(
	trashUsers: DashboardUserRow[],
	emails: string[],
): { matchedIds: number[]; notInTrash: string[] } {
	const byEmail = new Map<string, DashboardUserRow>();
	for (const u of trashUsers) {
		const e = (u.email || "").trim().toLowerCase();
		if (e && e !== "—") byEmail.set(e, u);
	}
	const matchedIds: number[] = [];
	const notInTrash: string[] = [];
	for (const email of emails) {
		const user = byEmail.get(email);
		if (user) {
			matchedIds.push(user.id);
		} else {
			notInTrash.push(email);
		}
	}
	return { matchedIds, notInTrash };
}

export default function UsersTrashPage() {
	const { user: session } = useDashboardAuth();
	const canPermanentDelete = isDashboardFullAdmin(session);
	const [users, setUsers] = useState<DashboardUserRow[]>([]);
	const [query, setQuery] = useState("");
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<Set<number>>(new Set());
	const [restoreOpen, setRestoreOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [working, setWorking] = useState(false);
	const [emailListText, setEmailListText] = useState("");
	const [emailListSummary, setEmailListSummary] = useState<string | null>(null);

	const reloadTrash = useCallback(async () => {
		setLoading(true);
		const { ok, data, status, errorMessage } = await getDashboardUsers(5000, {
			trash: true,
		});
		if (!ok || !data) {
			setBanner(describeDashboardFetchFailure(status, errorMessage));
			setUsers([]);
		} else {
			setBanner(null);
			setUsers(Array.isArray(data.users) ? data.users : []);
		}
		setSelected(new Set());
		setLoading(false);
	}, []);

	useEffect(() => {
		void reloadTrash();
	}, [reloadTrash]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return users;
		return users.filter(
			(u) =>
				u.name.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q) ||
				u.role.toLowerCase().includes(q),
		);
	}, [users, query]);

	const filteredIds = useMemo(() => filtered.map((u) => u.id), [filtered]);
	const allFilteredSelected =
		filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
	const someFilteredSelected =
		filteredIds.some((id) => selected.has(id)) && !allFilteredSelected;

	function toggleOne(id: number, checked: boolean) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	}

	function toggleAllFiltered(checked: boolean) {
		setSelected((prev) => {
			const next = new Set(prev);
			for (const id of filteredIds) {
				if (checked) next.add(id);
				else next.delete(id);
			}
			return next;
		});
	}

	async function restoreSelected() {
		const ids = Array.from(selected);
		if (ids.length === 0) return;
		setWorking(true);
		const res = await bulkDashboardUsers("restore", ids);
		setWorking(false);
		setRestoreOpen(false);
		if (!res.ok || !res.data) {
			toast.error(res.errorMessage || describeDashboardFetchFailure(res.status));
			return;
		}
		const { ok, failed } = res.data;
		if (ok.length > 0) {
			toast.success(
				ok.length === 1 ? "1 user restored." : `${ok.length} users restored.`,
			);
		}
		if (failed.length > 0) {
			toast.error(
				failed.length === 1
					? failed[0].detail
					: `${failed.length} users could not be restored.`,
			);
		}
		await reloadTrash();
	}

	async function permanentlyDeleteSelected() {
		const ids = Array.from(selected);
		if (ids.length === 0) return;
		setWorking(true);
		const res = await bulkDashboardUsers("permanent_delete", ids);
		setWorking(false);
		setDeleteOpen(false);
		if (!res.ok || !res.data) {
			toast.error(res.errorMessage || describeDashboardFetchFailure(res.status));
			return;
		}
		const { ok, failed } = res.data;
		if (ok.length > 0) {
			toast.success(
				ok.length === 1
					? "1 user permanently deleted."
					: `${ok.length} users permanently deleted.`,
			);
		}
		if (failed.length > 0) {
			toast.error(
				failed.length === 1
					? failed[0].detail
					: `${failed.length} users could not be deleted.`,
			);
		}
		await reloadTrash();
	}

	function applyEmailListSelection(text: string) {
		const emails = parseEmailListText(text);
		if (emails.length === 0) {
			toast.error("No valid emails found. Put one email per line in the file or text box.");
			setEmailListSummary(null);
			return;
		}
		const { matchedIds, notInTrash } = selectUsersByEmails(users, emails);
		setSelected(new Set(matchedIds));
		const parts: string[] = [];
		if (matchedIds.length > 0) {
			parts.push(
				`${matchedIds.length} user${matchedIds.length === 1 ? "" : "s"} selected from ${emails.length} email${emails.length === 1 ? "" : "s"} in your list.`,
			);
		} else {
			parts.push("No trashed users matched any email in your list.");
		}
		if (notInTrash.length > 0) {
			const preview = notInTrash.slice(0, 5).join(", ");
			const more =
				notInTrash.length > 5 ? ` (+${notInTrash.length - 5} more)` : "";
			parts.push(
				`${notInTrash.length} email${notInTrash.length === 1 ? "" : "s"} not in trash: ${preview}${more}`,
			);
		}
		setEmailListSummary(parts.join(" "));
		if (matchedIds.length > 0) {
			toast.success(
				`Selected ${matchedIds.length} user${matchedIds.length === 1 ? "" : "s"} for restore.`,
			);
		} else {
			toast.warning("No matching users in trash.");
		}
	}

	function handleEmailFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		if (!file.name.toLowerCase().endsWith(".txt") && file.type && file.type !== "text/plain") {
			toast.error("Please upload a plain .txt file (one email per line).");
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const text = typeof reader.result === "string" ? reader.result : "";
			setEmailListText(text);
			applyEmailListSelection(text);
		};
		reader.onerror = () => toast.error("Could not read the file.");
		reader.readAsText(file);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-2" asChild>
						<Link href="/dashboard/users">
							<ArrowLeft className="h-4 w-4" />
							Back to users
						</Link>
					</Button>
					<h2 className="text-3xl font-bold tracking-tight">User trash</h2>
					<p className="text-muted-foreground">
						Soft-deleted users are listed here. Restore them to the main list, or permanently
						delete them from the database{canPermanentDelete ? "" : " (super admin only)"}.
					</p>
				</div>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			{selected.size > 0 ? (
				<Card className="border-primary/30 bg-primary/5">
					<CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
						<p className="text-sm font-medium">
							{selected.size} user{selected.size === 1 ? "" : "s"} selected
						</p>
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setSelected(new Set())}
							>
								Clear selection
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="gap-2"
								disabled={working}
								onClick={() => setRestoreOpen(true)}
							>
								<RotateCcw className="h-4 w-4" />
								Restore
							</Button>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								className="gap-2"
								disabled={working || !canPermanentDelete}
								onClick={() => setDeleteOpen(true)}
							>
								<Trash2 className="h-4 w-4" />
								Delete permanently
							</Button>
						</div>
					</CardContent>
				</Card>
			) : null}

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Select by email list</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Upload a <code className="rounded bg-muted px-1">.txt</code> file with one email
						per line, or paste emails below. Matching trashed users will be selected so you
						can restore them in bulk.
					</p>
					<div className="flex flex-wrap items-center gap-3">
						<Label htmlFor="email-list-file" className="sr-only">
							Upload email list
						</Label>
						<Input
							id="email-list-file"
							type="file"
							accept=".txt,text/plain"
							className="max-w-xs cursor-pointer"
							onChange={handleEmailFileChange}
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="gap-2"
							disabled={loading}
							onClick={() => applyEmailListSelection(emailListText)}
						>
							<FileUp className="h-4 w-4" />
							Select matching users
						</Button>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email-list-paste">Or paste emails (one per line)</Label>
						<Textarea
							id="email-list-paste"
							placeholder={"user1@example.com\nuser2@example.com\n# lines starting with # are ignored"}
							value={emailListText}
							onChange={(e) => setEmailListText(e.target.value)}
							rows={5}
							className="font-mono text-sm"
						/>
					</div>
					{emailListSummary ? (
						<p className="text-sm text-muted-foreground rounded-lg border bg-muted/40 px-3 py-2">
							{emailListSummary}
						</p>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-6">
					<div className="relative">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							placeholder="Search trash..."
							className="pl-8"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						Trashed users
						{loading ? " …" : ` (${filtered.length})`}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{!loading && filtered.length === 0 ? (
						<p className="text-sm text-muted-foreground py-8 text-center">
							No users in trash.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10">
										<Checkbox
											checked={
												allFilteredSelected
													? true
													: someFilteredSelected
														? "indeterminate"
														: false
											}
											onCheckedChange={(v) => toggleAllFiltered(v === true)}
											aria-label="Select all trashed users"
										/>
									</TableHead>
									<TableHead>User</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Deleted</TableHead>
									<TableHead>Last login</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((user) => (
									<TableRow
										key={user.id}
										data-state={selected.has(user.id) ? "selected" : undefined}
									>
										<TableCell>
											<Checkbox
												checked={selected.has(user.id)}
												onCheckedChange={(v) => toggleOne(user.id, v === true)}
												aria-label={`Select ${user.name}`}
											/>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-8 w-8">
													<AvatarFallback>
														{user.name
															.split(/\s+/)
															.filter(Boolean)
															.map((n) => n[0])
															.join("")
															.slice(0, 2)
															.toUpperCase() || "?"}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="font-medium">{user.name}</p>
													<p className="text-sm text-muted-foreground">{user.email}</p>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="secondary">{user.role}</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{formatDeletedAt(user.deletedAt)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{user.lastSeen}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Restore users?</DialogTitle>
						<DialogDescription>
							{selected.size === 1
								? "This user will be reactivated and appear on the main Users list again."
								: `${selected.size} users will be reactivated and appear on the main Users list again.`}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setRestoreOpen(false)}
							disabled={working}
						>
							Cancel
						</Button>
						<Button type="button" disabled={working} onClick={() => void restoreSelected()}>
							{working ? "Restoring…" : "Restore"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Permanently delete?</DialogTitle>
						<DialogDescription>
							{selected.size === 1
								? "This user and their related data will be removed from the database. This cannot be undone."
								: `${selected.size} users and their related data will be removed from the database. This cannot be undone.`}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setDeleteOpen(false)}
							disabled={working}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={working}
							onClick={() => void permanentlyDeleteSelected()}
						>
							{working ? "Deleting…" : "Delete permanently"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

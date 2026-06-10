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
import { ArrowLeft, RotateCcw, Search, Trash2 } from "lucide-react";
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

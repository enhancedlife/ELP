"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Search,
	Plus,
	MoreHorizontal,
	Mail,
	Phone,
	Filter,
} from "lucide-react";
import { ToolbarDropdown } from "@/components/shared/toolbar-dropdown";
import { Label } from "@/components/ui/label";
import { useDashboardAuth } from "@/components/providers/dashboard-auth-provider";
import {
	describeDashboardFetchFailure,
	getDashboardUsers,
	patchDashboardUser,
	postDashboardUser,
} from "@/lib/api/dashboard";
import { isDashboardFullAdmin } from "@/lib/auth";
import type { DashboardUserRow } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const menuBtn =
	"inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50";

type NewAccountRole = "member" | "manager" | "admin";

export default function UsersPage() {
	const router = useRouter();
	const { user: session } = useDashboardAuth();
	const canCreateSuperAdmin = isDashboardFullAdmin(session);
	const [users, setUsers] = useState<DashboardUserRow[]>([]);
	const [query, setQuery] = useState("");
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [viewUser, setViewUser] = useState<DashboardUserRow | null>(null);
	const [addOpen, setAddOpen] = useState(false);
	const [newEmail, setNewEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [newName, setNewName] = useState("");
	const [newAccountRole, setNewAccountRole] = useState<NewAccountRole>("member");
	const [savingUser, setSavingUser] = useState(false);

	const reloadUsers = useCallback(async () => {
		setLoading(true);
		const { ok, data, status } = await getDashboardUsers();
		if (!ok || !data) {
			setBanner(describeDashboardFetchFailure(status));
			setUsers([]);
		} else {
			setBanner(null);
			setUsers(Array.isArray(data.users) ? data.users : []);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (cancelled) return;
			await reloadUsers();
		})();
		return () => {
			cancelled = true;
		};
	}, [reloadUsers]);

	const filtered = users.filter((u) => {
		const q = query.trim().toLowerCase();
		if (!q) return true;
		return (
			u.name.toLowerCase().includes(q) ||
			u.email.toLowerCase().includes(q) ||
			u.role.toLowerCase().includes(q)
		);
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Users</h2>
					<p className="text-muted-foreground">
						Browse accounts, open a user for full details (including imported Woo addresses),
						password resets, or create users here / in{" "}
						<code className="rounded bg-muted px-1 text-sm">/admin/</code>. Member imports use{" "}
						<code className="rounded bg-muted px-1 text-sm">import_wordpress_users</code>{" "}
						against this same database.
					</p>
				</div>
				<Button
					className="flex items-center gap-2"
					type="button"
					onClick={() => setAddOpen(true)}
				>
					<Plus className="h-4 w-4" />
					Add user
				</Button>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			<Card>
				<CardContent className="p-6">
					<div className="flex items-center gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
							<Input
								placeholder="Search users..."
								className="pl-8"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</div>
						<Button variant="outline" className="flex items-center gap-2" type="button" disabled>
							<Filter className="h-4 w-4" />
							Filter
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						All users
						{loading ? " …" : ` (${filtered.length})`}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Last login</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar className="h-8 w-8">
												<AvatarImage src={user.avatar || undefined} alt={user.name} />
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
												<Link
													href={`/dashboard/users/${user.id}`}
													className="font-medium text-primary hover:underline"
												>
													{user.name}
												</Link>
												<div className="text-sm text-muted-foreground">
													{user.email}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												user.role === "Admin" ? "default" : "secondary"
											}
										>
											{user.role}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												user.status === "Active"
													? "default"
													: user.status === "Inactive"
														? "secondary"
														: "outline"
											}
										>
											{user.status}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{user.lastSeen}
									</TableCell>
									<TableCell className="text-right">
										<div className="inline-flex justify-end">
											<ToolbarDropdown
												align="end"
												ariaLabel={`Actions for ${user.name}`}
												variant="ghost"
												size="icon"
												panelWidth={220}
												buttonClassName="h-8 w-8 shrink-0 text-foreground"
												panelClassName="z-[500] shadow-lg"
												triggerChildren={
													<MoreHorizontal className="h-4 w-4" aria-hidden />
												}
											>
												{(close) => (
													<div className="flex flex-col gap-0.5 py-0.5">
														<button
															type="button"
															className={cn(menuBtn)}
															disabled={!user.email || user.email === "—"}
															onClick={() => {
																close();
																const addr = user.email?.trim();
																if (addr && addr !== "—") {
																	window.location.href = `mailto:${addr}`;
																}
															}}
														>
															<Mail className="h-4 w-4 shrink-0" aria-hidden />
															Send email
														</button>
														<button type="button" className={cn(menuBtn)} disabled>
															<Phone className="h-4 w-4 shrink-0" aria-hidden />
															Call
														</button>
														<div
															className="my-1 h-px bg-border"
															role="separator"
														/>
														<button
															type="button"
															className={cn(menuBtn)}
															onClick={() => {
																close();
																router.push(`/dashboard/users/${user.id}`);
															}}
														>
															Open profile
														</button>
														<button
															type="button"
															className={cn(menuBtn)}
															onClick={() => {
																close();
																setViewUser(user);
															}}
														>
															Quick view
														</button>
														<div
															className="my-1 h-px bg-border"
															role="separator"
														/>
														<button
															type="button"
															className={cn(menuBtn)}
															disabled={user.status !== "Active"}
															onClick={() => {
																close();
																void (async () => {
																	const res = await patchDashboardUser(user.id, {
																		is_active: false,
																	});
																	if (!res.ok) {
																		alert(res.errorMessage || `HTTP ${res.status}`);
																		return;
																	}
																	await reloadUsers();
																})();
															}}
														>
															Deactivate
														</button>
														<button
															type="button"
															className={cn(menuBtn)}
															disabled={user.status === "Active"}
															onClick={() => {
																close();
																void (async () => {
																	const res = await patchDashboardUser(user.id, {
																		is_active: true,
																	});
																	if (!res.ok) {
																		alert(res.errorMessage || `HTTP ${res.status}`);
																		return;
																	}
																	await reloadUsers();
																})();
															}}
														>
															Activate
														</button>
													</div>
												)}
											</ToolbarDropdown>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add user</DialogTitle>
						<DialogDescription>
							Creates a Django user. Password is required; share it securely with the teammate.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3 py-2">
						<div className="grid gap-2">
							<Label htmlFor="nu-email">Email</Label>
							<Input
								id="nu-email"
								type="email"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								placeholder="name@company.com"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="nu-pass">Temporary password</Label>
							<Input
								id="nu-pass"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="At least 8 characters"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="nu-name">Display name (optional)</Label>
							<Input
								id="nu-name"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								placeholder="Full name"
							/>
						</div>
						<div className="grid gap-2">
							<Label>Account type</Label>
							<Select
								value={newAccountRole}
								onValueChange={(v) => setNewAccountRole(v as NewAccountRole)}
							>
								<SelectTrigger id="nu-role">
									<SelectValue placeholder="Select role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="member">Member (site only)</SelectItem>
									<SelectItem value="manager">Manager (limited dashboard)</SelectItem>
									{canCreateSuperAdmin ? (
										<SelectItem value="admin">Super admin (full dashboard)</SelectItem>
									) : null}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								Need a different account type or access? Contact the development team.
							</p>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={savingUser}
							onClick={() => {
								void (async () => {
									setSavingUser(true);
									const isAdmin = newAccountRole === "admin";
									const isManagerRole = newAccountRole === "manager";
									const res = await postDashboardUser({
										email: newEmail.trim(),
										password: newPassword,
										name: newName.trim() || undefined,
										is_staff: isAdmin || isManagerRole,
										is_superuser: isAdmin,
									});
									setSavingUser(false);
									if (!res.ok) {
										alert(res.errorMessage || `HTTP ${res.status}`);
										return;
									}
									setAddOpen(false);
									setNewEmail("");
									setNewPassword("");
									setNewName("");
									setNewAccountRole("member");
									await reloadUsers();
								})();
							}}
						>
							{savingUser ? "Creating…" : "Create user"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={viewUser != null} onOpenChange={(o) => !o && setViewUser(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>User</DialogTitle>
						<DialogDescription>User #{viewUser?.id}</DialogDescription>
					</DialogHeader>
					{viewUser ? (
						<>
							<dl className="grid gap-2 text-sm">
								<div>
									<dt className="text-muted-foreground">Name</dt>
									<dd className="font-medium">{viewUser.name}</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Email</dt>
									<dd>
										<a href={`mailto:${viewUser.email}`} className="text-primary underline">
											{viewUser.email}
										</a>
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Role</dt>
									<dd>{viewUser.role}</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Status</dt>
									<dd>{viewUser.status}</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Last seen</dt>
									<dd>{viewUser.lastSeen}</dd>
								</div>
							</dl>
							<div className="flex flex-wrap gap-2 pt-2">
								<Button type="button" size="sm" asChild>
									<Link href={`/dashboard/users/${viewUser.id}`}>Open full profile</Link>
								</Button>
							</div>
						</>
					) : null}
					<p className="text-xs text-muted-foreground pt-2">
						Docs:{" "}
						<Link href="/staff" className="underline">
							/staff
						</Link>
					</p>
				</DialogContent>
			</Dialog>
		</div>
	);
}

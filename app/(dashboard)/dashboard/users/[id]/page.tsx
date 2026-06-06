"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDashboardAuth } from "@/components/providers/dashboard-auth-provider";
import {
	describeDashboardFetchFailure,
	getDashboardUser,
	patchDashboardUser,
} from "@/lib/api/dashboard";
import { isDashboardFullAdmin } from "@/lib/auth";
import type { DashboardUserDetail } from "@/lib/types/dashboard";

function formatIso(iso: string | null | undefined): string {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleString();
	} catch {
		return iso;
	}
}

const WOO_LABELS: Record<string, string> = {
	first_name: "First name",
	last_name: "Last name",
	company: "Company",
	email: "Email",
	phone: "Phone",
	address_1: "Address line 1",
	address_2: "Address line 2",
	city: "City",
	state: "State / region",
	postcode: "Postcode",
	country: "Country",
};

function AddressBlock({
	title,
	data,
}: {
	title: string;
	data: Record<string, string>;
}) {
	const keys = Object.keys(data);
	if (keys.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">No {title.toLowerCase()} on file.</p>
		);
	}
	return (
		<div className="rounded-lg border bg-muted/30 p-4">
			<h4 className="mb-3 text-sm font-semibold">{title}</h4>
			<dl className="grid gap-2 text-sm sm:grid-cols-2">
				{keys.map((k) => (
					<div key={k} className={k.startsWith("address") ? "sm:col-span-2" : ""}>
						<dt className="text-muted-foreground">{WOO_LABELS[k] ?? k}</dt>
						<dd className="break-words font-medium">{data[k]}</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

export default function DashboardUserDetailPage() {
	const { user: session } = useDashboardAuth();
	const sessionIsFullAdmin = isDashboardFullAdmin(session);
	const params = useParams();
	const idParam = params?.id;
	const userId =
		typeof idParam === "string" ? Number.parseInt(idParam, 10) : Number.NaN;

	const [user, setUser] = useState<DashboardUserDetail | null>(null);
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [savingProfile, setSavingProfile] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [isStaff, setIsStaff] = useState(false);
	const [isSuperuser, setIsSuperuser] = useState(false);

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const load = useCallback(async () => {
		if (!Number.isFinite(userId)) {
			setBanner("Invalid user id.");
			setUser(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		const { ok, data, status } = await getDashboardUser(userId);
		if (!ok || !data) {
			setBanner(describeDashboardFetchFailure(status));
			setUser(null);
			setLoading(false);
			return;
		}
		setBanner(null);
		setUser(data);
		setFirstName(data.first_name ?? "");
		setLastName(data.last_name ?? "");
		setIsActive(data.is_active);
		setIsStaff(data.is_staff);
		setIsSuperuser(data.is_superuser);
		setLoading(false);
	}, [userId]);

	useEffect(() => {
		void load();
	}, [load]);

	async function handleSaveProfile() {
		if (!Number.isFinite(userId)) return;
		setSavingProfile(true);
		const body: Parameters<typeof patchDashboardUser>[1] = {
			first_name: firstName.trim(),
			last_name: lastName.trim(),
			is_active: isActive,
			is_staff: isStaff,
		};
		if (sessionIsFullAdmin) {
			body.is_superuser = isSuperuser;
		}
		const res = await patchDashboardUser(userId, body);
		setSavingProfile(false);
		if (!res.ok || !res.data) {
			toast.error("Could not save", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setUser(res.data);
		toast.success("Account updated");
	}

	async function handleSavePassword() {
		if (!Number.isFinite(userId)) return;
		if (newPassword !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}
		if (!newPassword) {
			toast.error("Enter a new password");
			return;
		}
		setSavingPassword(true);
		const res = await patchDashboardUser(userId, {
			password: newPassword,
			password_confirmation: confirmPassword,
		});
		setSavingPassword(false);
		if (!res.ok) {
			toast.error("Could not update password", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setUser(res.data);
		setNewPassword("");
		setConfirmPassword("");
		toast.success("Password updated", {
			description: "API tokens for this user were cleared; they must sign in again.",
		});
	}

	if (!Number.isFinite(userId)) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-destructive">Invalid user id.</p>
				<Button variant="outline" asChild>
					<Link href="/dashboard/users">Back to users</Link>
				</Button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
				<Loader2 className="h-5 w-5 animate-spin" aria-hidden />
				<span className="text-sm">Loading user…</span>
			</div>
		);
	}

	if (banner || !user) {
		return (
			<div className="space-y-4">
				{banner ? (
					<p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
						{banner}
					</p>
				) : null}
				<Button variant="outline" asChild>
					<Link href="/dashboard/users">Back to users</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="flex flex-wrap items-center gap-3">
				<Button variant="ghost" size="sm" asChild className="gap-1 pl-0">
					<Link href="/dashboard/users">
						<ArrowLeft className="h-4 w-4" aria-hidden />
						Users
					</Link>
				</Button>
			</div>

			<div>
				<h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
				<p className="text-sm text-muted-foreground">
					User #{user.id} · {user.email}
				</p>
				<div className="mt-2 flex flex-wrap gap-2">
					<Badge variant={user.role === "Admin" ? "default" : "secondary"}>
						{user.role}
					</Badge>
					<Badge variant={user.is_active ? "default" : "secondary"}>
						{user.is_active ? "Active" : "Inactive"}
					</Badge>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Account</CardTitle>
					<CardDescription>
						Username and email are managed in Django Admin if you need to change them.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<dl className="grid gap-3 text-sm sm:grid-cols-2">
						<div>
							<dt className="text-muted-foreground">Username</dt>
							<dd className="font-mono text-xs">{user.username}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Email</dt>
							<dd>
								<a
									href={`mailto:${user.email}`}
									className="text-primary underline underline-offset-4"
								>
									{user.email}
								</a>
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Joined</dt>
							<dd>{formatIso(user.date_joined)}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Last login</dt>
							<dd>{formatIso(user.last_login_iso)}</dd>
						</div>
					</dl>

					<div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="du-first">First name</Label>
							<Input
								id="du-first"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								autoComplete="off"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="du-last">Last name</Label>
							<Input
								id="du-last"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								autoComplete="off"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-4 rounded-lg border p-4">
						<div className="flex items-center justify-between gap-4">
							<div>
								<Label htmlFor="du-active">Active</Label>
								<p className="text-xs text-muted-foreground">
									Inactive users cannot sign in.
								</p>
							</div>
							<Switch
								id="du-active"
								checked={isActive}
								onCheckedChange={setIsActive}
							/>
						</div>
						<div className="flex items-center justify-between gap-4">
							<div>
								<Label htmlFor="du-staff">Staff</Label>
								<p className="text-xs text-muted-foreground">
									Can access staff tools when allowed by settings.
								</p>
							</div>
							<Switch
								id="du-staff"
								checked={isStaff}
								onCheckedChange={setIsStaff}
							/>
						</div>
						{sessionIsFullAdmin ? (
							<div className="flex items-center justify-between gap-4">
								<div>
									<Label htmlFor="du-super">Superuser</Label>
									<p className="text-xs text-muted-foreground">
										Full Django admin and dashboard access.
									</p>
								</div>
								<Switch
									id="du-super"
									checked={isSuperuser}
									onCheckedChange={setIsSuperuser}
								/>
							</div>
						) : null}
					</div>

					<Button
						type="button"
						disabled={savingProfile}
						onClick={() => void handleSaveProfile()}
					>
						{savingProfile ? "Saving…" : "Save account"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Addresses (import)</CardTitle>
					<CardDescription>
						Billing and shipping from WooCommerce / WordPress export, if present.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<AddressBlock
						title="Billing"
						data={user.member_profile?.billing ?? {}}
					/>
					<AddressBlock
						title="Shipping"
						data={user.member_profile?.shipping ?? {}}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Password</CardTitle>
					<CardDescription>
						Set a new password for this user. Their existing API tokens will be revoked.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2 sm:max-w-md">
						<Label htmlFor="du-pass">New password</Label>
						<Input
							id="du-pass"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							autoComplete="new-password"
						/>
					</div>
					<div className="grid gap-2 sm:max-w-md">
						<Label htmlFor="du-pass2">Confirm password</Label>
						<Input
							id="du-pass2"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							autoComplete="new-password"
						/>
					</div>
					<Button
						type="button"
						variant="secondary"
						disabled={savingPassword}
						onClick={() => void handleSavePassword()}
					>
						{savingPassword ? "Updating…" : "Update password"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

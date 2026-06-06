"use client";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppSwitcher } from "./app-switcher";
import { DashboardNotificationsMenu } from "./dashboard-notifications-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToolbarDropdown } from "@/components/shared/toolbar-dropdown";
import { useDashboardAuth } from "@/components/providers/dashboard-auth-provider";

function userInitials(name: string, email: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
	}
	if (name.length >= 2) return name.slice(0, 2).toUpperCase();
	if (email.length >= 2) return email.slice(0, 2).toUpperCase();
	return "?";
}

export function Topbar() {
	const { user, logout } = useDashboardAuth();
	const displayName = user?.name?.trim() || user?.email || "User";
	const email = user?.email || "";
	const initials = user ? userInitials(user.name || "", user.email || "") : "?";

	return (
		<header className="sticky top-0 z-50 isolate grid h-16 w-full shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="min-w-0 max-w-xl">
				<div className="relative w-full">
					<Search
						className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden
					/>
					<Input
						type="search"
						placeholder="Search anything..."
						className="h-10 w-full min-w-0 border-0 bg-muted/50 pl-10 pr-4 shadow-none focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20"
					/>
				</div>
			</div>

			<nav
				className="flex shrink-0 items-center gap-2 sm:gap-3"
				aria-label="Dashboard toolbar"
			>
				<AppSwitcher />
				<ThemeToggle />
				<DashboardNotificationsMenu />

				<ToolbarDropdown
					align="end"
					ariaLabel="Account menu"
					panelWidth={256}
					buttonClassName="relative h-9 w-9 shrink-0 rounded-full p-0 hover:bg-muted"
					triggerChildren={
						<Avatar className="h-8 w-8 ring-2 ring-background">
							<AvatarImage src={undefined} alt={displayName} />
							<AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
								{initials}
							</AvatarFallback>
						</Avatar>
					}
				>
					{(close) => (
						<>
							<div className="flex items-center gap-3 border-b px-2 pb-3 pt-1">
								<Avatar className="h-10 w-10">
									<AvatarImage src={undefined} alt={displayName} />
									<AvatarFallback className="bg-primary text-sm text-primary-foreground">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="flex min-w-0 flex-col space-y-1">
									<p className="truncate text-sm font-medium leading-none">{displayName}</p>
									<p className="truncate text-xs leading-none text-muted-foreground">
										{email}
									</p>
								</div>
							</div>
							<div className="flex flex-col gap-0.5 p-1 pt-2">
								<Link
									href="/dashboard/settings/appearance"
									className="rounded-md px-3 py-2 text-sm hover:bg-accent"
									onClick={() => close()}
								>
									Appearance
								</Link>
								<Link
									href="/dashboard/settings/notifications"
									className="rounded-md px-3 py-2 text-sm hover:bg-accent"
									onClick={() => close()}
								>
									Notifications
								</Link>
								<button
									type="button"
									className="rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-accent dark:text-red-400"
									onClick={() => {
										close();
										void logout().then(() => {
											window.location.assign("/login");
										});
									}}
								>
									Log out
								</button>
							</div>
						</>
					)}
				</ToolbarDropdown>
			</nav>
		</header>
	);
}

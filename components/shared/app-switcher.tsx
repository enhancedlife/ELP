"use client";
import Link from "next/link";
import { ToolbarDropdown } from "@/components/shared/toolbar-dropdown";
import {
	Grid3X3,
	LayoutDashboard,
	Calendar,
	FileText,
	BarChart3,
	Settings,
	Users,
	FolderKanban,
	MessageSquare,
	Database,
} from "lucide-react";

const apps = [
	{ name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", description: "Overview" },
	{ name: "Messages", icon: MessageSquare, href: "/dashboard/messages", description: "Inbox" },
	{ name: "Analytics", icon: BarChart3, href: "/dashboard/analytics", description: "Insights" },
	{ name: "Calendar", icon: Calendar, href: "/dashboard/calendar", description: "Schedule" },
	{ name: "Documents", icon: FileText, href: "/dashboard/documents", description: "Files" },
	{ name: "Users", icon: Users, href: "/dashboard/users", description: "Accounts" },
	{ name: "Projects", icon: FolderKanban, href: "/dashboard/projects", description: "Projects" },
	{ name: "Database", icon: Database, href: "/dashboard/database", description: "Data" },
	{ name: "Settings", icon: Settings, href: "/dashboard/settings", description: "Configuration" },
];

export function AppSwitcher() {
	return (
		<ToolbarDropdown
			align="start"
			ariaLabel="Switch applications"
			panelWidth={320}
			buttonClassName="h-8 w-8"
			triggerChildren={<Grid3X3 className="h-4 w-4" />}
		>
			{(close) => (
				<>
					<p className="mb-3 px-1 text-sm font-medium text-muted-foreground">Dashboard</p>
					<div className="grid grid-cols-3 gap-2">
						{apps.map((app) => {
							const Icon = app.icon;
							return (
								<Link
									key={app.name}
									href={app.href}
									onClick={() => close()}
									className="flex flex-col items-center rounded-lg p-3 text-center transition-colors hover:bg-muted"
								>
									<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
										<Icon className="h-5 w-5 text-muted-foreground" />
									</div>
									<span className="text-xs font-medium">{app.name}</span>
								</Link>
							);
						})}
					</div>
					<div className="mt-3 border-t pt-3 text-center text-xs text-muted-foreground">
						<Link href="/" className="hover:underline" onClick={() => close()}>
							Open public site
						</Link>
					</div>
				</>
			)}
		</ToolbarDropdown>
	);
}

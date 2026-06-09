"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	LayoutDashboard,
	Settings,
	Users,
	BarChart3,
	FolderKanban,
	Handshake,
	ChevronLeft,
	ChevronRight,
	FileText,
	BookMarked,
	Mail,
	MailPlus,
	LayoutTemplate,
	Calendar,
	Database,
	MessageSquare,
	Shield,
	HelpCircle,
	LogIn,
	AlertCircle,
	Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardAuth } from "@/components/providers/dashboard-auth-provider";
import { isDashboardManager } from "@/lib/auth";

const sidebarGroups = [
	{
		title: "General",
		items: [
			{
				title: "Dashboard",
				href: "/dashboard",
				icon: LayoutDashboard,
				badge: null,
			},
			{
				title: "Messages",
				href: "/dashboard/messages",
				icon: MessageSquare,
				badge: null,
			},
			{
				title: "Analytics",
				href: "/dashboard/analytics",
				icon: BarChart3,
				badge: "New",
			},
			{
				title: "Settings",
				href: "/dashboard/settings",
				icon: Settings,
				badge: null,
			},
		],
	},
	{
		title: "Pages",
		items: [
			{
				title: "Users",
				href: "/dashboard/users",
				icon: Users,
				badge: "12",
			},
			{
				title: "Projects",
				href: "/dashboard/projects",
				icon: FolderKanban,
				badge: null,
			},
			{
				title: "Sponsors",
				href: "/dashboard/sponsors",
				icon: Handshake,
				badge: null,
			},
			{
				title: "FAQ pages",
				href: "/dashboard/faq-pages",
				icon: BookMarked,
				badge: null,
			},
			{
				title: "Blog posts",
				href: "/dashboard/blog-posts",
				icon: FileText,
				badge: null,
			},
			{
				title: "Email",
				href: "/dashboard/email",
				icon: Mail,
				badge: null,
			},
			{
				title: "Bulk mail",
				href: "/dashboard/email/bulk",
				icon: MailPlus,
				badge: null,
			},
			{
				title: "Template (header/footer)",
				href: "/dashboard/email/template",
				icon: LayoutTemplate,
				badge: null,
			},
			{
				title: "Documents",
				href: "/dashboard/documents",
				icon: FileText,
				badge: null,
			},
			{
				title: "Calendar",
				href: "/dashboard/calendar",
				icon: Calendar,
				badge: "3",
			},
			{
				title: "Auth Pages",
				href: "/dashboard/auth",
				icon: LogIn,
				badge: null,
			},
			{
				title: "Error Pages",
				href: "/dashboard/errors",
				icon: AlertCircle,
				badge: null,
			},
		],
	},
	{
		title: "Others",
		items: [
			{
				title: "Database",
				href: "/dashboard/database",
				icon: Database,
				badge: null,
			},
			{
				title: "Security",
				href: "/dashboard/security",
				icon: Shield,
				badge: "!",
			},
			{
				title: "Help",
				href: "/dashboard/help",
				icon: HelpCircle,
				badge: null,
			},
		],
	},
];

const MANAGER_VISIBLE_HREFS = new Set<string>([
	"/dashboard",
	"/dashboard/messages",
	"/dashboard/analytics",
	"/dashboard/settings",
	"/dashboard/users",
	"/dashboard/email",
	"/dashboard/email/bulk",
	"/dashboard/email/log",
	"/dashboard/email/template",
]);

interface SidebarProps {
	onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps) {
	const { user } = useDashboardAuth();
	const isManager = isDashboardManager(user);
	const pathname = usePathname();
	const [isCollapsed, setIsCollapsed] = useState(false);

	const handleLinkClick = () => {
		if (onMobileClose) {
			onMobileClose();
		}
	};

	return (
		<div
			className={cn(
				"flex h-full min-h-0 shrink-0 flex-col border-r bg-card shadow-sm transition-all duration-300",
				isCollapsed ? "w-16" : "w-72",
			)}
		>
			{/* Logo */}
			<div className="flex h-16 shrink-0 items-center justify-between border-b px-6">
				{!isCollapsed && (
					<Link href="/dashboard" className="flex items-center gap-3 group">
						<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
							<LayoutDashboard className="w-4 h-4 text-primary-foreground" />
						</div>
						<span className="text-xl font-bold group-hover:text-primary transition-colors">
							Admin
						</span>
					</Link>
				)}
				{isCollapsed && (
					<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
						<LayoutDashboard className="w-4 h-4 text-primary-foreground" />
					</div>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 hover:bg-muted"
					onClick={() => setIsCollapsed(!isCollapsed)}
				>
					{isCollapsed ? (
						<ChevronRight className="h-4 w-4" />
					) : (
						<ChevronLeft className="h-4 w-4" />
					)}
				</Button>
			</div>

			{/* Navigation Groups */}
			<nav className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain p-6">
				{sidebarGroups.map((group) => {
					const items = isManager
						? group.items.filter((i) => MANAGER_VISIBLE_HREFS.has(i.href))
						: group.items;
					if (items.length === 0) {
						return null;
					}
					return (
					<div key={group.title} className="space-y-3">
						{/* Group Title */}
						{!isCollapsed && (
							<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-4">
								{group.title}
							</h3>
						)}

						{/* Group Items */}
						<div className="space-y-2">
							{items.map((item) => {
								const isActive =
									item.href === "/dashboard"
										? pathname === "/dashboard"
										: pathname === item.href || pathname.startsWith(`${item.href}/`);
								const Icon = item.icon;

								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={handleLinkClick}
										className={cn(
											"group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-muted",
											isActive
												? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
												: "text-muted-foreground hover:text-foreground",
											isCollapsed && "justify-center px-3 py-4",
										)}
										title={isCollapsed ? item.title : undefined}
									>
										<Icon
											className={cn(
												"transition-all duration-200",
												isCollapsed ? "h-5 w-5" : "h-4 w-4",
												isActive && !isCollapsed && "text-primary-foreground",
											)}
										/>
										{!isCollapsed && (
											<span className="group-hover:translate-x-0.5 transition-transform duration-200">
												{item.title}
											</span>
										)}
									</Link>
								);
							})}
						</div>
					</div>
					);
				})}
			</nav>

			<div className="shrink-0 space-y-2 border-t border-border p-4">
				<Link
					href="/"
					onClick={handleLinkClick}
					title={isCollapsed ? "Back to website home" : undefined}
					className={cn(
						"flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted",
						isCollapsed && "px-2",
					)}
				>
					<Home className="h-4 w-4 shrink-0" />
					{!isCollapsed && <span>Back to website</span>}
				</Link>
			</div>
		</div>
	);
}

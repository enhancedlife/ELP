"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutTemplate, Mail, MailPlus, ScrollText, Server } from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_TABS = [
	{ href: "/dashboard/email", label: "Newsletter", icon: Mail },
	{ href: "/dashboard/email/bulk", label: "Bulk mail", icon: MailPlus },
	{ href: "/dashboard/email/smtp", label: "SMTP servers", icon: Server },
	{ href: "/dashboard/email/template", label: "Template", icon: LayoutTemplate },
	{ href: "/dashboard/email/log", label: "Send log", icon: ScrollText },
] as const;

export function EmailSectionNav() {
	const pathname = usePathname();

	return (
		<nav
			className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-1.5"
			aria-label="Email section"
		>
			{EMAIL_TABS.map(({ href, label, icon: Icon }) => {
				const active = pathname === href || pathname.startsWith(`${href}/`);
				return (
					<Link
						key={href}
						href={href}
						className={cn(
							"inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
							active
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:bg-background/60 hover:text-foreground",
						)}
					>
						<Icon className="h-4 w-4 shrink-0" />
						{label}
					</Link>
				);
			})}
		</nav>
	);
}

"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDashboardAuth } from "@/components/providers/dashboard-auth-provider";
import { isDashboardManager } from "@/lib/auth";

const MANAGER_FORBIDDEN_PREFIXES = [
	"/dashboard/projects",
	"/dashboard/sponsors",
	"/dashboard/faq-pages",
	"/dashboard/blog-posts",
	"/dashboard/documents",
	"/dashboard/calendar",
	"/dashboard/auth",
	"/dashboard/errors",
	"/dashboard/database",
	"/dashboard/security",
	"/dashboard/help",
] as const;

function pathIsForbiddenForManager(pathname: string): boolean {
	return MANAGER_FORBIDDEN_PREFIXES.some(
		(p) => pathname === p || pathname.startsWith(`${p}/`),
	);
}

/**
 * Client redirect for manager-role accounts: only General + users + email + settings are allowed
 * (email template is read-only on the page; APIs enforce the rest).
 */
export function DashboardManagerRouteGuard({ children }: { children: ReactNode }) {
	const { user, loading } = useDashboardAuth();
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		if (loading || !user) return;
		if (!isDashboardManager(user)) return;
		if (pathIsForbiddenForManager(pathname)) {
			router.replace("/dashboard");
		}
	}, [loading, user, pathname, router]);

	return <>{children}</>;
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function shouldTrack(path: string): boolean {
	if (!path || path.startsWith("/dashboard") || path.startsWith("/auth/admin")) {
		return false;
	}
	if (path.startsWith("/api/") || path.startsWith("/_next/")) {
		return false;
	}
	return true;
}

export function SiteVisitTracker() {
	const pathname = usePathname();
	const lastTracked = useRef<string | null>(null);

	useEffect(() => {
		if (!pathname || !shouldTrack(pathname) || lastTracked.current === pathname) {
			return;
		}
		lastTracked.current = pathname;
		void fetch("/api/analytics/visit", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ path: pathname }),
			keepalive: true,
		}).catch(() => {});
	}, [pathname]);

	return null;
}

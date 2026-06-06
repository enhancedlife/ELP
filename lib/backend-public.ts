/**
 * Absolute URL to the Django backend for browser links (Django Admin, changelists).
 * Must match the API / BFF target. Override with NEXT_PUBLIC_BACKEND_URL in .env.local.
 */
export function backendOrigin(): string {
	return (
		process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"
	).replace(/\/$/, "");
}

export function backendUrl(path: string): string {
	const p = path.startsWith("/") ? path : `/${path}`;
	return `${backendOrigin()}${p}`;
}

/**
 * When NEXT_PUBLIC_DASHBOARD_CLIENT_DIRECT=1, dashboard fetches go straight from the
 * browser to Django (needs CORS). Use if the Next.js server cannot reach the API but
 * the browser can (e.g. wrong BACKEND_URL on Node). Default uses same-origin /api/dashboard BFF.
 */
export function dashboardClientFetchUrl(path: string): string {
	const clean = path.replace(/^\//, "");
	if (
		typeof window !== "undefined" &&
		process.env.NEXT_PUBLIC_DASHBOARD_CLIENT_DIRECT === "1"
	) {
		return `${backendOrigin()}/api/dashboard/${clean}`;
	}
	return `/api/dashboard/${clean}`;
}

/** Same pattern for auth endpoints (login, user, logout, register). */
export function authClientFetchUrl(path: string): string {
	const clean = path.replace(/^\//, "");
	if (
		typeof window !== "undefined" &&
		process.env.NEXT_PUBLIC_DASHBOARD_CLIENT_DIRECT === "1"
	) {
		return `${backendOrigin()}/api/auth/${clean}`;
	}
	return `/api/auth/${clean}`;
}

/** Member portal API (same-origin BFF or direct to Django). */
export function portalClientFetchUrl(path: string): string {
	const clean = path.replace(/^\//, "");
	if (
		typeof window !== "undefined" &&
		process.env.NEXT_PUBLIC_DASHBOARD_CLIENT_DIRECT === "1"
	) {
		return `${backendOrigin()}/api/portal/${clean}`;
	}
	return `/api/portal/${clean}`;
}

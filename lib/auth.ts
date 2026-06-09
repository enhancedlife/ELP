import { authClientFetchUrl } from "@/lib/backend-public";

export const AUTH_TOKEN_STORAGE_KEY = "theswolerepublic_auth_token";

/** Same-tab listeners (e.g. SiteHeader) refresh when login/logout updates localStorage. */
export const AUTH_SESSION_CHANGE_EVENT = "theswolerepublic-auth-change";

/** Prevents hung UI when Django / Next rewrites are slow or unreachable. */
const AUTH_FETCH_TIMEOUT_MS = 12_000;

/**
 * Fetch with a hard timeout (works even when `AbortSignal.timeout` is missing, e.g. older Safari).
 */
async function authFetch(input: string, init?: RequestInit): Promise<Response> {
	const c = new AbortController();
	const id = setTimeout(() => c.abort(), AUTH_FETCH_TIMEOUT_MS);
	try {
		return await fetch(input, {
			...init,
			signal: c.signal,
		});
	} finally {
		clearTimeout(id);
	}
}

function mapAuthNetworkError(e: unknown): Error {
	if (e instanceof DOMException && e.name === "AbortError") {
		return new Error(
			"Request timed out. Start Django on port 8000 and ensure Next.js BACKEND_URL (or API_REWRITE_TARGET) points to it.",
		);
	}
	if (e instanceof TypeError) {
		return new Error(
			"Could not reach the API. Check that Django is running and BACKEND_URL is correct (use 127.0.0.1 on Windows if needed).",
		);
	}
	return e instanceof Error ? e : new Error("Request failed.");
}

export type AuthUser = {
	id: number;
	email: string;
	/** Display name (full name or username). */
	name: string;
	first_name?: string;
	last_name?: string;
	is_staff: boolean;
	is_superuser: boolean;
	/** Staff, not superuser (limited dashboard; server sets explicitly when present). */
	is_manager?: boolean;
	/** "admin" | "manager" | "user" from the API; optional for older sessions. */
	dashboard_role?: "admin" | "manager" | "user";
	/** Legacy: same as can_access_admin_dashboard when present. */
	can_access_dashboard?: boolean;
	/** Staff / Next.js admin dashboard (superuser or staff per Django settings). */
	can_access_admin_dashboard?: boolean;
	/** Member area (any active account). */
	can_access_client_portal?: boolean;
};

/** True when this user may use the Next.js admin dashboard (matches Django admin login rules). */
export function userCanAccessDashboard(user: AuthUser): boolean {
	if (typeof user.can_access_admin_dashboard === "boolean") {
		return user.can_access_admin_dashboard;
	}
	if (typeof user.can_access_dashboard === "boolean") {
		return user.can_access_dashboard;
	}
	return user.is_superuser;
}

/** After client sign-in or registration: admins go to dashboard, members to portal. */
export function postAuthLandingPath(user: AuthUser): "/dashboard" | "/portal" {
	return userCanAccessDashboard(user) ? "/dashboard" : "/portal";
}

export function userCanAccessClientPortal(user: AuthUser): boolean {
	if (typeof user.can_access_client_portal === "boolean") {
		return user.can_access_client_portal;
	}
	return true;
}

/** Limited dashboard role: Django staff, not superuser. */
export function isDashboardManager(user: AuthUser | null | undefined): boolean {
	if (!user) return false;
	if (typeof user.is_manager === "boolean") return user.is_manager;
	return Boolean(user.is_staff && !user.is_superuser);
}

export function isDashboardFullAdmin(user: AuthUser | null | undefined): boolean {
	if (!user) return false;
	return Boolean(user.is_superuser);
}

export function getStoredToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
	if (typeof window === "undefined") return;
	const prev = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
	const next = token && token.length > 0 ? token : null;
	if (next) localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, next);
	else localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
	if (prev !== next) {
		window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
	}
}

function authHeadersJson(): HeadersInit {
	const headers: Record<string, string> = {
		Accept: "application/json",
		"Content-Type": "application/json",
	};
	const t = getStoredToken();
	if (t) headers.Authorization = `Token ${t}`;
	return headers;
}

export async function loginRequest(
	email: string,
	password: string,
): Promise<{ token: string; user: AuthUser }> {
	let res: Response;
	try {
		res = await authFetch(authClientFetchUrl("login"), {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
			cache: "no-store",
		});
	} catch (e) {
		throw mapAuthNetworkError(e);
	}
	const data = (await res.json().catch(() => ({}))) as {
		detail?: string;
		token?: string;
		user?: AuthUser;
	};
	if (!res.ok) {
		throw new Error(
			typeof data.detail === "string" ? data.detail : "Sign in failed.",
		);
	}
	if (!data.token || !data.user) {
		throw new Error("Invalid response from server.");
	}
	setStoredToken(data.token);
	return { token: data.token, user: data.user };
}

/** Staff / admin dashboard sign-in (superuser or staff per backend settings). */
export async function adminLoginRequest(
	email: string,
	password: string,
): Promise<{ token: string; user: AuthUser }> {
	let res: Response;
	try {
		res = await authFetch(authClientFetchUrl("admin/login"), {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
			cache: "no-store",
		});
	} catch (e) {
		throw mapAuthNetworkError(e);
	}
	const data = (await res.json().catch(() => ({}))) as {
		detail?: string;
		token?: string;
		user?: AuthUser;
	};
	if (!res.ok) {
		throw new Error(
			typeof data.detail === "string" ? data.detail : "Sign in failed.",
		);
	}
	if (!data.token || !data.user) {
		throw new Error("Invalid response from server.");
	}
	setStoredToken(data.token);
	return { token: data.token, user: data.user };
}

export type RegisterPayload = {
	email: string;
	password: string;
	password_confirmation: string;
	first_name: string;
	last_name: string;
};

export async function forgotPasswordRequest(email: string): Promise<{
	detail: string;
	email_delivery?: "console" | "smtp";
}> {
	let res: Response;
	try {
		res = await authFetch(authClientFetchUrl("password-reset"), {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email: email.trim().toLowerCase() }),
			cache: "no-store",
		});
	} catch (e) {
		throw mapAuthNetworkError(e);
	}
	const data = (await res.json().catch(() => ({}))) as {
		detail?: string;
		email_delivery?: string;
	};
	if (!res.ok) {
		throw new Error(
			typeof data.detail === "string" ? data.detail : "Could not send reset email.",
		);
	}
	if (typeof data.detail !== "string") {
		throw new Error("Invalid response from server.");
	}
	const out: { detail: string; email_delivery?: "console" | "smtp" } = { detail: data.detail };
	if (data.email_delivery === "console") {
		out.email_delivery = "console";
	}
	return out;
}

export type PasswordResetConfirmPayload = {
	uid: string;
	token: string;
	password: string;
	password_confirmation: string;
};

export async function passwordResetConfirmRequest(
	payload: PasswordResetConfirmPayload,
): Promise<{ detail: string }> {
	let res: Response;
	try {
		res = await authFetch(authClientFetchUrl("password-reset/confirm"), {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
			cache: "no-store",
		});
	} catch (e) {
		throw mapAuthNetworkError(e);
	}
	const data = (await res.json().catch(() => ({}))) as { detail?: string };
	if (!res.ok) {
		throw new Error(
			typeof data.detail === "string" ? data.detail : "Could not reset password.",
		);
	}
	if (typeof data.detail !== "string") {
		throw new Error("Invalid response from server.");
	}
	return { detail: data.detail };
}

export async function registerRequest(
	payload: RegisterPayload,
): Promise<{ token: string; user: AuthUser }> {
	let res: Response;
	try {
		res = await authFetch(authClientFetchUrl("register"), {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
			cache: "no-store",
		});
	} catch (e) {
		throw mapAuthNetworkError(e);
	}
	const data = (await res.json().catch(() => ({}))) as {
		detail?: string;
		token?: string;
		user?: AuthUser;
	};
	if (!res.ok) {
		throw new Error(
			typeof data.detail === "string" ? data.detail : "Registration failed.",
		);
	}
	if (!data.token || !data.user) {
		throw new Error("Invalid response from server.");
	}
	setStoredToken(data.token);
	return { token: data.token, user: data.user };
}

export type ProfileUpdatePayload = {
	/** Full display name; server splits on first space into first_name / last_name. */
	name?: string;
	first_name?: string;
	last_name?: string;
	email?: string;
};

export async function updateProfileRequest(
	payload: ProfileUpdatePayload,
): Promise<AuthUser> {
	let res: Response;
	try {
		res = await authFetch(authClientFetchUrl("user"), {
			method: "PATCH",
			headers: dashboardAuthHeadersJson(),
			body: JSON.stringify(payload),
			cache: "no-store",
		});
	} catch (e) {
		throw mapAuthNetworkError(e);
	}
	const data = (await res.json().catch(() => ({}))) as {
		detail?: string;
		user?: AuthUser;
	};
	if (!res.ok) {
		throw new Error(
			typeof data.detail === "string" ? data.detail : "Could not update profile.",
		);
	}
	if (!data.user) {
		throw new Error("Invalid response from server.");
	}
	return data.user;
}

export type ChangePasswordPayload = {
	current_password: string;
	new_password: string;
	new_password_confirmation: string;
};

export async function changePasswordRequest(
	payload: ChangePasswordPayload,
): Promise<{ detail: string }> {
	let res: Response;
	try {
		res = await authFetch(authClientFetchUrl("password-change"), {
			method: "POST",
			headers: dashboardAuthHeadersJson(),
			body: JSON.stringify(payload),
			cache: "no-store",
		});
	} catch (e) {
		throw mapAuthNetworkError(e);
	}
	const data = (await res.json().catch(() => ({}))) as { detail?: string };
	if (!res.ok) {
		throw new Error(
			typeof data.detail === "string" ? data.detail : "Could not change password.",
		);
	}
	if (typeof data.detail !== "string") {
		throw new Error("Invalid response from server.");
	}
	return { detail: data.detail };
}

export async function fetchAuthUser(): Promise<AuthUser | null> {
	const t = getStoredToken();
	if (!t) return null;
	try {
		const res = await authFetch(authClientFetchUrl("user"), {
			headers: { Accept: "application/json", Authorization: `Token ${t}` },
			cache: "no-store",
		});
		if (res.status === 401) {
			setStoredToken(null);
			return null;
		}
		if (!res.ok) {
			return null;
		}
		const data = (await res.json().catch(() => ({}))) as { user?: AuthUser };
		return data.user ?? null;
	} catch {
		/* timeout, network error, or backend unreachable */
		return null;
	}
}

export async function logoutRequest(): Promise<void> {
	const t = getStoredToken();
	if (t) {
		try {
			await authFetch(authClientFetchUrl("logout"), {
				method: "POST",
				headers: authHeadersJson(),
				cache: "no-store",
			});
		} catch {
			/* still clear local session */
		}
	}
	setStoredToken(null);
}

export function dashboardAuthHeaders(): HeadersInit {
	const headers: Record<string, string> = { Accept: "application/json" };
	const t = getStoredToken();
	if (t) headers.Authorization = `Token ${t}`;
	return headers;
}

export function dashboardAuthHeadersJson(): HeadersInit {
	const headers: Record<string, string> = {
		Accept: "application/json",
		"Content-Type": "application/json",
	};
	const t = getStoredToken();
	if (t) headers.Authorization = `Token ${t}`;
	return headers;
}

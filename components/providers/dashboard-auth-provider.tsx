"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	fetchAuthUser,
	getStoredToken,
	logoutRequest,
	userCanAccessDashboard,
	type AuthUser,
} from "@/lib/auth";

type DashboardAuthContextValue = {
	user: AuthUser | null;
	loading: boolean;
	refresh: () => Promise<void>;
	logout: () => Promise<void>;
};

const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(
	null,
);

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		if (!getStoredToken()) {
			setUser(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const u = await fetchAuthUser();
			setUser(u);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const logout = useCallback(async () => {
		await logoutRequest();
		setUser(null);
	}, []);

	return (
		<DashboardAuthContext.Provider value={{ user, loading, refresh, logout }}>
			{children}
		</DashboardAuthContext.Provider>
	);
}

export function useDashboardAuth(): DashboardAuthContextValue {
	const ctx = useContext(DashboardAuthContext);
	if (!ctx) {
		throw new Error("useDashboardAuth must be used within DashboardAuthProvider");
	}
	return ctx;
}

function FullScreenLoading() {
	return (
		<div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
			<p className="text-sm">Loading…</p>
		</div>
	);
}

function PendingDashboardAccess() {
	const { logout, user } = useDashboardAuth();
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
			<h1 className="text-xl font-semibold tracking-tight">Staff dashboard only</h1>
			<p className="max-w-md text-sm text-muted-foreground">
				Signed in as <span className="font-medium text-foreground">{user?.email}</span>.
				This area is for accounts that have staff dashboard access. Use the member portal for the
				public site experience, or contact the development team if you need access.
			</p>
			<div className="flex flex-wrap items-center justify-center gap-2">
				<Button type="button" asChild variant="default">
					<Link href="/portal">Go to member portal</Link>
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						void logout().then(() => {
							window.location.assign("/auth/login");
						});
					}}
				>
					Sign out
				</Button>
			</div>
		</div>
	);
}

export function DashboardAuthGate({ children }: { children: ReactNode }) {
	const { user, loading } = useDashboardAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;
		if (!user) {
			router.replace("/auth/admin/login");
		}
	}, [loading, user, router]);

	if (loading) {
		return <FullScreenLoading />;
	}
	if (!user) {
		return <FullScreenLoading />;
	}
	if (!userCanAccessDashboard(user)) {
		return <PendingDashboardAccess />;
	}
	return <>{children}</>;
}

"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	AUTH_SESSION_CHANGE_EVENT,
	AUTH_TOKEN_STORAGE_KEY,
	fetchAuthUser,
	getStoredToken,
	logoutRequest,
	type AuthUser,
} from "@/lib/auth";

type PortalAuthContextValue = {
	user: AuthUser | null;
	loading: boolean;
	refresh: () => Promise<void>;
	logout: () => Promise<void>;
};

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
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

	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key !== null && e.key !== AUTH_TOKEN_STORAGE_KEY) return;
			void refresh();
		};
		const onSessionChange = () => void refresh();
		window.addEventListener("storage", onStorage);
		window.addEventListener(AUTH_SESSION_CHANGE_EVENT, onSessionChange);
		return () => {
			window.removeEventListener("storage", onStorage);
			window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, onSessionChange);
		};
	}, [refresh]);

	return (
		<PortalAuthContext.Provider value={{ user, loading, refresh, logout }}>
			{children}
		</PortalAuthContext.Provider>
	);
}

export function usePortalAuth(): PortalAuthContextValue {
	const ctx = useContext(PortalAuthContext);
	if (!ctx) {
		throw new Error("usePortalAuth must be used within PortalAuthProvider");
	}
	return ctx;
}

function FullScreenLoading() {
	return (
		<div className="flex min-h-[40vh] w-full items-center justify-center text-muted-foreground">
			<p className="text-sm">Loading…</p>
		</div>
	);
}

export function PortalAuthGate({ children }: { children: ReactNode }) {
	const { user, loading } = usePortalAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;
		if (!user) {
			router.replace("/auth/login");
		}
	}, [loading, user, router]);

	if (loading) {
		return <FullScreenLoading />;
	}
	if (!user) {
		return <FullScreenLoading />;
	}
	return <>{children}</>;
}

export function PortalSignOutButton() {
	const { logout } = usePortalAuth();
	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			onClick={() => {
				void logout().then(() => {
					window.location.assign("/");
				});
			}}
		>
			Sign out
		</Button>
	);
}

"use client";
import { DashboardManagerRouteGuard } from "@/components/dashboard-manager-route-guard";
import {
	DashboardAuthGate,
	DashboardAuthProvider,
} from "@/components/providers/dashboard-auth-provider";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<DashboardAuthProvider>
			<DashboardAuthGate>
				<DashboardManagerRouteGuard>
					<div className="dark relative flex h-screen min-h-0 overflow-hidden bg-background text-foreground">
						<Sidebar />
						<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
							<Topbar />
							<main className="mx-auto w-full max-w-7xl p-6 lg:p-8">
								<div className="min-h-[calc(100vh-5rem)]">{children}</div>
							</main>
						</div>
					</div>
				</DashboardManagerRouteGuard>
			</DashboardAuthGate>
		</DashboardAuthProvider>
	);
}

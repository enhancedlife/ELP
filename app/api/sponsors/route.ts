import { NextResponse } from "next/server";

/** Match dashboard BFF — avoid localhost → ::1 on Windows when Django binds 127.0.0.1. */
function backendBase(): string {
	const raw =
		process.env.BACKEND_URL ||
		process.env.API_REWRITE_TARGET ||
		"http://127.0.0.1:8000";
	const trimmed = raw.replace(/\/$/, "");
	return trimmed.replace(
		/(^https?:\/\/)localhost\b/i,
		(_, scheme: string) => `${scheme}127.0.0.1`,
	);
}

export const dynamic = "force-dynamic";

/** Proxy GET /api/sponsors → Django (ELP). Requires Django on BACKEND_URL, not another stack. */
export async function GET() {
	const url = `${backendBase()}/api/sponsors`;
	try {
		const res = await fetch(url, {
			headers: { Accept: "application/json" },
			cache: "no-store",
			signal: AbortSignal.timeout(15_000),
		});
		const text = await res.text();

		if (!res.ok && text.includes("NotFoundHttpException")) {
			return NextResponse.json(
				{
					detail:
						"BACKEND_URL is pointing at a server without /api/sponsors (expected Django ELP on port 8000). " +
						"Stop other backends on that port and set BACKEND_URL=http://127.0.0.1:8000 in .env.local.",
					backend: backendBase(),
				},
				{ status: 502 },
			);
		}

		return new NextResponse(text, {
			status: res.status,
			headers: {
				"Content-Type": res.headers.get("Content-Type") || "application/json",
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return NextResponse.json(
			{
				detail:
					"Django API unreachable from Next.js. Start ELP Django (python manage.py runserver 127.0.0.1:8000) " +
					"and set BACKEND_URL=http://127.0.0.1:8000 in .env.local.",
				error: message,
				backend: backendBase(),
			},
			{ status: 502 },
		);
	}
}

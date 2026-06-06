import { NextRequest, NextResponse } from "next/server";

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

/**
 * Proxy public landing-page list so query strings (?faq=1, ?faq_sponsors=1) always reach Django.
 * next.config rewrites can be unreliable for the same path with different query params.
 */
export async function GET(request: NextRequest) {
	const q = request.nextUrl.search;
	const url = `${backendBase()}/api/landing-pages${q}`;
	try {
		const res = await fetch(url, {
			headers: { Accept: "application/json" },
			cache: "no-store",
			signal: AbortSignal.timeout(15_000),
		});
		const text = await res.text();
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
					"Django API unreachable from Next.js. Start the backend and set BACKEND_URL / API_REWRITE_TARGET if needed.",
				error: message,
			},
			{ status: 502 },
		);
	}
}

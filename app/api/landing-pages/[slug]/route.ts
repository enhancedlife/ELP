import { NextRequest, NextResponse } from "next/server";

/** Same as list route — explicit proxy so slug paths always reach Django (rewrites alone can miss). */
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

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ slug: string }> },
) {
	const params = await context.params;
	const slug = encodeURIComponent(params.slug);
	const url = `${backendBase()}/api/landing-pages/${slug}`;
	try {
		const res = await fetch(url, {
			headers: { Accept: "application/json" },
			cache: "no-store",
			signal: AbortSignal.timeout(30_000),
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
				upstream: url,
			},
			{ status: 502 },
		);
	}
}

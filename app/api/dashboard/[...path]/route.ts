import { type NextRequest, NextResponse } from "next/server";

/** Node on Windows often resolves `localhost` to ::1 while Django binds 127.0.0.1 — force IPv4 loopback. */
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

function buildUpstreamHeaders(request: Request): HeadersInit {
	const secret = (process.env.DASHBOARD_SERVER_SECRET || "").trim();
	const headers: Record<string, string> = { Accept: "application/json" };
	if (secret) {
		headers["X-Dashboard-Secret"] = secret;
	}
	const auth = request.headers.get("Authorization");
	if (auth) {
		headers.Authorization = auth;
	}
	const contentType = request.headers.get("Content-Type");
	if (contentType?.toLowerCase().includes("application/json")) {
		headers["Content-Type"] = "application/json";
	}
	return headers;
}

async function forwardDashboard(
	request: Request,
	context: { params: Promise<{ path: string[] }> },
) {
	const { path: pathSegments } = await context.params;
	const segments = pathSegments ?? [];
	const suffix = segments.join("/");
	const base = backendBase();
	const url = `${base}/api/dashboard/${suffix}`;
	const method = request.method.toUpperCase();
	const hasBody = !["GET", "HEAD"].includes(method);
	const body = hasBody ? await request.text() : undefined;

	try {
		const res = await fetch(url, {
			method,
			headers: buildUpstreamHeaders(request),
			body: hasBody && body && body.length > 0 ? body : undefined,
			cache: "no-store",
			signal: AbortSignal.timeout(25_000),
		});

		const text = await res.text();
		const ct = res.headers.get("Content-Type") || "application/json";

		return new NextResponse(text, {
			status: res.status,
			headers: { "Content-Type": ct },
		});
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Unknown error reaching Django";
		const payload = JSON.stringify({
			detail:
				"Django API unreachable from Next.js server. Start the backend (e.g. runserver on port 8000), set BACKEND_URL / API_REWRITE_TARGET if it is not http://127.0.0.1:8000, and on Windows prefer 127.0.0.1 instead of localhost.",
			upstream: base,
			error: message,
		});
		return new NextResponse(payload, {
			status: 502,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ path: string[] }> },
) {
	return forwardDashboard(request, context);
}

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ path: string[] }> },
) {
	return forwardDashboard(request, context);
}

export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ path: string[] }> },
) {
	return forwardDashboard(request, context);
}

export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ path: string[] }> },
) {
	return forwardDashboard(request, context);
}

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ path: string[] }> },
) {
	return forwardDashboard(request, context);
}

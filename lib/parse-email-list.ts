/** Parse comma/newline/semicolon-separated emails for bulk mail UI. */

const EMAIL_RE =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function parseEmailListInput(raw: string): {
	valid: string[];
	invalid: string[];
} {
	const parts = raw.split(/[\n,;]+/);
	const seen = new Set<string>();
	const valid: string[] = [];
	const invalid: string[] = [];

	for (const part of parts) {
		const email = part.trim().toLowerCase();
		if (!email) continue;
		if (!EMAIL_RE.test(email)) {
			invalid.push(part.trim());
			continue;
		}
		if (seen.has(email)) continue;
		seen.add(email);
		valid.push(email);
	}

	return { valid, invalid };
}

export function formatEmailListForInput(emails: string[] | null | undefined): string {
	if (!emails?.length) return "";
	return emails.join("\n");
}

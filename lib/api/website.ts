import type {
  LandingPage,
  LandingPageSummary,
  PartnersPageSettings,
  Sponsor,
} from '@/lib/types';

async function safeFetchJson<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(input, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      ...init,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function listLandingPages(options?: { faqOnly?: boolean }): Promise<LandingPageSummary[]> {
  const q = options?.faqOnly === true ? '?faq=1' : '';
  const data = await safeFetchJson<LandingPageSummary[]>(`/api/landing-pages${q}`);
  return Array.isArray(data) ? data : [];
}

/**
 * Entries shown under “Sponsors' FAQ” in the site header (managed in dashboard).
 * Uses same-origin `/api/landing-pages` only (Next proxies to Django) so the browser never
 * cross-origin calls Django — avoids CORS. Configure BACKEND_URL on the Next server for the proxy.
 */
export async function listFaqSponsorNavPages(): Promise<LandingPageSummary[]> {
  const data = await safeFetchJson<LandingPageSummary[]>(
    '/api/landing-pages?faq_sponsors=1',
  );
  return Array.isArray(data) ? data : [];
}

export async function getLandingPage(
  slug: string,
  signal?: AbortSignal,
): Promise<LandingPage | null> {
  return safeFetchJson<LandingPage>(`/api/landing-pages/${encodeURIComponent(slug)}`, {
    signal,
  });
}

/** Resolve /faq/[topic]: try exact slug, then faq-{topic}. */
export async function getFaqArticleByTopic(topic: string): Promise<LandingPage | null> {
  const decoded = decodeURIComponent(topic);
  const direct = await getLandingPage(decoded);
  if (direct) return direct;
  return getLandingPage(`faq-${decoded}`);
}

export type NewsletterSubscribeResult = { ok: boolean; email: string; created: boolean };

export async function postNewsletterSubscribe(body: {
  email: string;
  name?: string;
}): Promise<{ ok: boolean; data: NewsletterSubscribeResult | null; status: number }> {
  try {
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as NewsletterSubscribeResult | null;
    return { ok: res.ok, data, status: res.status };
  } catch {
    return { ok: false, data: null, status: 0 };
  }
}

/**
 * Same as getLandingPage but aborts the request after `ms`.
 * Uses AbortSignal (not Promise.race) so a slow-but-successful response is not thrown away.
 */
export async function getLandingPageWithTimeout(slug: string, ms = 25000): Promise<LandingPage | null> {
  try {
    const signal = AbortSignal.timeout(ms);
    return await getLandingPage(slug, signal);
  } catch {
    return null;
  }
}

export async function getSponsors(): Promise<Sponsor[]> {
  const { sponsors } = await getSponsorsWithStatus();
  return sponsors;
}

function parseSponsorsPayload(data: unknown): {
  sponsors: Sponsor[];
  page: PartnersPageSettings | null;
} {
  if (Array.isArray(data)) {
    return { sponsors: data as Sponsor[], page: null };
  }
  if (data && typeof data === 'object' && 'sponsors' in data) {
    const raw = data as { sponsors?: unknown; page?: unknown };
    const sponsors = Array.isArray(raw.sponsors) ? (raw.sponsors as Sponsor[]) : [];
    const page =
      raw.page && typeof raw.page === 'object'
        ? (raw.page as PartnersPageSettings)
        : null;
    return { sponsors, page };
  }
  return { sponsors: [], page: null };
}

/** Same-origin `/api/sponsors` only (Next → Django proxy); avoids browser CORS to Django. */
export async function getSponsorsWithStatus(): Promise<{
  sponsors: Sponsor[];
  page: PartnersPageSettings | null;
  ok: boolean;
}> {
  try {
    const res = await fetch('/api/sponsors', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return { sponsors: [], page: null, ok: false };
    const data = (await res.json()) as unknown;
    const { sponsors, page } = parseSponsorsPayload(data);
    return { sponsors, page, ok: true };
  } catch {
    return { sponsors: [], page: null, ok: false };
  }
}

export type ContactFormPayload = {
  name: string;
  email: string;
  issue_type:
    | 'order_issue'
    | 'account'
    | 'website_technical'
    | 'partnership'
    | 'other';
  /** Sponsor id (string), or preset keys `aquila_anabolics`, `hvy_research`, `other`. */
  sponsor_selection?: string;
  /** Required when issue type is order / account / website-technical. */
  related_username?: string;
  message: string;
};

export async function postContactForm(
  body: ContactFormPayload,
): Promise<{ ok: boolean; detail?: string; status: number; email_delivery?: 'console' | 'smtp' }> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      detail?: string;
      ok?: boolean;
      email_delivery?: string;
    };
    const email_delivery =
      data.email_delivery === 'console' ? ('console' as const) : undefined;
    return {
      ok: res.ok,
      detail: typeof data.detail === 'string' ? data.detail : undefined,
      status: res.status,
      ...(email_delivery ? { email_delivery } : {}),
    };
  } catch {
    return { ok: false, detail: 'Network error.', status: 0 };
  }
}


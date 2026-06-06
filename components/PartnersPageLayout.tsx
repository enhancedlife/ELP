'use client';

import { Loader2 } from 'lucide-react';

import { cmsHtmlProseClass } from '@/lib/cms-prose';
import type { PartnersPageSettings, Sponsor } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Prose for sponsor card HTML from the API (slightly smaller than main article prose). */
const sponsorCardHtmlClass = cn(cmsHtmlProseClass, 'prose-sm md:prose-base max-w-none');

function groupSponsorsByCategory(sponsors: Sponsor[]): { category: string; items: Sponsor[] }[] {
  const map = new Map<string, Sponsor[]>();
  for (const s of sponsors) {
    const c = (s.category ?? '').trim() || 'Sponsors';
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(s);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([category, items]) => ({
      category,
      items: [...items].sort((x, y) => x.sort_order - y.sort_order || x.name.localeCompare(y.name)),
    }));
}

const FALLBACK_PAGE: Omit<PartnersPageSettings, 'id' | 'updated_at'> = {
  banner_image_url: '',
  banner_kicker: '',
  hero_title: 'The Swole Republic Sponsors',
  hero_lead:
    'Safe, reliable sponsors you can shop with confidence—high quality products to help you attain your goals.',
  intro_heading: '',
  intro_body: '',
  pillars: [],
  link_primary_label: '',
  link_primary_url: '',
  link_secondary_label: '',
  link_secondary_url: '',
};

function mergePageSettings(page: PartnersPageSettings | null): PartnersPageSettings {
  if (!page) {
    return {
      id: 1,
      ...FALLBACK_PAGE,
      updated_at: '',
    };
  }
  return {
    ...page,
    pillars: Array.isArray(page.pillars) ? page.pillars : [],
  };
}

type PartnersPageLayoutProps = {
  page: PartnersPageSettings | null;
  sponsors: Sponsor[];
  loadFailed: boolean;
  /** When true, hero still renders; sponsor list area shows loading. */
  loading?: boolean;
};

export function PartnersPageLayout({ page, sponsors, loadFailed, loading = false }: PartnersPageLayoutProps) {
  const p = mergePageSettings(page);
  const groups = groupSponsorsByCategory(sponsors);
  const hasBannerImage = Boolean(p.banner_image_url?.trim());

  return (
    <div className="min-w-0 w-full">
      {/* Hero banner — full viewport width; image covers area with top anchor (crop below). */}
      <section
        className={cn(
          "relative overflow-hidden border-b border-white/10 py-16 px-6",
          hasBannerImage
            ? "min-h-[280px] bg-[#0a0c0f]"
            : "bg-gradient-to-b from-[#0a0c0f] to-[#121820]",
        )}
      >
        {hasBannerImage ? (
          <>
            <div className="absolute inset-0 bg-black/50" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element -- remote CMS URL */}
            <img
              src={p.banner_image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-top opacity-60"
            />
          </>
        ) : null}
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-wide text-white">
            {p.hero_title}
          </h1>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-green-500" aria-hidden />
          {p.hero_lead?.trim() ? (
            <div
              className={cn(
                "mt-6 text-lg text-gray-300 max-w-2xl mx-auto prose prose-invert prose-p:mb-3 prose-p:mt-0",
                cmsHtmlProseClass,
              )}
              dangerouslySetInnerHTML={{ __html: p.hero_lead }}
            />
          ) : null}
        </div>
      </section>

      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
          {!loading && loadFailed ? (
            <p className="mx-auto mb-10 max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
              Could not load sponsors. Start the Django API on port 8000 and ensure Next rewrites{' '}
              <code className="rounded bg-muted px-1">/api/sponsors</code> to it.
            </p>
          ) : null}

          {loading ? (
            <div className="flex min-h-[min(40vh,320px)] flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary/80" aria-hidden />
              <p className="text-sm font-medium">Loading sponsors…</p>
            </div>
          ) : null}

          {!loading && !loadFailed && sponsors.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center text-muted-foreground">
              No sponsors are published yet. Add active sponsors (with categories) from the dashboard.
            </p>
          ) : null}

          {!loading && !loadFailed && (p.intro_heading?.trim() || p.intro_body?.trim()) ? (
            <div className="mb-14 max-w-3xl">
              {p.intro_heading?.trim() ? (
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {p.intro_heading}
                </h2>
              ) : null}
              {p.intro_body?.trim() ? (
                <div
                  className={cn(cmsHtmlProseClass)}
                  dangerouslySetInnerHTML={{ __html: p.intro_body }}
                />
              ) : null}
            </div>
          ) : null}

          {!loading
            ? groups.map(({ category, items }) => (
            <section key={category} className="mb-16 last:mb-0">
              <h3 className="mb-8 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {category}
              </h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <article
                    key={s.id}
                    className="flex flex-col rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 flex min-h-[100px] items-center justify-center">
                      {s.logo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- remote sponsor URL */
                        <img
                          src={s.logo_url}
                          alt=""
                          className="max-h-[88px] w-full max-w-[200px] object-contain"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">{s.name}</span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-foreground">{s.name}</h4>
                    {s.description?.trim() ? (
                      <div
                        className={cn('mt-3 flex-1', sponsorCardHtmlClass)}
                        dangerouslySetInnerHTML={{ __html: s.description }}
                      />
                    ) : null}
                    {s.website_url ? (
                      <a
                        href={s.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex text-sm font-bold text-primary hover:underline"
                      >
                        Visit sponsor →
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

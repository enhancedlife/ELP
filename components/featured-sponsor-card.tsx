"use client";

import { BlogArticleBody } from "@/components/blog-article-body";
import type { Sponsor } from "@/lib/types";
import { resolveBlogBodyHtml, sponsorIntroText } from "@/lib/blog-body-blocks";

type FeaturedSponsorCardProps = {
  sponsor: Sponsor;
  compact?: boolean;
};

export function FeaturedSponsorCard({ sponsor, compact = false }: FeaturedSponsorCardProps) {
  const body = sponsor.body?.trim() || sponsor.description?.trim() || "";
  const ctaLabel = sponsor.cta_label?.trim() || `Visit ${sponsor.name}`;
  const intro = sponsorIntroText(sponsor.body, sponsor.description);

  if (compact) {
    return (
      <div className="bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-green-500/30">
        <h3 className="text-3xl font-heading font-bold text-green-400 uppercase tracking-wide">
          {sponsor.name}
        </h3>
        {intro ? (
          <p className="mt-4 text-gray-300 leading-relaxed">{intro}</p>
        ) : null}
        {sponsor.website_url ? (
          <a
            href={sponsor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 bg-green-600 hover:bg-green-500 transition px-6 py-3 rounded-xl font-heading font-semibold uppercase tracking-wider"
          >
            {ctaLabel}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#171a21] to-[#1a2428] rounded-2xl p-8 md:p-12 border border-green-500/30">
      {sponsor.is_featured ? (
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            FEATURED SPONSOR
          </span>
        </div>
      ) : null}
      <h2 className="text-3xl md:text-4xl font-bold text-green-400 mb-0">{sponsor.name}</h2>
      {body ? (
        <div className="mt-4 w-full [&_.blog-article-body>p]:max-w-4xl [&_.blog-article-body>p]:text-lg [&_.blog-article-body>p]:leading-relaxed [&_.blog-article-body>p]:text-gray-300 [&_.blog-article-body>div]:w-full [&_.blog-article-body>div]:max-w-none">
          <BlogArticleBody body={body} tone="sponsor-featured" />
        </div>
      ) : null}
      {sponsor.website_url ? (
        <a
          href={sponsor.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-8 bg-green-600 hover:bg-green-500 transition px-8 py-4 rounded-xl font-semibold"
        >
          {ctaLabel}
        </a>
      ) : null}
    </div>
  );
}

export function SponsorGridCard({ sponsor }: { sponsor: Sponsor }) {
  const body = sponsor.body?.trim() || sponsor.description?.trim() || "";
  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6">
      {sponsor.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sponsor.logo_url}
          alt=""
          className="mb-4 max-h-[88px] w-full max-w-[200px] object-contain self-center"
        />
      ) : null}
      <h4 className="text-lg font-bold text-green-400">{sponsor.name}</h4>
      {body ? (
        <div className="mt-3 flex-1 text-sm">
          <BlogArticleBody body={body} />
        </div>
      ) : null}
      {sponsor.website_url ? (
        <a
          href={sponsor.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex text-sm font-bold text-green-400 hover:underline"
        >
          {sponsor.cta_label?.trim() || "Visit sponsor"} →
        </a>
      ) : null}
    </article>
  );
}

export function sponsorBodyPreview(sponsor: Sponsor): string {
  return resolveBlogBodyHtml(sponsor.body || sponsor.description || "");
}

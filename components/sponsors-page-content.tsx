"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { BlogArticleBody } from "@/components/blog-article-body";
import { FeaturedSponsorCard, SponsorGridCard } from "@/components/featured-sponsor-card";
import type { PartnersPageSettings, Sponsor } from "@/lib/types";

function groupSponsorsByCategory(sponsors: Sponsor[]): { category: string; items: Sponsor[] }[] {
  const map = new Map<string, Sponsor[]>();
  for (const s of sponsors) {
    const c = (s.category ?? "").trim() || "Sponsors";
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(s);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map(([category, items]) => ({
      category,
      items: [...items].sort((x, y) => x.sort_order - y.sort_order || x.name.localeCompare(y.name)),
    }));
}

export function SponsorsPageContent() {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [page, setPage] = useState<PartnersPageSettings | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/sponsors", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) {
          setLoadFailed(true);
          setLoading(false);
          return;
        }
        const data = (await res.json()) as {
          sponsors?: Sponsor[];
          page?: PartnersPageSettings | null;
        };
        setSponsors(Array.isArray(data.sponsors) ? data.sponsors : []);
        setPage(data.page ?? null);
        setLoadFailed(false);
      } catch {
        setLoadFailed(true);
      }
      setLoading(false);
    })();
  }, []);

  const featured = sponsors.filter((s) => s.is_featured);
  const regular = sponsors.filter((s) => !s.is_featured);
  const groups = groupSponsorsByCategory(regular);

  const heroTitle = page?.hero_title?.trim() || "Trusted Sponsors";
  const heroLead =
    page?.hero_lead?.trim() ||
    "Companies we trust and recommend to the Your Enhanced Life community.";

  return (
    <>
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold">{heroTitle}</h1>
          <p className="mt-4 text-xl text-gray-400 max-w-2xl">{heroLead}</p>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : null}

      {!loading && loadFailed ? (
        <p className="mx-auto mb-10 max-w-xl rounded-xl border border-orange-500/30 bg-orange-950/20 px-4 py-3 text-center text-sm text-orange-200">
          Could not load sponsors. Start the <strong>ELP Django</strong> backend on port 8000 (
          <code className="rounded bg-black/30 px-1">npm run dev:backend</code>
          ) and set{" "}
          <code className="rounded bg-black/30 px-1">BACKEND_URL=http://127.0.0.1:8000</code> in{" "}
          <code className="rounded bg-black/30 px-1">.env.local</code>. If another app (e.g. Laravel)
          uses port 8000, stop it first.
        </p>
      ) : null}

      {!loading && !loadFailed && featured.length > 0 ? (
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto space-y-10">
            {featured.map((s) => (
              <FeaturedSponsorCard key={s.id} sponsor={s} />
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !loadFailed && groups.length > 0 ? (
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto space-y-14">
            {groups.map(({ category, items }) => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-8 text-white">{category}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((s) => (
                    <SponsorGridCard key={s.id} sponsor={s} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !loadFailed && sponsors.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No sponsors published yet.</p>
      ) : null}

      {!loading && page?.page_body?.trim() ? (
        <>
          <section className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <BlogArticleBody
                body={page.page_body}
                tone="sponsor"
                className="[&>p]:text-gray-400 [&>p]:max-w-xl [&>p]:mx-auto [&>p]:text-center [&>ul]:max-w-md [&>ul]:mx-auto [&>ul]:text-gray-400 [&>ul]:list-inside"
              />
            </div>
          </section>
        </>
      ) : null}

      {!loading && !page?.page_body?.trim() ? (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10 text-center">
              <h2 className="text-3xl font-bold">Become A Sponsor</h2>
              <p className="mt-4 text-gray-400 max-w-xl mx-auto">
                Interested in partnering with Your Enhanced Life? Contact us to discuss sponsorship.
              </p>
              <Link
                href="/contact"
                className="inline-block mt-8 border border-white/20 hover:border-green-500 px-8 py-4 rounded-xl transition font-semibold"
              >
                Contact Us About Sponsorship
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

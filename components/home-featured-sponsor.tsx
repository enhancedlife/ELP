import Link from "next/link";
import { FeaturedSponsorCard } from "@/components/featured-sponsor-card";
import { getSponsorsWithStatus } from "@/lib/api/website";

export async function HomeFeaturedSponsor() {
  const { sponsors, ok } = await getSponsorsWithStatus();
  const featured = ok ? sponsors.filter((s) => s.is_featured) : [];
  const primary = featured[0];

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-heading font-bold text-center uppercase tracking-wide">
          Trusted Sponsors
        </h2>

        <div className="mt-14 grid md:grid-cols-2 gap-8">
          {primary ? (
            <FeaturedSponsorCard sponsor={primary} compact />
          ) : (
            <div className="bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-white/10 text-gray-400">
              Featured sponsor coming soon.
            </div>
          )}

          <Link
            href="/sponsors"
            className="bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-green-500/50 transition group flex flex-col"
          >
            <h3 className="text-3xl font-heading font-bold uppercase tracking-wide">
              Become A Sponsor
            </h3>
            <p className="mt-4 text-gray-300 flex-1">
              Interested in partnering with Your Enhanced Life? We&apos;re always looking for quality
              companies that align with our community values.
            </p>
            <span className="inline-block mt-8 border border-white/20 group-hover:border-green-500 px-6 py-3 rounded-xl transition text-center font-heading font-semibold uppercase tracking-wider">
              Sponsor Inquiry →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

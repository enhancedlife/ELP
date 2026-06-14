import Link from "next/link"
import { NewsletterSignup } from "@/components/newsletter-signup"

const resources = [
  { title: "Peptide Calculator", href: "/resources/peptide-calculator" },
  { title: "Reconstitution Guide", href: "/resources/reconstitution-guide" },
  { title: "Injection Guide", href: "/resources/injection-guide" },
  { title: "Bloodwork Guide", href: "/resources/bloodwork-guide" },
  { title: "Beginner TRT Guide", href: "/resources/beginner-trt-guide" },
  { title: "Fat Loss Protocols", href: "/resources/fat-loss-protocols" },
]

const articles = [
  {
    title: "Understanding Estradiol on TRT",
    slug: "understanding-estradiol-on-trt",
    image: "/images/article-estradiol.jpg",
  },
  {
    title: "Recovery Peptides Explained",
    slug: "recovery-peptides-explained",
    image: "/images/article-recovery-peptides.jpg",
  },
  {
    title: "Sleep Optimization for Enhanced Athletes",
    slug: "sleep-optimization-for-enhanced-athletes",
    image: "/images/article-sleep.jpg",
  },
]

const features = [
  {
    title: "Peptides",
    desc: "Educational resources, calculators, and protocol discussions.",
    href: "/resources",
  },
  {
    title: "TRT / HRT",
    desc: "Hormone optimization information for men and women.",
    href: "/resources/beginner-trt-guide",
  },
  {
    title: "Recovery & Longevity",
    desc: "Sleep, bloodwork, cardiovascular health, and recovery support.",
    href: "/blog/sleep-optimization-for-enhanced-athletes",
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen text-white pt-16 bg-transparent">
      {/* HERO */}
      <section
        className="relative h-[85vh] bg-cover bg-center flex items-center"
        style={{
          backgroundImage: "url('/your-enhanced-life-banner.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight uppercase tracking-wide">
            Your Enhanced Life
          </h1>

          <p className="mt-6 text-xl md:text-2xl text-gray-200 max-w-3xl">
            A community focused on peptides, TRT/HRT, recovery,
            longevity, and performance optimization.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/resources"
              className="bg-green-600 hover:bg-green-500 transition px-6 py-3 rounded-xl font-heading font-semibold uppercase tracking-wider"
            >
              Explore Resources
            </Link>

            <Link
              href="/sponsors"
              className="border border-white/30 hover:border-white transition px-6 py-3 rounded-xl font-heading font-semibold uppercase tracking-wider"
            >
              Trusted Sponsors
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl font-heading font-bold uppercase tracking-wide">
            learn. improve. thrive.
          </h2>

          <p className="mt-6 text-gray-300 text-lg max-w-3xl mx-auto">
            Your Enhanced Life is built for people who want to improve
            their health, physique, recovery, longevity, and overall
            quality of life through intelligent performance optimization.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {features.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-green-500/50 transition group"
            >
              <h3 className="text-2xl font-heading font-semibold text-green-400 group-hover:text-green-300 transition uppercase tracking-wide">
                {item.title}
              </h3>

              <p className="mt-4 text-gray-300">
                {item.desc}
              </p>

              <span className="inline-block mt-4 text-green-400 group-hover:translate-x-1 transition-transform font-medium">
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* RESOURCES */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-4xl font-heading font-bold uppercase tracking-wide">
              Resources
            </h2>

            <Link href="/resources" className="text-green-400 hover:text-green-300 transition font-medium">
              View All Resources →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {resources.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="bg-black/30 backdrop-blur-md p-6 rounded-2xl hover:border-green-500 border border-white/10 transition group"
              >
                <h3 className="text-xl font-heading font-semibold group-hover:text-green-400 transition uppercase tracking-wide">
                  {resource.title}
                </h3>

                <span className="inline-block mt-6 text-green-400 group-hover:translate-x-1 transition-transform font-medium">
                  Open Resource →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-4xl font-heading font-bold uppercase tracking-wide">
            Latest Articles
          </h2>

          <Link href="/blog" className="text-green-400 hover:text-green-300 transition font-medium">
            View All Articles →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-14">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 hover:border-green-500/50 transition group"
            >
              <div 
                className="h-48 bg-cover bg-center" 
                style={{ backgroundImage: `url('${article.image}')` }}
              />

              <div className="p-6">
                <h3 className="text-xl font-heading font-semibold group-hover:text-green-400 transition uppercase tracking-wide">
                  {article.title}
                </h3>

                <p className="mt-4 text-gray-400">
                  Read more about performance optimization,
                  recovery, and longevity.
                </p>

                <span className="inline-block mt-6 text-green-400 group-hover:translate-x-1 transition-transform font-medium">
                  Read Article →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SPONSORS */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-heading font-bold text-center uppercase tracking-wide">
            Trusted Sponsors
          </h2>

          <div className="mt-14 grid md:grid-cols-2 gap-8">
            <div className="bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-green-500/30">
              <h3 className="text-3xl font-heading font-bold text-green-400 uppercase tracking-wide">
                Great Life Pharma
              </h3>

              <p className="mt-4 text-gray-300">
                Premium peptides, wellness products,
                recovery support, and performance-focused solutions.
              </p>

              <div className="mt-6">
                <p className="text-sm uppercase text-gray-500 font-heading tracking-wider">
                  Sponsor Code
                </p>

                <p className="text-2xl font-heading font-bold text-orange-400">
                  GREATLIFE50
                </p>

                <p className="text-sm text-gray-400 mt-2">
                  Save $50 on your order (one-time use per customer)
                </p>
              </div>

              <a
                href="https://greatlifepharma.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-8 bg-green-600 hover:bg-green-500 transition px-6 py-3 rounded-xl font-heading font-semibold uppercase tracking-wider"
              >
                Visit Sponsor
              </a>
            </div>

            <Link
              href="/sponsors"
              className="bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-green-500/50 transition group flex flex-col"
            >
              <h3 className="text-3xl font-heading font-bold uppercase tracking-wide">
                Become A Sponsor
              </h3>

              <p className="mt-4 text-gray-300 flex-1">
                Interested in partnering with Your Enhanced Life?
                We&apos;re always looking for quality companies that align
                with our community values.
              </p>

              <span className="inline-block mt-8 border border-white/20 group-hover:border-green-500 px-6 py-3 rounded-xl transition text-center font-heading font-semibold uppercase tracking-wider">
                Sponsor Inquiry →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <NewsletterSignup />
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-heading font-bold uppercase tracking-wide">
          Have Questions?
        </h2>

        <p className="mt-4 text-gray-400 text-lg">
          Reach out to us for general inquiries, content suggestions, or sponsorship opportunities.
        </p>

        <Link
          href="/contact"
          className="inline-block mt-8 bg-green-600 hover:bg-green-500 transition px-8 py-4 rounded-xl font-heading font-semibold uppercase tracking-wider"
        >
          Contact Us
        </Link>
      </section>
    </main>
  )
}

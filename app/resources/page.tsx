import Link from "next/link"

const resources = [
  {
    title: "Peptide Calculator",
    desc: "Calculate reconstitution and dosing for peptides with precision.",
    href: "/resources/peptide-calculator",
    category: "Tools",
  },
  {
    title: "Reconstitution Guide",
    desc: "Step-by-step guide for safely reconstituting peptides.",
    href: "/resources/reconstitution-guide",
    category: "Guides",
  },
  {
    title: "Injection Guide",
    desc: "Proper injection techniques for subcutaneous and intramuscular administration.",
    href: "/resources/injection-guide",
    category: "Guides",
  },
  {
    title: "Bloodwork Guide",
    desc: "Understanding your bloodwork markers and what to test for.",
    href: "/resources/bloodwork-guide",
    category: "Guides",
  },
  {
    title: "Beginner TRT Guide",
    desc: "Everything you need to know about starting testosterone replacement therapy.",
    href: "/resources/beginner-trt-guide",
    category: "Guides",
  },
  {
    title: "Fat Loss Protocols",
    desc: "Evidence-based approaches to fat loss optimization.",
    href: "/resources/fat-loss-protocols",
    category: "Protocols",
  },
]

export default function ResourcesPage() {
  return (
    <main className="min-h-screen text-white pt-24">
      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-wide">Resources</h1>
          <p className="mt-4 text-xl text-gray-400 max-w-2xl">
            Tools, calculators, and educational guides for the performance optimization community.
          </p>
          <p className="mt-2 text-sm text-green-400">
            Create a free account to access all resources.
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="group bg-black/30 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-green-500/50 transition-all hover:-translate-y-1"
              >
                <span className="text-xs uppercase tracking-wider text-green-400 font-heading font-semibold">
                  {resource.category}
                </span>
                <h3 className="text-xl font-heading font-semibold mt-2 group-hover:text-green-400 transition uppercase tracking-wide">
                  {resource.title}
                </h3>
                <p className="mt-3 text-gray-400">
                  {resource.desc}
                </p>
                <span className="inline-block mt-4 text-green-400 group-hover:translate-x-1 transition-transform font-medium">
                  Open Resource →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-black/30 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-heading font-semibold text-orange-400 uppercase tracking-wide">Educational Disclaimer</h3>
            <p className="mt-2 text-gray-400">
              All resources provided are for educational purposes only. Always consult with a qualified 
              healthcare provider before starting any new supplement, hormone therapy, or health protocol.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

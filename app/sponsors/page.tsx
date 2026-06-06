import Link from "next/link"

export default function SponsorsPage() {
  return (
    <main className="min-h-screen text-white pt-24">
      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold">Trusted Sponsors</h1>
          <p className="mt-4 text-xl text-gray-400 max-w-2xl">
            Companies we trust and recommend to the Your Enhanced Life community.
          </p>
        </div>
      </section>

      {/* Featured Sponsor */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-[#171a21] to-[#1a2428] rounded-2xl p-8 md:p-12 border border-green-500/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">FEATURED SPONSOR</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-green-400">Great Life Pharma</h2>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl">
              Premium peptides, wellness products, recovery support, and performance-focused 
              solutions. Great Life Pharma is our trusted source for high-quality research compounds.
            </p>

            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="bg-black/50 rounded-xl p-5">
                <h3 className="font-semibold text-green-400">Quality Tested</h3>
                <p className="text-gray-400 mt-2 text-sm">Third-party testing on all products for purity and potency</p>
              </div>
              <div className="bg-black/50 rounded-xl p-5">
                <h3 className="font-semibold text-green-400">Fast Shipping</h3>
                <p className="text-gray-400 mt-2 text-sm">Quick domestic shipping with discreet packaging</p>
              </div>
              <div className="bg-black/50 rounded-xl p-5">
                <h3 className="font-semibold text-green-400">Customer Support</h3>
                <p className="text-gray-400 mt-2 text-sm">Responsive support team to answer your questions</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-black/50 rounded-xl border border-orange-500/30">
              <p className="text-sm uppercase text-gray-500">Exclusive Community Code</p>
              <p className="text-3xl font-bold text-orange-400 mt-1">GREATLIFE50</p>
              <p className="text-gray-400 mt-2">Use this code for a discount on your order</p>
            </div>

            <a
              href="https://greatlifepharma.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-8 bg-green-600 hover:bg-green-500 transition px-8 py-4 rounded-xl font-semibold"
            >
              Visit Great Life Pharma
            </a>
          </div>
        </div>
      </section>

      {/* Why We Choose Sponsors */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Our Sponsor Standards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-green-400">Quality First</h3>
              <p className="mt-3 text-gray-400">
                We only partner with companies that prioritize product quality, 
                testing, and transparency in their manufacturing processes.
              </p>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-green-400">Community Aligned</h3>
              <p className="mt-3 text-gray-400">
                Our sponsors understand and support the performance optimization 
                community. They share our values around education and harm reduction.
              </p>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-green-400">Verified by Use</h3>
              <p className="mt-3 text-gray-400">
                We personally use and verify products before recommending them. 
                Our reputation depends on honest recommendations.
              </p>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-green-400">Customer Service</h3>
              <p className="mt-3 text-gray-400">
                We value sponsors who take care of their customers with responsive 
                support, fair policies, and reliable delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Become a Sponsor */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10 text-center">
            <h2 className="text-3xl font-bold">Become A Sponsor</h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Interested in partnering with Your Enhanced Life? We are always looking 
              for quality companies that align with our community values and can provide 
              value to our audience.
            </p>
            <div className="mt-8 space-y-4 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-green-400">What We Look For:</h3>
              <ul className="text-gray-400 space-y-2">
                <li>• High-quality products with third-party testing</li>
                <li>• Excellent customer service reputation</li>
                <li>• Alignment with our educational mission</li>
                <li>• Exclusive offers for our community</li>
              </ul>
            </div>
            <Link
              href="/contact"
              className="inline-block mt-8 border border-white/20 hover:border-green-500 px-8 py-4 rounded-xl transition font-semibold"
            >
              Contact Us About Sponsorship
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-black/30 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-orange-400">Sponsorship Disclosure</h3>
            <p className="mt-2 text-gray-400">
              Your Enhanced Life receives compensation from sponsors. However, we only 
              partner with companies we genuinely trust and would use ourselves. Our 
              editorial content remains independent of sponsor influence.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

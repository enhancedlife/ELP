"use client"

import Link from "next/link"
import { ResourceContentGate } from "@/components/resource-content-gate"

export default function InjectionGuidePage() {
  return (
    <ResourceContentGate
      title="Injection Guide"
      description="Proper injection techniques for subcutaneous and intramuscular administration."
    >
      <main className="min-h-screen text-white pt-24">
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/resources" className="text-green-400 hover:text-green-300 transition">
              ← Back to Resources
            </Link>

            <h1 className="text-4xl md:text-5xl font-heading font-bold mt-6 uppercase tracking-wide">Injection Guide</h1>
            <p className="mt-4 text-xl text-gray-400">
              Proper injection techniques for subcutaneous and intramuscular administration.
            </p>

            <div className="mt-12">
              <h2 className="text-2xl font-heading font-bold text-green-400 uppercase tracking-wide">Subcutaneous Injections</h2>
              <p className="mt-2 text-gray-400">
                Most peptides are administered subcutaneously (under the skin).
              </p>

              <div className="mt-8 space-y-6">
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Common Injection Sites</h3>
                  <ul className="mt-4 space-y-2 text-gray-400">
                    <li>- Abdomen (2 inches away from the navel)</li>
                    <li>- Thigh (front or outer area)</li>
                    <li>- Back of the arm (tricep area)</li>
                  </ul>
                </div>

                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Technique</h3>
                  <ol className="mt-4 space-y-3 text-gray-400">
                    <li>1. Clean the injection site with an alcohol swab</li>
                    <li>2. Pinch a fold of skin between your thumb and forefinger</li>
                    <li>3. Insert the needle at a 45-90 degree angle</li>
                    <li>4. Inject slowly and steadily</li>
                    <li>5. Release the skin fold and remove the needle</li>
                    <li>6. Apply light pressure with a cotton ball if needed</li>
                  </ol>
                </div>

                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Equipment</h3>
                  <ul className="mt-4 space-y-2 text-gray-400">
                    <li>- Insulin syringes (29-31 gauge, 1/2 inch needle)</li>
                    <li>- Alcohol swabs</li>
                    <li>- Sharps container for disposal</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-heading font-bold text-green-400 uppercase tracking-wide">Intramuscular Injections</h2>
              <p className="mt-2 text-gray-400">
                Some compounds like testosterone are administered intramuscularly.
              </p>

              <div className="mt-8 space-y-6">
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Common Injection Sites</h3>
                  <ul className="mt-4 space-y-2 text-gray-400">
                    <li>- Ventrogluteal (hip)</li>
                    <li>- Deltoid (shoulder)</li>
                    <li>- Vastus lateralis (outer thigh)</li>
                    <li>- Gluteal (upper outer quadrant)</li>
                  </ul>
                </div>

                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Technique</h3>
                  <ol className="mt-4 space-y-3 text-gray-400">
                    <li>1. Clean the injection site with an alcohol swab</li>
                    <li>2. Hold the syringe like a dart</li>
                    <li>3. Insert the needle at a 90 degree angle with a quick motion</li>
                    <li>4. Aspirate slightly to check for blood (if taught by your provider)</li>
                    <li>5. Inject slowly over 10-30 seconds</li>
                    <li>6. Remove needle and apply pressure</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="mt-12 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
              <h3 className="text-xl font-heading font-semibold text-green-400 uppercase tracking-wide">Safety Guidelines</h3>
              <ul className="mt-4 space-y-3 text-gray-400">
                <li>- Always use a new, sterile needle for each injection</li>
                <li>- Rotate injection sites to prevent tissue damage</li>
                <li>- Never share needles or syringes</li>
                <li>- Dispose of sharps properly in a designated container</li>
              </ul>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
              <h3 className="text-lg font-heading font-semibold text-orange-400 uppercase tracking-wide">Disclaimer</h3>
              <p className="mt-2 text-gray-400">
                This guide is for educational purposes only. Always consult with a healthcare 
                provider for proper training on injection techniques.
              </p>
            </div>
          </div>
        </section>
      </main>
    </ResourceContentGate>
  )
}

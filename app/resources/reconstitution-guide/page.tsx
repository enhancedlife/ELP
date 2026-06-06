"use client"

import Link from "next/link"
import { ResourceContentGate } from "@/components/resource-content-gate"

export default function ReconstitutionGuidePage() {
  return (
    <ResourceContentGate
      title="Reconstitution Guide"
      description="Step-by-step guide for safely reconstituting peptides."
    >
      <main className="min-h-screen text-white pt-24">
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/resources" className="text-green-400 hover:text-green-300 transition">
              ← Back to Resources
            </Link>

            <h1 className="text-4xl md:text-5xl font-heading font-bold mt-6 uppercase tracking-wide">Reconstitution Guide</h1>
            <p className="mt-4 text-xl text-gray-400">
              Step-by-step guide for safely reconstituting peptides.
            </p>

            <div className="mt-12 space-y-8">
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">1</span>
                  <div>
                    <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Gather Your Supplies</h3>
                    <ul className="mt-3 space-y-2 text-gray-400">
                      <li>- Peptide vial</li>
                      <li>- Bacteriostatic water (BAC water)</li>
                      <li>- Insulin syringes (29-31 gauge)</li>
                      <li>- Alcohol swabs</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">2</span>
                  <div>
                    <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Clean the Vial Tops</h3>
                    <p className="mt-3 text-gray-400">
                      Use an alcohol swab to clean the rubber stopper on both the peptide vial and the 
                      bacteriostatic water vial. Allow to air dry for a few seconds.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">3</span>
                  <div>
                    <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Draw Bacteriostatic Water</h3>
                    <p className="mt-3 text-gray-400">
                      Using an insulin syringe, draw your desired amount of bacteriostatic water. 
                      Common amounts are 1-2ml depending on your dosing preferences.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">4</span>
                  <div>
                    <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Add Water to Peptide Vial</h3>
                    <p className="mt-3 text-gray-400">
                      Slowly inject the water into the peptide vial. Aim the stream at the side of 
                      the vial, not directly at the powder. Never shake the vial.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">5</span>
                  <div>
                    <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Allow to Dissolve</h3>
                    <p className="mt-3 text-gray-400">
                      Let the peptide dissolve naturally. Gently roll the vial between your 
                      palms to help, but never shake. The solution should be clear when ready.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">6</span>
                  <div>
                    <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Storage</h3>
                    <p className="mt-3 text-gray-400">
                      Store reconstituted peptides in the refrigerator (36-46°F / 2-8°C). Most 
                      remain stable for 4-8 weeks. Protect from light and never freeze.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
              <h3 className="text-xl font-heading font-semibold text-green-400 uppercase tracking-wide">Pro Tips</h3>
              <ul className="mt-4 space-y-3 text-gray-400">
                <li>- Use the peptide calculator to determine your dosing before reconstitution</li>
                <li>- Label your vials with the date and concentration</li>
                <li>- Keep a log of your reconstitution to track stability</li>
                <li>- If the solution appears cloudy or discolored, do not use</li>
              </ul>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
              <h3 className="text-lg font-heading font-semibold text-orange-400 uppercase tracking-wide">Disclaimer</h3>
              <p className="mt-2 text-gray-400">
                This guide is for educational purposes only. Always consult with a healthcare 
                provider and follow proper safety protocols.
              </p>
            </div>
          </div>
        </section>
      </main>
    </ResourceContentGate>
  )
}

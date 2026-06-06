"use client"

import Link from "next/link"
import { ResourceContentGate } from "@/components/resource-content-gate"

export default function BeginnerTRTGuidePage() {
  return (
    <ResourceContentGate
      title="Beginner TRT Guide"
      description="Everything you need to know about starting testosterone replacement therapy."
    >
      <main className="min-h-screen text-white pt-24">
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/resources" className="text-green-400 hover:text-green-300 transition">
              ← Back to Resources
            </Link>

            <h1 className="text-4xl md:text-5xl font-heading font-bold mt-6 uppercase tracking-wide">Beginner TRT Guide</h1>
            <p className="mt-4 text-xl text-gray-400">
              Everything you need to know about starting testosterone replacement therapy.
            </p>

            <div className="mt-12 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-heading font-bold text-green-400 uppercase tracking-wide">What is TRT?</h2>
              <p className="mt-4 text-gray-300 leading-relaxed">
                Testosterone Replacement Therapy (TRT) is a medical treatment for men with clinically 
                low testosterone levels (hypogonadism). It aims to restore testosterone to healthy, 
                physiological levels to improve quality of life, energy, body composition, and overall well-being.
              </p>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-heading font-bold uppercase tracking-wide">Signs of Low Testosterone</h2>
              <div className="mt-4 grid md:grid-cols-2 gap-4 text-gray-400">
                <ul className="space-y-2">
                  <li>- Fatigue and low energy</li>
                  <li>- Decreased muscle mass</li>
                  <li>- Increased body fat</li>
                  <li>- Low libido</li>
                  <li>- Erectile dysfunction</li>
                </ul>
                <ul className="space-y-2">
                  <li>- Brain fog / poor concentration</li>
                  <li>- Depression or mood changes</li>
                  <li>- Poor sleep quality</li>
                  <li>- Decreased motivation</li>
                  <li>- Loss of bone density</li>
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-heading font-bold mb-6 uppercase tracking-wide">Getting Started</h2>
              <div className="space-y-6">
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">1</span>
                    <div>
                      <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Get Comprehensive Bloodwork</h3>
                      <p className="mt-2 text-gray-400">
                        Test Total Testosterone, Free Testosterone, SHBG, LH, FSH, Estradiol, CBC, 
                        metabolic panel, and lipids. Test in the morning, fasted.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">2</span>
                    <div>
                      <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Find a Knowledgeable Provider</h3>
                      <p className="mt-2 text-gray-400">
                        Work with a doctor or clinic experienced in hormone optimization. TRT clinics, 
                        urologists, and endocrinologists are common options.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">3</span>
                    <div>
                      <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Understand Your Options</h3>
                      <p className="mt-2 text-gray-400">
                        Common delivery methods include weekly/twice-weekly injections (cypionate or enanthate), 
                        topical gels/creams, or pellets. Injections are often preferred for consistent levels.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">4</span>
                    <div>
                      <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Start Low and Monitor</h3>
                      <p className="mt-2 text-gray-400">
                        Typical starting doses are 100-150mg/week. Follow up with bloodwork at 6-8 weeks 
                        to assess response and adjust as needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-heading font-bold uppercase tracking-wide">What to Expect</h2>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-300 font-medium">Week 1-2</span>
                  <span className="text-gray-400">Possible improved mood and energy</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-300 font-medium">Week 3-6</span>
                  <span className="text-gray-400">Libido improvements, better sleep</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-300 font-medium">Week 6-12</span>
                  <span className="text-gray-400">Body composition changes begin</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-300 font-medium">Month 3-6</span>
                  <span className="text-gray-400">Full benefits realized</span>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
              <h2 className="text-xl font-heading font-semibold text-green-400 uppercase tracking-wide">Ongoing Monitoring</h2>
              <ul className="mt-4 space-y-2 text-gray-400">
                <li>- Bloodwork every 3-6 months once stable</li>
                <li>- Monitor hematocrit (donate blood if elevated)</li>
                <li>- Track estradiol and adjust if symptoms arise</li>
                <li>- Annual prostate exam (PSA) for men over 40</li>
              </ul>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
              <h3 className="text-lg font-heading font-semibold text-orange-400 uppercase tracking-wide">Medical Disclaimer</h3>
              <p className="mt-2 text-gray-400">
                TRT is a medical treatment that should only be undertaken under the supervision of 
                a qualified healthcare provider. This guide is for educational purposes only.
              </p>
            </div>
          </div>
        </section>
      </main>
    </ResourceContentGate>
  )
}

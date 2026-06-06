"use client"

import Link from "next/link"
import { ResourceContentGate } from "@/components/resource-content-gate"

export default function FatLossProtocolsPage() {
  return (
    <ResourceContentGate
      title="Fat Loss Protocols"
      description="Evidence-based approaches to fat loss optimization."
    >
      <main className="min-h-screen text-white pt-24">
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/resources" className="text-green-400 hover:text-green-300 transition">
              ← Back to Resources
            </Link>

            <h1 className="text-4xl md:text-5xl font-heading font-bold mt-6 uppercase tracking-wide">Fat Loss Protocols</h1>
            <p className="mt-4 text-xl text-gray-400">
              Evidence-based approaches to fat loss optimization.
            </p>

            <div className="mt-12 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
              <h2 className="text-2xl font-heading font-bold text-green-400 uppercase tracking-wide">The Foundation</h2>
              <p className="mt-4 text-gray-300 leading-relaxed">
                Before considering any advanced protocols, the fundamentals must be in place: 
                caloric deficit, adequate protein, resistance training, sleep, and stress management. 
                No compound or protocol will overcome poor fundamentals.
              </p>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-heading font-bold uppercase tracking-wide">Nutrition Fundamentals</h2>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-heading font-semibold text-green-400 uppercase tracking-wide">Caloric Deficit</h3>
                  <p className="mt-2 text-gray-400">
                    Aim for a 300-500 calorie deficit for sustainable fat loss. Aggressive deficits 
                    can lead to muscle loss and metabolic adaptation.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold text-green-400 uppercase tracking-wide">Protein Intake</h3>
                  <p className="mt-2 text-gray-400">
                    Consume 0.8-1g per pound of body weight to preserve muscle mass during a deficit.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold text-green-400 uppercase tracking-wide">Meal Timing</h3>
                  <p className="mt-2 text-gray-400">
                    While total calories matter most, some find benefit in time-restricted eating 
                    or front-loading calories earlier in the day.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-heading font-bold uppercase tracking-wide">Training for Fat Loss</h2>
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-black/50 rounded-xl">
                  <h3 className="font-heading font-semibold uppercase tracking-wide">Resistance Training</h3>
                  <p className="mt-2 text-gray-400">
                    Maintain intensity (weight on the bar) while in a deficit. 3-5 sessions per week. 
                    This is the #1 priority for body composition.
                  </p>
                </div>
                <div className="p-4 bg-black/50 rounded-xl">
                  <h3 className="font-heading font-semibold uppercase tracking-wide">Cardio</h3>
                  <p className="mt-2 text-gray-400">
                    Use cardio as a tool, not the primary driver. 2-4 sessions of low-intensity 
                    steady state (LISS) or 1-2 HIIT sessions. Walking is underrated.
                  </p>
                </div>
                <div className="p-4 bg-black/50 rounded-xl">
                  <h3 className="font-heading font-semibold uppercase tracking-wide">NEAT</h3>
                  <p className="mt-2 text-gray-400">
                    Non-Exercise Activity Thermogenesis (daily movement) can make a huge difference. 
                    Target 8,000-12,000 steps daily.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-heading font-bold uppercase tracking-wide">Peptides for Fat Loss</h2>
              <p className="mt-2 text-gray-400 mb-6">
                Advanced tools that can enhance fat loss when fundamentals are dialed in.
              </p>
              <div className="space-y-6">
                <div className="p-4 bg-black/50 rounded-xl border border-white/5">
                  <h3 className="font-heading font-semibold text-green-400 uppercase tracking-wide">GLP-1 Agonists</h3>
                  <p className="mt-2 text-gray-400 text-sm">
                    Semaglutide, Tirzepatide - reduce appetite and improve insulin sensitivity. 
                    Significant weight loss effects but require medical supervision.
                  </p>
                </div>
                <div className="p-4 bg-black/50 rounded-xl border border-white/5">
                  <h3 className="font-heading font-semibold text-green-400 uppercase tracking-wide">Growth Hormone Secretagogues</h3>
                  <p className="mt-2 text-gray-400 text-sm">
                    CJC-1295/Ipamorelin, Tesamorelin - enhance natural GH release which supports 
                    fat metabolism and body composition.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-heading font-bold uppercase tracking-wide">Recovery Factors</h2>
              <div className="mt-4 space-y-4 text-gray-400">
                <div>
                  <span className="text-white font-medium">Sleep:</span> 7-9 hours of quality sleep. 
                  Poor sleep increases hunger hormones and decreases fat oxidation.
                </div>
                <div>
                  <span className="text-white font-medium">Stress Management:</span> Chronic stress 
                  elevates cortisol which promotes fat storage, especially visceral fat.
                </div>
                <div>
                  <span className="text-white font-medium">Hydration:</span> Adequate water intake 
                  supports metabolic processes and can reduce hunger signals.
                </div>
              </div>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
              <h3 className="text-lg font-heading font-semibold text-orange-400 uppercase tracking-wide">Disclaimer</h3>
              <p className="mt-2 text-gray-400">
                This guide is for educational purposes only. Always consult with a healthcare 
                provider before starting any new supplement or protocol.
              </p>
            </div>
          </div>
        </section>
      </main>
    </ResourceContentGate>
  )
}

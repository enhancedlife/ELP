"use client"

import Link from "next/link"
import { ResourceContentGate } from "@/components/resource-content-gate"
import { PeptideCalculatorContent } from "./calculator-content"

export default function PeptideCalculatorPage() {
  return (
    <ResourceContentGate
      title="Peptide Calculator"
      description="Calculate your peptide reconstitution and dosing with precision."
    >
      <main className="min-h-screen text-white pt-24">
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/resources" className="text-green-400 hover:text-green-300 transition">
              ← Back to Resources
            </Link>

            <h1 className="text-4xl md:text-5xl font-heading font-bold mt-6 uppercase tracking-wide">Peptide Calculator</h1>
            <p className="mt-4 text-xl text-gray-400">
              Calculate your peptide reconstitution and dosing with precision.
            </p>

            <PeptideCalculatorContent />
          </div>
        </section>
      </main>
    </ResourceContentGate>
  )
}

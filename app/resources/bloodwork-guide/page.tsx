"use client"

import Link from "next/link"
import { ResourceContentGate } from "@/components/resource-content-gate"

const markers = [
  {
    category: "Hormones",
    tests: [
      { name: "Total Testosterone", range: "300-1000 ng/dL (men)", notes: "Primary male hormone" },
      { name: "Free Testosterone", range: "9-30 pg/mL (men)", notes: "Bioavailable testosterone" },
      { name: "Estradiol (E2)", range: "20-40 pg/mL (men on TRT)", notes: "Monitor for estrogen management" },
      { name: "SHBG", range: "10-57 nmol/L", notes: "Sex hormone binding globulin" },
      { name: "LH/FSH", range: "Varies", notes: "Suppressed on TRT" },
      { name: "Prolactin", range: "2-18 ng/mL", notes: "Monitor with certain compounds" },
    ]
  },
  {
    category: "Metabolic Health",
    tests: [
      { name: "Fasting Glucose", range: "70-100 mg/dL", notes: "Blood sugar control" },
      { name: "HbA1c", range: "< 5.7%", notes: "3-month blood sugar average" },
      { name: "Fasting Insulin", range: "2-6 μU/mL (optimal)", notes: "Insulin sensitivity marker" },
    ]
  },
  {
    category: "Lipids",
    tests: [
      { name: "Total Cholesterol", range: "< 200 mg/dL", notes: "Overall cholesterol" },
      { name: "LDL", range: "< 100 mg/dL", notes: "Bad cholesterol" },
      { name: "HDL", range: "> 40 mg/dL (men)", notes: "Good cholesterol" },
      { name: "Triglycerides", range: "< 150 mg/dL", notes: "Monitor with certain protocols" },
    ]
  },
  {
    category: "Blood Health",
    tests: [
      { name: "Hematocrit", range: "38-50%", notes: "Red blood cell percentage - important on TRT" },
      { name: "Hemoglobin", range: "13.5-17.5 g/dL (men)", notes: "Oxygen-carrying protein" },
      { name: "RBC", range: "4.5-5.5 million/μL", notes: "Red blood cell count" },
      { name: "Ferritin", range: "30-400 ng/mL", notes: "Iron storage" },
    ]
  },
]

export default function BloodworkGuidePage() {
  return (
    <ResourceContentGate
      title="Bloodwork Guide"
      description="Understanding your bloodwork markers and what to test for optimization."
    >
      <main className="min-h-screen text-white pt-24">
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <Link href="/resources" className="text-green-400 hover:text-green-300 transition">
              ← Back to Resources
            </Link>

            <h1 className="text-4xl md:text-5xl font-heading font-bold mt-6 uppercase tracking-wide">Bloodwork Guide</h1>
            <p className="mt-4 text-xl text-gray-400">
              Understanding your bloodwork markers and what to test for optimization.
            </p>

            <div className="mt-12 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
              <h3 className="text-xl font-heading font-semibold text-green-400 uppercase tracking-wide">Testing Schedule</h3>
              <ul className="mt-4 space-y-3 text-gray-400">
                <li><span className="text-white font-medium">Baseline:</span> Before starting any protocol</li>
                <li><span className="text-white font-medium">6-8 weeks:</span> After starting or changing protocols</li>
                <li><span className="text-white font-medium">Quarterly:</span> Routine monitoring once stable</li>
                <li><span className="text-white font-medium">Annually:</span> Comprehensive panel with additional markers</li>
              </ul>
            </div>

            <div className="mt-12 space-y-10">
              {markers.map((section) => (
                <div key={section.category}>
                  <h2 className="text-2xl font-heading font-bold text-green-400 uppercase tracking-wide mb-6">{section.category}</h2>
                  <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-black/50">
                          <tr>
                            <th className="text-left px-6 py-4 font-heading font-semibold uppercase tracking-wide text-sm">Marker</th>
                            <th className="text-left px-6 py-4 font-heading font-semibold uppercase tracking-wide text-sm">Reference Range</th>
                            <th className="text-left px-6 py-4 font-heading font-semibold uppercase tracking-wide text-sm">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.tests.map((test, idx) => (
                            <tr key={test.name} className={idx % 2 === 0 ? "bg-black/30 backdrop-blur-sm" : "bg-[#1a1e26]"}>
                              <td className="px-6 py-4 font-medium">{test.name}</td>
                              <td className="px-6 py-4 text-gray-400">{test.range}</td>
                              <td className="px-6 py-4 text-gray-400">{test.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">Testing Tips</h3>
              <ul className="mt-4 space-y-3 text-gray-400">
                <li>- Fast for 8-12 hours before bloodwork (water is okay)</li>
                <li>- Test in the morning for hormones (testosterone peaks early)</li>
                <li>- For TRT users, test at trough (before your next injection)</li>
                <li>- Avoid intense exercise 24-48 hours before testing</li>
              </ul>
            </div>

            <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
              <h3 className="text-lg font-heading font-semibold text-orange-400 uppercase tracking-wide">Disclaimer</h3>
              <p className="mt-2 text-gray-400">
                Reference ranges can vary by lab and individual. Always work with a healthcare 
                provider to interpret your results.
              </p>
            </div>
          </div>
        </section>
      </main>
    </ResourceContentGate>
  )
}

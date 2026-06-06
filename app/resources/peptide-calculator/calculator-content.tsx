"use client"

import { useState } from "react"

export function PeptideCalculatorContent() {
  const [peptideAmount, setPeptideAmount] = useState("")
  const [bacWaterAmount, setBacWaterAmount] = useState("")
  const [desiredDose, setDesiredDose] = useState("")
  const [result, setResult] = useState<{ concentration: number; injectionVolume: number } | null>(null)

  const calculate = () => {
    const peptide = parseFloat(peptideAmount)
    const water = parseFloat(bacWaterAmount)
    const dose = parseFloat(desiredDose)

    if (peptide && water && dose) {
      const concentration = peptide / water
      const injectionVolume = (dose / (peptide / water))
      setResult({ concentration, injectionVolume })
    }
  }

  return (
    <>
      <div className="mt-12 bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Peptide Amount (mg)
            </label>
            <input
              type="number"
              value={peptideAmount}
              onChange={(e) => setPeptideAmount(e.target.value)}
              placeholder="e.g., 5"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bacteriostatic Water (ml)
            </label>
            <input
              type="number"
              value={bacWaterAmount}
              onChange={(e) => setBacWaterAmount(e.target.value)}
              placeholder="e.g., 2"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Desired Dose (mcg)
            </label>
            <input
              type="number"
              value={desiredDose}
              onChange={(e) => setDesiredDose(e.target.value)}
              placeholder="e.g., 250"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition"
            />
          </div>
        </div>

        <button
          onClick={calculate}
          className="mt-6 w-full bg-green-600 hover:bg-green-500 transition px-6 py-4 rounded-xl font-heading font-semibold uppercase tracking-wider"
        >
          Calculate
        </button>

        {result && (
          <div className="mt-8 p-6 bg-black/50 rounded-xl border border-green-500/30">
            <h3 className="text-lg font-heading font-semibold text-green-400 uppercase tracking-wide">Results</h3>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Concentration</p>
                <p className="text-2xl font-bold">{result.concentration.toFixed(2)} mcg/unit</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Injection Volume</p>
                <p className="text-2xl font-bold">{result.injectionVolume.toFixed(1)} units</p>
                <p className="text-sm text-gray-400">({(result.injectionVolume / 100).toFixed(2)} ml)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 space-y-6">
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">How to Use</h3>
          <ol className="mt-4 space-y-3 text-gray-400">
            <li>1. Enter the total amount of peptide in your vial (in mg)</li>
            <li>2. Enter how much bacteriostatic water you will add (in ml)</li>
            <li>3. Enter your desired dose (in mcg)</li>
            <li>4. The calculator will show you how many units to draw</li>
          </ol>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
          <h3 className="text-lg font-heading font-semibold text-orange-400 uppercase tracking-wide">Important Notes</h3>
          <ul className="mt-4 space-y-2 text-gray-400">
            <li>- 1 ml = 100 units on an insulin syringe</li>
            <li>- Always use bacteriostatic water for reconstitution</li>
            <li>- Store reconstituted peptides in the refrigerator</li>
            <li>- This calculator is for educational purposes only</li>
          </ul>
        </div>
      </div>
    </>
  )
}

"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ArrowLeftRight, Beaker, Droplets, Info, Syringe, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  clamp,
  computeDoseMassMcgMg,
  computeMixedStrength,
  computeSyringeMl,
  getDoseBounds,
  getVialBounds,
  parseNum,
  resolveWaterMl,
  type DoseUnit,
  type VialUnit,
  type WaterKey,
} from "@/lib/peptide-calculator"

function StepCard({
  icon: Icon,
  step,
  title,
  children,
}: {
  icon: LucideIcon
  step: number
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Step {step}</p>
          <h2 className="mt-1 text-xl font-heading font-semibold uppercase tracking-wide text-white sm:text-2xl">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  )
}

function UnitToggle<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all",
              value === o.value
                ? "border-green-500 bg-green-500/10 text-green-400 shadow-sm ring-1 ring-green-500/15"
                : "border-white/10 bg-black/40 text-gray-300 hover:border-green-500/40",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PeptideCalculatorContent() {
  const [vialUnit, setVialUnit] = useState<VialUnit>("mg")
  const [vialAmount, setVialAmount] = useState("10")
  const [waterKey, setWaterKey] = useState<WaterKey>("2")
  const [waterOther, setWaterOther] = useState("")
  const [doseUnit, setDoseUnit] = useState<DoseUnit>("mcg")
  const [doseAmount, setDoseAmount] = useState("250")
  const [primaryMassUnit, setPrimaryMassUnit] = useState<"mg" | "mcg">("mcg")

  useEffect(() => {
    if (doseUnit === "mg") setPrimaryMassUnit("mg")
    else if (doseUnit === "mcg") setPrimaryMassUnit("mcg")
  }, [doseUnit])

  const vialBounds = getVialBounds(vialUnit)
  const doseBounds = getDoseBounds(doseUnit)

  const waterMl = useMemo(() => resolveWaterMl(waterKey, waterOther), [waterKey, waterOther])

  const vialNum = parseNum(vialAmount)
  const doseNum = parseNum(doseAmount)

  const vialInRange =
    vialNum !== null && vialNum >= vialBounds.min && vialNum <= vialBounds.max
  const doseInRange =
    doseNum !== null && doseNum >= doseBounds.min && doseNum <= doseBounds.max

  const calc = useMemo(() => {
    if (!vialInRange || !doseInRange || waterMl === null) {
      return { result: null as ReturnType<typeof computeSyringeMl> | null, syringeMl: "" }
    }
    const r = computeSyringeMl(vialUnit, vialNum, waterMl, doseUnit, doseNum)
    if (!r.ok) {
      return { result: r, syringeMl: "" }
    }
    return { result: r, syringeMl: r.ml.toFixed(3) }
  }, [vialUnit, vialNum, waterMl, doseUnit, doseNum, vialInRange, doseInRange])

  const showManualNotice = waterKey === "other" && (parseNum(waterOther) ?? 0) > 0

  const incompatible =
    calc.result?.ok === false && calc.result.reason === "incompatible"

  const doseMassMcgMg = useMemo(
    () => computeDoseMassMcgMg(doseUnit, doseNum, doseInRange),
    [doseUnit, doseNum, doseInRange],
  )

  const mixedStrength = useMemo(
    () => computeMixedStrength(vialUnit, waterMl, vialNum, vialInRange),
    [vialUnit, waterMl, vialNum, vialInRange],
  )

  const chipClass = (active: boolean) =>
    cn(
      "cursor-pointer rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all duration-200",
      active
        ? "border-green-500 bg-green-500/10 text-green-400 shadow-sm ring-1 ring-green-500/15"
        : "border-white/10 bg-black/40 text-gray-300 hover:border-green-500/40 hover:bg-black/50",
    )

  const inputClass =
    "h-11 w-full rounded-xl border border-white/10 bg-black/50 px-4 text-white shadow-sm transition-colors placeholder:text-gray-500 focus:border-green-500 focus:outline-none"

  const setVialPreset = (n: number) =>
    setVialAmount(String(clamp(n, vialBounds.min, vialBounds.max)))
  const setDosePreset = (n: number) =>
    setDoseAmount(String(clamp(n, doseBounds.min, doseBounds.max)))

  return (
    <>
      {incompatible ? (
        <div className="mt-8 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <strong className="font-semibold">Unit mismatch.</strong> MG vials work with mg or mcg doses;
            IU vials work with IU doses. Switch the vial or dose unit, or confirm your label uses a
            consistent system.
          </p>
        </div>
      ) : null}

      {showManualNotice ? (
        <div className="mt-8 flex gap-3 rounded-xl border border-green-500/30 bg-green-950/20 px-4 py-3 text-sm text-gray-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-green-400" aria-hidden />
          <p>
            <strong className="font-semibold text-green-400">Custom water volume.</strong> You entered a
            diluent amount outside the 1–3 mL quick picks—double-check it against your protocol and vial.
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 space-y-6">
          <StepCard icon={Beaker} step={1} title="Peptide vial quantity">
            <UnitToggle<VialUnit>
              label="Vial unit"
              value={vialUnit}
              onChange={(u) => {
                setVialUnit(u)
                setVialAmount("10")
              }}
              options={[
                { value: "mg", label: "mg" },
                { value: "iu", label: "IU" },
              ]}
            />
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-gray-300" htmlFor="vial-amt">
                Amount
              </label>
              <input
                id="vial-amt"
                type="number"
                min={vialBounds.min}
                max={vialBounds.max}
                inputMode="decimal"
                value={vialAmount}
                onChange={(e) => setVialAmount(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-gray-500">
                Range: {vialBounds.min.toLocaleString()}–{vialBounds.max.toLocaleString()}{" "}
                {vialUnit === "mg" ? "mg" : "IU"}
              </p>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Quick fill
              </p>
              <div className="flex flex-wrap gap-2">
                {vialUnit === "mg"
                  ? [10, 20, 30].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setVialPreset(n)}
                        className={chipClass(vialAmount === String(n))}
                      >
                        {n} mg
                      </button>
                    ))
                  : [10, 36, 1500].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setVialPreset(n)}
                        className={chipClass(vialAmount === String(n))}
                      >
                        {n.toLocaleString()} IU
                      </button>
                    ))}
              </div>
            </div>
          </StepCard>

          <StepCard icon={Droplets} step={2} title="Bacteriostatic water added">
            <div className="flex flex-wrap gap-3">
              {(["1", "2", "3"] as const).map((k) => (
                <label key={k} className="inline-flex cursor-pointer">
                  <input
                    type="radio"
                    name="waterAmount"
                    value={k}
                    checked={waterKey === k}
                    onChange={() => {
                      setWaterKey(k)
                      setWaterOther("")
                    }}
                    className="sr-only"
                  />
                  <span className={chipClass(waterKey === k)}>{k} ml</span>
                </label>
              ))}
              <label className="inline-flex cursor-pointer">
                <input
                  type="radio"
                  name="waterAmount"
                  value="other"
                  checked={waterKey === "other"}
                  onChange={() => setWaterKey("other")}
                  className="sr-only"
                />
                <span className={chipClass(waterKey === "other")}>Other</span>
              </label>
            </div>
            {waterKey === "other" ? (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="water-other">
                  Volume (ml)
                </label>
                <input
                  id="water-other"
                  type="number"
                  min={0.1}
                  step={0.1}
                  inputMode="decimal"
                  value={waterOther}
                  onChange={(e) => setWaterOther(e.target.value)}
                  placeholder="e.g. 2.5"
                  className={inputClass}
                />
              </div>
            ) : null}
          </StepCard>

          <StepCard icon={Syringe} step={3} title="Peptide per dose">
            <UnitToggle<DoseUnit>
              label="Dose unit"
              value={doseUnit}
              onChange={(u) => {
                setDoseUnit(u)
                if (u === "mcg") setDoseAmount("250")
                else if (u === "mg") setDoseAmount("1")
                else setDoseAmount("100")
              }}
              options={[
                { value: "mcg", label: "mcg" },
                { value: "mg", label: "mg" },
                { value: "iu", label: "IU" },
              ]}
            />
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-gray-300" htmlFor="dose-amt">
                Dose amount
              </label>
              <input
                id="dose-amt"
                type="number"
                min={doseBounds.min}
                max={doseBounds.max}
                inputMode="decimal"
                value={doseAmount}
                onChange={(e) => setDoseAmount(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-gray-500">
                Range: {doseBounds.min.toLocaleString()}–{doseBounds.max.toLocaleString()}{" "}
                {doseUnit === "mcg" ? "mcg" : doseUnit === "mg" ? "mg" : "IU"}
              </p>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Quick fill
              </p>
              <div className="flex flex-wrap gap-2">
                {doseUnit === "mcg" &&
                  [100, 250, 500].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDosePreset(n)}
                      className={chipClass(doseAmount === String(n))}
                    >
                      {n} mcg
                    </button>
                  ))}
                {doseUnit === "mg" &&
                  [1, 2, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDosePreset(n)}
                      className={chipClass(doseAmount === String(n))}
                    >
                      {n} mg
                    </button>
                  ))}
                {doseUnit === "iu" &&
                  [2, 3, 500].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDosePreset(n)}
                      className={chipClass(doseAmount === String(n))}
                    >
                      {n} IU
                    </button>
                  ))}
              </div>
            </div>
          </StepCard>
        </div>

        <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-[min(100%,380px)]">
          <div className="rounded-2xl border-2 border-green-500/40 bg-green-950/20 p-6 shadow-sm sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 text-green-400">
                <Syringe className="h-5 w-5" strokeWidth={2} aria-hidden />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400/90">Result</p>
                <p className="text-sm font-semibold text-white">Syringe pull</p>
              </div>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-gray-400">
              For your selected dose, draw to this mark on the syringe (ml).
            </p>
            <div className="rounded-xl border border-green-500/30 bg-black/50 p-4">
              <p className="text-center text-3xl font-black tracking-tight text-green-400 sm:text-4xl">
                {calc.syringeMl ? calc.syringeMl : "—"}
                <span className="ml-1 text-lg font-bold text-gray-500 sm:text-xl">ml</span>
              </p>
            </div>
            {calc.syringeMl && !incompatible && doseNum !== null && doseInRange ? (
              <div className="mt-4 space-y-3">
                {doseUnit === "iu" ? (
                  <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-center text-sm leading-relaxed text-gray-400">
                    <p className="font-semibold text-gray-200">Dose (IU)</p>
                    <p className="mt-1 text-lg font-bold text-white">{doseNum.toLocaleString()} IU</p>
                    <p className="mt-2 text-[11px] leading-snug">
                      mg/mcg conversion does not apply to IU-labeled doses without a product-specific
                      factor.
                    </p>
                  </div>
                ) : doseMassMcgMg ? (
                  <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-3">
                    <p className="text-center text-xs font-semibold text-gray-200">Your dose</p>
                    {primaryMassUnit === "mg" ? (
                      <>
                        <p className="mt-1 text-center text-2xl font-bold tabular-nums text-white">
                          {doseMassMcgMg.mg.toFixed(3)} mg
                        </p>
                        <p className="text-center text-xs text-gray-500">
                          {doseMassMcgMg.mcg.toLocaleString()} mcg
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-1 text-center text-2xl font-bold tabular-nums text-white">
                          {doseMassMcgMg.mcg.toLocaleString()} mcg
                        </p>
                        <p className="text-center text-xs text-gray-500">
                          {doseMassMcgMg.mg.toFixed(3)} mg
                        </p>
                      </>
                    )}
                    {mixedStrength ? (
                      <>
                        <p className="mt-4 text-center text-xs font-semibold text-gray-200">
                          Mixed concentration (full vial)
                        </p>
                        {primaryMassUnit === "mg" ? (
                          <>
                            <p className="mt-1 text-center text-xl font-bold tabular-nums text-white">
                              {mixedStrength.mgPerMl.toFixed(3)} mg/ml
                            </p>
                            <p className="text-center text-xs text-gray-500">
                              {mixedStrength.mcgPerMl.toLocaleString(undefined, {
                                maximumFractionDigits: 1,
                              })}{" "}
                              mcg/ml
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="mt-1 text-center text-xl font-bold tabular-nums text-white">
                              {mixedStrength.mcgPerMl.toLocaleString(undefined, {
                                maximumFractionDigits: 1,
                              })}{" "}
                              mcg/ml
                            </p>
                            <p className="text-center text-xs text-gray-500">
                              {mixedStrength.mgPerMl.toFixed(3)} mg/ml
                            </p>
                          </>
                        )}
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPrimaryMassUnit((u) => (u === "mg" ? "mcg" : "mg"))}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-green-500/35 bg-black/50 px-3 py-2.5 text-xs font-semibold text-green-400 transition hover:bg-green-500/10"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Convert: mg ↔ mcg
                    </button>
                    <p className="mt-2 text-center text-[11px] text-gray-500">1 mg = 1,000 mcg</p>
                  </div>
                ) : null}
              </div>
            ) : null}
            {calc.syringeMl ? (
              <p className="mt-4 text-center text-sm text-gray-400">
                Pull to <strong className="text-white">{calc.syringeMl} ml</strong> for the dose you
                chose.
              </p>
            ) : (
              <p className="mt-4 text-center text-sm text-gray-400">
                {incompatible
                  ? "Adjust units to compute syringe volume."
                  : "Enter valid amounts in range to see your syringe volume."}
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-12 space-y-6">
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-heading font-semibold uppercase tracking-wide">How to Use</h3>
          <ol className="mt-4 space-y-3 text-gray-400">
            <li>1. Choose your vial unit (mg or IU) and enter the total vial amount</li>
            <li>2. Select how much bacteriostatic water you added (or enter a custom volume)</li>
            <li>3. Set your desired dose in mcg, mg, or IU</li>
            <li>4. The result panel updates live with syringe volume (ml) to draw</li>
          </ol>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
          <h3 className="text-lg font-heading font-semibold text-orange-400 uppercase tracking-wide">
            Important Notes
          </h3>
          <ul className="mt-4 space-y-2 text-gray-400">
            <li>- MG vials pair with mg/mcg doses; IU vials pair with IU doses</li>
            <li>- Always use bacteriostatic water for reconstitution</li>
            <li>- Store reconstituted peptides in the refrigerator (2–8°C)</li>
            <li>- This calculator is for educational purposes only</li>
          </ul>
        </div>
      </div>
    </>
  )
}

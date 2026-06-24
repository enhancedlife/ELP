export const VIAL_MG = { min: 1, max: 100 } as const
export const VIAL_IU = { min: 10, max: 20_000 } as const
export const DOSE_MCG = { min: 1, max: 1000 } as const
export const DOSE_MG = { min: 1, max: 100 } as const
export const DOSE_IU = { min: 1, max: 1000 } as const

export type VialUnit = "mg" | "iu"
export type DoseUnit = "mcg" | "mg" | "iu"
export type WaterKey = "1" | "2" | "3" | "other"

export type CalcResult =
  | { ok: true; ml: number }
  | { ok: false; reason: "incompatible" | "incomplete" }

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function parseNum(s: string): number | null {
  const t = s.trim()
  if (t === "") return null
  const n = Number.parseFloat(t)
  return Number.isFinite(n) ? n : null
}

export function computeSyringeMl(
  vialUnit: VialUnit,
  vialAmt: number,
  waterMl: number,
  doseUnit: DoseUnit,
  doseAmt: number,
): CalcResult {
  if (waterMl <= 0 || vialAmt <= 0 || doseAmt <= 0) {
    return { ok: false, reason: "incomplete" }
  }

  if (vialUnit === "mg") {
    if (doseUnit === "iu") {
      return { ok: false, reason: "incompatible" }
    }
    const totalMcg = vialAmt * 1000
    const doseMcg = doseUnit === "mg" ? doseAmt * 1000 : doseAmt
    const ml = (doseMcg / totalMcg) * waterMl
    return { ok: true, ml }
  }

  if (doseUnit !== "iu") {
    return { ok: false, reason: "incompatible" }
  }
  const ml = (doseAmt / vialAmt) * waterMl
  return { ok: true, ml }
}

export function getVialBounds(vialUnit: VialUnit) {
  return vialUnit === "mg" ? VIAL_MG : VIAL_IU
}

export function getDoseBounds(doseUnit: DoseUnit) {
  if (doseUnit === "mcg") return DOSE_MCG
  if (doseUnit === "mg") return DOSE_MG
  return DOSE_IU
}

export function resolveWaterMl(waterKey: WaterKey, waterOther: string): number | null {
  if (waterKey === "other") {
    const n = parseNum(waterOther)
    return n !== null && n > 0 ? n : null
  }
  return Number.parseInt(waterKey, 10)
}

export function computeMixedStrength(
  vialUnit: VialUnit,
  waterMl: number | null,
  vialNum: number | null,
  vialInRange: boolean,
) {
  if (vialUnit !== "mg" || waterMl === null || vialNum === null || !vialInRange) return null
  const mcgPerMl = (vialNum * 1000) / waterMl
  const mgPerMl = mcgPerMl / 1000
  return { mcgPerMl, mgPerMl }
}

export function computeDoseMassMcgMg(
  doseUnit: DoseUnit,
  doseNum: number | null,
  doseInRange: boolean,
) {
  if (doseNum === null || !doseInRange || doseUnit === "iu") return null
  const mcg = doseUnit === "mg" ? doseNum * 1000 : doseNum
  return { mcg, mg: mcg / 1000 }
}

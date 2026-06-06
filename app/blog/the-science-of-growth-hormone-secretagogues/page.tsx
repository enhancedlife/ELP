import { BlogContentGate } from "@/components/blog-content-gate"

export default function GHSecretagoguesArticle() {
  return (
    <BlogContentGate
      title="The Science of Growth Hormone Secretagogues"
      category="Peptides"
      readTime="12 min read"
      date="December 15, 2023"
      excerpt="Growth hormone secretagogues (GHS) are compounds that stimulate the body's natural production of growth hormone. Unlike exogenous GH, they work with your body's feedback systems to enhance GH release."
    >
      <p className="text-gray-300 leading-relaxed">
        Growth hormone secretagogues (GHS) are compounds that stimulate the body&apos;s 
        natural production of growth hormone. Unlike exogenous GH, they work with 
        your body&apos;s feedback systems to enhance GH release.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-4">How Growth Hormone Works</h2>
      <p className="text-gray-300 leading-relaxed">
        Growth hormone is released from the pituitary gland in pulses, primarily 
        during deep sleep. It affects virtually every tissue in the body, promoting:
      </p>
      <ul className="text-gray-400 mt-4 space-y-2">
        <li>• Fat metabolism and body composition</li>
        <li>• Muscle growth and repair</li>
        <li>• Bone density</li>
        <li>• Skin quality and collagen synthesis</li>
        <li>• Sleep quality</li>
        <li>• Cognitive function</li>
      </ul>

      <h2 className="text-2xl font-bold mt-10 mb-4">Types of Secretagogues</h2>

      <h3 className="text-xl font-semibold text-green-400 mt-8">GHRH Analogs (Growth Hormone Releasing Hormone)</h3>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 my-4">
        <h4 className="font-semibold">CJC-1295 (with DAC)</h4>
        <p className="text-gray-400 mt-2">
          A modified GHRH with extended half-life (days). Provides sustained GH 
          elevation. Often used 1-2x per week.
        </p>
      </div>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 my-4">
        <h4 className="font-semibold">CJC-1295 (no DAC) / Mod GRF 1-29</h4>
        <p className="text-gray-400 mt-2">
          Shorter half-life version. Provides more physiological GH pulses. 
          Typically dosed 2-3x daily.
        </p>
      </div>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 my-4">
        <h4 className="font-semibold">Tesamorelin</h4>
        <p className="text-gray-400 mt-2">
          FDA-approved GHRH analog for HIV-associated lipodystrophy. Shown to 
          reduce visceral fat and improve body composition.
        </p>
      </div>

      <h3 className="text-xl font-semibold text-green-400 mt-8">GHRPs (Growth Hormone Releasing Peptides)</h3>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 my-4">
        <h4 className="font-semibold">Ipamorelin</h4>
        <p className="text-gray-400 mt-2">
          Selective GH release with minimal impact on cortisol and prolactin. 
          Considered the &quot;cleanest&quot; GHRP with fewest side effects.
        </p>
      </div>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 my-4">
        <h4 className="font-semibold">GHRP-6</h4>
        <p className="text-gray-400 mt-2">
          Potent GH release but causes significant hunger increase (ghrelin-like). 
          Also raises cortisol and prolactin.
        </p>
      </div>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 my-4">
        <h4 className="font-semibold">GHRP-2</h4>
        <p className="text-gray-400 mt-2">
          Middle ground between Ipamorelin and GHRP-6. Stronger GH release than 
          Ipamorelin with moderate hunger effects.
        </p>
      </div>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 my-4">
        <h4 className="font-semibold">Hexarelin</h4>
        <p className="text-gray-400 mt-2">
          Strongest GHRP but rapid desensitization occurs. Not recommended for 
          long-term use.
        </p>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">Synergy: GHRH + GHRP</h2>
      <p className="text-gray-300 leading-relaxed">
        Combining a GHRH analog with a GHRP creates a synergistic effect - the 
        GH release is greater than either alone. A common combination is:
      </p>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 my-6 border border-green-500/20">
        <p className="text-green-400 font-semibold">CJC-1295 (no DAC) + Ipamorelin</p>
        <p className="text-gray-400 mt-2">
          100mcg of each, 2-3x daily. Usually taken before bed and/or upon waking 
          on an empty stomach.
        </p>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">MK-677 (Ibutamoren)</h2>
      <p className="text-gray-300 leading-relaxed">
        MK-677 is an oral GH secretagogue (non-peptide) that mimics ghrelin. It 
        provides 24-hour elevation of GH and IGF-1. Benefits include convenience 
        (oral dosing) but it can significantly increase appetite and may affect 
        insulin sensitivity with long-term use.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-4">What to Expect</h2>
      <div className="space-y-4 my-6">
        <div className="flex gap-4 items-start">
          <span className="text-gray-500 w-24">Week 1-2</span>
          <span className="text-gray-300">Improved sleep quality, vivid dreams</span>
        </div>
        <div className="flex gap-4 items-start">
          <span className="text-gray-500 w-24">Week 2-4</span>
          <span className="text-gray-300">Improved recovery, better skin quality</span>
        </div>
        <div className="flex gap-4 items-start">
          <span className="text-gray-500 w-24">Month 2-3</span>
          <span className="text-gray-300">Body composition improvements, fat loss</span>
        </div>
        <div className="flex gap-4 items-start">
          <span className="text-gray-500 w-24">Month 3-6</span>
          <span className="text-gray-300">Continued improvements, potential muscle gains</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">Side Effects</h2>
      <ul className="text-gray-300 space-y-2 mt-4">
        <li>• Water retention (especially initially)</li>
        <li>• Tingling/numbness in hands (carpal tunnel-like)</li>
        <li>• Increased hunger (especially with GHRP-6, MK-677)</li>
        <li>• Potential impact on blood sugar/insulin sensitivity</li>
        <li>• Vivid dreams (usually considered positive)</li>
      </ul>

      {/* Disclaimer */}
      <div className="mt-12 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
        <h3 className="text-lg font-semibold text-orange-400">Research Disclaimer</h3>
        <p className="mt-2 text-gray-400">
          Growth hormone secretagogues are research compounds (except Tesamorelin which 
          is prescription). This article is for educational purposes only. Consult with 
          a healthcare provider before using any GH-related compounds.
        </p>
      </div>
    </BlogContentGate>
  )
}

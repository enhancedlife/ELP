type FaqPageHeroProps = {
  title: string
  subtitle?: string | null
}

/** FAQ hero — matches ELP site styling (dark + green accents). */
export function FaqPageHero({ title, subtitle }: FaqPageHeroProps) {
  const lead = subtitle?.trim()
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#0a0c0f] to-[#121820] py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-wide text-white">
          {title}
        </h1>
        <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-green-500" aria-hidden />
        {lead ? (
          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">{lead}</p>
        ) : null}
      </div>
    </section>
  )
}

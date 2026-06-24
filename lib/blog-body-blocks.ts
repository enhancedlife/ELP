export const BLOG_BODY_FORMAT = "blog-blocks-v1" as const

export type BlogAccentColor = "green" | "orange" | "white" | "blue" | "purple"

export const BLOG_ACCENT_COLOR_OPTIONS: {
  value: BlogAccentColor
  label: string
  className: string
}[] = [
  { value: "green", label: "Green", className: "text-green-400" },
  { value: "orange", label: "Orange", className: "text-orange-400" },
  { value: "white", label: "White", className: "text-white" },
  { value: "blue", label: "Blue", className: "text-blue-400" },
  { value: "purple", label: "Purple", className: "text-purple-400" },
]

export function blogAccentTextClass(color?: BlogAccentColor): string {
  const key = color ?? "green"
  return BLOG_ACCENT_COLOR_OPTIONS.find((o) => o.value === key)?.className ?? "text-green-400"
}

export function blogAccentLabelClass(color?: BlogAccentColor): string {
  return `${blogAccentTextClass(color)} font-medium`
}

export function blogAccentHeading3Class(color?: BlogAccentColor, insideBox = false): string {
  const accent = blogAccentTextClass(color)
  return insideBox
    ? `text-lg font-semibold ${accent} mt-4`
    : `text-xl font-semibold ${accent} mt-8`
}

export type BlogLabeledItem = {
  label?: string
  text: string
}

export type BlogBodyBlock =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading2"; text: string }
  | { id: string; type: "heading3"; text: string; color?: BlogAccentColor }
  | { id: string; type: "bullet_list"; items: string[] }
  | {
      id: string
      type: "labeled_list"
      items: BlogLabeledItem[]
      labelColor?: BlogAccentColor
      inBox?: boolean
    }
  | {
      id: string
      type: "box"
      title?: string
      titleColor?: BlogAccentColor
      intro?: string
      items: BlogLabeledItem[]
      labelColor?: BlogAccentColor
    }
  | {
      id: string
      type: "two_column"
      columns: [
        { title: string; titleColor?: BlogAccentColor; body: string },
        { title: string; titleColor?: BlogAccentColor; body: string },
      ]
    }
  | {
      id: string
      type: "three_column"
      columns: [
        { title: string; titleColor?: BlogAccentColor; body: string },
        { title: string; titleColor?: BlogAccentColor; body: string },
        { title: string; titleColor?: BlogAccentColor; body: string },
      ]
    }
  | {
      id: string
      type: "promo_code"
      label: string
      code: string
      description: string
      codeColor?: BlogAccentColor
    }
  | {
      id: string
      type: "cta_link"
      label: string
      href: string
      variant?: "primary" | "outline"
    }
  | { id: string; type: "disclaimer"; title: string; text: string }
  | { id: string; type: "raw_html"; html: string }

export type BlogBodyDocument = {
  format: typeof BLOG_BODY_FORMAT
  blocks: BlogBodyBlock[]
}

export function newBlockId(): string {
  return `b_${Math.random().toString(36).slice(2, 10)}`
}

export function createEmptyBlock(type: BlogBodyBlock["type"]): BlogBodyBlock {
  const id = newBlockId()
  switch (type) {
    case "paragraph":
      return { id, type, text: "" }
    case "heading2":
      return { id, type, text: "" }
    case "heading3":
      return { id, type, text: "", color: "green" }
    case "bullet_list":
      return { id, type, items: [""] }
    case "labeled_list":
      return { id, type, items: [{ label: "", text: "" }], labelColor: "green", inBox: false }
    case "box":
      return {
        id,
        type,
        title: "",
        titleColor: "green",
        intro: "",
        items: [{ text: "" }],
        labelColor: "green",
      }
    case "two_column":
      return {
        id,
        type,
        columns: [
          { title: "", titleColor: "green", body: "" },
          { title: "", titleColor: "green", body: "" },
        ],
      }
    case "three_column":
      return {
        id,
        type,
        columns: [
          { title: "", titleColor: "green", body: "" },
          { title: "", titleColor: "green", body: "" },
          { title: "", titleColor: "green", body: "" },
        ],
      }
    case "promo_code":
      return {
        id,
        type,
        label: "Exclusive Community Code",
        code: "",
        description: "",
        codeColor: "orange",
      }
    case "cta_link":
      return {
        id,
        type,
        label: "Contact Us",
        href: "/contact",
        variant: "outline",
      }
    case "disclaimer":
      return { id, type, title: "Disclaimer", text: "" }
    case "raw_html":
      return { id, type, html: "" }
  }
}

export function defaultBlogBodyBlocks(): BlogBodyBlock[] {
  return [createEmptyBlock("paragraph")]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderLabeledList(
  items: BlogLabeledItem[],
  listClass: string,
  labelColor?: BlogAccentColor,
): string {
  const labelClass = blogAccentLabelClass(labelColor)
  const rows = items
    .filter((item) => item.text.trim())
    .map((item) => {
      const text = escapeHtml(item.text)
      if (item.label?.trim()) {
        return `<li><span class="${labelClass}">${escapeHtml(item.label)}:</span> ${text}</li>`
      }
      const bullet = text.startsWith("•") ? text : `• ${text}`
      return `<li>${bullet}</li>`
    })
    .join("")
  if (!rows) return ""
  return `<ul class="${listClass}">${rows}</ul>`
}

export function blogBlockToHtml(block: BlogBodyBlock): string {
  switch (block.type) {
    case "paragraph":
      if (!block.text.trim()) return ""
      return `<p class="text-gray-300 leading-relaxed text-justify">${escapeHtml(block.text).replace(/\n/g, "<br />")}</p>`
    case "heading2":
      if (!block.text.trim()) return ""
      return `<h2 class="block-h2 text-2xl font-bold mt-10 mb-4">${escapeHtml(block.text)}</h2>`
    case "heading3":
      if (!block.text.trim()) return ""
      return `<h3 class="block-h3 ${blogAccentHeading3Class(block.color)}">${escapeHtml(block.text)}</h3>`
    case "bullet_list": {
      const items = block.items.filter((i) => i.trim())
      if (items.length === 0) return ""
      return renderLabeledList(
        items.map((text) => ({ text })),
        "text-gray-300 space-y-2 mt-4",
      )
    }
    case "labeled_list": {
      const list = renderLabeledList(
        block.items,
        block.inBox ? "text-gray-300 space-y-3" : "text-gray-300 space-y-3 mt-4",
        block.labelColor,
      )
      if (!list) return ""
      return block.inBox
        ? `<div class="bg-black/30 backdrop-blur-sm rounded-xl p-6 my-6">${list}</div>`
        : list
    }
    case "box": {
      const title = block.title?.trim()
        ? `<h3 class="text-lg font-semibold ${blogAccentTextClass(block.titleColor)}">${escapeHtml(block.title)}</h3>`
        : ""
      const intro = block.intro?.trim()
        ? `<p class="text-gray-300 leading-relaxed text-justify${title ? " mt-2" : ""}">${escapeHtml(block.intro).replace(/\n/g, "<br />")}</p>`
        : ""
      const hasLabels = block.items.some((i) => i.label?.trim() && i.text.trim())
      const listClass = hasLabels ? "text-gray-300 space-y-3" : "text-gray-300 space-y-2 mt-4"
      const list = renderLabeledList(block.items, listClass, block.labelColor)
      if (!intro && !title && !list) return ""
      return `<div class="bg-black/30 backdrop-blur-sm rounded-xl p-6 my-6">${title}${intro}${list}</div>`
    }
    case "two_column": {
      const [a, b] = block.columns
      if (!a.title.trim() && !a.body.trim() && !b.title.trim() && !b.body.trim()) return ""
      const col = (c: { title: string; titleColor?: BlogAccentColor; body: string }) =>
        `<div class="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10"><h3 class="sponsor-col-title text-xl font-semibold ${blogAccentTextClass(c.titleColor)}">${escapeHtml(c.title)}</h3><p class="text-gray-400 mt-3 text-sm text-justify leading-relaxed">${escapeHtml(c.body).replace(/\n/g, "<br />")}</p></div>`
      return `<div class="sponsor-two-col grid md:grid-cols-2 gap-6 my-6">${col(a)}${col(b)}</div>`
    }
    case "three_column": {
      const [a, b, c] = block.columns
      if (
        !a.title.trim() &&
        !a.body.trim() &&
        !b.title.trim() &&
        !b.body.trim() &&
        !c.title.trim() &&
        !c.body.trim()
      ) {
        return ""
      }
      const col = (col: { title: string; titleColor?: BlogAccentColor; body: string }) =>
        `<div class="bg-black/50 rounded-xl p-5 h-full"><h3 class="sponsor-col-title text-base font-semibold ${blogAccentTextClass(col.titleColor)}">${escapeHtml(col.title)}</h3><p class="text-gray-400 mt-2 text-sm text-justify leading-relaxed">${escapeHtml(col.body).replace(/\n/g, "<br />")}</p></div>`
      return `<div class="sponsor-three-col grid md:grid-cols-3 gap-6 my-8 w-full">${col(a)}${col(b)}${col(c)}</div>`
    }
    case "promo_code": {
      if (!block.code.trim() && !block.label.trim() && !block.description.trim()) return ""
      const codeClass = blogAccentTextClass(block.codeColor ?? "orange")
      const label = block.label?.trim()
        ? `<p class="text-sm uppercase text-gray-500">${escapeHtml(block.label)}</p>`
        : ""
      const code = block.code?.trim()
        ? `<p class="text-3xl font-bold ${codeClass} mt-1">${escapeHtml(block.code)}</p>`
        : ""
      const desc = block.description?.trim()
        ? `<p class="text-gray-400 mt-2">${escapeHtml(block.description).replace(/\n/g, "<br />")}</p>`
        : ""
      return `<div class="mt-8 p-6 bg-black/50 rounded-xl border border-orange-500/30">${label}${code}${desc}</div>`
    }
    case "cta_link": {
      if (!block.label.trim() || !block.href.trim()) return ""
      const cls =
        block.variant === "primary"
          ? "inline-block mt-8 bg-green-600 hover:bg-green-500 transition px-8 py-4 rounded-xl font-semibold text-white"
          : "inline-block mt-8 border border-white/20 hover:border-green-500 px-8 py-4 rounded-xl transition font-semibold text-white"
      return `<div class="text-center my-8"><a href="${escapeHtml(block.href)}" class="${cls}">${escapeHtml(block.label)}</a></div>`
    }
    case "disclaimer":
      if (!block.title.trim() && !block.text.trim()) return ""
      return `<div class="mt-12 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20"><h3 class="text-lg font-semibold text-orange-400">${escapeHtml(block.title || "Disclaimer")}</h3><p class="mt-2 text-gray-400">${escapeHtml(block.text).replace(/\n/g, "<br />")}</p></div>`
    case "raw_html":
      return block.html
  }
}

export function blogBlocksToHtml(blocks: BlogBodyBlock[]): string {
  return blocks.map(blogBlockToHtml).filter(Boolean).join("\n")
}

export function parseBlogBody(raw: string | null | undefined): BlogBodyBlock[] | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  if (!trimmed.startsWith("{")) return null
  try {
    const data = JSON.parse(trimmed) as BlogBodyDocument
    if (data?.format !== BLOG_BODY_FORMAT || !Array.isArray(data.blocks)) return null
    return data.blocks
  } catch {
    return null
  }
}

export function serializeBlogBody(blocks: BlogBodyBlock[]): string {
  const doc: BlogBodyDocument = { format: BLOG_BODY_FORMAT, blocks }
  return JSON.stringify(doc)
}

/** Stored body → HTML for public article view */
export function resolveBlogBodyHtml(raw: string | null | undefined): string {
  const trimmed = raw?.trim()
  if (!trimmed) return ""
  const blocks = parseBlogBody(trimmed)
  if (blocks) return blogBlocksToHtml(blocks)
  return trimmed
}

export const BLOG_BLOCK_LABELS: Record<BlogBodyBlock["type"], string> = {
  paragraph: "Paragraph",
  heading2: "Section heading (H2)",
  heading3: "Subheading (H3)",
  bullet_list: "Bullet list",
  labeled_list: "Labeled list (title: text)",
  box: "Single column box",
  two_column: "Two column boxes",
  three_column: "Three column boxes",
  promo_code: "Promo / discount code",
  cta_link: "Call-to-action button",
  disclaimer: "Disclaimer box",
  raw_html: "Raw HTML (legacy)",
}

import { BLOG_CATEGORIES } from "@/lib/blog"
import {
  createEmptyBlock,
  newBlockId,
  type BlogAccentColor,
  type BlogBodyBlock,
  type BlogLabeledItem,
} from "@/lib/blog-body-blocks"

export type ParsedBlogTsx = {
  slug: string
  title: string
  excerpt: string
  category: string
  read_time_minutes: number
  published_at: string
  bodyBlocks: BlogBodyBlock[]
  warnings: string[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function decodeJsxText(raw: string): string {
  return raw
    .replace(/<Link[^>]*>([\s\S]*?)<\/Link>/gi, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function extractProp(source: string, name: string): string | null {
  const patterns = [
    new RegExp(`${name}=\\{["']([^"']+)["']\\}`, "i"),
    new RegExp(`${name}=["]([^"]*)["]`, "i"),
    new RegExp(`${name}=[']([^']*)[']`, "i"),
  ]
  for (const re of patterns) {
    const m = source.match(re)
    if (m?.[1] != null && m[1].trim()) return m[1].trim()
  }
  return null
}

function extractGateSection(source: string): { props: string; body: string } | null {
  const gateOpen = source.match(/<BlogContentGate[\s\S]*?>/i)
  if (!gateOpen || gateOpen.index == null) return null
  const props = gateOpen[0]
  const bodyStart = gateOpen.index + gateOpen[0].length
  const closeIdx = source.indexOf("</BlogContentGate>", bodyStart)
  if (closeIdx === -1) return null
  return { props, body: source.slice(bodyStart, closeIdx) }
}

function findMatchingCloseTag(source: string, tagName: string, openTagStart: number): number {
  const openTag = new RegExp(`<${tagName}(\\s[^>]*)?>`, "gi")
  const closeTag = new RegExp(`</${tagName}>`, "gi")
  const openEnd = source.indexOf(">", openTagStart)
  if (openEnd === -1) return -1

  let depth = 1
  let pos = openEnd + 1

  while (depth > 0 && pos < source.length) {
    openTag.lastIndex = pos
    closeTag.lastIndex = pos
    const nextOpen = openTag.exec(source)
    const nextClose = closeTag.exec(source)
    const openAt = nextOpen?.index ?? -1
    const closeAt = nextClose?.index ?? -1

    if (closeAt === -1) return -1
    if (openAt !== -1 && openAt < closeAt) {
      depth += 1
      pos = openAt + (nextOpen?.[0].length ?? 0)
    } else {
      depth -= 1
      if (depth === 0) return closeAt
      pos = closeAt + `</${tagName}>`.length
    }
  }
  return -1
}

function parseTopLevelElements(body: string): string[] {
  const elements: string[] = []
  let i = 0
  const trimmed = body.trim()

  while (i < trimmed.length) {
    while (i < trimmed.length && /\s/.test(trimmed[i])) i += 1
    if (i >= trimmed.length) break

    if (trimmed.startsWith("{/*", i)) {
      const end = trimmed.indexOf("*/}", i)
      i = end === -1 ? trimmed.length : end + 3
      continue
    }

    if (trimmed[i] !== "<") {
      i += 1
      continue
    }

    const tagMatch = trimmed.slice(i).match(/^<(\w+)/)
    if (!tagMatch) {
      i += 1
      continue
    }
    const tag = tagMatch[1]
    const openEnd = trimmed.indexOf(">", i)
    if (openEnd === -1) break

    const openTag = trimmed.slice(i, openEnd + 1)
    if (/\/>$/.test(openTag.trim())) {
      elements.push(openTag)
      i = openEnd + 1
      continue
    }

    const closeStart = findMatchingCloseTag(trimmed, tag, i)
    if (closeStart === -1) {
      elements.push(trimmed.slice(i))
      break
    }
    const closeEnd = closeStart + `</${tag}>`.length
    elements.push(trimmed.slice(i, closeEnd))
    i = closeEnd
  }

  return elements
}

function extractClassName(el: string): string {
  const m = el.match(/className=["']([^"']+)["']/i)
  return m?.[1] ?? ""
}

function accentFromClass(className: string): BlogAccentColor {
  if (className.includes("text-orange-400")) return "orange"
  if (className.includes("text-blue-400")) return "blue"
  if (className.includes("text-purple-400")) return "purple"
  if (className.includes("text-white")) return "white"
  return "green"
}

function getInnerHtml(el: string, tag: string): string {
  const openEnd = el.indexOf(">")
  const closeStart = el.lastIndexOf(`</${tag}>`)
  if (openEnd === -1 || closeStart === -1 || closeStart <= openEnd) return ""
  return el.slice(openEnd + 1, closeStart)
}

function extractListItems(el: string): BlogLabeledItem[] {
  const items: BlogLabeledItem[] = []
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let m: RegExpExecArray | null
  while ((m = liRe.exec(el)) !== null) {
    const inner = m[1]
    const labelMatch = inner.match(
      /<span[^>]*className=["'][^"']*font-medium[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    )
    if (labelMatch) {
      const label = decodeJsxText(labelMatch[1]).replace(/:$/, "")
      const text = decodeJsxText(inner.replace(labelMatch[0], ""))
      if (text) items.push({ label, text })
      continue
    }
    const text = decodeJsxText(inner)
    if (text) items.push({ text })
  }
  return items
}

function withId(block: BlogBodyBlock): BlogBodyBlock {
  return { ...block, id: newBlockId() }
}

function parseListElement(el: string): BlogBodyBlock {
  const items = extractListItems(el)
  const hasLabels = items.some((i) => i.label?.trim())
  if (hasLabels) {
    return withId({
      ...createEmptyBlock("labeled_list"),
      items: items.length ? items : [{ text: "" }],
      labelColor: accentFromClass(extractClassName(el)),
      inBox: false,
    })
  }
  return withId({
    ...createEmptyBlock("bullet_list"),
    items: items.map((i) => i.text).filter(Boolean).length
      ? items.map((i) => i.text)
      : [""],
  })
}

function parseDisclaimerDiv(el: string): BlogBodyBlock {
  const titleMatch = el.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)
  const bodyMatch = el.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  return withId({
    ...createEmptyBlock("disclaimer"),
    title: titleMatch ? decodeJsxText(titleMatch[1]) : "Disclaimer",
    text: bodyMatch ? decodeJsxText(bodyMatch[1]) : decodeJsxText(getInnerHtml(el, "div")),
  })
}

function parseTwoColumnDiv(el: string): BlogBodyBlock {
  const inner = getInnerHtml(el, "div")
  const colEls = parseTopLevelElements(inner).filter((c) => c.startsWith("<div"))
  const parseCol = (colEl: string) => {
    const titleMatch = colEl.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)
    const bodyMatch = colEl.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    return {
      title: titleMatch ? decodeJsxText(titleMatch[1]) : "",
      titleColor: accentFromClass(extractClassName(colEl)),
      body: bodyMatch ? decodeJsxText(bodyMatch[1]) : "",
    }
  }
  const a = parseCol(colEls[0] ?? "")
  const b = parseCol(colEls[1] ?? "")
  return withId({
    ...createEmptyBlock("two_column"),
    columns: [a, b],
  })
}

function parseBoxDiv(el: string): BlogBodyBlock {
  const titleMatch = el.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)
  const introMatch = el.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  const listMatch = el.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i)
  const items = listMatch ? extractListItems(listMatch[0]) : [{ text: "" }]
  return withId({
    ...createEmptyBlock("box"),
    title: titleMatch ? decodeJsxText(titleMatch[1]) : "",
    titleColor: accentFromClass(titleMatch?.[0] ?? extractClassName(el)),
    intro: introMatch ? decodeJsxText(introMatch[1]) : "",
    items: items.length ? items : [{ text: "" }],
    labelColor: accentFromClass(listMatch?.[0] ?? extractClassName(el)),
  })
}

function elementToBlock(el: string): BlogBodyBlock | null {
  const tagMatch = el.match(/^<(\w+)/)
  if (!tagMatch) return null
  const tag = tagMatch[1].toLowerCase()

  if (tag === "p") {
    const text = decodeJsxText(getInnerHtml(el, "p"))
    if (!text) return null
    return withId({ ...createEmptyBlock("paragraph"), text })
  }
  if (tag === "h2") {
    const text = decodeJsxText(getInnerHtml(el, "h2"))
    if (!text) return null
    return withId({ ...createEmptyBlock("heading2"), text })
  }
  if (tag === "h3") {
    const text = decodeJsxText(getInnerHtml(el, "h3"))
    if (!text) return null
    return withId({
      ...createEmptyBlock("heading3"),
      text,
      color: accentFromClass(extractClassName(el)),
    })
  }
  if (tag === "ul" || tag === "ol") {
    return parseListElement(el)
  }
  if (tag === "div") {
    const cls = extractClassName(el)
    if (el.includes("grid-cols-2") || el.includes("md:grid-cols-2")) {
      return parseTwoColumnDiv(el)
    }
    if (el.includes("border-orange") || cls.includes("border-orange")) {
      return parseDisclaimerDiv(el)
    }
    if (el.includes("bg-black/30") || el.includes("backdrop-blur")) {
      return parseBoxDiv(el)
    }
    const text = decodeJsxText(getInnerHtml(el, "div"))
    if (text) {
      return withId({ ...createEmptyBlock("paragraph"), text })
    }
  }
  return withId({ ...createEmptyBlock("raw_html"), html: el })
}

function normalizeCategory(raw: string | null): string {
  if (!raw?.trim()) return "General"
  const found = BLOG_CATEGORIES.find((c) => c.toLowerCase() === raw.trim().toLowerCase())
  return found ?? "General"
}

function parseReadTimeMinutes(raw: string | null): number {
  if (!raw) return 5
  const m = raw.match(/(\d+)/)
  const n = m ? Number(m[1]) : 5
  return Number.isFinite(n) && n > 0 ? n : 5
}

function parsePublishedAt(raw: string | null): string {
  if (!raw?.trim()) return new Date().toISOString()
  const parsed = Date.parse(raw.trim())
  if (Number.isNaN(parsed)) return new Date().toISOString()
  return new Date(parsed).toISOString()
}

function slugFromFilename(filename: string | undefined): string | null {
  if (!filename) return null
  const base = filename.replace(/\\/g, "/").split("/").pop() ?? ""
  const name = base.replace(/\.(tsx|ts|jsx|js)$/i, "")
  if (!name || name === "page" || name === "index") return null
  return slugify(name)
}

export function parseBlogTsx(source: string, filename?: string): ParsedBlogTsx {
  const warnings: string[] = []
  const gate = extractGateSection(source)
  if (!gate) {
    throw new Error(
      "Could not find <BlogContentGate> in this file. Use the same layout as app/blog/*/page.tsx articles.",
    )
  }

  const title = extractProp(gate.props, "title")
  const excerpt = extractProp(gate.props, "excerpt")
  if (!title?.trim()) {
    throw new Error("BlogContentGate is missing a title prop.")
  }
  if (!excerpt?.trim()) {
    throw new Error("BlogContentGate is missing an excerpt prop.")
  }

  const commentSlug = extractProp(gate.props, "commentSlug")
  const slug =
    commentSlug?.trim() ||
    slugFromFilename(filename) ||
    slugify(title)

  const categoryRaw = extractProp(gate.props, "category")
  const category = normalizeCategory(categoryRaw)
  if (categoryRaw && category === "General" && categoryRaw !== "General") {
    warnings.push(`Category "${categoryRaw}" was mapped to General.`)
  }

  const read_time_minutes = parseReadTimeMinutes(extractProp(gate.props, "readTime"))
  const published_at = parsePublishedAt(extractProp(gate.props, "date"))

  const elements = parseTopLevelElements(gate.body)
  const bodyBlocks: BlogBodyBlock[] = []
  for (const el of elements) {
    const block = elementToBlock(el)
    if (block) bodyBlocks.push(block)
  }

  if (bodyBlocks.length === 0) {
    warnings.push("No body blocks were detected; a blank paragraph was added.")
    bodyBlocks.push(createEmptyBlock("paragraph"))
  }

  return {
    slug,
    title: title.trim(),
    excerpt: excerpt.trim(),
    category,
    read_time_minutes,
    published_at,
    bodyBlocks,
    warnings,
  }
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function applyParsedBlogTsx(parsed: ParsedBlogTsx): {
  form: {
    slug: string
    title: string
    excerpt: string
    category: string
    read_time_minutes: number
    published_at: string
  }
  bodyBlocks: BlogBodyBlock[]
} {
  return {
    form: {
      slug: parsed.slug,
      title: parsed.title,
      excerpt: parsed.excerpt,
      category: parsed.category,
      read_time_minutes: parsed.read_time_minutes,
      published_at: toDatetimeLocalValue(parsed.published_at),
    },
    bodyBlocks: parsed.bodyBlocks,
  }
}

/**
 * Parse static app/blog/<slug>/page.tsx files and emit import JSON for Django.
 * Usage: npx tsx scripts/import-legacy-blog-posts.mts [--write backend/blog/data/legacy_imports.json]
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { applyParsedBlogTsx, parseBlogTsx } from "../lib/parse-blog-tsx"
import { serializeBlogBody, upsertHeroImageBlock } from "../lib/blog-body-blocks"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const blogDir = join(root, "app", "blog")

const slugs = readdirSync(blogDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "[slug]" && d.name !== "archive")
  .map((d) => d.name)

const imports: Array<{
  slug: string
  body: string
  image_url?: string
}> = []

for (const slug of slugs) {
  const pagePath = join(blogDir, slug, "page.tsx")
  const source = readFileSync(pagePath, "utf8")
  const parsed = parseBlogTsx(source, pagePath)
  const applied = applyParsedBlogTsx(parsed)
  const imageUrl = applied.form.image_url?.trim() || undefined
  let blocks = applied.bodyBlocks
  if (imageUrl && imageUrl !== "/images/article-default.jpg") {
    blocks = upsertHeroImageBlock(blocks, imageUrl, parsed.title)
  }
  imports.push({
    slug,
    body: serializeBlogBody(blocks),
    ...(imageUrl && imageUrl !== "/images/article-default.jpg" ? { image_url: imageUrl } : {}),
  })
  console.log(`${slug}: ${blocks.length} block(s)`)
}

const outArg = process.argv.indexOf("--write")
if (outArg !== -1) {
  const outPath = process.argv[outArg + 1] || join(root, "backend", "blog", "data", "legacy_imports.json")
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(imports, null, 2), "utf8")
  console.log(`Wrote ${imports.length} posts to ${outPath}`)
} else {
  console.log(JSON.stringify(imports, null, 2))
}

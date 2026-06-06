const fs = require("fs")
const path = require("path")

const rootDir = ".next"
const outDir = "scripts/extracted-blog"

fs.mkdirSync(outDir, { recursive: true })

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, files)
    else if (entry.name.endsWith(".map")) files.push(p)
  }
  return files
}

function extractFromMapFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8")
  if (!raw.includes("app/blog/") || !raw.includes("sourcesContent")) return

  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return
  }

  const sections = data.sections || []
  for (const section of sections) {
    const content = section.map?.sourcesContent?.[0]
    const source = section.map?.sources?.[0]
    if (!content || !source?.includes("app/blog/")) continue

    const rel = source.replace(/^file:\/\/\/.*\/ELP\//, "").replace(/%20/g, " ")
    const outPath = path.join(outDir, rel.replace(/\//g, "__"))
    fs.writeFileSync(outPath, content, "utf8")
    console.log("Wrote", outPath)
  }

  const sources = data.sources || []
  const contents = data.sourcesContent || []
  sources.forEach((source, i) => {
    if (!source?.includes("app/blog/")) return
    const content = contents[i]
    if (!content) return
    const outPath = path.join(outDir, source.replace(/\//g, "__"))
    fs.writeFileSync(outPath, content, "utf8")
    console.log("Wrote", outPath)
  })
}

for (const f of walk(rootDir)) extractFromMapFile(f)

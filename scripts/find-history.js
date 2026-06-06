const fs = require("fs")
const path = require("path")

const hist = path.join(process.env.APPDATA, "Cursor", "User", "History")
if (!fs.existsSync(hist)) {
  console.log("no history")
  process.exit(0)
}

const needles = [
  "RecoveryPeptidesArticle",
  "recovery-peptides-explained/page",
  "Beginner's Guide to BPC-157",
  "HematocritArticle",
  "GrowthHormoneSecretagogues",
  "archivedArticles",
]

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else {
      try {
        const t = fs.readFileSync(p, "utf8")
        for (const n of needles) {
          if (t.includes(n)) {
            console.log(n, "->", p)
            break
          }
        }
      } catch {}
    }
  }
}

walk(hist)

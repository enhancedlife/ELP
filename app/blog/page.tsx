import Link from "next/link"
import { getFeaturedBlogPosts } from "@/lib/api/blog"
import type { BlogPostSummary } from "@/lib/blog"

const fallbackArticles: BlogPostSummary[] = [
  {
    slug: "understanding-estradiol-on-trt",
    title: "Understanding Estradiol on TRT",
    excerpt: "A comprehensive guide to managing estrogen levels while on testosterone replacement therapy.",
    category: "TRT / HRT",
    date: "January 15, 2024",
    read_time: "8 min read",
    image: "/images/article-estradiol.jpg",
  },
  {
    slug: "recovery-peptides-explained",
    title: "Recovery Peptides Explained",
    excerpt: "An overview of the most popular peptides for healing, recovery, and tissue repair.",
    category: "Peptides",
    date: "January 10, 2024",
    read_time: "10 min read",
    image: "/images/article-recovery-peptides.jpg",
  },
  {
    slug: "sleep-optimization-for-enhanced-athletes",
    title: "Sleep Optimization for Enhanced Athletes",
    excerpt: "Why sleep is the ultimate performance enhancer and how to optimize it.",
    category: "Recovery",
    date: "January 5, 2024",
    read_time: "7 min read",
    image: "/images/article-sleep.jpg",
  },
  {
    slug: "beginners-guide-to-bpc-157",
    title: "Beginner's Guide to BPC-157",
    excerpt: "Everything you need to know about this popular healing peptide.",
    category: "Peptides",
    date: "December 28, 2023",
    read_time: "9 min read",
    image: "/images/article-bpc157.jpg",
  },
  {
    slug: "hematocrit-management-on-trt",
    title: "Hematocrit Management on TRT",
    excerpt: "Understanding and managing elevated hematocrit while on testosterone therapy.",
    category: "TRT / HRT",
    date: "December 20, 2023",
    read_time: "6 min read",
    image: "/images/article-hematocrit.jpg",
  },
  {
    slug: "the-science-of-growth-hormone-secretagogues",
    title: "The Science of Growth Hormone Secretagogues",
    excerpt: "How GH secretagogues work and what the research says about their effects.",
    category: "Peptides",
    date: "December 15, 2023",
    read_time: "12 min read",
    image: "/images/article-gh-secretagogues.jpg",
  },
]

export default async function BlogPage() {
  const fromApi = await getFeaturedBlogPosts()
  const articles = fromApi.length > 0 ? fromApi : fallbackArticles

  return (
    <main className="min-h-screen text-white pt-24">
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold">Blog</h1>
          <p className="mt-4 text-xl text-gray-400 max-w-2xl">
            Educational articles on peptides, hormone optimization, recovery, and longevity.
          </p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-green-500/50 transition-all hover:-translate-y-1"
              >
                <div
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url('${article.image}')` }}
                />
                <div className="p-6">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-400 font-medium">{article.category}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">{article.read_time}</span>
                  </div>
                  <h3 className="text-xl font-semibold mt-3 group-hover:text-green-400 transition">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-gray-400 line-clamp-2">{article.excerpt}</p>
                  <p className="mt-4 text-sm text-gray-500">{article.date}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/blog/archive"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition group"
            >
              <span>View Older Blog Posts</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-green-500/20 text-center">
            <h2 className="text-2xl font-bold">Stay Updated</h2>
            <p className="mt-2 text-gray-400">
              Get the latest articles and resources delivered to your inbox.
            </p>
            <form className="mt-6 flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition"
              />
              <button className="bg-green-600 hover:bg-green-500 transition px-6 py-3 rounded-xl font-semibold whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}

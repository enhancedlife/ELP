import Link from "next/link"
import { getFeaturedBlogPosts } from "@/lib/api/blog"
import { NewsletterSignup } from "@/components/newsletter-signup"
import type { BlogPostSummary } from "@/lib/types"

export default async function BlogPage() {
  const articles = await getFeaturedBlogPosts()

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
          {articles.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No featured articles yet. Check back soon.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <BlogCard key={article.slug} article={article} />
              ))}
            </div>
          )}

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
          <NewsletterSignup />
        </div>
      </section>
    </main>
  )
}

function BlogCard({ article }: { article: BlogPostSummary }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-green-500/50 transition-all hover:-translate-y-1"
    >
      <div
        className="h-48 bg-cover bg-center bg-gray-800"
        style={{ backgroundImage: `url('${article.image}')` }}
      />
      <div className="p-6">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-green-400 font-medium">{article.category}</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">{article.read_time}</span>
        </div>
        <h3 className="text-xl font-semibold mt-3 group-hover:text-green-400 transition">{article.title}</h3>
        <p className="mt-3 text-gray-400 line-clamp-2">{article.excerpt}</p>
        <p className="mt-4 text-sm text-gray-500">{article.date}</p>
      </div>
    </Link>
  )
}

import Link from "next/link"
import { getBlogArchivePage } from "@/lib/api/blog"

const ARTICLES_PER_PAGE = 6

export default async function BlogArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const requestedPage = Math.max(1, parseInt(params.page || "1", 10) || 1)
  const archive = await getBlogArchivePage(requestedPage, ARTICLES_PER_PAGE)
  const totalPages = Math.max(1, archive.total_pages)
  const currentPage = Math.min(requestedPage, totalPages)
  const articles = archive.results

  return (
    <main className="min-h-screen text-white pt-24">
      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition mb-6"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span>Back to Blog</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-wide">Blog Archive</h1>
          <p className="mt-4 text-xl text-gray-400 max-w-2xl">
            Browse our collection of older articles on peptides, hormone optimization, and recovery.
            {currentPage > 1 && ` Page ${currentPage} of ${totalPages}.`}
          </p>
        </div>
      </section>

      {/* Articles List */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {articles.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No archived posts yet.</p>
          ) : (
            <div className="space-y-6">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="block bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-green-500/30 transition group"
                >
                  <div className="flex flex-col md:flex-row">
                    <div 
                      className="w-full md:w-48 h-32 md:h-auto bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url('${article.image}')` }}
                    />
                    <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 text-sm mb-2">
                          <span className="text-green-400 font-medium">{article.category}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-500">{article.date}</span>
                        </div>
                        <h3 className="text-xl font-semibold group-hover:text-green-400 transition">
                          {article.title}
                        </h3>
                        <p className="mt-2 text-gray-400 text-sm">
                          {article.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 whitespace-nowrap">{article.read_time}</span>
                        <span className="text-green-500 group-hover:translate-x-1 transition-transform">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="mt-12 flex justify-center gap-2">
              {currentPage > 1 && (
                <Link 
                  href={`/blog/archive?page=${currentPage - 1}`}
                  className="px-4 py-2 bg-black/30 text-gray-400 hover:text-white rounded-lg transition"
                >
                  Previous
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/blog/archive?page=${page}`}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentPage === page
                      ? "bg-green-600 text-white"
                      : "bg-black/30 text-gray-400 hover:text-white"
                  }`}
                >
                  {page}
                </Link>
              ))}
              {currentPage < totalPages && (
                <Link 
                  href={`/blog/archive?page=${currentPage + 1}`}
                  className="px-4 py-2 bg-black/30 text-gray-400 hover:text-white rounded-lg transition"
                >
                  Next
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

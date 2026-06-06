import Link from "next/link"
import { getBlogArchivePage } from "@/lib/api/blog"
import type { BlogPostSummary } from "@/lib/blog"

const allArchivedArticles: BlogPostSummary[] = [
  // Page 1 articles
  {
    slug: "understanding-testosterone-esters",
    title: "Understanding Testosterone Esters",
    excerpt: "The differences between cypionate, enanthate, propionate, and other testosterone esters.",
    category: "TRT / HRT",
    date: "November 28, 2023",
    read_time: "11 min read",
    image: "/images/archive-testosterone-basics.jpg",
  },
  {
    slug: "peptide-storage-best-practices",
    title: "Peptide Storage Best Practices",
    excerpt: "How to properly store your peptides to maintain potency and effectiveness.",
    category: "Peptides",
    date: "November 15, 2023",
    read_time: "5 min read",
    image: "/images/archive-peptide-storage.jpg",
  },
  {
    slug: "understanding-igf-1-levels",
    title: "Understanding IGF-1 Levels",
    excerpt: "What your IGF-1 levels mean and how to optimize them for health and performance.",
    category: "Bloodwork",
    date: "November 8, 2023",
    read_time: "8 min read",
    image: "/images/archive-bloodwork.jpg",
  },
  {
    slug: "the-role-of-dhea-in-hormone-optimization",
    title: "The Role of DHEA in Hormone Optimization",
    excerpt: "How DHEA supplementation fits into a comprehensive hormone optimization protocol.",
    category: "TRT / HRT",
    date: "October 25, 2023",
    read_time: "7 min read",
    image: "/images/archive-testosterone-basics.jpg",
  },
  {
    slug: "thymosin-alpha-1-immune-support",
    title: "Thymosin Alpha-1 for Immune Support",
    excerpt: "Exploring the immune-modulating effects of this powerful peptide.",
    category: "Peptides",
    date: "October 18, 2023",
    read_time: "9 min read",
    image: "/images/archive-thymosin-beta.jpg",
  },
  {
    slug: "managing-prolactin-on-trt",
    title: "Managing Prolactin on TRT",
    excerpt: "Understanding prolactin elevation and how to address it while on testosterone therapy.",
    category: "TRT / HRT",
    date: "October 10, 2023",
    read_time: "6 min read",
    image: "/images/archive-bloodwork.jpg",
  },
  // Page 2 articles
  {
    slug: "sauna-and-cold-exposure-protocols",
    title: "Sauna and Cold Exposure Protocols",
    excerpt: "Evidence-based protocols for thermal stress to enhance recovery and longevity.",
    category: "Recovery",
    date: "September 28, 2023",
    read_time: "10 min read",
    image: "/images/archive-cardio-trt.jpg",
  },
  {
    slug: "understanding-shbg",
    title: "Understanding SHBG and Free Testosterone",
    excerpt: "Why SHBG matters and how it affects your available testosterone levels.",
    category: "Bloodwork",
    date: "September 15, 2023",
    read_time: "8 min read",
    image: "/images/archive-testosterone-basics.jpg",
  },
  {
    slug: "mk-677-comprehensive-guide",
    title: "MK-677: A Comprehensive Guide",
    excerpt: "Everything you need to know about this popular growth hormone secretagogue.",
    category: "Peptides",
    date: "September 5, 2023",
    read_time: "12 min read",
    image: "/images/archive-mk677.jpg",
  },
  {
    slug: "optimizing-injection-frequency",
    title: "Optimizing Injection Frequency on TRT",
    excerpt: "Why more frequent injections may lead to better outcomes and fewer side effects.",
    category: "TRT / HRT",
    date: "August 22, 2023",
    read_time: "7 min read",
    image: "/images/archive-injection-frequency.jpg",
  },
  {
    slug: "peptides-for-gut-health",
    title: "Peptides for Gut Health",
    excerpt: "How BPC-157 and other peptides can support digestive health and healing.",
    category: "Peptides",
    date: "August 10, 2023",
    read_time: "8 min read",
    image: "/images/article-bpc157.jpg",
  },
  {
    slug: "cardiovascular-health-on-trt",
    title: "Cardiovascular Health on TRT",
    excerpt: "Monitoring and maintaining heart health while on testosterone replacement therapy.",
    category: "TRT / HRT",
    date: "July 28, 2023",
    read_time: "9 min read",
    image: "/images/archive-cardio-trt.jpg",
  },
  // Page 3 articles
  {
    slug: "nandrolone-for-joint-health",
    title: "Nandrolone for Joint Health",
    excerpt: "Exploring the therapeutic use of low-dose nandrolone for joint pain and collagen synthesis.",
    category: "TRT / HRT",
    date: "July 15, 2023",
    read_time: "10 min read",
    image: "/images/archive-testosterone-basics.jpg",
  },
  {
    slug: "liver-support-supplements",
    title: "Liver Support Supplements Guide",
    excerpt: "The most effective supplements for maintaining liver health during hormone optimization.",
    category: "Supplements",
    date: "July 5, 2023",
    read_time: "7 min read",
    image: "/images/archive-bloodwork.jpg",
  },
  {
    slug: "cjc-1295-ipamorelin-stack",
    title: "CJC-1295 & Ipamorelin Stack",
    excerpt: "A detailed look at this popular growth hormone releasing peptide combination.",
    category: "Peptides",
    date: "June 22, 2023",
    read_time: "11 min read",
    image: "/images/archive-mk677.jpg",
  },
  {
    slug: "blood-pressure-management",
    title: "Blood Pressure Management on TRT",
    excerpt: "Strategies for maintaining healthy blood pressure while on testosterone therapy.",
    category: "TRT / HRT",
    date: "June 10, 2023",
    read_time: "8 min read",
    image: "/images/archive-cardio-trt.jpg",
  },
  {
    slug: "bac-water-vs-sterile-water",
    title: "BAC Water vs Sterile Water",
    excerpt: "Understanding when to use bacteriostatic water versus sterile water for reconstitution.",
    category: "Peptides",
    date: "May 28, 2023",
    read_time: "5 min read",
    image: "/images/archive-peptide-storage.jpg",
  },
  {
    slug: "post-cycle-therapy-guide",
    title: "Post Cycle Therapy Guide",
    excerpt: "A comprehensive guide to PCT protocols for restoring natural hormone production.",
    category: "TRT / HRT",
    date: "May 15, 2023",
    read_time: "14 min read",
    image: "/images/archive-testosterone-basics.jpg",
  },
]

const ARTICLES_PER_PAGE = 6

export default async function BlogArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const requestedPage = Math.max(1, parseInt(params.page || "1", 10) || 1)
  const archive = await getBlogArchivePage(requestedPage, ARTICLES_PER_PAGE)
  const useApi = archive.count > 0
  const totalPages = useApi
    ? archive.total_pages
    : Math.max(1, Math.ceil(allArchivedArticles.length / ARTICLES_PER_PAGE))
  const currentPage = Math.min(requestedPage, totalPages)
  const articles = useApi
    ? archive.results
    : allArchivedArticles.slice(
        (currentPage - 1) * ARTICLES_PER_PAGE,
        currentPage * ARTICLES_PER_PAGE,
      )

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

          {/* Pagination */}
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
        </div>
      </section>
    </main>
  )
}

import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
      <div className="w-full max-w-md text-center">
        <div className="bg-black/30 backdrop-blur-sm p-8 rounded-xl border border-white/10">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-heading font-bold uppercase tracking-wider text-white mb-4">
            Authentication Error
          </h1>
          
          <p className="text-gray-400 mb-6">
            Something went wrong during authentication. Please try again.
          </p>

          <div className="space-y-3">
            <Link 
              href="/auth/login"
              className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-heading uppercase tracking-wider rounded-lg transition"
            >
              Try Again
            </Link>
            <Link 
              href="/"
              className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

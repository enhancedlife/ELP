import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
      <div className="w-full max-w-md text-center">
        <div className="bg-black/30 backdrop-blur-sm p-8 rounded-xl border border-white/10">
          <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-heading font-bold uppercase tracking-wider text-white mb-4">
            Check Your Email
          </h1>
          
          <p className="text-gray-400 mb-6">
            We&apos;ve sent you a confirmation link. Click the link in your email to activate your account and access all resources.
          </p>

          <div className="space-y-3">
            <Link 
              href="/"
              className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-heading uppercase tracking-wider rounded-lg transition"
            >
              Return Home
            </Link>
            <Link 
              href="/auth/login"
              className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

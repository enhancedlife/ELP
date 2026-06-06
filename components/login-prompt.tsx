import Link from "next/link"

export function LoginPrompt() {
  return (
    <div className="bg-[#1a1d24] border border-white/10 rounded-xl p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      
      <h2 className="text-xl font-heading font-bold uppercase tracking-wider text-white mb-3">
        Members Only Content
      </h2>
      
      <p className="text-gray-400 mb-6">
        Create a free account to access this resource and all our exclusive guides, calculators, and protocols.
      </p>

      <div className="space-y-3">
        <Link 
          href="/auth/sign-up"
          className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-heading uppercase tracking-wider rounded-lg transition"
        >
          Create Free Account
        </Link>
        <Link 
          href="/auth/login"
          className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition"
        >
          Already have an account? Log In
        </Link>
      </div>
    </div>
  )
}

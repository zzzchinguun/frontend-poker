'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push('/lobby');
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess('Check your email to confirm your account, then sign in.');
        setLoading(false);
        setIsLogin(true);
      }
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 via-transparent to-amber-950/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center px-16 xl:px-24">
        <div className="max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <span className="text-2xl">♠</span>
            </div>
            <span className="text-2xl font-bold text-white">PokerRoom</span>
          </div>

          {/* Tagline */}
          <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
            Play Poker
            <span className="block text-gold">Like a Pro</span>
          </h1>

          <p className="text-lg text-neutral-400 mb-12 leading-relaxed">
            Join thousands of players in real-time Texas Hold&apos;em games.
            Create tables, invite friends, and experience the thrill of poker.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              { icon: '⚡', text: 'Real-time multiplayer gameplay' },
              { icon: '🔒', text: 'Secure authentication' },
              { icon: '🎯', text: 'Create private tables' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-neutral-300">
                <span className="text-xl">{feature.icon}</span>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <span className="text-xl">♠</span>
            </div>
            <span className="text-xl font-bold text-white">PokerRoom</span>
          </div>

          {/* Form Card */}
          <div className="bg-[#141414] rounded-2xl p-8 border border-neutral-800/50 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-neutral-500">
                {isLogin ? 'Sign in to continue playing' : 'Start your poker journey'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-[#0d0d0d] border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3.5 bg-[#0d0d0d] border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
                  <span className="text-red-500 mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-800">
              <p className="text-center text-neutral-500">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                  }}
                  className="ml-2 text-green-500 hover:text-green-400 font-medium transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          {/* Demo link */}
          <p className="text-center mt-6 text-neutral-600 text-sm">
            Want to see how it looks?{' '}
            <a href="/demo" className="text-neutral-500 hover:text-neutral-400 underline">
              Try the demo
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

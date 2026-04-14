// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Sparkles, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Animated Grid Background (reused from home page)
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-gray-50 z-10" />

      {/* Animated grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-brand-gray-400"
            />
          </pattern>
          <linearGradient id="grid-fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="grid-mask">
            <rect width="100%" height="100%" fill="url(#grid-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" mask="url(#grid-mask)" />
      </svg>

      {/* Animated horizontal lines */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-brand-accent/30 to-transparent"
          style={{ top: `${20 + i * 15}%`, left: 0, right: 0 }}
          animate={{ opacity: [0, 0.5, 0], x: ['-100%', '100%'] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 1.5 }}
        />
      ))}

      {/* Floating orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
          top: '-20%',
          right: '-10%',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
          bottom: '-10%',
          left: '-5%',
        }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// Universe Loading Animation (blob pulse during login)
function UniverseLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-gray-50">
      <AnimatedGrid />
      <motion.div
        className="relative z-20 flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Pulsing orbs */}
        <div className="relative">
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-accent/30 to-purple-500/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-brand-accent/50 to-purple-500/50"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-black flex items-center justify-center shadow-2xl">
              <span className="text-2xl font-bold text-brand-white">C</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-brand-gray-700">Lade dein Universe...</p>
          <p className="text-sm text-brand-gray-500 mt-1">Daten werden synchronisiert</p>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUniverseLoading, setIsUniverseLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setEmailSent(true)
      }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show universe loading animation when transitioning
  if (isUniverseLoading) {
    return <UniverseLoading />
  }

  return (
    <main className="min-h-screen bg-brand-gray-50 relative flex items-center justify-center p-4">
      <AnimatedGrid />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full max-w-md"
      >
        {/* Glass Card */}
        <div className="glass-card rounded-2xl p-8 md:p-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="w-14 h-14 rounded-xl bg-brand-black flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-brand-white">C</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-900 mb-2">
              Bereit für dein nächstes Level?
            </h1>
            <p className="text-brand-gray-500">
              Melde dich an, um dein Career Universe zu betreten.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!emailSent ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleMagicLink}
                className="space-y-6"
              >
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brand-gray-700 mb-2">
                    E-Mail Adresse
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@convidera.com"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-brand-gray-200 bg-brand-white/80
                                 text-brand-gray-900 placeholder:text-brand-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent
                                 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !email}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-brand-white
                             bg-brand-black hover:bg-brand-gray-800
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200 relative overflow-hidden group"
                  style={{
                    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)',
                  }}
                >
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                    }}
                  />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Access Universe
                      </>
                    )}
                  </span>
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </motion.div>
                <h2 className="text-xl font-semibold text-brand-gray-900 mb-2">
                  Check deine E-Mails!
                </h2>
                <p className="text-brand-gray-500 mb-6">
                  Wir haben einen Magic Link an <strong className="text-brand-gray-700">{email}</strong> gesendet.
                  Klicke auf den Link, um dich anzumelden.
                </p>
                <button
                  onClick={() => {
                    setEmailSent(false)
                    setEmail('')
                  }}
                  className="text-sm text-brand-accent hover:text-brand-accent/80 font-medium transition-colors"
                >
                  Andere E-Mail verwenden
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 bg-white/70 text-brand-gray-400 font-medium">
                Convidera Intern
              </span>
            </div>
          </div>

          {/* Footer Info */}
          <p className="text-center text-xs text-brand-gray-400">
            Mit der Anmeldung akzeptierst du unsere internen Nutzungsbedingungen.
            <br />
            Bei Problemen wende dich an das HR-Team.
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-brand-gray-400">Career Universe 2.0 • Convidera GmbH</p>
      </div>
    </main>
  )
}

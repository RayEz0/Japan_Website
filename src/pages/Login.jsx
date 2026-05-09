import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()
  const shakeControls = useAnimationControls()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password.')
      shakeControls.start({
        x: [0, -10, 10, -8, 8, -4, 0],
        transition: { duration: 0.42, ease: 'easeInOut' },
      })
      setLoading(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Left: cinematic image panel ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="relative flex-shrink-0 w-full h-48 md:h-auto md:w-1/2 flex items-end overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=1400&q=80')" }}
        />
        {/* gradient: lighter top, heavy bottom so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/80" />

        <div className="relative z-10 p-8 md:p-12 pb-10 md:pb-16">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-[9px] uppercase tracking-[2px] text-white/50 mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Private · Invite Only
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.55 }}
            className="font-bold text-white leading-none mb-4"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(44px, 7vw, 72px)',
              letterSpacing: '-2.5px',
            }}
          >
            Japan<br />2027
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-[10px] text-white/55 leading-relaxed"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Nov 23 – Dec 5, 2027<br />
            Tokyo · Fuji · Kyoto · Osaka
          </motion.p>
        </div>
      </motion.div>

      {/* ── Right: form panel ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="flex-1 bg-[#F5F4F0] flex items-center justify-center px-8 py-12 md:py-0"
      >
        <div className="w-full max-w-[340px]">

          {/* Brand mark */}
          <div className="mb-10">
            <div className="w-9 h-9 bg-[#0C0C0C] flex items-center justify-center mb-5">
              <span
                className="text-white text-xs font-semibold"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                JP
              </span>
            </div>
            <h2
              className="text-[30px] font-bold text-[#0C0C0C] leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Welcome back.
            </h2>
            <p
              className="text-[9px] uppercase tracking-[1.4px] text-[#777] mt-1.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Sign in to continue
            </p>
          </div>

          {/* Shakeable form wrapper */}
          <motion.div animate={shakeControls}>
            <form onSubmit={handleSubmit} noValidate>

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-[8.5px] uppercase tracking-[1.2px] text-[#777] mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-2 text-[14px] text-[#0C0C0C] outline-none transition-colors focus:border-[#0C0C0C] placeholder:text-[#C5C2BA]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>

              <div className="mb-8">
                <label
                  htmlFor="password"
                  className="block text-[8.5px] uppercase tracking-[1.2px] text-[#777] mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-2 text-[14px] text-[#0C0C0C] outline-none transition-colors focus:border-[#0C0C0C] placeholder:text-[#C5C2BA]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1,  y: 0  }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[10px] text-[#B8321A] mb-5 -mt-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ opacity: 0.78 }}
                whileTap={{ scale: 0.985 }}
                className="w-full bg-[#0C0C0C] text-white text-[10px] uppercase tracking-[1.5px] py-3.5 disabled:opacity-40"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {loading ? 'Signing in…' : 'Sign In →'}
              </motion.button>

            </form>
          </motion.div>

          <p
            className="text-center text-[8.5px] uppercase tracking-[1.2px] text-[#BBBBBB] mt-8"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Invite-only · No public signup
          </p>
        </div>
      </motion.div>

    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-10 h-10 bg-[#0C0C0C] flex items-center justify-center mb-4">
            <span
              className="text-white text-sm font-semibold tracking-wide"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              JP
            </span>
          </div>
          <h1
            className="text-2xl font-bold text-[#0C0C0C] tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Japan 2027
          </h1>
          <p className="text-xs text-[#777] mt-1 tracking-widest uppercase"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Nov 23 – Dec 5 · Private
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#D5D2CA] p-8">
          <form onSubmit={handleSubmit} noValidate>

            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-[10px] uppercase tracking-widest text-[#777] mb-2"
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
                className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-2 text-sm text-[#0C0C0C] outline-none transition-colors focus:border-[#0C0C0C]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="you@example.com"
              />
            </div>

            <div className="mb-7">
              <label
                htmlFor="password"
                className="block text-[10px] uppercase tracking-widest text-[#777] mb-2"
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
                className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-2 text-sm text-[#0C0C0C] outline-none transition-colors focus:border-[#0C0C0C]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                className="text-xs text-[#B8321A] mb-5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0C0C0C] text-white text-[11px] uppercase tracking-widest py-3 transition-opacity hover:opacity-75 disabled:opacity-40"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

          </form>
        </div>

        <p
          className="text-center text-[9px] uppercase tracking-widest text-[#BBBBBB] mt-6"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Invite-only · No public signup
        </p>

      </div>
    </div>
  )
}

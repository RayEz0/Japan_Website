import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Itinerary from './pages/Itinerary'
import Expenses  from './pages/Expenses'
import Savings   from './pages/Savings'
import Stays     from './pages/Stays'
import Gifts     from './pages/Gifts'
import Budget    from './pages/Budget'

// ── Animated outlet — fades + slides pages on route change ───────────────────
function AnimatedOutlet() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}

const PAGE_TITLES = {
  '/':          'Dashboard',
  '/itinerary': 'Itinerary',
  '/budget':    'Budget',
  '/savings':   'Savings',
  '/expenses':  'Expenses',
  '/stays':     'Stays',
  '/gifts':     'Gifts',
}

// ── Protected shell ──────────────────────────────────────────────────────────
function AppLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Japan 2027'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center">
        <div className="text-[10px] uppercase tracking-widest text-[#777]"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Loading…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-[#F5F4F0]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-white border-b border-[#D5D2CA] flex items-center px-3 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-[#0C0C0C]"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h14M2 9h14M2 14h14"/>
          </svg>
        </button>
        <p className="flex-1 text-center text-[14px] font-semibold text-[#0C0C0C]"
           style={{ fontFamily: "'Fraunces', serif" }}>
          {pageTitle}
        </p>
        <div className="w-10" />
      </div>

      <main className="lg:ml-60 flex-1 min-w-0 overflow-y-auto h-screen pt-12 lg:pt-0">
        <AnimatedOutlet />
      </main>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />

          <Route element={<AppLayout />}>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/budget"    element={<Budget />} />
            <Route path="/savings"   element={<Savings />} />
            <Route path="/expenses"  element={<Expenses />} />
            <Route path="/stays"     element={<Stays />} />
            <Route path="/gifts"     element={<Gifts />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function LoginGuard() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Login />
}

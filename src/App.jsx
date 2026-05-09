import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Itinerary from './pages/Itinerary'

// ── Placeholder (Phase 4+) ───────────────────────────────────────────────────
function PageShell({ title, index }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-widest text-[#777] mb-3"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {index}
        </p>
        <h1 className="text-5xl font-bold text-[#0C0C0C] tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}>
          {title}
        </h1>
        <p className="text-[10px] text-[#BBBBBB] mt-4 uppercase tracking-widest"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Coming soon
        </p>
      </div>
    </div>
  )
}

// ── Protected shell ──────────────────────────────────────────────────────────
function AppLayout() {
  const { user, loading } = useAuth()

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
      <Sidebar />
      <main className="ml-[230px] flex-1 min-w-0 overflow-y-auto h-screen">
        <Outlet />
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
            <Route path="/budget"    element={<PageShell title="Budget"   index="003 — Finances"      />} />
            <Route path="/savings"   element={<PageShell title="Savings"  index="003B — Savings"      />} />
            <Route path="/expenses"  element={<PageShell title="Expenses" index="003C — Expense Log"  />} />
            <Route path="/stays"     element={<PageShell title="Stays"    index="005 — Accommodation" />} />
            <Route path="/gifts"     element={<PageShell title="Gifts"    index="006 — Checklist"     />} />
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

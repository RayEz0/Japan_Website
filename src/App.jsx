import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'

// ── Placeholder pages (Phase 3 will replace these) ──────────────────────────
function PageShell({ title, index }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p
          className="text-[9px] uppercase tracking-widest text-[#777] mb-3"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {index}
        </p>
        <h1
          className="text-5xl font-bold text-[#0C0C0C] tracking-tight"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {title}
        </h1>
        <p
          className="text-[10px] text-[#BBBBBB] mt-4 uppercase tracking-widest"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Coming in Phase 3
        </p>
      </div>
    </div>
  )
}

const PAGES = [
  { path: '/',           title: 'Dashboard',  index: '001 — Overview'       },
  { path: '/itinerary',  title: 'Itinerary',  index: '002 — Route'          },
  { path: '/budget',     title: 'Budget',     index: '003 — Finances'       },
  { path: '/savings',    title: 'Savings',    index: '003B — Savings'       },
  { path: '/expenses',   title: 'Expenses',   index: '003C — Expense Log'   },
  { path: '/stays',      title: 'Stays',      index: '005 — Accommodation'  },
  { path: '/gifts',      title: 'Gifts',      index: '006 — Checklist'      },
]

// ── Protected layout ─────────────────────────────────────────────────────────
function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center">
        <div
          className="text-[10px] uppercase tracking-widest text-[#777]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Loading…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-[#F5F4F0]">
      <Sidebar />
      {/* Offset content by sidebar width */}
      <main className="ml-[230px] flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginGuard />} />

          {/* Protected */}
          <Route element={<AppLayout />}>
            {PAGES.map(({ path, title, index }) => (
              <Route
                key={path}
                path={path}
                element={<PageShell title={title} index={index} />}
              />
            ))}
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

// Redirect already-logged-in users away from /login
function LoginGuard() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Login />
}

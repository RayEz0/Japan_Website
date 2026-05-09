import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { ACCENT_COLORS } from '../lib/users'

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="6" height="6"/>
        <rect x="9" y="1" width="6" height="6"/>
        <rect x="1" y="9" width="6" height="6"/>
        <rect x="9" y="9" width="6" height="6"/>
      </svg>
    ),
  },
  {
    to: '/itinerary',
    label: 'Itinerary',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="6.5" r="2.5"/>
        <path d="M8 1C5.2 1 3 3.2 3 6.5c0 4 5 9 5 9s5-5 5-9C13 3.2 10.8 1 8 1z"/>
      </svg>
    ),
  },
  {
    to: '/budget',
    label: 'Budget',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="3" width="14" height="10" rx="1"/>
        <path d="M1 6h14"/>
        <circle cx="8" cy="10" r="1.5"/>
      </svg>
    ),
  },
  {
    to: '/savings',
    label: 'Savings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 6a5 5 0 11-10 0 5 5 0 0110 0z"/>
        <path d="M8 3v3l2 1"/>
        <path d="M10.5 11.5l1.5 3"/>
        <path d="M5.5 11.5L4 14.5"/>
      </svg>
    ),
  },
  {
    to: '/expenses',
    label: 'Expenses',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 4h12M2 8h8M2 12h5"/>
        <circle cx="12" cy="11" r="3"/>
        <path d="M12 9.5v1.5l1 1"/>
      </svg>
    ),
  },
  {
    to: '/stays',
    label: 'Stays',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12V6l7-4 7 4v6"/>
        <rect x="5" y="8" width="6" height="4"/>
        <path d="M1 12h14"/>
      </svg>
    ),
  },
  {
    to: '/gifts',
    label: 'Gifts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="5" width="14" height="10"/>
        <path d="M1 8h14M8 5V15"/>
        <path d="M8 5c0-2 2-4 3-2.5S9.5 5 8 5zM8 5c0-2-2-4-3-2.5S6.5 5 8 5z"/>
      </svg>
    ),
  },
]

const SIDEBAR_W = 240

// Tracks desktop breakpoint reactively
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export default function Sidebar({ isOpen, onClose }) {
  const { profile, signOut } = useAuth()
  const navigate   = useNavigate()
  const accent     = profile ? ACCENT_COLORS[profile.accent] : ACCENT_COLORS.amber
  const isDesktop  = useIsDesktop()

  // On desktop the sidebar is always fully visible; animation only runs on mobile
  const xPos = isDesktop ? 0 : isOpen ? 0 : -SIDEBAR_W

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function handleNavClick() {
    if (!isDesktop) onClose()
  }

  return (
    <>
      {/* Dark overlay — mobile only, shown while drawer is open */}
      <AnimatePresence>
        {isOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[55]"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        initial={false}
        animate={{ x: xPos }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 bottom-0 flex flex-col z-[60]"
        style={{
          width:       SIDEBAR_W,
          background:  '#FFFFFF',
          borderRight: '1.5px solid #0C0C0C',
        }}
      >
        {/* ✕ Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-[#777] hover:text-[#0C0C0C] transition-colors text-base"
          aria-label="Close menu"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ✕
        </button>

        {/* Brand */}
        <div
          className="flex items-center gap-3.5 px-3.5 flex-shrink-0"
          style={{ height: 62, borderBottom: '1.5px solid #0C0C0C' }}
        >
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
               style={{ background: '#0C0C0C' }}>
            <span className="text-white text-xs font-semibold tracking-wide"
                  style={{ fontFamily: "'Fraunces', serif" }}>
              JP
            </span>
          </div>
          <div>
            <div className="text-[17px] font-semibold text-[#0C0C0C] leading-none"
                 style={{ fontFamily: "'Fraunces', serif" }}>
              Japan 2027
            </div>
            <div className="text-[8.5px] text-[#777] tracking-[0.8px] mt-1 uppercase"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Nov 23–Dec 5 · 3 Travellers
            </div>
          </div>
        </div>

        {/* User accent pill */}
        {profile && (
          <div className="px-3.5 pt-4 pb-2 flex-shrink-0">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium"
              style={{ background: accent.bg, color: accent.text, fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent.dot }} />
              {profile.name}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-1 overflow-hidden flex flex-col">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                [
                  'flex items-center h-[50px] w-full text-left text-[12.5px] font-medium transition-colors duration-150 relative',
                  isActive
                    ? 'text-[#0C0C0C] bg-[#F5F4F0]'
                    : 'text-[#777] hover:text-[#0C0C0C] hover:bg-[#F5F4F0]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-0 top-0 bottom-0 w-[2.5px]"
                      style={{ background: accent.dot }}
                    />
                  )}
                  <span className="w-[58px] h-[50px] flex items-center justify-center text-base flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className="tracking-[0.1px]">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="flex-shrink-0" style={{ borderTop: '1px solid #D5D2CA' }}>
          <button
            onClick={handleSignOut}
            className="flex items-center h-[50px] w-full text-[11px] font-medium text-[#777] hover:text-[#B8321A] transition-colors duration-150"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span className="w-[58px] h-[50px] flex items-center justify-center text-base flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2H2v11h4"/>
                <path d="M10 10l3-2.5L10 5"/>
                <path d="M13 7.5H6"/>
              </svg>
            </span>
            <span className="uppercase tracking-widest text-[9px]">Sign Out</span>
          </button>
        </div>
      </motion.aside>
    </>
  )
}

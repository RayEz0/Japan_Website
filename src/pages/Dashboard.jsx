import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ACCENT_COLORS } from '../lib/users'
import { OptimizedHeroImage } from '../components/OptimizedImage'

const TRIP_DATE = new Date('2027-11-23T06:00:00')
const SAVINGS_GOAL = 250000
const FLIGHT_BOOKING_TARGET = new Date('2027-01-15T00:00:00')

const BUDGET_ITEMS = [
  { icon: '✈️', label: 'Flights',       note: 'Per person · Air India / JAL',                inr: '₹70,000'   },
  { icon: '🏨', label: 'Accommodation', note: 'Per person · hostel / capsule / Airbnb',       inr: '₹55,000'   },
  { icon: '🍜', label: 'Food & Drink',  note: 'Per person · ~₹3,000/day · 13 days',          inr: '₹40,000'   },
  { icon: '🚃', label: 'Transport',     note: 'Per person · JR Pass + IC card',               inr: '₹30,000'   },
  { icon: '🎡', label: 'Activities',    note: 'Per person · Disney, TeamLab, temples',        inr: '₹25,000'   },
  { icon: '🛍️', label: 'Shopping',      note: 'Per person · gifts, souvenirs, clothing',      inr: '₹20,000'   },
  { icon: '🧮', label: 'Buffer',        note: 'Per person · SIM, emergencies, contingency',   inr: '₹10,000'   },
]

const NEXT_ACTIONS = [
  { tag: 'Critical · Now',  title: 'Apply for Passport',           sub: 'Target July 2026 · Tatkal if needed'     },
  { tag: 'Set Alert',       title: 'Google Flights — BLR → NRT',   sub: 'Book window: Jan–Feb 2027'               },
  { tag: 'Monthly',         title: '₹16,000 per person / month',   sub: 'Auto-transfer recommended'               },
  { tag: 'Book Ahead',      title: 'Shibuya Sky tickets',          sub: '2+ months ahead · sunset slot'           },
  { tag: 'Book Ahead',      title: 'teamLab Borderless Kyoto',     sub: '2+ months ahead · last time slot'        },
  { tag: 'Book Ahead',      title: 'Sagano Torokko Train',         sub: '3+ months ahead · right-side seats'      },
]

const ROUTE = [
  { label: 'BLR',     nights: null },
  { label: 'Tokyo',   nights: 6    },
  { label: 'Mt Fuji', nights: null },
  { label: 'Kyoto',   nights: 3    },
  { label: 'Nara',    nights: null },
  { label: 'Osaka',   nights: 3    },
  { label: 'KIX',     nights: null },
]

function pad(n) { return String(n).padStart(2, '0') }

function fmtCompactINR(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
  return '₹' + Number(n).toLocaleString('en-IN')
}

function getCountdown() {
  const diff = TRIP_DATE - new Date()
  if (diff <= 0) return { d: 0, h: '00', m: '00', s: '00' }
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h: pad(h), m: pad(m), s: pad(s) }
}

function getTokyoTimeParts(date = new Date()) {
  return {
    time: new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date),
    day: new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      weekday: 'long',
    }).format(date),
  }
}

function getMilestoneDays() {
  const diff = FLIGHT_BOOKING_TARGET - new Date()
  return Math.max(0, Math.ceil(diff / 86400000))
}

export default function Dashboard() {
  const { profile } = useAuth()
  const accent = profile ? ACCENT_COLORS[profile.accent] : ACCENT_COLORS.amber
  const [cd, setCd] = useState(getCountdown)
  const [tokyoNow, setTokyoNow] = useState(() => new Date())
  const [savingsTotal, setSavingsTotal] = useState(0)
  const [savingsLoading, setSavingsLoading] = useState(true)
  const tokyo = getTokyoTimeParts(tokyoNow)
  const milestoneDays = getMilestoneDays()
  const savingsPct = Math.min(100, Math.round((savingsTotal / SAVINGS_GOAL) * 100))

  useEffect(() => {
    const id = setInterval(() => setCd(getCountdown()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTokyoNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let alive = true

    async function loadSavings() {
      if (!profile?.name) {
        setSavingsLoading(false)
        return
      }

      setSavingsLoading(true)
      const { data } = await supabase
        .from('savings')
        .select('amount')
        .eq('person', profile.name.toLowerCase())

      if (!alive) return
      const total = (data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
      setSavingsTotal(total)
      setSavingsLoading(false)
    }

    loadSavings()
    return () => { alive = false }
  }, [profile?.name])

  return (
    <div className="min-h-screen bg-[#F5F4F0] pb-10">

      {/* ── Hero banner ── */}
      <div className="relative h-[200px] lg:h-64 overflow-hidden flex items-end">
        <OptimizedHeroImage hero="dashboard" alt="" eager />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/70" />
        <div className="relative z-10 px-4 pb-5 lg:px-12 lg:pb-7 w-full">
          <p className="text-[9px] uppercase tracking-[1.8px] text-white/65 mb-1.5"
             >
            001 — OVERVIEW
          </p>
          <h1 className="text-[32px] lg:text-[42px] font-bold text-white leading-none"
              style={{ letterSpacing: '-1px' }}>
            Dashboard
          </h1>
        </div>
      </div>

      {/* ── Route strip ── */}
      <div className="bg-white border-b border-[#D5D2CA] px-4 lg:px-12 py-3 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {ROUTE.map((stop, i) => (
            <div key={stop.label} className="flex items-center">
              {i > 0 && (
                <div className="w-6 lg:w-8 h-px bg-[#D5D2CA] flex-shrink-0" />
              )}
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: accent.dot }}
                />
                <span
                  className="text-[9px] font-medium text-[#0C0C0C]"
                  
                >
                  {stop.label}
                </span>
                {stop.nights && (
                  <span
                    className="text-[8px] text-[#777]"
                    
                  >
                    ({stop.nights}n)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Welcome Strip — sits between route strip and grid ── */}
      {profile && (
        <div className="dashboard-welcome-strip border-b border-[#D5D2CA] px-5 lg:px-12 py-2 flex items-center gap-2.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent.dot }} />
          <p className="text-[11px] uppercase tracking-[1.2px] text-[#777] truncate">
            Welcome back, <span style={{ color: accent.text }}>{profile.name}</span>
          </p>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] border-b border-[#D5D2CA]">

        {/* ── Countdown ── */}
        <div className="lg:row-span-2 lg:col-start-1 lg:row-start-1 border-b lg:border-b-0 border-r-0 lg:border-r border-[#D5D2CA] p-5 lg:p-8 flex flex-col">
          <div>
            <p className="text-[9.5px] uppercase tracking-[1.5px] text-[#777] mb-4"
               >
              Departure In
            </p>

            {/* Mobile: 2×2 grid */}
            <div className="lg:hidden grid grid-cols-2 gap-3 mb-3">
              {[['Days', cd.d], ['Hrs', cd.h], ['Min', cd.m], ['Sec', cd.s]].map(([lbl, val]) => (
                <div key={lbl} className="border border-[#D5D2CA] bg-white p-3">
                  <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-1"
                     >{lbl}</p>
                  <span className="type-num text-[36px] font-light text-[#0C0C0C] leading-none tabular-nums">{val}</span>
                </div>
              ))}
            </div>

            {/* Desktop: big number + HH:MM:SS */}
            <div className="hidden lg:block">
              <div className="type-num text-[118px] font-light text-[#0C0C0C] leading-none tabular-nums"
                   style={{ letterSpacing: '-5px' }}>
                {cd.d}
              </div>
              <p className="text-[10px] uppercase tracking-[1.5px] text-[#777] mt-1"
                 >
                Days
              </p>
              <p className="text-[17px] text-[#777] mt-3 italic">
                November 23, 2027
              </p>
              <div className="flex items-end gap-1 mt-5">
                {[['Hrs', cd.h], ['Min', cd.m], ['Sec', cd.s]].map(([lbl, val], i) => (
                  <div key={lbl} className="flex items-end gap-1">
                    {i > 0 && <span className="text-[22px] text-[#BBBBBB] pb-0.5"
                      >:</span>}
                    <div>
                      <p className="text-[7px] uppercase tracking-[1px] text-[#777] mb-0.5"
                         >{lbl}</p>
                      <span className="type-num text-[22px] text-[#0C0C0C] tabular-nums">{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── Stat cards ── */}
        <div className="lg:col-start-2 lg:row-start-1 border-b border-r-0 lg:border-r border-[#D5D2CA] p-4 lg:p-7">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
            <div className="panel p-4">
              <p className="type-label mb-2">Tokyo Time</p>
              <p className="type-num text-[24px] font-medium text-[#0C0C0C] leading-none tabular-nums">{tokyo.time}</p>
              <p className="type-meta mt-1">{tokyo.day}</p>
            </div>

            <div className="panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="type-label mb-2">Savings</p>
                  <p className="type-num text-[21px] font-medium text-[#0C0C0C] leading-none tabular-nums">
                    {savingsLoading ? 'Loading' : `${fmtCompactINR(savingsTotal)} / ${fmtCompactINR(SAVINGS_GOAL)}`}
                  </p>
                </div>
                <p className="type-meta text-right flex-shrink-0">{savingsLoading ? '...' : `${savingsPct}%`}</p>
              </div>
              <div className="progress-track mt-4">
                <div
                  className="progress-fill"
                  style={{ width: `${savingsLoading ? 0 : savingsPct}%`, background: accent.dot }}
                />
              </div>
              <p className="type-meta mt-2">{savingsLoading ? 'Syncing' : 'Complete'}</p>
            </div>

            <div className="panel p-4">
              <p className="type-label mb-2">Next Milestone</p>
              <p className="text-[15px] font-medium text-[#0C0C0C] leading-snug">
                {milestoneDays > 0 ? `Book flights in ${milestoneDays} days` : 'Book flights now'}
              </p>
              <p className="type-meta mt-2">Jan 15, 2027</p>
            </div>
          </div>

          <p className="text-[9.5px] uppercase tracking-[1.5px] text-[#777] mb-5"
             >
            Trip Snapshot
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Budget',  value: '₹7,50,000', sub: 'combined · 3 pax' },
              { label: 'Per Person',    value: '₹2,50,000', sub: 'target · all-in'  },
              { label: 'Trip Length',   value: '13',        sub: 'days in Japan'    },
            ].map(s => (
              <div key={s.label} className="soft-card border border-[#D5D2CA] bg-white p-4">
                <p className="type-label mb-2"
                   >
                  {s.label}
                </p>
                <p className="type-num text-[22px] lg:text-[26px] font-light text-[#0C0C0C] leading-none tabular-nums"
                   >
                  {s.value}
                </p>
                <p className="text-[9px] text-[#777] mt-1.5"
                   >
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Next Actions ── */}
        <div className="lg:col-start-3 lg:row-start-1 lg:row-span-2 border-l-0 lg:border-l border-b border-[#D5D2CA] p-4 lg:p-6">
          <p className="text-[9.5px] uppercase tracking-[1.5px] text-[#777] mb-4"
             >
            Next Actions
          </p>
          <div className="flex flex-col gap-2">
            {NEXT_ACTIONS.map((a, i) => (
              <div key={i} className="soft-card border border-[#D5D2CA] bg-white p-3 hover:border-[#0C0C0C] transition-colors duration-150">
                <p className="text-[8px] uppercase tracking-[0.8px] text-[#B8321A] mb-1"
                   >
                  {a.tag}
                </p>
                <p className="text-[12.5px] font-medium text-[#0C0C0C] leading-snug"
                   >
                  {a.title}
                </p>
                <p className="text-[9.5px] text-[#777] mt-0.5"
                   >
                  {a.sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Budget overview ── */}
        <div className="lg:col-start-2 lg:row-start-2 p-4 lg:p-8">
          <p className="type-label mb-5"
             >
            Expense Overview — Per Person
          </p>
          <div className="flex flex-col divide-y divide-[#F0EDE6]">
            {BUDGET_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-3.5 py-3">
                <span className="text-lg w-7 text-center flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium text-[#0C0C0C]"
                     >
                    {item.label}
                  </p>
                  <p className="type-meta mt-0.5"
                     >
                    {item.note}
                  </p>
                  <div className="h-[1.5px] bg-[#E5E2DA] mt-1.5 relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-[#0C0C0C]"
                      style={{
                        width: `${[100, 73, 55, 45, 36, 33, 22][i]}%`,
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0 min-w-[90px] lg:min-w-[110px]">
                  <p className="type-num text-[13px] font-semibold text-[#0C0C0C] tabular-nums"
                     >
                    {item.inr}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

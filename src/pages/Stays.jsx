import { useState } from 'react'

// ── Data ─────────────────────────────────────────────────────────────────────
const CITIES = [
  {
    key: 'tokyo', name: 'Tokyo', nights: 6,
    options: [
      {
        key:       'ks-house',
        type:      'hostel',
        name:      "K's House Tokyo Oasis",
        area:      'Ueno',
        priceRange: '¥3,200–4,500 / person',
        priceMin:   3200,
        priceMax:   4500,
        priceType:  'person',
        note:       null,
        badge:      null,
      },
      {
        key:       'manga-cafe',
        type:      'capsule',
        name:      'Manga Café / Capsule Hotel',
        area:      'Shinjuku',
        priceRange: '¥2,000–3,000 / person',
        priceMin:   2000,
        priceMax:   3000,
        priceType:  'person',
        note:       'One-night experience only',
        badge:      null,
      },
      {
        key:       'airbnb-shinjuku',
        type:      'airbnb',
        name:      'Airbnb — 3-Person Apartment',
        area:      'Shinjuku / Kabukicho',
        priceRange: '¥12,000–18,000 total / night',
        priceMin:   12000,
        priceMax:   18000,
        priceType:  'total',
        note:       null,
        badge:      null,
      },
    ],
  },
  {
    key: 'kyoto', name: 'Kyoto', nights: 3,
    options: [
      {
        key:       'piece-hostel',
        type:      'hostel',
        name:      'Piece Hostel Sanjo',
        area:      'Near Nishiki Market',
        priceRange: '¥3,500–5,000 / person',
        priceMin:   3500,
        priceMax:   5000,
        priceType:  'person',
        note:       null,
        badge:      null,
      },
      {
        key:       'airbnb-machiya',
        type:      'airbnb',
        name:      'Airbnb — Machiya Townhouse',
        area:      'Higashiyama',
        priceRange: '¥10,000–16,000 total / night',
        priceMin:   10000,
        priceMax:   16000,
        priceType:  'total',
        note:       null,
        badge:      null,
      },
    ],
  },
  {
    key: 'osaka', name: 'Osaka', nights: 3,
    options: [
      {
        key:       'millennials',
        type:      'capsule',
        name:      'The Millennials Shinsaibashi',
        area:      'Shinsaibashi',
        priceRange: '¥4,000–6,000 / person',
        priceMin:   4000,
        priceMax:   6000,
        priceType:  'person',
        note:       null,
        badge:      'Experience',
      },
      {
        key:       'airbnb-namba',
        type:      'airbnb',
        name:      'Airbnb — Namba Apartment',
        area:      'Namba',
        priceRange: '¥10,000–15,000 total / night',
        priceMin:   10000,
        priceMax:   15000,
        priceType:  'total',
        note:       null,
        badge:      null,
      },
    ],
  },
]

const STATUSES = ['Not booked', 'Researching', 'Booked']

const TYPE_LABEL = { hostel: 'Hostel', capsule: 'Capsule Hotel', airbnb: 'Airbnb' }

const TYPE_COLOR = {
  hostel:  { bg: '#D1FAE5', text: '#064E3B' },
  capsule: { bg: '#FEF9C3', text: '#92400E' },
  airbnb:  { bg: '#DBEAFE', text: '#1E3A8A' },
}

const STATUS_STYLE = {
  'Not booked':  { bg: '#F1F5F9', text: '#64748B', dot: '#CBD5E1', border: '#E2E8F0' },
  'Researching': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', border: '#FCD34D' },
  'Booked':      { bg: '#D1FAE5', text: '#064E3B', dot: '#10B981', border: '#6EE7B7' },
}

function fmtJPY(n) { return '¥' + Number(n).toLocaleString('en-US') }

const LS_KEY = 'japan2027-stays'
function loadStatuses() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } catch { return {} }
}

// ── City section ──────────────────────────────────────────────────────────────
function CitySection({ city, statuses, onCycle }) {
  const bookedOpt = city.options.find(o =>
    (statuses[`${city.key}-${o.key}`] ?? 'Not booked') === 'Booked')

  return (
    <div>
      {/* City header */}
      <div className="flex flex-wrap items-baseline gap-4 mb-4 pb-3 border-b-[1.5px] border-[#0C0C0C]">
        <h2 className="text-[26px] font-semibold text-[#0C0C0C] leading-none"
            style={{ fontFamily: "'Fraunces', serif" }}>
          {city.name}
        </h2>
        <span className="text-[9px] uppercase tracking-[0.8px] text-[#777]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {city.nights} nights
        </span>
        {bookedOpt && (
          <span className="ml-auto text-[8.5px] uppercase tracking-[0.8px] px-2.5 py-1"
                style={{ fontFamily: "'JetBrains Mono', monospace",
                         background: STATUS_STYLE.Booked.bg, color: STATUS_STYLE.Booked.text }}>
            ✓ Booked: {bookedOpt.name}
          </span>
        )}
      </div>

      {/* Option cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {city.options.map(opt => {
          const statusKey = `${city.key}-${opt.key}`
          const status    = statuses[statusKey] ?? 'Not booked'
          const st        = STATUS_STYLE[status]
          const tc        = TYPE_COLOR[opt.type]

          return (
            <div
              key={opt.key}
              className="bg-white border p-5 transition-colors"
              style={{ borderColor: st.border, borderWidth: status === 'Booked' ? '1.5px' : '1px' }}
            >
              {/* Type label + optional badge */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[7.5px] uppercase tracking-[1.2px] px-2 py-0.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace", background: tc.bg, color: tc.text }}
                >
                  {TYPE_LABEL[opt.type]}
                </span>
                {opt.badge && (
                  <span
                    className="text-[7.5px] uppercase tracking-[1px] px-2 py-0.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace",
                             background: '#FEF3C7', color: '#92400E' }}
                  >
                    {opt.badge}
                  </span>
                )}
              </div>

              {/* Name */}
              <h3 className="text-[16px] font-semibold text-[#0C0C0C] leading-snug mb-1"
                  style={{ fontFamily: "'Fraunces', serif" }}>
                {opt.name}
              </h3>

              {/* Area */}
              <p className="text-[9px] text-[#777] mb-3"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {opt.area}
              </p>

              {/* Price range */}
              <div className="mb-1">
                <p className="text-[22px] font-light text-[#0C0C0C] leading-none"
                   style={{ fontFamily: "'Fraunces', serif" }}>
                  {fmtJPY(opt.priceMin)}
                  <span className="text-[14px] text-[#777]">–{fmtJPY(opt.priceMax)}</span>
                </p>
              </div>

              {/* Note (optional) */}
              {opt.note && (
                <p className="text-[8.5px] text-[#B8321A] mb-3 italic"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {opt.note}
                </p>
              )}

              {/* Total trip cost for this city */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#D5D2CA]">
                <p className="text-[9px] text-[#777]"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {city.nights} nights
                  {opt.priceType === 'person' ? ' · per person' : ' · group total'}
                </p>
                <p className="text-[12px] font-medium text-[#0C0C0C]"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtJPY(opt.priceMin * city.nights)}–{fmtJPY(opt.priceMax * city.nights)}
                </p>
              </div>

              {/* Status toggle */}
              <button
                onClick={() => onCycle(city.key, opt.key)}
                className="flex items-center justify-center gap-2 w-full px-3 py-1.5 text-[9px] uppercase tracking-[0.8px] transition-opacity hover:opacity-75"
                style={{ fontFamily: "'JetBrains Mono', monospace",
                         background: st.bg, color: st.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                {status}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Stays() {
  const [statuses, setStatuses] = useState(loadStatuses)

  function cycleStatus(cityKey, optKey) {
    const key     = `${cityKey}-${optKey}`
    const current = statuses[key] ?? 'Not booked'
    const next    = STATUSES[(STATUSES.indexOf(current) + 1) % STATUSES.length]
    const next_s  = { ...statuses, [key]: next }
    setStatuses(next_s)
    localStorage.setItem(LS_KEY, JSON.stringify(next_s))
  }

  const totalNights = CITIES.reduce((s, c) => s + c.nights, 0)

  // Group-of-3 min/max across all cities (all options at their lowest/highest ends)
  const groupMin = CITIES.reduce((s, c) => {
    const opt = c.options[0]
    return s + (opt.priceType === 'person' ? opt.priceMin * 3 : opt.priceMin) * c.nights
  }, 0)
  const groupMax = CITIES.reduce((s, c) => {
    const opt = c.options[c.options.length - 1]
    return s + (opt.priceType === 'total' ? opt.priceMax : opt.priceMax * 3) * c.nights
  }, 0)

  return (
    <div className="min-h-screen bg-[#F5F4F0]">

      {/* Hero */}
      <div className="relative h-[200px] lg:h-64 overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-cover bg-center"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=70&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/70" />
        <div className="relative z-10 px-4 pb-5 lg:px-12 lg:pb-7 w-full">
          <p className="text-[9px] uppercase tracking-[1.8px] text-white/65 mb-1.5"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>005 — ACCOMMODATION</p>
          <h1 className="text-[32px] lg:text-[42px] font-bold text-white leading-none"
              style={{ fontFamily: "'Fraunces', serif", letterSpacing: '-1px' }}>
            Where We <em className="not-italic" style={{ color: 'rgba(255,200,150,.95)' }}>Stay</em>
          </h1>
        </div>
      </div>

      <div className="px-4 lg:px-12 py-6 lg:py-8">

        {/* Summary strip */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-8 border-[1.5px] border-[#0C0C0C] bg-white px-6 py-4 mb-6 lg:mb-8">
          <div>
            <p className="text-[8px] uppercase tracking-[1.2px] text-[#777] mb-0.5"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>Total Nights</p>
            <p className="text-[36px] font-light text-[#0C0C0C] leading-none"
               style={{ fontFamily: "'Fraunces', serif" }}>
              {totalNights}
            </p>
          </div>

          <div className="hidden sm:block w-px h-12 bg-[#D5D2CA]" />

          {CITIES.map(c => (
            <div key={c.key}>
              <p className="text-[8px] uppercase tracking-[1.2px] text-[#777] mb-0.5"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {c.name}
              </p>
              <p className="text-[20px] font-light text-[#0C0C0C] leading-none"
                 style={{ fontFamily: "'Fraunces', serif" }}>
                {c.nights}
                <span className="text-[12px] text-[#777]"> nights</span>
              </p>
            </div>
          ))}

          <div className="hidden sm:block w-px h-12 bg-[#D5D2CA]" />

          <div>
            <p className="text-[8px] uppercase tracking-[1.2px] text-[#777] mb-0.5"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>Est. Group Range</p>
            <p className="text-[12px] text-[#0C0C0C]"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtJPY(groupMin)} – {fmtJPY(groupMax)}
            </p>
            <p className="text-[8px] text-[#777] mt-0.5"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>full trip · 3 people</p>
          </div>

          <div className="ml-auto">
            <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-1.5"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>Status legend</p>
            <div className="flex items-center gap-3">
              {STATUSES.map(s => {
                const st = STATUS_STYLE[s]
                return (
                  <span key={s}
                        className="flex items-center gap-1.5 text-[8.5px] px-2 py-1"
                        style={{ fontFamily: "'JetBrains Mono', monospace",
                                 background: st.bg, color: st.text }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                    {s}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* City sections */}
        <div className="space-y-10">
          {CITIES.map(city => (
            <CitySection
              key={city.key}
              city={city}
              statuses={statuses}
              onCycle={cycleStatus}
            />
          ))}
        </div>

        <p className="text-[8.5px] text-[#BBBBBB] mt-8 text-center"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Status saved locally · Click any badge to cycle · Prices in Japanese ¥
        </p>
      </div>
    </div>
  )
}

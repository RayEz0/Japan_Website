import { useState } from 'react'

// ── Data ─────────────────────────────────────────────────────────────────────
const CITIES = [
  {
    key: 'tokyo', name: 'Tokyo', nights: 6, area: 'Shinjuku',
    options: [
      { tier: 'budget',  name: 'Khaosan Tokyo Samurai',  price: 2500  },
      { tier: 'mid',     name: 'Citadines Shinjuku',     price: 5500  },
      { tier: 'splurge', name: 'Hyatt Regency Shinjuku', price: 12000 },
    ],
  },
  {
    key: 'kyoto', name: 'Kyoto', nights: 3, area: 'Gion',
    options: [
      { tier: 'budget',  name: 'Piece Hostel Sanjo',  price: 2000  },
      { tier: 'mid',     name: 'Hotel Gracery Kyoto', price: 5000  },
      { tier: 'splurge', name: 'The Thousand Kyoto',  price: 15000 },
    ],
  },
  {
    key: 'osaka', name: 'Osaka', nights: 3, area: 'Namba',
    options: [
      { tier: 'budget',  name: 'Capsule Ryokan Osaka', price: 1800  },
      { tier: 'mid',     name: 'Cross Hotel Osaka',    price: 4500  },
      { tier: 'splurge', name: 'Conrad Osaka',         price: 18000 },
    ],
  },
]

const STATUSES  = ['Not booked', 'Researching', 'Booked']
const TIER_LABEL = { budget: 'Budget', mid: 'Mid-range', splurge: 'Splurge' }

const STATUS_STYLE = {
  'Not booked':  { bg: '#F1F5F9', text: '#64748B', dot: '#CBD5E1', border: '#E2E8F0' },
  'Researching': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', border: '#FCD34D' },
  'Booked':      { bg: '#D1FAE5', text: '#064E3B', dot: '#10B981', border: '#6EE7B7' },
}

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN') }

const LS_KEY = 'japan2027-stays'
function loadStatuses() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } catch { return {} }
}

// ── City section ──────────────────────────────────────────────────────────────
function CitySection({ city, statuses, onCycle }) {
  const booked = city.options.find(o =>
    (statuses[`${city.key}-${o.tier}`] ?? 'Not booked') === 'Booked')

  return (
    <div>
      {/* City header */}
      <div className="flex items-baseline gap-4 mb-4 pb-3 border-b-[1.5px] border-[#0C0C0C]">
        <h2 className="text-[26px] font-semibold text-[#0C0C0C] leading-none"
            style={{ fontFamily: "'Fraunces', serif" }}>
          {city.name}
        </h2>
        <span className="text-[9px] uppercase tracking-[0.8px] text-[#777]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {city.nights} nights · {city.area} area
        </span>
        {booked && (
          <span className="ml-auto text-[8.5px] uppercase tracking-[0.8px] px-2.5 py-1"
                style={{ fontFamily: "'JetBrains Mono', monospace",
                         background: STATUS_STYLE.Booked.bg, color: STATUS_STYLE.Booked.text }}>
            ✓ Booked: {booked.name}
          </span>
        )}
      </div>

      {/* Hotel cards */}
      <div className="grid grid-cols-3 gap-4">
        {city.options.map(opt => {
          const statusKey = `${city.key}-${opt.tier}`
          const status    = statuses[statusKey] ?? 'Not booked'
          const st        = STATUS_STYLE[status]
          const total     = opt.price * city.nights

          return (
            <div
              key={opt.tier}
              className="bg-white border p-5 transition-colors"
              style={{ borderColor: st.border, borderWidth: status === 'Booked' ? '1.5px' : '1px' }}
            >
              {/* Tier label */}
              <p className="text-[7.5px] uppercase tracking-[1.2px] text-[#777] mb-3"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {TIER_LABEL[opt.tier]}
              </p>

              {/* Hotel name */}
              <h3 className="text-[16px] font-semibold text-[#0C0C0C] leading-snug mb-4"
                  style={{ fontFamily: "'Fraunces', serif" }}>
                {opt.name}
              </h3>

              {/* Price per night */}
              <div className="flex items-end gap-2 mb-1">
                <p className="text-[28px] font-light text-[#0C0C0C] leading-none"
                   style={{ fontFamily: "'Fraunces', serif" }}>
                  {fmt(opt.price)}
                </p>
                <p className="text-[9px] text-[#777] mb-1"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  / night
                </p>
              </div>

              {/* Total for stay */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#D5D2CA]">
                <p className="text-[9px] text-[#777]"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {city.nights} nights total
                </p>
                <p className="text-[13px] font-medium text-[#0C0C0C]"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt(total)}
                </p>
              </div>

              {/* Status badge — clickable, cycles through statuses */}
              <button
                onClick={() => onCycle(city.key, opt.tier)}
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

  function cycleStatus(cityKey, tier) {
    const key     = `${cityKey}-${tier}`
    const current = statuses[key] ?? 'Not booked'
    const next    = STATUSES[(STATUSES.indexOf(current) + 1) % STATUSES.length]
    const next_s  = { ...statuses, [key]: next }
    setStatuses(next_s)
    localStorage.setItem(LS_KEY, JSON.stringify(next_s))
  }

  const totalNights = CITIES.reduce((s, c) => s + c.nights, 0)

  // Cost summary for the "booked" or mid-range option per city
  const estimatedMin = CITIES.reduce((s, c) => s + c.options[0].price * c.nights, 0)
  const estimatedMax = CITIES.reduce((s, c) => s + c.options[2].price * c.nights, 0)

  return (
    <div className="min-h-screen bg-[#F5F4F0]">

      {/* Hero */}
      <div className="relative h-64 overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-cover bg-center"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=70&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/70" />
        <div className="relative z-10 px-12 pb-7 w-full">
          <p className="text-[9px] uppercase tracking-[1.8px] text-white/65 mb-1.5"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>005 — ACCOMMODATION</p>
          <h1 className="text-[42px] font-bold text-white leading-none"
              style={{ fontFamily: "'Fraunces', serif", letterSpacing: '-1px' }}>
            Where We <em className="not-italic" style={{ color: 'rgba(255,200,150,.95)' }}>Stay</em>
          </h1>
        </div>
      </div>

      <div className="px-12 py-8">

        {/* Summary strip */}
        <div className="flex items-center gap-8 border-[1.5px] border-[#0C0C0C] bg-white px-6 py-4 mb-8">
          <div>
            <p className="text-[8px] uppercase tracking-[1.2px] text-[#777] mb-0.5"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>Total Nights</p>
            <p className="text-[36px] font-light text-[#0C0C0C] leading-none"
               style={{ fontFamily: "'Fraunces', serif" }}>
              {totalNights}
            </p>
          </div>

          <div className="w-px h-12 bg-[#D5D2CA]" />

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

          <div className="w-px h-12 bg-[#D5D2CA]" />

          <div>
            <p className="text-[8px] uppercase tracking-[1.2px] text-[#777] mb-0.5"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>Est. Range</p>
            <p className="text-[13px] text-[#0C0C0C]"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {fmt(estimatedMin)} – {fmt(estimatedMax)}
            </p>
          </div>

          <div className="ml-auto">
            <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-1.5"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>Booking status legend</p>
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
          Status saved locally in this browser · Click any badge to cycle through statuses
        </p>
      </div>
    </div>
  )
}

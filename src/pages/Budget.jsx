import { useState } from 'react'

// ── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key:   'flights',
    label: 'Flights',
    amount: 22000,
    note:  'Return airfare per person',
    color: '#6366F1',
    bg:    '#E0E7FF',
    text:  '#312E81',
  },
  {
    key:   'accommodation',
    label: 'Accommodation',
    amount: 18000,
    note:  '12 nights shared ÷ 3 (Tokyo 6 + Kyoto 3 + Osaka 3)',
    color: '#F59E0B',
    bg:    '#FEF3C7',
    text:  '#92400E',
  },
  {
    key:   'food',
    label: 'Food & Drink',
    amount: 10000,
    note:  'Meals, cafés, convenience stores',
    color: '#EF4444',
    bg:    '#FEF2F2',
    text:  '#991B1B',
  },
  {
    key:   'transport',
    label: 'Transport',
    amount: 8000,
    note:  'JR Pass + Shinkansen + IC card top-ups',
    color: '#3B82F6',
    bg:    '#DBEAFE',
    text:  '#1E3A8A',
  },
  {
    key:   'activities',
    label: 'Activities',
    amount: 7000,
    note:  'Disney, TeamLab, Shibuya Sky, temples',
    color: '#10B981',
    bg:    '#D1FAE5',
    text:  '#064E3B',
  },
  {
    key:   'shopping',
    label: 'Shopping',
    amount: 6000,
    note:  'Gifts, souvenirs, clothing',
    color: '#EC4899',
    bg:    '#FCE7F3',
    text:  '#831843',
  },
  {
    key:   'misc',
    label: 'Misc & Buffer',
    amount: 4000,
    note:  'SIM card, emergencies, contingency',
    color: '#8B5CF6',
    bg:    '#F3E8FF',
    text:  '#4C1D95',
  },
]

const PER_PERSON = CATEGORIES.reduce((s, c) => s + c.amount, 0)   // 75,000
const PEOPLE     = 3
const GROUP      = PER_PERSON * PEOPLE                              // 2,25,000

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN') }

// ── Bar row ───────────────────────────────────────────────────────────────────
function BarRow({ cat, multiplier, maxAmount, animate }) {
  const amount  = cat.amount * multiplier
  const pct     = Math.round((cat.amount / PER_PERSON) * 100)   // % always based on per-person
  const barPct  = maxAmount ? (cat.amount / maxAmount) * 100 : 0

  return (
    <div className="py-5 border-b border-[#D5D2CA] last:border-0">
      <div className="flex items-baseline justify-between mb-2.5">
        <div className="flex items-center gap-3">
          {/* colour dot */}
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: cat.color }} />
          <div>
            <p className="text-[14px] font-medium text-[#0C0C0C]"
               style={{ fontFamily: "'Outfit', sans-serif" }}>
              {cat.label}
            </p>
            <p className="text-[9px] text-[#BBBBBB] mt-0.5"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {cat.note}
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0 ml-6">
          <p className="text-[22px] font-light text-[#0C0C0C] leading-none"
             style={{ fontFamily: "'Fraunces', serif" }}>
            {fmt(amount)}
          </p>
          <p className="text-[8.5px] text-[#BBBBBB] mt-0.5"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {pct}% of total
          </p>
        </div>
      </div>

      {/* Bar track */}
      <div className="h-[3px] bg-[#E5E2DA] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width:      animate ? `${barPct}%` : '0%',
            background: cat.color,
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Budget() {
  const [mode, setMode] = useState('person')   // 'person' | 'group'
  const multiplier = mode === 'person' ? 1 : PEOPLE
  const total      = mode === 'person' ? PER_PERSON : GROUP

  // bars scale relative to the largest category
  const maxAmount = Math.max(...CATEGORIES.map(c => c.amount))

  return (
    <div className="min-h-screen bg-[#F5F4F0]">

      {/* Hero */}
      <div className="relative h-64 overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-cover bg-center"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=1400&q=70&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/70" />
        <div className="relative z-10 px-12 pb-7 w-full">
          <p className="text-[9px] uppercase tracking-[1.8px] text-white/65 mb-1.5"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>003 — FINANCES</p>
          <h1 className="text-[42px] font-bold text-white leading-none"
              style={{ fontFamily: "'Fraunces', serif", letterSpacing: '-1px' }}>
            Trip <em className="not-italic" style={{ color: 'rgba(255,200,150,.95)' }}>Budget</em>
          </h1>
        </div>
      </div>

      <div className="px-12 py-8">

        {/* Top bar: total card + toggle */}
        <div className="flex items-stretch gap-6 mb-8">

          {/* Total card */}
          <div className="flex-1 border-[1.5px] border-[#0C0C0C] bg-white px-8 py-6">
            <p className="text-[8px] uppercase tracking-[1.4px] text-[#777] mb-1"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {mode === 'person' ? 'Per Person · Target' : `Group Total · ${PEOPLE} People`}
            </p>
            <p className="text-[56px] font-light text-[#0C0C0C] leading-none"
               style={{ fontFamily: "'Fraunces', serif" }}>
              {fmt(total)}
            </p>
            {mode === 'person' && (
              <p className="text-[9px] text-[#BBBBBB] mt-2"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Group total: {fmt(GROUP)} across all three
              </p>
            )}
          </div>

          {/* Toggle + mini category pills */}
          <div className="flex flex-col gap-4">
            {/* Toggle */}
            <div className="flex border-[1.5px] border-[#0C0C0C] overflow-hidden self-start">
              {[
                { key: 'person', label: 'Per Person' },
                { key: 'group',  label: 'Group Total' },
              ].map(({ key, label }) => {
                const on = mode === key
                return (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className="px-5 py-2.5 text-[9.5px] uppercase tracking-[0.8px] transition-colors border-r border-[#D5D2CA] last:border-r-0"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: on ? '#0C0C0C' : 'transparent',
                      color:      on ? '#fff'    : '#777',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Category colour legend */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
              {CATEGORIES.map(cat => (
                <div key={cat.key} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: cat.color }} />
                  <span className="text-[8.5px] text-[#777]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {cat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_280px] gap-8">

          {/* ── Left: bar chart ── */}
          <div className="border-[1.5px] border-[#0C0C0C] bg-white px-8 py-2">
            {CATEGORIES.map(cat => (
              <BarRow
                key={cat.key}
                cat={cat}
                multiplier={multiplier}
                maxAmount={maxAmount}
                animate={true}
              />
            ))}
          </div>

          {/* ── Right: stat cards ── */}
          <div className="flex flex-col gap-4">

            {/* Biggest spend */}
            <div className="border border-[#D5D2CA] bg-white p-5">
              <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-3"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Largest Category
              </p>
              {(() => {
                const top = CATEGORIES.reduce((a, b) => a.amount > b.amount ? a : b)
                return (
                  <>
                    <span
                      className="inline-block text-[8px] uppercase tracking-[0.8px] px-2 py-1 mb-2"
                      style={{ fontFamily: "'JetBrains Mono', monospace",
                               background: top.bg, color: top.text }}
                    >
                      {top.label}
                    </span>
                    <p className="text-[32px] font-light text-[#0C0C0C] leading-none"
                       style={{ fontFamily: "'Fraunces', serif" }}>
                      {fmt(top.amount * multiplier)}
                    </p>
                    <p className="text-[8.5px] text-[#BBBBBB] mt-1"
                       style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {Math.round((top.amount / PER_PERSON) * 100)}% of per-person budget
                    </p>
                  </>
                )
              })()}
            </div>

            {/* Daily average */}
            <div className="border border-[#D5D2CA] bg-white p-5">
              <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-3"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Daily Spend (13 days)
              </p>
              <p className="text-[32px] font-light text-[#0C0C0C] leading-none"
                 style={{ fontFamily: "'Fraunces', serif" }}>
                {fmt(Math.round((PER_PERSON * multiplier) / 13))}
              </p>
              <p className="text-[8.5px] text-[#BBBBBB] mt-1"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {mode === 'person' ? 'per person' : 'across the group'} / day
              </p>
            </div>

            {/* Discretionary (Shopping + Misc) */}
            <div className="border border-[#D5D2CA] bg-white p-5">
              <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-3"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Discretionary
              </p>
              <p className="text-[32px] font-light text-[#0C0C0C] leading-none"
                 style={{ fontFamily: "'Fraunces', serif" }}>
                {fmt((6000 + 4000) * multiplier)}
              </p>
              <p className="text-[8.5px] text-[#BBBBBB] mt-1"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Shopping + misc buffer
              </p>
            </div>

            {/* Fixed vs flexible split */}
            <div className="border border-[#D5D2CA] bg-white p-5">
              <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-4"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Fixed vs Flexible
              </p>
              {[
                { label: 'Fixed',    amount: (22000 + 18000 + 8000) * multiplier, note: 'Flights · Stay · JR Pass' },
                { label: 'Flexible', amount: (10000 + 7000 + 6000 + 4000) * multiplier, note: 'Food · Activities · Shopping · Misc' },
              ].map(({ label, amount, note }) => {
                const pct = Math.round((amount / (PER_PERSON * multiplier)) * 100)
                return (
                  <div key={label} className="mb-3 last:mb-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[9px] uppercase tracking-[0.5px] text-[#777]"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {label}
                      </span>
                      <span className="text-[13px] text-[#0C0C0C]"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(amount)}
                      </span>
                    </div>
                    <div className="h-[2px] bg-[#E5E2DA]">
                      <div
                        className="h-full bg-[#0C0C0C]"
                        style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
                      />
                    </div>
                    <p className="text-[8px] text-[#BBBBBB] mt-0.5"
                       style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {note}
                    </p>
                  </div>
                )
              })}
            </div>

          </div>
        </div>

        <p className="text-[8.5px] text-[#BBBBBB] mt-8 text-center"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          All figures are estimates · Actual costs tracked in Expense Log
        </p>
      </div>
    </div>
  )
}

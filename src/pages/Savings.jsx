import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ACCENT_COLORS } from '../lib/users'

// ── Constants ────────────────────────────────────────────────────────────────
const PERSONS = [
  { key: 'aman',    name: 'Aman',    accent: 'amber'  },
  { key: 'rithwik', name: 'Rithwik', accent: 'teal'   },
  { key: 'vishal',  name: 'Vishal',  accent: 'indigo' },
]

const MONTHS = [
  'Apr2026','May2026','Jun2026','Jul2026','Aug2026','Sep2026',
  'Oct2026','Nov2026','Dec2026','Jan2027','Feb2027','Mar2027',
  'Apr2027','May2027','Jun2027','Jul2027','Aug2027','Sep2027',
]
const MONTH_LABELS = [
  'Apr 26','May 26','Jun 26','Jul 26','Aug 26','Sep 26',
  'Oct 26','Nov 26','Dec 26','Jan 27','Feb 27','Mar 27',
  'Apr 27','May 27','Jun 27','Jul 27','Aug 27','Sep 27',
]

const PER_PERSON_GOAL = 250000
const TOTAL_GOAL      = 750000
const MONTHLY_TARGET  = 13000

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN') }

// ── Helpers ───────────────────────────────────────────────────────────────────
/** empty nested store: { aman: {}, rithwik: {}, vishal: {} } */
function emptyData() {
  return Object.fromEntries(PERSONS.map(p => [p.key, {}]))
}

function personTotal(data, key) {
  return MONTHS.reduce((s, m) => s + (Number(data[key]?.[m]) || 0), 0)
}

function allTotal(data) {
  return PERSONS.reduce((s, p) => s + personTotal(data, p.key), 0)
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = '#0C0C0C' }) {
  const pct = Math.min(100, max ? Math.round((value / max) * 100) : 0)
  return (
    <div className="h-[2px] bg-[#E5E2DA] mt-2 mb-1">
      <div
        className="h-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Savings() {
  const { user, profile } = useAuth()
  const myKey     = profile?.name?.toLowerCase() ?? ''
  const [data,    setData]    = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('combined')  // 'combined' | 'aman' | 'rithwik' | 'vishal'
  const channelRef = useRef(null)
  // track in-flight saves to avoid overwriting local edits with realtime echo
  const savingRef  = useRef(new Set())

  // ── Load + realtime ──────────────────────────────────────────────
  useEffect(() => {
    loadAll()

    channelRef.current = supabase
      .channel('savings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings' },
        payload => {
          const row = payload.new
          if (!row?.person || !row?.month) return
          // Skip echo of our own in-flight saves
          if (savingRef.current.has(`${row.person}-${row.month}`)) return
          setData(prev => ({
            ...prev,
            [row.person]: { ...prev[row.person], [row.month]: Number(row.amount) || 0 },
          }))
        })
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  async function loadAll() {
    const { data: rows } = await supabase.from('savings').select('person, month, amount')
    if (rows) {
      const next = emptyData()
      rows.forEach(r => {
        if (next[r.person]) next[r.person][r.month] = Number(r.amount) || 0
      })
      setData(next)
    }
    setLoading(false)
  }

  // ── Update a cell ────────────────────────────────────────────────
  async function handleChange(personKey, month, raw) {
    const amount = Number(raw) || 0
    // Optimistic local update
    setData(prev => ({
      ...prev,
      [personKey]: { ...prev[personKey], [month]: amount },
    }))

    const cacheKey = `${personKey}-${month}`
    savingRef.current.add(cacheKey)

    await supabase.from('savings').upsert(
      { user_id: user.id, person: personKey, month, amount },
      { onConflict: 'person,month' }
    )

    // Let realtime settle before removing lock
    setTimeout(() => savingRef.current.delete(cacheKey), 2000)
  }

  // ── Derived ──────────────────────────────────────────────────────
  const grandTotal = allTotal(data)
  const grandPct   = Math.min(100, Math.round((grandTotal / TOTAL_GOAL) * 100))

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F4F0]">

      {/* Hero */}
      <div className="relative h-[200px] lg:h-64 overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-cover bg-center"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1400&q=70&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/70" />
        <div className="relative z-10 px-4 pb-5 lg:px-12 lg:pb-7 w-full">
          <p className="text-[9px] uppercase tracking-[1.8px] text-white/65 mb-1.5"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>003B — SAVINGS</p>
          <h1 className="text-[32px] lg:text-[42px] font-bold text-white leading-none"
              style={{ fontFamily: "'Fraunces', serif", letterSpacing: '-1px' }}>
            Savings <em className="not-italic" style={{ color: 'rgba(255,200,150,.95)' }}>Tracker</em>
          </h1>
        </div>
      </div>

      <div className="px-4 lg:px-12 py-6 lg:py-8">

        {/* Group total banner */}
        <div className="border border-[#D5D2CA] bg-white p-6 mb-7">
          <div className="flex items-end justify-between mb-1">
            <p className="text-[9px] uppercase tracking-[1.2px] text-[#777]"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Combined · Target {fmt(TOTAL_GOAL)} · {fmt(MONTHLY_TARGET)}/month each
            </p>
            <p className="text-[9px] text-[#777]"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {grandPct}%
            </p>
          </div>
          <p className="text-[46px] font-light text-[#0C0C0C] leading-none"
             style={{ fontFamily: "'Fraunces', serif" }}>
            {fmt(grandTotal)}
          </p>
          <ProgressBar value={grandTotal} max={TOTAL_GOAL} />
          {/* Per-person mini row */}
          <div className="flex gap-6 mt-3">
            {PERSONS.map(p => {
              const tot = personTotal(data, p.key)
              const ac  = ACCENT_COLORS[p.accent]
              return (
                <div key={p.key} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: ac.dot }} />
                  <span className="text-[9px] text-[#777]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {p.name}: {fmt(tot)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto mb-7">
        <div className="flex border-[1.5px] border-[#0C0C0C] overflow-hidden w-fit">
          {['combined', ...PERSONS.map(p => p.key)].map(key => {
            const label = key === 'combined' ? 'Combined' : PERSONS.find(p => p.key === key)?.name
            const on    = tab === key
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
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
        </div>

        {loading ? (
          <p className="text-[10px] text-[#777] py-12 text-center"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Loading…
          </p>
        ) : tab === 'combined' ? (
          <CombinedView data={data} />
        ) : (
          <PersonView
            personKey={tab}
            data={data}
            isMe={tab === myKey}
            onSave={handleChange}
          />
        )}
      </div>
    </div>
  )
}

// ── Combined view ─────────────────────────────────────────────────────────────
function CombinedView({ data }) {
  return (
    <div>
      <div className="grid grid-cols-3 lg:grid-cols-6 mb-6" style={{ gap: 1, background: '#D5D2CA', border: '1px solid #D5D2CA' }}>
        {MONTHS.map((m, i) => {
          const total = PERSONS.reduce((s, p) => s + (Number(data[p.key]?.[m]) || 0), 0)
          const mt    = MONTHLY_TARGET * 3
          const cls   = total === 0 ? '' : total >= mt ? '#2e7d32' : '#B8321A'
          return (
            <div key={m} className="bg-white p-3 pb-2.5">
              <p className="text-[7.5px] uppercase tracking-[0.8px] text-[#777] mb-1.5"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {MONTH_LABELS[i]}
              </p>
              <p className="text-[13px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: cls || '#0C0C0C' }}>
                {total ? fmt(total) : '—'}
              </p>
              <div className="flex gap-px mt-1.5">
                {PERSONS.map(p => {
                  const v = Number(data[p.key]?.[m]) || 0
                  const ac = ACCENT_COLORS[p.accent]
                  return (
                    <div key={p.key} className="flex-1 h-[2px]"
                         style={{ background: v > 0 ? ac.dot : '#E5E2DA' }} />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 border-t-[1.5px] border-[#0C0C0C] pt-6">
        {PERSONS.map(p => {
          const tot  = allTotal({ [p.key]: Object.fromEntries(MONTHS.map(m => [m, 0])), ...{ [p.key]: {} } })
          // recalculate properly
          const ptot = MONTHS.reduce((s, m) => s + (Number(data[p.key]?.[m]) || 0), 0)
          const pct  = Math.min(100, Math.round((ptot / PER_PERSON_GOAL) * 100))
          const ac   = ACCENT_COLORS[p.accent]
          return (
            <div key={p.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: ac.dot }} />
                <p className="text-[9px] uppercase tracking-[0.8px] text-[#777]"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {p.name}
                </p>
              </div>
              <p className="text-[32px] font-light text-[#0C0C0C] leading-none"
                 style={{ fontFamily: "'Fraunces', serif" }}>
                {fmt(ptot)}
              </p>
              <ProgressBar value={ptot} max={PER_PERSON_GOAL} color={ac.dot} />
              <p className="text-[8.5px] text-[#777]"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {pct}% of {fmt(PER_PERSON_GOAL)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Per-person view ───────────────────────────────────────────────────────────
function PersonView({ personKey, data, isMe, onSave }) {
  const person = PERSONS.find(p => p.key === personKey)
  const ac     = ACCENT_COLORS[person.accent]
  const total  = personTotal(data, personKey)
  const pct    = Math.min(100, Math.round((total / PER_PERSON_GOAL) * 100))
  const remaining = Math.max(0, PER_PERSON_GOAL - total)
  const contributed = MONTHS.filter(m => (Number(data[personKey]?.[m]) || 0) > 0).length
  const avg = contributed > 0 ? Math.round(total / contributed) : 0

  return (
    <div>
      {/* Person header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ background: ac.dot }} />
          <h2 className="text-[30px] font-semibold text-[#0C0C0C] leading-none"
              style={{ fontFamily: "'Fraunces', serif" }}>
            {person.name}
          </h2>
          {isMe && (
            <span className="text-[8px] uppercase tracking-[1px] px-2 py-0.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace",
                           background: ac.bg, color: ac.text }}>
              You
            </span>
          )}
        </div>
        <p className="text-[9px] uppercase tracking-[0.8px] text-[#777]"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Target: {fmt(PER_PERSON_GOAL)} · Monthly target: {fmt(MONTHLY_TARGET)}
        </p>
      </div>

      {/* Monthly grid */}
      <div className="grid mb-6"
           style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, background: '#D5D2CA', border: '1px solid #D5D2CA' }}>
        {MONTHS.map((m, i) => {
          const val = Number(data[personKey]?.[m]) || 0
          const onTarget = val > 0 && val >= MONTHLY_TARGET
          const below    = val > 0 && val <  MONTHLY_TARGET
          return (
            <div key={m} className="bg-white p-3 pb-2.5">
              <p className="text-[7.5px] uppercase tracking-[0.8px] text-[#777] mb-1.5"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {MONTH_LABELS[i]}
              </p>
              {isMe ? (
                <input
                  type="number"
                  min="0"
                  defaultValue={val || ''}
                  placeholder="₹"
                  onBlur={e => onSave(personKey, m, e.target.value)}
                  className="w-full border-0 border-b-2 bg-transparent text-[12px] outline-none pb-0.5 transition-colors"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    borderColor: onTarget ? '#4caf50' : below ? '#B8321A' : '#D5D2CA',
                    color:       onTarget ? '#2e7d32' : below ? '#B8321A' : '#0C0C0C',
                  }}
                />
              ) : (
                <p
                  className="text-[12px] pb-0.5 border-b-2 border-[#D5D2CA]"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: onTarget ? '#2e7d32' : below ? '#B8321A' : val ? '#0C0C0C' : '#BBBBBB',
                  }}
                >
                  {val ? fmt(val) : '—'}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 border-t-[1.5px] border-[#0C0C0C] pt-6">
        <div>
          <p className="text-[8px] uppercase tracking-[1.2px] text-[#777] mb-2"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>Total Saved</p>
          <p className="text-[38px] font-light text-[#0C0C0C] leading-none"
             style={{ fontFamily: "'Fraunces', serif" }}>{fmt(total)}</p>
          <ProgressBar value={total} max={PER_PERSON_GOAL} color={ac.dot} />
          <p className="text-[8.5px] text-[#777]"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>{pct}% complete</p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-[1.2px] text-[#777] mb-2"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>Remaining</p>
          <p className="text-[38px] font-light text-[#0C0C0C] leading-none"
             style={{ fontFamily: "'Fraunces', serif" }}>{fmt(remaining)}</p>
          <p className="text-[8.5px] text-[#777] mt-2"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {MONTHS.length - contributed} months left
          </p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-[1.2px] text-[#777] mb-2"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>Avg / Month</p>
          <p className="text-[38px] font-light text-[#0C0C0C] leading-none"
             style={{ fontFamily: "'Fraunces', serif" }}>{avg ? fmt(avg) : '—'}</p>
          <p className="text-[8.5px] text-[#777] mt-2"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {contributed} month{contributed !== 1 ? 's' : ''} contributed
          </p>
        </div>
      </div>

      {!isMe && (
        <p className="text-[9px] text-[#BBBBBB] mt-6 text-center"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Read-only — you can only edit your own savings
        </p>
      )}
    </div>
  )
}

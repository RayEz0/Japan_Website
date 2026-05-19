import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ACCENT_COLORS } from '../lib/users'
import { OptimizedHeroImage } from '../components/OptimizedImage'

// ── Constants ────────────────────────────────────────────────────────────────
const PERSONS = [
  { key: 'aman',    name: 'Aman',    accent: 'amber'  },
  { key: 'rithwik', name: 'Rithwik', accent: 'teal'   },
  { key: 'vishal',  name: 'Vishal',  accent: 'indigo' },
]

const FILTER_CATS = ['All', 'Snacks', 'Drinks', 'Fragrance', 'Clothing', 'Stationery', 'Decor', 'Other']
const ADD_CATS    = ['Snacks', 'Drinks', 'Fragrance', 'Clothing', 'Stationery', 'Decor', 'Other']

const CAT_STYLE = {
  Snacks:     { bg: '#FEF9C3', text: '#713F12' },
  Drinks:     { bg: '#DBEAFE', text: '#1E3A8A' },
  Fragrance:  { bg: '#FCE7F3', text: '#831843' },
  Clothing:   { bg: '#D1FAE5', text: '#064E3B' },
  Stationery: { bg: '#F3E8FF', text: '#4C1D95' },
  Decor:      { bg: '#FEF3C7', text: '#92400E' },
  Other:      { bg: '#F1F5F9', text: '#334155' },
}

const RECOMMENDED_LOCATIONS = {
  anime: 'Akihabara, Tokyo',
  figure: 'Akihabara, Tokyo',
  manga: 'Akihabara, Tokyo',
  knife: 'Osaka - Sennichimae Doguyasuji',
  matcha: 'Kyoto - Nishiki Market',
  kitkat: 'Tokyo - Don Quijote',
  skincare: 'Tokyo - Matsumoto Kiyoshi',
  fragrance: 'Tokyo - Ginza',
  stationery: 'Tokyo - Itoya Ginza',
  yukata: 'Kyoto - Gion',
  ceramic: 'Kyoto - Kiyomizu-zaka',
  chopstick: 'Kyoto - Nishiki Market',
  snack: 'Tokyo - Don Quijote',
}

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN') }

function blankForm() {
  return { name: '', price: '', category: 'Snacks', location: '' }
}

function getRecommendedLocation(gift) {
  if (gift.location) return gift.location
  const haystack = `${gift.name ?? ''} ${gift.category ?? ''}`.toLowerCase()
  const match = Object.entries(RECOMMENDED_LOCATIONS).find(([key]) => haystack.includes(key))
  return match?.[1] ?? null
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Gifts() {
  const { profile } = useAuth()
  const myName = profile?.name ?? ''

  const [gifts,         setGifts]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState('All')
  const [addForm,       setAddForm]       = useState(blankForm)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [confirmId,     setConfirmId]     = useState(null)  // gift.id awaiting delete confirm
  const channelRef = useRef(null)

  async function loadAll() {
    const { data } = await supabase
      .from('gifts')
      .select('*')
      .order('category')
      .order('name')
    setGifts(data ?? [])
    setLoading(false)
  }

  // ── Load + realtime ──────────────────────────────────────────────
  useEffect(() => {
    void Promise.resolve().then(loadAll)

    channelRef.current = supabase
      .channel('gifts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gifts' },
        payload => setGifts(prev =>
          prev.some(g => g.id === payload.new.id) ? prev : [...prev, payload.new]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'gifts' },
        payload => setGifts(prev =>
          prev.map(g => g.id === payload.new.id ? { ...g, ...payload.new } : g)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'gifts' },
        payload => setGifts(prev => prev.filter(g => g.id !== payload.old.id)))
      .subscribe()

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  // ── Toggle checked ───────────────────────────────────────────────
  async function handleToggle(gift) {
    const newChecked   = !gift.checked
    const newCheckedBy = newChecked ? myName : ''

    setGifts(prev => prev.map(g =>
      g.id === gift.id ? { ...g, checked: newChecked, checked_by: newCheckedBy } : g))

    await supabase
      .from('gifts')
      .update({
        checked:    newChecked,
        checked_by: newCheckedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gift.id)
  }

  // ── Add gift ─────────────────────────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault()
    if (!addForm.name.trim()) return
    setAddSubmitting(true)

    const { data: newRow, error } = await supabase
      .from('gifts')
      .insert({
        name:      addForm.name.trim(),
        category:  addForm.category,
        est_price: addForm.price ? Number(addForm.price) : 0,
        location:  addForm.location.trim() || null,
        checked:   false,
        is_custom: true,
      })
      .select()
      .single()

    if (!error && newRow) {
      setGifts(prev =>
        prev.some(g => g.id === newRow.id) ? prev : [...prev, newRow])
      setAddForm(blankForm())
    }
    setAddSubmitting(false)
  }

  // ── Delete gift (is_custom only) ─────────────────────────────────
  async function handleDelete(gift) {
    setConfirmId(null)
    setGifts(prev => prev.filter(g => g.id !== gift.id))
    await supabase.from('gifts').delete().eq('id', gift.id)
  }

  // ── Derived ──────────────────────────────────────────────────────
  const displayed    = filter === 'All' ? gifts : gifts.filter(g => g.category === filter)
  const checkedCount = gifts.filter(g => g.checked).length
  const totalEst     = gifts.reduce((s, g) => s + Number(g.est_price), 0)
  const progressPct  = gifts.length ? Math.round((checkedCount / gifts.length) * 100) : 0

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F4F0]">

      {/* Hero */}
      <div className="relative h-[200px] lg:h-64 overflow-hidden flex items-end">
        <OptimizedHeroImage hero="gifts" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/70" />
        <div className="relative z-10 px-4 pb-5 lg:px-12 lg:pb-7 w-full">
          <p className="text-[9px] uppercase tracking-[1.8px] text-white/65 mb-1.5"
             >006 — CHECKLIST</p>
          <h1 className="text-[32px] lg:text-[42px] font-bold text-white leading-none"
              style={{  letterSpacing: '-1px' }}>
            Gifts &amp; <em className="not-italic" style={{ color: 'rgba(255,200,150,.95)' }}>Souvenirs</em>
          </h1>
        </div>
      </div>

      <div className="px-4 lg:px-12 py-6 lg:py-8">

        {/* ── Add Gift form ── */}
        <div className="border-[1.5px] border-[#0C0C0C] bg-white p-5 mb-7">
          <p className="text-[8px] uppercase tracking-[1.2px] text-[#777] mb-4"
             >
            Add Gift / Souvenir
          </p>
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
            {/* Name */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[7.5px] uppercase tracking-[0.8px] text-[#777] mb-1.5"
                     >
                Item name *
              </label>
              <input
                type="text"
                required
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Matcha Kit Kat box"
                className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-1 text-[13px] text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors"
                
              />
            </div>

            {/* Location */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[7.5px] uppercase tracking-[0.8px] text-[#777] mb-1.5">
                Where to buy (optional)
              </label>
              <input
                type="text"
                value={addForm.location}
                onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Tokyo – Don Quijote"
                className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-1 text-[13px] text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors"
              />
            </div>

            {/* Est. price */}
            <div className="w-28">
              <label className="block text-[7.5px] uppercase tracking-[0.8px] text-[#777] mb-1.5"
                     >
                Est. price (₹)
              </label>
              <input
                type="number"
                min="0"
                value={addForm.price}
                onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0"
                className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-1 text-[13px] text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors"
                
              />
            </div>

            {/* Category */}
            <div className="w-36">
              <label className="block text-[7.5px] uppercase tracking-[0.8px] text-[#777] mb-1.5"
                     >
                Category
              </label>
              <select
                value={addForm.category}
                onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-1 text-[12px] text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors appearance-none"
                
              >
                {ADD_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={addSubmitting}
              className="text-[9px] uppercase tracking-[1px] bg-[#0C0C0C] text-white px-5 py-2 hover:opacity-75 disabled:opacity-40 transition-opacity flex-shrink-0"
              
            >
              {addSubmitting ? 'Adding…' : '+ Add'}
            </button>
          </form>
        </div>

        {/* Summary bar */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-8 border-[1.5px] border-[#0C0C0C] bg-white px-6 py-4 mb-7">
          <div>
            <p className="type-label mb-0.5"
               >Checked Off</p>
            <p className="type-num text-[32px] font-light leading-none text-[#0C0C0C] tabular-nums"
               >
              {checkedCount}
              <span className="text-[16px] text-[#777]"> / {gifts.length}</span>
            </p>
          </div>

          <div className="w-px h-12 bg-[#D5D2CA]" />

          <div>
            <p className="type-label mb-0.5"
               >Est. Total</p>
            <p className="type-num text-[32px] font-light leading-none text-[#0C0C0C] tabular-nums"
               >
              {fmt(totalEst)}
            </p>
          </div>

          <div className="w-px h-12 bg-[#D5D2CA]" />

          {/* Progress */}
          <div className="flex-1 min-w-[120px]">
            <div className="flex justify-between mb-1.5">
              <p className="type-label"
                 >Progress</p>
              <p className="type-meta"
                 >{progressPct}%</p>
            </div>
            <div className="h-[3px] bg-[#E5E2DA]">
              <div
                className="h-full bg-[#0C0C0C] transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Per-person counts */}
          <div className="flex gap-4">
            {PERSONS.map(p => {
              const ac    = ACCENT_COLORS[p.accent]
              const count = gifts.filter(g => g.checked_by === p.name).length
              return (
                <div key={p.key} className="text-center">
                  <span className="block w-2 h-2 rounded-full mx-auto mb-1" style={{ background: ac.dot }} />
                  <p className="text-[9px]" style={{  color: ac.text }}>
                    {p.name}
                  </p>
                  <p className="type-num text-[16px] font-light text-[#0C0C0C] leading-none tabular-nums" >
                    {count}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="overflow-x-auto mb-7">
          <div className="flex border-[1.5px] border-[#0C0C0C] overflow-hidden w-fit min-w-max">
            {FILTER_CATS.map(cat => {
              const on = filter === cat
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className="px-4 py-2 text-[9px] uppercase tracking-[0.8px] border-r border-[#D5D2CA] last:border-r-0 transition-colors"
                  style={{
                    
                    background: on ? '#0C0C0C' : 'transparent',
                    color:      on ? '#fff'    : '#777',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Gift list */}
        {loading ? (
          <p className="text-[10px] text-[#777] py-12 text-center"
             >
            Loading…
          </p>
        ) : (
          <div className="border-[1.5px] border-[#0C0C0C] bg-white overflow-hidden">
            {displayed.length === 0 && (
              <p className="text-[11px] text-[#777] py-8 text-center"
                 >
                No items in this category.
              </p>
            )}

            {displayed.map(gift => {
              const cs            = CAT_STYLE[gift.category] ?? CAT_STYLE.Other
              const checkerPerson = PERSONS.find(p => p.name === gift.checked_by)
              const checkerAc     = checkerPerson ? ACCENT_COLORS[checkerPerson.accent] : null
              const isConfirming  = confirmId === gift.id
              const recommendedLocation = getRecommendedLocation(gift)

              return (
                <div
                  key={gift.id}
                  className="flex items-center gap-3 px-3 py-3 lg:px-6 lg:py-4 border-b border-[#D5D2CA] last:border-0 group transition-colors"
                  style={{ opacity: gift.checked ? 0.6 : 1, background: isConfirming ? '#FEF2F2' : undefined }}
                >
                  {/* Checkbox — clicking row toggles unless in confirm mode */}
                  <div
                    onClick={() => !isConfirming && handleToggle(gift)}
                    className="w-5 h-5 border-[1.5px] flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer"
                    style={{
                      borderColor: gift.checked ? '#0C0C0C' : '#D5D2CA',
                      background:  gift.checked ? '#0C0C0C' : 'transparent',
                    }}
                  >
                    {gift.checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Name + who checked */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => !isConfirming && handleToggle(gift)}
                  >
                    <p
                      className="text-[14px] font-medium leading-tight"
                      style={{
                        
                        color:          gift.checked ? '#999' : '#0C0C0C',
                        textDecoration: gift.checked ? 'line-through' : 'none',
                      }}
                    >
                      {gift.name}
                      {recommendedLocation && (
                        <span className="text-[#777] font-normal ml-1.5">
                          ({recommendedLocation})
                        </span>
                      )}
                    </p>
                    {gift.checked && gift.checked_by && (
                      <p className="text-[9px] mt-0.5 text-[#777]"
                         >
                        Picked by{' '}
                        <span style={{ color: checkerAc?.text ?? '#0C0C0C' }}>
                          {gift.checked_by}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Category badge */}
                  <span
                    className="text-[8px] uppercase tracking-[0.8px] px-2 py-1 flex-shrink-0"
                    style={{ 
                             background: cs.bg, color: cs.text }}
                  >
                    {gift.category}
                  </span>

                  {/* Est. price */}
                  <p className="text-[13px] font-light text-[#777] flex-shrink-0 min-w-[64px] text-right"
                     >
                    {fmt(gift.est_price)}
                  </p>

                  {/* Delete — only for custom items */}
                  {gift.is_custom && (
                    <div className="flex-shrink-0 ml-1">
                      {isConfirming ? (
                        <span className="flex items-center gap-1.5 text-[8.5px]"
                              >
                          <span className="text-[#B8321A]">Sure?</span>
                          <button
                            onClick={() => handleDelete(gift)}
                            className="text-[#B8321A] font-semibold hover:underline"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-[#777] hover:underline"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmId(gift.id) }}
                          className="text-[#D5D2CA] hover:text-[#B8321A] transition-colors opacity-0 group-hover:opacity-100 text-sm"
                          title="Delete"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-[8.5px] text-[#BBBBBB] mt-4 text-center"
           >
          Click any item to check / uncheck · Syncs in real time across all users
        </p>
      </div>
    </div>
  )
}

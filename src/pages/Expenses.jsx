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

const CATEGORIES = ['Food', 'Transport', 'Stay', 'Activity', 'Shopping', 'Other']

const CAT_STYLE = {
  Food:      { bg: '#FEF9C3', text: '#713F12' },
  Transport: { bg: '#DBEAFE', text: '#1E3A8A' },
  Stay:      { bg: '#F3E8FF', text: '#4C1D95' },
  Activity:  { bg: '#D1FAE5', text: '#064E3B' },
  Shopping:  { bg: '#FCE7F3', text: '#831843' },
  Other:     { bg: '#F1F5F9', text: '#334155' },
}

function fmt(n)    { return '₹' + Number(n).toLocaleString('en-IN') }
function todayStr(){ return new Date().toISOString().slice(0, 10) }
function cap(s)    { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

// ── Balance math ─────────────────────────────────────────────────────────────
function calcBalances(expenses) {
  const b = { aman: 0, rithwik: 0, vishal: 0 }
  for (const e of expenses) {
    if (e.is_personal) continue
    const split = e.split_between ?? []
    if (!split.length) continue
    const share = Number(e.amount) / split.length
    for (const p of split) { if (p in b) b[p] -= share }
    if (e.paid_by in b) b[e.paid_by] += Number(e.amount)
  }
  return b
}

function calcSettlements(bal) {
  const pos = Object.entries(bal).filter(([, v]) => v >  0.5).map(([p, v]) => ({ p, v }))
  const neg = Object.entries(bal).filter(([, v]) => v < -0.5).map(([p, v]) => ({ p, v: -v }))
  const out = []
  for (const debtor of neg) {
    for (const cred of pos) {
      if (debtor.v < 0.5 || cred.v < 0.5) continue
      const amt = Math.min(debtor.v, cred.v)
      out.push({ from: debtor.p, to: cred.p, amount: Math.round(amt) })
      debtor.v -= amt
      cred.v   -= amt
    }
  }
  return out
}

// ── blank form ────────────────────────────────────────────────────────────────
function blankForm() {
  return { name: '', amount: '', category: 'Food', date: todayStr(),
           notes: '', paid_by: 'aman', split_between: ['aman','rithwik','vishal'] }
}

// ── Expense detail modal ──────────────────────────────────────────────────────
function ExpenseModal({ expense, onClose }) {
  if (!expense) return null
  const split  = expense.split_between ?? []
  const amt    = Number(expense.amount)
  const share  = split.length ? amt / split.length : 0
  const isPersonal = expense.is_personal

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white border-[1.5px] border-[#0C0C0C] p-8 w-full max-w-md mx-4">
        <h2 className="text-[22px] font-bold text-[#0C0C0C] leading-tight mb-1"
            style={{ fontFamily: "'Fraunces', serif" }}>
          {expense.name}
        </h2>
        <p className="text-[9px] uppercase tracking-[0.8px] text-[#777] mb-5"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {fmt(expense.amount)} · {expense.category}
          {expense.date ? ` · ${expense.date}` : ''}
          {` · paid by ${cap(expense.paid_by)}`}
        </p>

        {isPersonal ? (
          <p className="text-[11px] text-[#777] italic"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Personal expense — not included in group balance
          </p>
        ) : (
          <>
            <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-3"
               style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Split Breakdown
            </p>
            {PERSONS.filter(({ key }) => key === expense.paid_by || split.includes(key))
              .map(({ key, name }) => {
                const isPaid = key === expense.paid_by
                const inSplit = split.includes(key)
                const net = (isPaid ? amt : 0) - (inSplit ? share : 0)
                const cls = net >  0.5 ? 'text-[#2e7d32] font-semibold'
                          : net < -0.5 ? 'text-[#B8321A] font-semibold'
                          : 'text-[#777]'
                const sign = net > 0.5 ? '+' : ''
                return (
                  <div key={key} className="flex justify-between items-center py-2.5 border-b border-[#D5D2CA] last:border-0">
                    <span className="text-[13px] text-[#0C0C0C]"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {name}
                      {isPaid && (
                        <span className="ml-2 text-[7.5px] text-[#B8321A] uppercase tracking-wide"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          [paid]
                        </span>
                      )}
                    </span>
                    <span className={`text-[13px] ${cls}`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {sign}{fmt(Math.abs(net))}
                    </span>
                  </div>
                )
              })}
          </>
        )}

        {expense.notes && (
          <p className="text-[11px] text-[#777] mt-4 pt-4 border-t border-[#D5D2CA] italic">
            {expense.notes}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-[0.8px] border-[1.5px] border-[#D5D2CA] text-[#777] px-5 py-2 hover:border-[#0C0C0C] hover:text-[#0C0C0C] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Expenses() {
  const { user, profile } = useAuth()
  const myKey = profile?.name?.toLowerCase() ?? 'aman'

  const [expenses,   setExpenses]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form,       setForm]       = useState(blankForm)
  const [filterCat,  setFilterCat]  = useState('')
  const [filterBy,   setFilterBy]   = useState('')
  const [modal,      setModal]      = useState(null)   // expense to show in modal
  const [delId,      setDelId]      = useState(null)   // pending delete id
  const channelRef = useRef(null)

  // ── Load + realtime ──────────────────────────────────────────────
  useEffect(() => {
    loadAll()

    channelRef.current = supabase
      .channel('expenses-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expenses' },
        payload => setExpenses(prev =>
          prev.some(e => e.id === payload.new.id) ? prev : [payload.new, ...prev]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'expenses' },
        payload => setExpenses(prev => prev.filter(e => e.id !== payload.old.id)))
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  async function loadAll() {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
    setExpenses(data ?? [])
    setLoading(false)
  }

  // ── Form helpers ─────────────────────────────────────────────────
  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleSplit(key) {
    setForm(f => ({
      ...f,
      split_between: f.split_between.includes(key)
        ? f.split_between.filter(k => k !== key)
        : [...f.split_between, key],
    }))
  }

  // ── Add expense ──────────────────────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.amount || !form.split_between.length) return
    setSubmitting(true)

    const isPersonal = form.split_between.length === 1
                    && form.split_between[0] === form.paid_by

    const { data: newRow, error } = await supabase
      .from('expenses')
      .insert({
        created_by:    user.id,
        name:          form.name.trim(),
        amount:        Number(form.amount),
        category:      form.category,
        date:          form.date || null,
        notes:         form.notes.trim(),
        paid_by:       form.paid_by,
        split_between: form.split_between,
        is_personal:   isPersonal,
      })
      .select()
      .single()

    if (!error && newRow) {
      setExpenses(prev => [newRow, ...prev])  // optimistic — don't wait for realtime
      setForm(blankForm())
    }
    setSubmitting(false)
  }

  // ── Delete expense ───────────────────────────────────────────────
  async function handleDelete(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))  // optimistic
    setDelId(null)
    await supabase.from('expenses').delete().eq('id', id)
  }

  // ── Derived ──────────────────────────────────────────────────────
  const displayed = expenses.filter(e => {
    if (filterCat && e.category !== filterCat) return false
    if (filterBy  && e.paid_by  !== filterBy)  return false
    return true
  })

  const balances    = calcBalances(expenses)           // always full dataset
  const settlements = calcSettlements(balances)
  const totalSpent  = expenses.reduce((s, e) => s + Number(e.amount), 0)

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F4F0]">

      {/* Hero */}
      <div className="relative h-[200px] lg:h-64 overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-cover bg-center"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=1400&q=70&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/70" />
        <div className="relative z-10 px-4 pb-5 lg:px-12 lg:pb-7 w-full">
          <p className="text-[9px] uppercase tracking-[1.8px] text-white/65 mb-1.5"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>003C — EXPENSE LOG</p>
          <h1 className="text-[32px] lg:text-[42px] font-bold text-white leading-none"
              style={{ fontFamily: "'Fraunces', serif", letterSpacing: '-1px' }}>
            Expense <em className="not-italic" style={{ color: 'rgba(255,200,150,.95)' }}>Log</em>
          </h1>
        </div>
      </div>

      <div className="max-w-none px-4 lg:px-12 py-6 lg:py-8">

        {/* Total bar */}
        <div className="flex items-center justify-between border-[1.5px] border-[#0C0C0C] bg-white px-6 py-4 mb-7">
          <p className="text-[9px] uppercase tracking-[1.2px] text-[#777]"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>Total Spent</p>
          <p className="text-[32px] font-light text-[#0C0C0C]"
             style={{ fontFamily: "'Fraunces', serif" }}>
            {fmt(totalSpent)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">

          {/* ── Left column ── */}
          <div>

            {/* Add form */}
            <div className="border-[1.5px] border-[#0C0C0C] bg-white p-6 mb-7">
              <h2 className="text-[20px] font-semibold text-[#0C0C0C] mb-5"
                  style={{ fontFamily: "'Fraunces', serif" }}>
                Add Expense
              </h2>
              <form onSubmit={handleAdd}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block text-[8px] uppercase tracking-[1px] text-[#777] mb-1.5"
                           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Item / Title
                    </label>
                    <input
                      type="text" required value={form.name}
                      onChange={e => setField('name', e.target.value)}
                      placeholder="e.g. Ramen Dinner"
                      className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-1.5 text-[13px] text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                  </div>
                  {/* Amount */}
                  <div>
                    <label className="block text-[8px] uppercase tracking-[1px] text-[#777] mb-1.5"
                           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Amount (₹)
                    </label>
                    <input
                      type="number" required min="1" value={form.amount}
                      onChange={e => setField('amount', e.target.value)}
                      placeholder="0"
                      className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-1.5 text-[13px] text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                  </div>
                  {/* Category */}
                  <div>
                    <label className="block text-[8px] uppercase tracking-[1px] text-[#777] mb-1.5"
                           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Category
                    </label>
                    <select
                      value={form.category} onChange={e => setField('category', e.target.value)}
                      className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-1.5 text-[13px] text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors appearance-none"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  {/* Date */}
                  <div>
                    <label className="block text-[8px] uppercase tracking-[1px] text-[#777] mb-1.5"
                           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Date
                    </label>
                    <input
                      type="date" value={form.date}
                      onChange={e => setField('date', e.target.value)}
                      className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-1.5 text-[13px] text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                  </div>
                  {/* Paid by */}
                  <div>
                    <label className="block text-[8px] uppercase tracking-[1px] text-[#777] mb-1.5"
                           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Paid By
                    </label>
                    <select
                      value={form.paid_by} onChange={e => setField('paid_by', e.target.value)}
                      className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-1.5 text-[13px] text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors appearance-none"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {PERSONS.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-[8px] uppercase tracking-[1px] text-[#777] mb-1.5"
                         style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Notes (optional)
                  </label>
                  <input
                    type="text" value={form.notes}
                    onChange={e => setField('notes', e.target.value)}
                    placeholder="e.g. Dotonbori night"
                    className="w-full border-0 border-b-2 border-[#D5D2CA] bg-transparent pb-1.5 text-[13px] text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>

                {/* Split between */}
                <div className="flex items-center gap-4 mb-5">
                  <p className="text-[8px] uppercase tracking-[1px] text-[#777] flex-shrink-0"
                     style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Split Between
                  </p>
                  <div className="flex gap-4">
                    {PERSONS.map(p => {
                      const checked = form.split_between.includes(p.key)
                      const ac = ACCENT_COLORS[p.accent]
                      return (
                        <label
                          key={p.key}
                          className="flex items-center gap-2 cursor-pointer text-[12px]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          <input
                            type="checkbox" checked={checked}
                            onChange={() => toggleSplit(p.key)}
                            className="accent-[#0C0C0C] cursor-pointer"
                          />
                          <span
                            className="px-2 py-0.5 text-[10px] rounded-sm"
                            style={checked ? { background: ac.bg, color: ac.text } : { color: '#777' }}
                          >
                            {p.name}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  {form.split_between.length === 1 && form.split_between[0] === form.paid_by && (
                    <span className="text-[8.5px] text-[#777] italic ml-2"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      → personal expense
                    </span>
                  )}
                </div>

                <button
                  type="submit" disabled={submitting}
                  className="text-[10px] uppercase tracking-[1px] bg-[#0C0C0C] text-white px-7 py-2.5 hover:opacity-75 disabled:opacity-40 transition-opacity"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {submitting ? 'Adding…' : '+ Add Expense'}
                </button>
              </form>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <p className="text-[8.5px] uppercase tracking-[0.8px] text-[#777] flex-shrink-0"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Filter:
              </p>
              <select
                value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="border border-[#D5D2CA] bg-white text-[11px] text-[#0C0C0C] px-3 py-1.5 outline-none appearance-none hover:border-[#0C0C0C] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select
                value={filterBy} onChange={e => setFilterBy(e.target.value)}
                className="border border-[#D5D2CA] bg-white text-[11px] text-[#0C0C0C] px-3 py-1.5 outline-none appearance-none hover:border-[#0C0C0C] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <option value="">All Payers</option>
                {PERSONS.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
              {(filterCat || filterBy) && (
                <button
                  onClick={() => { setFilterCat(''); setFilterBy('') }}
                  className="text-[9px] uppercase tracking-wider text-[#B8321A] hover:underline"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Expense list */}
            <div>
              <p className="text-[9px] uppercase tracking-[1px] text-[#777] border-b border-[#D5D2CA] pb-2 mb-0"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                All Entries {filterCat || filterBy ? `(${displayed.length} shown)` : `(${expenses.length})`}
              </p>

              {loading && (
                <p className="text-[10px] text-[#777] py-8 text-center"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Loading…
                </p>
              )}

              {!loading && !displayed.length && (
                <p className="text-[11px] text-[#777] py-8 text-center"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  No expenses yet. Add one above.
                </p>
              )}

              {displayed.map(e => {
                const catStyle = CAT_STYLE[e.category] ?? CAT_STYLE.Other
                const isOwner  = e.created_by === user?.id
                const split    = e.split_between ?? []
                const isPersonal = e.is_personal

                return (
                  <div
                    key={e.id}
                    onClick={() => setModal(e)}
                    className="flex items-center gap-3 py-3.5 border-b border-[#D5D2CA] cursor-pointer hover:bg-white transition-colors group px-2 -mx-2"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] uppercase tracking-[0.8px] mb-0.5"
                         style={{ fontFamily: "'JetBrains Mono', monospace",
                                  color: catStyle.text, background: catStyle.bg,
                                  display: 'inline-block', padding: '1px 5px' }}>
                        {e.category}
                      </p>
                      <p className="text-[14px] font-medium text-[#0C0C0C] leading-tight"
                         style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {e.name}
                      </p>
                      {e.notes && (
                        <p className="text-[9.5px] text-[#777] mt-0.5"
                           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {e.notes}
                        </p>
                      )}
                      <p className="text-[9px] text-[#B8321A] mt-0.5"
                         style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Paid by {cap(e.paid_by)} ·{' '}
                        {isPersonal
                          ? 'Personal expense'
                          : `Split: ${split.map(cap).join(', ')}`}
                      </p>
                    </div>

                    {/* Date */}
                    <p className="text-[9px] text-[#BBBBBB] flex-shrink-0"
                       style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {e.date ?? ''}
                    </p>

                    {/* Amount */}
                    <p className="text-[18px] font-light text-[#0C0C0C] flex-shrink-0 min-w-[80px] text-right"
                       style={{ fontFamily: "'Fraunces', serif" }}>
                      {fmt(e.amount)}
                    </p>

                    {/* Expand hint */}
                    <span className="text-[#BBBBBB] text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      ⊕
                    </span>

                    {/* Delete */}
                    {isOwner && (
                      <button
                        onClick={ev => { ev.stopPropagation(); setDelId(e.id) }}
                        className="text-[#BBBBBB] hover:text-[#B8321A] transition-colors text-sm flex-shrink-0 opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right column: balances + settlement ── */}
          <div className="flex flex-col gap-6">

            {/* Per-person balances */}
            <div className="border border-[#D5D2CA] bg-white p-5">
              <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-4"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Balances
              </p>
              {PERSONS.map(({ key, name, accent }) => {
                const val = balances[key] ?? 0
                const ac  = ACCENT_COLORS[accent]
                const pos = val > 0.5
                const neg = val < -0.5
                return (
                  <div key={key} className="flex justify-between items-center py-2.5 border-b border-[#D5D2CA] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: ac.dot }} />
                      <span className="text-[13px] font-medium text-[#0C0C0C]"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {name}
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-semibold"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: pos ? '#2e7d32' : neg ? '#B8321A' : '#777',
                      }}
                    >
                      {val > 0 ? '+' : ''}{fmt(Math.round(val))}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Settlement */}
            <div className="border border-[#D5D2CA] bg-white p-5">
              <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-4"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Who Pays Whom
              </p>
              {settlements.length === 0 ? (
                <p className="text-[11px] text-[#777] text-center py-3"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  All settled ✓
                </p>
              ) : (
                settlements.map((s, i) => (
                  <div key={i} className="py-2.5 border-b border-[#D5D2CA] last:border-0">
                    <p className="text-[11px] text-[#0C0C0C]"
                       style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <span className="text-[#B8321A] font-medium">{cap(s.from)}</span>
                      {' pays '}
                      <span className="text-[#2e7d32] font-medium">{cap(s.to)}</span>
                    </p>
                    <p className="text-[20px] font-light text-[#0C0C0C] mt-0.5"
                       style={{ fontFamily: "'Fraunces', serif" }}>
                      {fmt(s.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Category breakdown */}
            <div className="border border-[#D5D2CA] bg-white p-5">
              <p className="text-[8px] uppercase tracking-[1px] text-[#777] mb-4"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                By Category
              </p>
              {CATEGORIES.map(cat => {
                const total = expenses.filter(e => e.category === cat)
                                      .reduce((s, e) => s + Number(e.amount), 0)
                if (!total) return null
                const pct = totalSpent ? Math.round((total / totalSpent) * 100) : 0
                const cs  = CAT_STYLE[cat]
                return (
                  <div key={cat} className="mb-3 last:mb-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] uppercase tracking-[0.5px]"
                            style={{ fontFamily: "'JetBrains Mono', monospace",
                                     color: cs.text }}>
                        {cat}
                      </span>
                      <span className="text-[9px] text-[#777]"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(total)}
                      </span>
                    </div>
                    <div className="h-[2px] bg-[#E5E2DA]">
                      <div className="h-full bg-[#0C0C0C]" style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {delId && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50"
             onClick={() => setDelId(null)}>
          <div className="bg-white border-[1.5px] border-[#0C0C0C] p-8 max-w-sm w-full mx-4"
               onClick={e => e.stopPropagation()}>
            <p className="text-[14px] text-[#0C0C0C] mb-6 leading-relaxed"
               style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Delete this expense? This can't be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDelId(null)}
                      className="text-[10px] uppercase tracking-[0.8px] border-[1.5px] border-[#D5D2CA] text-[#777] px-5 py-2 hover:border-[#0C0C0C] hover:text-[#0C0C0C] transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(delId)}
                      className="text-[10px] uppercase tracking-[0.8px] bg-[#B8321A] text-white px-5 py-2 hover:opacity-85 transition-opacity"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense detail modal */}
      <ExpenseModal expense={modal} onClose={() => setModal(null)} />
    </div>
  )
}

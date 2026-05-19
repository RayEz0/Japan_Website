import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { DAYS, toPlaceKey } from '../data/days'
import { LazyCarouselImage, OptimizedHeroImage } from '../components/OptimizedImage'

// ── Image focal-point map ─────────────────────────────────────────────────────
const POSITION_MAP = {
  'Sensoji Temple':          'center top',
  'Shibuya Crossing':        'center center',
  'Fushimi Inari Taisha':    'center top',
  'Lake Kawaguchi':          'center center',
  'Oishi Park':              'center bottom',
  'Dotonbori Canal':         'center center',
  'Gion Walk':               'center top',
  'Meiji Shrine':            'center top',
  'Osaka Castle Park':       'center top',
  'Arashiyama Bamboo Grove': 'center center',
}

// ── Carousel ─────────────────────────────────────────────────────────────────
function Carousel({ images, alt, objectPosition = 'center center' }) {
  const validImgs = images.filter(Boolean)
  const [cur, setCur] = useState(0)
  const timerRef = useRef(null)

  const goTo = useCallback((n) => {
    setCur((n + validImgs.length) % validImgs.length)
  }, [validImgs.length])

  useEffect(() => {
    if (validImgs.length <= 1) return
    timerRef.current = setInterval(() => goTo(c => (c + 1)), 3500)
    return () => clearInterval(timerRef.current)
  }, [validImgs.length, goTo])

  const restart = (fn) => {
    clearInterval(timerRef.current)
    fn()
    if (validImgs.length > 1) {
      timerRef.current = setInterval(() => goTo(c => (c + 1)), 3500)
    }
  }

  if (!validImgs.length) return (
    <div className="h-[200px] bg-[#EFEDE7] flex items-center justify-center">
      <span className="text-[#BBBBBB] text-sm">No image</span>
    </div>
  )

  return (
    <div className="relative h-[200px] overflow-hidden bg-[#EFEDE7] flex-shrink-0">
      <LazyCarouselImage src={validImgs[cur]} alt={alt} objectPosition={objectPosition} />

      {validImgs.length > 1 && (
        <>
          <button
            onClick={() => restart(() => goTo(cur - 1))}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-black/45 text-white hover:bg-black/70 transition-colors z-10 text-base"
            aria-label="Previous"
          >‹</button>
          <button
            onClick={() => restart(() => goTo(cur + 1))}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-black/45 text-white hover:bg-black/70 transition-colors z-10 text-base"
            aria-label="Next"
          >›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {validImgs.map((_, i) => (
              <button
                key={i}
                onClick={() => restart(() => setCur(i))}
                className="w-[5px] h-[5px] rounded-full transition-colors"
                style={{ background: i === cur ? '#fff' : 'rgba(255,255,255,0.4)' }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── PlaceCard ─────────────────────────────────────────────────────────────────
function PlaceCard({ dayNum, place, visitedMap, onToggleVisit, onSaveNote }) {
  const key = toPlaceKey(dayNum, place.n)
  const isVisited = visitedMap[key]?.visited ?? false
  const savedNote = visitedMap[key]?.notes ?? ''
  const [note, setNote] = useState(savedNote)
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(place.n + ' Japan')}`

  // Sync note if visitedMap changes from outside (initial load)
  useEffect(() => { setNote(visitedMap[key]?.notes ?? '') }, [visitedMap, key])

  function handleNoteBlur() {
    if (note !== savedNote) onSaveNote(key, note)
  }

  return (
    <div className="bg-white flex flex-col border-b border-r border-[#D5D2CA] last:border-r-0">
      <Carousel
        images={place.images ?? []}
        alt={place.n}
        objectPosition={POSITION_MAP[place.n] ?? 'center center'}
      />

      <div className="p-5 flex flex-col flex-1">
        {/* Name + visited badge */}
        <div className="flex items-start gap-2 mb-1">
          <h3 className="text-base font-bold text-[#0C0C0C] leading-tight flex-1"
              >
            {place.n}
            {isVisited && <span className="ml-1.5 text-sm">✅</span>}
          </h3>
        </div>

        {/* Time */}
        <p className="text-[10px] text-[#777] mb-2.5"
           >
          ⏰ {place.s}
        </p>

        {/* Description */}
        <p className="text-[15px] text-[#3A3A3A] leading-[1.75] mb-3"
           >
          {place.d}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-[#E5E2DA]">
          <button
            onClick={() => onToggleVisit(key, !isVisited)}
            className="text-[8.5px] uppercase tracking-[0.6px] px-2.5 py-1.5 border transition-all duration-150"
            style={{
              
              borderColor: isVisited ? '#4caf50' : '#D5D2CA',
              background:  isVisited ? '#e8f5e9' : 'transparent',
              color:       isVisited ? '#2e7d32' : '#777',
            }}
          >
            {isVisited ? '✅ Visited' : 'Mark Visited'}
          </button>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[8.5px] uppercase tracking-[0.6px] px-2.5 py-1.5 border border-[#D5D2CA] text-[#777] hover:border-[#0C0C0C] hover:text-[#0C0C0C] transition-all duration-150 flex items-center gap-1"
            
          >
            📍 Maps
          </a>
        </div>

        {/* Notes */}
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="Add a note…"
          rows={2}
          className="mt-3 w-full text-[10px] text-[#0C0C0C] bg-transparent border-0 border-b border-[#D5D2CA] outline-none resize-none placeholder-[#BBBBBB] focus:border-[#0C0C0C] transition-colors"
          
        />
      </div>
    </div>
  )
}

// ── OptionalRow ───────────────────────────────────────────────────────────────
function OptionalRow({ place }) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-2 border-l-2 border-[#D5D2CA] opacity-55">
      <span
        className="text-[7.5px] uppercase tracking-[1.5px] text-[#B8321A] bg-[#F5F4F0] border border-[#D5D2CA] px-1 py-px whitespace-nowrap flex-shrink-0 mt-0.5"
        
      >
        Optional
      </span>
      <div>
        <p className="text-[13px] font-medium text-[#3A3A3A]"
           >
          {place.n}
        </p>
        <p className="text-[9px] text-[#777] mt-0.5"
           >
          ⏰ {place.s}
        </p>
        {place.d && (
          <p className="text-[12px] text-[#777] mt-1 leading-relaxed"
             >
            {place.d.slice(0, 80)}…
          </p>
        )}
      </div>
    </div>
  )
}

// ── DayAccordion ──────────────────────────────────────────────────────────────
function DayAccordion({ day, dayIndex, visitedMap, onToggleVisit, onSaveNote }) {
  const [open, setOpen] = useState(dayIndex === 0)

  // Count visited non-optional places
  const totalPlaces   = day.places.filter(p => !p.optional).length
  const visitedPlaces = day.places.filter(p => !p.optional && visitedMap[toPlaceKey(day.num, p.n)]?.visited).length

  return (
    <div className="border-b border-[#D5D2CA]">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 lg:gap-4 px-4 py-3 lg:px-12 lg:py-[18px] text-left hover:bg-[#EFEDE7] transition-colors duration-150 select-none"
        style={{ borderBottom: open ? '1px solid #0C0C0C' : 'none' }}
      >
        <span
          className="type-num w-[38px] lg:w-[52px] flex-shrink-0 leading-none text-[2.5rem] lg:text-[3rem] text-[#0C0C0C] tabular-nums"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
        >
          {day.num}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[8px] uppercase tracking-[1.5px] text-[#B8321A] mb-0.5"
             >
            {day.city}
          </p>
          <p className="text-[18px] lg:text-[22px] font-semibold text-[#0C0C0C] leading-tight"
             >
            {day.title}
          </p>
          <p className="text-[9px] text-[#777] mt-1"
             >
            🚃 {day.transport}
          </p>
        </div>

        {/* Visited pill */}
        {visitedPlaces > 0 && (
          <span
            className="text-[8px] px-2 py-1 bg-[#e8f5e9] text-[#2e7d32] border border-[#4caf50] whitespace-nowrap"
            
          >
            {visitedPlaces}/{totalPlaces} visited
          </span>
        )}

        <span
          className="text-[#777] text-lg flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'none', }}
        >
          ›
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="border-b-2 border-[#0C0C0C]">
          {/* Place cards grid */}
          <div className="px-2 lg:px-12 pt-4 lg:pt-6 pb-2 lg:pb-4">
            <div className="grid gap-px bg-[#D5D2CA] border border-[#D5D2CA]"
                 style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))' }}>
              {day.places.map((place, pi) =>
                place.optional
                  ? null
                  : (
                    <PlaceCard
                      key={pi}
                      dayNum={day.num}
                      place={place}
                      visitedMap={visitedMap}
                      onToggleVisit={onToggleVisit}
                      onSaveNote={onSaveNote}
                    />
                  )
              )}
            </div>

            {/* Optional rows below cards */}
            {day.places.some(p => p.optional) && (
              <div className="mt-3 flex flex-col gap-1">
                {day.places.filter(p => p.optional).map((p, i) => (
                  <OptionalRow key={i} place={p} />
                ))}
              </div>
            )}
          </div>

          {/* Footer: food / stay / next */}
          <div className="mx-3 lg:mx-12 border-t border-[#D5D2CA] pt-4 pb-6 flex flex-col gap-3">
            {[
              { label: 'Food',  value: day.food },
              { label: 'Stay',  value: day.stay },
              ...(day.next ? [{ label: 'Next', value: day.next }] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[8.5px] uppercase tracking-[1px] text-[#B8321A] mb-1 font-medium"
                   >
                  {label}
                </p>
                <p className="text-[15px] text-[#3A3A3A] leading-[1.75]"
                   >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Itinerary() {
  const { user } = useAuth()
  const [visitedMap, setVisitedMap] = useState({})   // { place_key: { visited, notes } }
  const [loading, setLoading]       = useState(true)

  // Load all visited records for this user
  useEffect(() => {
    if (!user?.id) return
    async function load() {
      const { data } = await supabase
        .from('visited')
        .select('place_key, visited, notes')
        .eq('user_id', user.id)

      if (data) {
        const map = {}
        data.forEach(row => { map[row.place_key] = { visited: row.visited, notes: row.notes ?? '' } })
        setVisitedMap(map)
      }
      setLoading(false)
    }
    load()
  }, [user?.id])

  // Toggle visited — optimistic then upsert
  const handleToggleVisit = useCallback(async (placeKey, isVisited) => {
    setVisitedMap(prev => ({
      ...prev,
      [placeKey]: { ...prev[placeKey], visited: isVisited, notes: prev[placeKey]?.notes ?? '' },
    }))

    await supabase.from('visited').upsert(
      { user_id: user.id, place_key: placeKey, visited: isVisited },
      { onConflict: 'user_id,place_key' }
    )
  }, [user?.id])

  // Save notes — optimistic then upsert
  const handleSaveNote = useCallback(async (placeKey, notes) => {
    setVisitedMap(prev => ({
      ...prev,
      [placeKey]: { ...prev[placeKey], notes, visited: prev[placeKey]?.visited ?? false },
    }))

    await supabase.from('visited').upsert(
      { user_id: user.id, place_key: placeKey, notes },
      { onConflict: 'user_id,place_key' }
    )
  }, [user?.id])

  return (
    <div className="min-h-screen bg-[#F5F4F0]">

      {/* Hero */}
      <div className="relative h-[200px] lg:h-64 overflow-hidden flex items-end">
        <OptimizedHeroImage hero="itinerary" alt="" eager />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/70" />
        <div className="relative z-10 px-4 pb-5 lg:px-12 lg:pb-7 w-full">
          <p className="text-[9px] uppercase tracking-[1.8px] text-white/65 mb-1.5"
             >
            002 — ROUTE
          </p>
          <h1 className="text-[32px] lg:text-[42px] font-bold text-white leading-none"
              style={{  letterSpacing: '-1px' }}>
            Itinerary <em className="not-italic" style={{ color: 'rgba(255,200,150,0.95)' }}>2027</em>
          </h1>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <p className="text-[10px] uppercase tracking-widest text-[#777]"
             >
            Loading…
          </p>
        </div>
      )}

      {/* Day list */}
      {!loading && (
        <div>
          {DAYS.map((day, i) => (
            <DayAccordion
              key={day.num}
              day={day}
              dayIndex={i}
              visitedMap={visitedMap}
              onToggleVisit={handleToggleVisit}
              onSaveNote={handleSaveNote}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'

const HERO_ASSETS = {
  dashboard: '/images/heroes/dashboard',
  login: '/images/heroes/login',
  itinerary: '/images/heroes/itinerary',
  budget: '/images/heroes/budget',
  savings: '/images/heroes/savings',
  expenses: '/images/heroes/budget',
  stays: '/images/heroes/stays',
}

export const HERO_URLS = {
  dashboard: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=70&auto=format&fit=crop',
  login: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=1400&q=80&auto=format&fit=crop',
  itinerary: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1400&q=70&auto=format&fit=crop',
  budget: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=1400&q=70&auto=format&fit=crop',
  savings: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1400&q=70&auto=format&fit=crop',
  expenses: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=1400&q=70&auto=format&fit=crop',
  stays: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=70&auto=format&fit=crop',
  gifts: 'https://images.unsplash.com/photo-1513884923432-2b3e1d12348e?w=1400&q=70&auto=format&fit=crop',
}

function optimizedRemote(src, width, format, quality) {
  if (!src?.includes('images.unsplash.com')) return src
  const url = new URL(src)
  url.searchParams.set('w', String(width))
  url.searchParams.set('q', String(quality))
  url.searchParams.set('fm', format)
  url.searchParams.set('auto', 'format')
  url.searchParams.set('fit', 'crop')
  return url.toString()
}

function remoteSrcSet(src, format, widths = [480, 768, 1120]) {
  return widths.map(width => `${optimizedRemote(src, width, format, format === 'avif' ? 45 : 55)} ${width}w`).join(', ')
}

function pinimgVariant(src, width) {
  if (!src?.includes('i.pinimg.com')) return src
  return src.replace(/\/(236x|474x|736x|1200x|originals)\//, `/${width <= 480 ? '474x' : '736x'}/`)
}

function genericSrcSet(src) {
  if (src?.includes('images.unsplash.com')) {
    return remoteSrcSet(src, 'webp', [360, 520, 736])
  }
  if (src?.includes('i.pinimg.com')) {
    return `${pinimgVariant(src, 480)} 480w, ${pinimgVariant(src, 736)} 736w`
  }
  return undefined
}

export function useInViewOnce(rootMargin = '200px') {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (inView) return
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.disconnect()
      }
    }, { rootMargin })
    observer.observe(node)
    return () => observer.disconnect()
  }, [inView, rootMargin])

  return [ref, inView]
}

export function OptimizedHeroImage({ hero, alt, eager = false, className = '' }) {
  const [loaded, setLoaded] = useState(false)
  const localBase = HERO_ASSETS[hero]
  const remote = HERO_URLS[hero]
  const loading = eager ? 'eager' : 'lazy'
  const fetchPriority = eager ? 'high' : 'auto'

  return (
    <picture className={`absolute inset-0 block overflow-hidden bg-[#2A2A28] ${className}`}>
      {localBase ? (
        <>
          <source type="image/avif" srcSet={`${localBase}-768.avif 768w, ${localBase}-1280.avif 1280w`} sizes="100vw" />
          <source type="image/webp" srcSet={`${localBase}-768.webp 768w, ${localBase}-1280.webp 1280w`} sizes="100vw" />
        </>
      ) : (
        <>
          <source type="image/avif" srcSet={remoteSrcSet(remote, 'avif', [480, 768, 1120])} sizes="100vw" />
          <source type="image/webp" srcSet={remoteSrcSet(remote, 'webp', [480, 768, 1120])} sizes="100vw" />
        </>
      )}
      <img
        src={localBase ? `${localBase}-1280.webp` : optimizedRemote(remote, 1120, 'webp', 55)}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        sizes="100vw"
        onLoad={() => setLoaded(true)}
      />
    </picture>
  )
}

export function LazyCarouselImage({ src, alt, objectPosition = 'center center' }) {
  const [loaded, setLoaded] = useState(false)
  const [wrapRef, inView] = useInViewOnce('260px')
  const sourceSet = useMemo(() => genericSrcSet(src), [src])

  return (
    <div ref={wrapRef} className="absolute inset-0 bg-[#EFEDE7]">
      {inView && (
        <img
          src={src?.includes('images.unsplash.com') ? optimizedRemote(src, 736, 'webp', 58) : pinimgVariant(src, 736)}
          srcSet={sourceSet}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 44vw, 320px"
          alt={alt}
          className={`w-full h-full object-cover block transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectPosition }}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  )
}

import { StrictMode, lazy, Suspense, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then(module => ({ default: module.SpeedInsights }))
)

function DeferredSpeedInsights() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const schedule = window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 1500))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const id = schedule(() => setEnabled(true))
    return () => cancel(id)
  }, [])

  if (!enabled) return null
  return (
    <Suspense fallback={null}>
      <SpeedInsights />
    </Suspense>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <DeferredSpeedInsights />
  </StrictMode>,
)

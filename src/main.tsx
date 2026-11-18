import React, { Suspense, lazy, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import logoWolmar from './assets/branding/logo-wolmar-small.png'

// Code-split so each route only pays for what it needs: the leaderboard is a
// plain scoreboard with no map dependency, so it shouldn't have to download
// and parse the entire map bundle (MapLibre alone is >500kB) just to render,
// and the map shouldn't have to wait on leaderboard code it'll never use.
const App = lazy(() => import('./App'))
const LeaderboardPage = lazy(() => import('./LeaderboardPage'))
const MerchPage = lazy(() => import('./MerchPage'))
const FieldReportPage = lazy(() => import('./FieldReportPage'))

// Shown while the chosen page's own chunk downloads — previously a blank
// dark rectangle. Styled in index.css (not App.css, which is itself part
// of the lazy App chunk and wouldn't be loaded yet at this point).
const fallback = (
  <div className="splash-screen">
    <img src={logoWolmar} alt="" className="splash-logo" />
  </div>
)

function Root() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <Suspense fallback={fallback}>
      {hash === '#/leaderboard' ? (
        <LeaderboardPage />
      ) : hash === '#/merch' ? (
        <MerchPage />
      ) : hash === '#/signaler' ? (
        <FieldReportPage />
      ) : (
        <App />
      )}
    </Suspense>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)

// Registered after the initial render so it never competes with the first
// paint for bandwidth/CPU. See public/sw.js for exactly what it does (just
// an offline shell fallback) and, as importantly, what it deliberately
// doesn't touch (Firestore, MapTiler, the hashed JS/CSS bundles).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}

import { useEffect, useState } from 'react'

/** Re-renders the calling component on an interval so a relative-time string ("il y a 3 min") stays fresh without needing new data. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

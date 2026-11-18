import { useEffect, useRef, useState } from 'react'

/**
 * Tracks which ids in a live-updating list are "new since last snapshot" —
 * for a brief pulse animation on freshly-arrived pins, not on every re-render
 * of pins that were already there. The very first snapshot (initial load)
 * never counts as "new" — only ids that show up in a later update do.
 */
export function useNewItemIds(ids: string[], pulseDurationMs = 1600): Set<string> {
  const seenRef = useRef<Set<string> | null>(null)
  const [pulsing, setPulsing] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const current = new Set(ids)
    const seen = seenRef.current
    seenRef.current = current

    if (seen === null) return // first snapshot: nothing to pulse yet

    const freshlyAdded = ids.filter((id) => !seen.has(id))
    if (freshlyAdded.length === 0) return

    setPulsing((prev) => {
      const next = new Set(prev)
      freshlyAdded.forEach((id) => next.add(id))
      return next
    })

    const timer = setTimeout(() => {
      setPulsing((prev) => {
        const next = new Set(prev)
        freshlyAdded.forEach((id) => next.delete(id))
        return next
      })
    }, pulseDurationMs)

    return () => clearTimeout(timer)
  }, [ids.join(',')])

  return pulsing
}

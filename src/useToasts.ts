import { useCallback, useRef, useState } from 'react'

export interface Toast {
  id: number
  message: string
  variant: 'success' | 'error'
}

const TOAST_DURATION_MS = 3500

/** A small fire-and-forget toast queue — one instance lives in App.tsx, rendered by ToastStack. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (message: string, variant: Toast['variant'] = 'success') => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => dismissToast(id), TOAST_DURATION_MS)
    },
    [dismissToast],
  )

  return { toasts, pushToast, dismissToast }
}

import { CheckIcon, CrossIcon } from './MapActionIcons'
import type { Toast } from './useToasts'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export default function ToastStack({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`toast toast-${toast.variant}`}
          onClick={() => onDismiss(toast.id)}
        >
          {toast.variant === 'success' ? <CheckIcon /> : <CrossIcon />}
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  )
}

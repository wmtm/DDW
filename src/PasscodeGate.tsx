import { useState, type FormEvent, type ReactNode } from 'react'
import { PASSCODE, isUnlocked, setUnlocked } from './passcode'

interface Props {
  label: string
  children: ReactNode
  onUnlock?: () => void
  /** Override to gate on a different passcode (e.g. the admin one) instead of the site-wide default. */
  passcode?: string
  checkUnlocked?: () => boolean
  persistUnlocked?: () => void
}

export default function PasscodeGate({
  label,
  children,
  onUnlock,
  passcode = PASSCODE,
  checkUnlocked = isUnlocked,
  persistUnlocked = setUnlocked,
}: Props) {
  const [unlocked, setUnlockedLocal] = useState(checkUnlocked())
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return <>{children}</>

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (code === passcode) {
      persistUnlocked()
      setUnlockedLocal(true)
      setError(false)
      onUnlock?.()
    } else {
      setError(true)
      setCode('')
    }
  }

  return (
    <form className="passcode-gate" onSubmit={submit}>
      <span className="hint">{label}</span>
      <div className="button-row">
        <input
          type="password"
          inputMode="numeric"
          className="search-input passcode-input"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(false)
          }}
          placeholder="Code"
        />
        <button type="submit" className="action-button">
          Déverrouiller
        </button>
      </div>
      {error && <span className="hint passcode-error">Code incorrect</span>}
    </form>
  )
}

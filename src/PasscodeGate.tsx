import { useState, type FormEvent, type ReactNode } from 'react'
import { PASSCODE, isUnlocked, setUnlocked } from './passcode'

interface Props {
  label: string
  children: ReactNode
  onUnlock?: () => void
}

export default function PasscodeGate({ label, children, onUnlock }: Props) {
  const [unlocked, setUnlockedLocal] = useState(isUnlocked())
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return <>{children}</>

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (code === PASSCODE) {
      setUnlocked()
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
          Unlock
        </button>
      </div>
      {error && <span className="hint passcode-error">Incorrect code</span>}
    </form>
  )
}

import { useEffect, useState } from 'react'

const ONBOARDING_STORAGE_KEY = 'ddw-onboarding-seen'

export default function OnboardingCard() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
    } catch {
      // ignore (private browsing / storage disabled)
    }
  }

  if (!visible) return null

  return (
    <div className="onboarding-card">
      <h3>Bienvenue à la Chassée de Wolmar</h3>
      <ul>
        <li>Cliquez et glissez pour incliner et faire pivoter la vue</li>
        <li>Choisissez un fond de carte — satellite, carte, hybride ou terrain</li>
        <li>Mesurez des distances et des surfaces avec l'outil de mesure</li>
        <li>Visitez les chutes grâce à une visite guidée</li>
      </ul>
      <button className="action-button onboarding-dismiss" onClick={dismiss}>
        Compris
      </button>
    </div>
  )
}

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
      <h3>Welcome to Chassée de Wolmar</h3>
      <ul>
        <li>Click and drag to tilt and rotate the view</li>
        <li>Pick a basemap — satellite, map, hybrid, or terrain</li>
        <li>Measure distances and areas with the measure tool</li>
        <li>Visit the chutes with a guided tour</li>
      </ul>
      <button className="action-button onboarding-dismiss" onClick={dismiss}>
        Got it
      </button>
    </div>
  )
}

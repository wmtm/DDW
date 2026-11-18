import { useEffect, useState } from 'react'
import wolmarEntrance from './assets/branding/wolmar-entrance.jpg'

const ONBOARDING_STORAGE_KEY = 'ddw-onboarding-seen'

const STEPS = [
  {
    title: 'Signalez ce que vous voyez',
    body: "Le bouton + en bas à droite de la carte permet de déposer un repère : un animal blessé, ou tout point inhabituel sur le domaine.",
  },
  {
    title: 'Lisez les cônes de vent',
    body: "Une fois les chutes affichées, un cône indique le sens où porte le vent actuel au niveau de chacune — utile pour savoir où votre odeur part.",
  },
  {
    title: 'Explorez en 3D',
    body: "Le bouton cube isole le domaine dans une vue plateforme 3D, pour voir le relief du terrain sous un autre angle.",
  },
]

export default function OnboardingCard() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

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

  const isLastStep = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="onboarding-card">
      <div
        className="onboarding-card-banner"
        style={{ backgroundImage: `url(${wolmarEntrance})` }}
        role="img"
        aria-label="Panneau d'entrée du Domaine de Wolmar"
      />
      <div className="onboarding-card-body">
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? 'onboarding-dot-active' : ''}`} />
          ))}
        </div>
        <div key={step} className="onboarding-step">
          <h3>{current.title}</h3>
          <p className="onboarding-step-body">{current.body}</p>
        </div>
        <div className="onboarding-card-actions">
          <button type="button" className="onboarding-skip" onClick={dismiss}>
            Passer
          </button>
          <button
            type="button"
            className="action-button onboarding-dismiss"
            onClick={isLastStep ? dismiss : () => setStep((s) => s + 1)}
          >
            {isLastStep ? "C'est parti" : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  )
}

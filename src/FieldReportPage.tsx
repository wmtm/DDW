import { useState } from 'react'
import PasscodeGate from './PasscodeGate'
import { isFirebaseConfigured } from './firebase'
import { reportWoundedDeer, WOUNDED_DEER_VISIBLE_HOURS } from './fieldReports'
import './App.css'
import './Leaderboard.css'
import './FieldReport.css'

type Status = 'idle' | 'locating' | 'sending' | 'sent' | 'error'

/**
 * Mobile field page a hunter opens on their own phone, mid-hunt, to pin
 * roughly where they just wounded a deer — one tap, one GPS read, no
 * account needed. The pin shows up live on the main map (see App.tsx) for
 * WOUNDED_DEER_VISIBLE_HOURS so a recovery team can be sent, then it's
 * gone on its own.
 */
export default function FieldReportPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [note, setNote] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleReport() {
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMessage("La géolocalisation n'est pas disponible sur cet appareil.")
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus('sending')
        try {
          await reportWoundedDeer(position.coords.latitude, position.coords.longitude, note)
          setStatus('sent')
        } catch {
          setStatus('error')
          setErrorMessage("Échec de l'envoi — vérifiez votre connexion et réessayez.")
        }
      },
      (geoError) => {
        setStatus('error')
        setErrorMessage(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Localisation refusée — autorisez la géolocalisation pour ce site et réessayez.'
            : "Impossible d'obtenir votre position — réessayez.",
        )
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-card">
        <a className="leaderboard-back" href="#/">
          ← Retour à la carte
        </a>

        <div className="leaderboard-hero">
          <span className="leaderboard-badge">Saison de chasse</span>
          <h1>Signaler une biche touchée</h1>
          <h2>Visible sur la carte pendant {WOUNDED_DEER_VISIBLE_HOURS}h</h2>
        </div>

        <PasscodeGate label="Cette page est réservée aux chasseurs. Entrez le code pour continuer.">
          {!isFirebaseConfigured ? (
            <p className="field-report-note">Cette fonctionnalité n'est pas encore activée sur le site.</p>
          ) : status === 'sent' ? (
            <div className="field-report-sent">
              <p>Signalement envoyé — visible sur la carte pour l'équipe.</p>
              <button
                type="button"
                className="action-button"
                onClick={() => {
                  setStatus('idle')
                  setNote('')
                }}
              >
                Signaler un autre emplacement
              </button>
            </div>
          ) : (
            <div className="field-report-form">
              <p className="field-report-note">
                Appuyez sur le bouton à l'endroit où vous vous trouvez, au moment où vous touchez la biche. Votre
                position actuelle sera envoyée.
              </p>
              <textarea
                className="field-report-note-input"
                placeholder="Note optionnelle (ex : zone broussailleuse près du grand chêne)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={280}
                rows={3}
              />
              <button
                type="button"
                className="field-report-button"
                onClick={handleReport}
                disabled={status === 'locating' || status === 'sending'}
              >
                {status === 'locating'
                  ? 'Localisation en cours…'
                  : status === 'sending'
                    ? 'Envoi…'
                    : '📍 Biche touchée ici'}
              </button>
              {status === 'error' && <p className="field-report-error">{errorMessage}</p>}
            </div>
          )}
        </PasscodeGate>
      </div>
    </div>
  )
}

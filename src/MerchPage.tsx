import { useState } from 'react'
import './App.css'
import './Leaderboard.css'
import './Merch.css'

/**
 * Beta preview of the branded merchandise sold in person at La Boutique
 * (see the "Services" tab's shop-hours note), now with a lightweight order
 * form: visitors pick an item and submit their details, which land in the
 * client's Formspree dashboard (and inbox) — no backend of our own. Payment
 * itself isn't processed on the site: the form just displays MCB Juice /
 * bank transfer instructions and collects a reference, and the client
 * confirms payment and places the print order with whichever local
 * Mauritian supplier they choose, tracked from that same dashboard. Items
 * are still placeholders (no real photos/names/prices yet) until the
 * client provides the actual lineup.
 */

interface PlaceholderItem {
  id: string
  name: string
  icon: 'tshirt' | 'cap' | 'mug' | 'polo'
}

const PLACEHOLDER_ITEMS: PlaceholderItem[] = [
  { id: 'tshirt', name: 'T-shirt brodé', icon: 'tshirt' },
  { id: 'polo', name: 'Polo du domaine', icon: 'polo' },
  { id: 'cap', name: 'Casquette', icon: 'cap' },
  { id: 'mug', name: 'Mug en grès', icon: 'mug' },
]

// The client's Formspree form endpoint (https://formspree.io/f/xxxxxxxx,
// from their dashboard after creating a form — no code on their end).
// Empty until that's set up, in which case the form explains orders
// aren't open yet instead of silently failing.
const ORDER_FORM_ENDPOINT = ''

const JUICE_PHONE = '5812 3094'

type OrderStatus = 'idle' | 'submitting' | 'sent' | 'error'

function ItemIcon({ icon }: { icon: PlaceholderItem['icon'] }) {
  const common = {
    viewBox: '0 0 64 64',
    width: 36,
    height: 36,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (icon) {
    case 'tshirt':
      return (
        <svg {...common}>
          <path d="M22 10 L32 15 L42 10 L52 18 L46 26 L42 23 L42 54 L22 54 L22 23 L18 26 L12 18 Z" />
        </svg>
      )
    case 'polo':
      return (
        <svg {...common}>
          <path d="M22 10 L32 15 L42 10 L50 17 L45 25 L42 22 L42 30 L38 34 L38 54 L26 54 L26 34 L22 30 L22 22 L19 25 L14 17 Z" />
        </svg>
      )
    case 'cap':
      return (
        <svg {...common}>
          <path d="M12 38 C12 24 20 16 32 16 C44 16 52 24 52 38 Z" />
          <path d="M12 38 C8 38 6 40 6 42 C6 44 10 45 16 44" />
          <circle cx="32" cy="22" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'mug':
      return (
        <svg {...common}>
          <rect x="14" y="18" width="28" height="30" rx="3" />
          <path d="M42 24 C50 24 50 40 42 40" />
          <path d="M20 18 C20 12 36 12 36 18" />
        </svg>
      )
    default:
      return null
  }
}

interface OrderFormProps {
  item: PlaceholderItem
  onClose: () => void
}

function OrderForm({ item, onClose }: OrderFormProps) {
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [delivery, setDelivery] = useState<'pickup' | 'tbd'>('pickup')
  const [paymentMethod, setPaymentMethod] = useState<'juice' | 'bank'>('juice')
  const [paymentReference, setPaymentReference] = useState('')
  const [status, setStatus] = useState<OrderStatus>('idle')

  const canSubmit = name.trim() !== '' && contact.trim() !== '' && status !== 'submitting'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    if (!ORDER_FORM_ENDPOINT) {
      setStatus('error')
      return
    }
    setStatus('submitting')
    try {
      const res = await fetch(ORDER_FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          item: item.name,
          quantity,
          notes,
          name,
          contact,
          delivery: delivery === 'pickup' ? 'Retrait sur place' : 'À convenir',
          paymentMethod: paymentMethod === 'juice' ? 'MCB Juice' : 'Virement bancaire',
          paymentReference,
        }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="merch-order-form">
        <p className="merch-order-success">
          Merci ! Votre demande pour « {item.name} » a bien été envoyée. Nous vous recontactons pour
          confirmer avant de lancer la commande.
        </p>
        <button type="button" className="action-button" onClick={onClose}>
          Fermer
        </button>
      </div>
    )
  }

  return (
    <form className="merch-order-form" onSubmit={handleSubmit}>
      <p className="merch-order-item-label">{item.name}</p>

      <label className="merch-field">
        <span>Quantité</span>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>

      <label className="merch-field">
        <span>Taille / précisions</span>
        <input
          type="text"
          placeholder="ex. Taille M, couleur…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <label className="merch-field">
        <span>Nom</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label className="merch-field">
        <span>Téléphone ou email</span>
        <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} required />
      </label>

      <label className="merch-field">
        <span>Livraison</span>
        <select value={delivery} onChange={(e) => setDelivery(e.target.value as 'pickup' | 'tbd')}>
          <option value="pickup">Retrait sur place</option>
          <option value="tbd">À convenir</option>
        </select>
      </label>

      <div className="merch-payment-box">
        <p className="merch-field-title">Paiement</p>
        <label className="merch-radio">
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'juice'}
            onChange={() => setPaymentMethod('juice')}
          />
          <span>
            MCB Juice — envoyez le montant au <strong>{JUICE_PHONE}</strong>
          </span>
        </label>
        <label className="merch-radio">
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'bank'}
            onChange={() => setPaymentMethod('bank')}
          />
          <span>Virement bancaire — coordonnées communiquées après votre demande</span>
        </label>
        <label className="merch-field">
          <span>Référence de paiement (optionnel)</span>
          <input
            type="text"
            placeholder="ex. numéro de transaction Juice"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
          />
        </label>
        <p className="merch-payment-note">
          Le paiement n'est pas traité sur le site : envoyez-le via Juice ou virement, puis
          soumettez votre demande ci-dessous. Nous confirmons avant de lancer la commande.
        </p>
      </div>

      {status === 'error' && (
        <p className="merch-order-error">
          {ORDER_FORM_ENDPOINT
            ? "Une erreur est survenue, merci de réessayer ou de nous contacter directement."
            : "Les commandes en ligne ne sont pas encore ouvertes — merci de passer à La Boutique."}
        </p>
      )}

      <div className="merch-order-actions">
        <button type="button" className="action-button" onClick={onClose}>
          Annuler
        </button>
        <button type="submit" className="action-button merch-order-submit" disabled={!canSubmit}>
          {status === 'submitting' ? 'Envoi…' : 'Envoyer la demande'}
        </button>
      </div>
    </form>
  )
}

export default function MerchPage() {
  const [orderingItem, setOrderingItem] = useState<PlaceholderItem | null>(null)

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-card">
        <a className="leaderboard-back" href="#/">
          ← Retour à la carte
        </a>

        <div className="leaderboard-hero">
          <span className="leaderboard-badge merch-badge-beta">Aperçu — bêta</span>
          <h1>Chasse de Wolmar</h1>
          <h2>Produits dérivés</h2>
        </div>

        <p className="merch-intro">
          Un aperçu de ce que vous retrouverez à La Boutique. Les visuels et noms ci-dessous sont
          provisoires — le catalogue définitif (photos, tailles, prix) arrive bientôt. Vous pouvez
          déjà faire une demande de commande ci-dessous ; elle n'est pas définitive tant que le
          paiement n'est pas confirmé.
        </p>

        <div className="merch-grid">
          {PLACEHOLDER_ITEMS.map((item) => (
            <div key={item.id} className="merch-card">
              <div className="merch-card-icon">
                <ItemIcon icon={item.icon} />
              </div>
              <span className="merch-card-name">{item.name}</span>
              {orderingItem?.id === item.id ? (
                <span className="merch-card-status">Formulaire ouvert ci-dessous</span>
              ) : (
                <button
                  type="button"
                  className="action-button merch-card-order-button"
                  onClick={() => setOrderingItem(item)}
                >
                  Commander
                </button>
              )}
            </div>
          ))}
        </div>

        {orderingItem && <OrderForm item={orderingItem} onClose={() => setOrderingItem(null)} />}

        <div className="merch-boutique-note">
          <strong>La Boutique</strong>
          <span>Lun-Ven : 9h–15h · Sam : 9h–11h</span>
        </div>
      </div>
    </div>
  )
}

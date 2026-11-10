import { useState } from 'react'

/**
 * The order-request form — unchanged in behavior from the original beta
 * merch page: no checkout, no payment processed on the site. Submissions
 * POST straight to the client's Formspree endpoint; she confirms payment
 * (MCB Juice or bank transfer) and places the print order herself with
 * whichever local Mauritian supplier fits that item. Lifted out of
 * MerchPage.tsx unchanged apart from taking a pre-filled item label
 * (product + colour) and initial notes (size) from the product detail
 * panel instead of a flat placeholder item.
 */

const ORDER_FORM_ENDPOINT = 'https://formspree.io/f/xjyynreq'

const JUICE_PHONE = '5812 3094'

type OrderStatus = 'idle' | 'submitting' | 'sent' | 'error'

interface OrderFormProps {
  itemLabel: string
  initialNotes?: string
  onClose: () => void
}

export default function OrderForm({ itemLabel, initialNotes, onClose }: OrderFormProps) {
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState(initialNotes ?? '')
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
          item: itemLabel,
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
          Merci ! Votre demande pour « {itemLabel} » a bien été envoyée. Nous vous recontactons pour
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
      <p className="merch-order-item-label">{itemLabel}</p>

      <label className="merch-field">
        <span>Quantité</span>
        <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
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

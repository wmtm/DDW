import './App.css'
import './Leaderboard.css'
import './Merch.css'

/**
 * Beta preview of the branded merchandise sold in person at La Boutique
 * (see the "Services" tab's shop-hours note) — a browse-only catalog, not
 * a storefront: no prices, no checkout, just enough to let visitors know
 * what's there before they stop by. Items are placeholders (no real
 * photos/names/prices yet) until the client provides the actual lineup.
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

export default function MerchPage() {
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
          Un aperçu de ce que vous retrouverez à La Boutique, sur place. Les visuels et noms
          ci-dessous sont provisoires — le catalogue définitif (photos, tailles, prix) arrive
          bientôt. Rien ne s'achète en ligne ici : les articles sont disponibles uniquement
          sur place, aux horaires habituels.
        </p>

        <div className="merch-grid">
          {PLACEHOLDER_ITEMS.map((item) => (
            <div key={item.id} className="merch-card">
              <div className="merch-card-icon">
                <ItemIcon icon={item.icon} />
              </div>
              <span className="merch-card-name">{item.name}</span>
              <span className="merch-card-status">Bientôt disponible</span>
            </div>
          ))}
        </div>

        <div className="merch-boutique-note">
          <strong>La Boutique</strong>
          <span>Lun-Ven : 9h–15h · Sam : 9h–11h</span>
        </div>
      </div>
    </div>
  )
}

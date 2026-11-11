import { useRef, useState } from 'react'
import './App.css'
import './Leaderboard.css'
import './Merch.css'
import HeroBanner from './merch/HeroBanner'
import CategoryNav from './merch/CategoryNav'
import ProductCard from './merch/ProductCard'
import ProductDetailPanel from './merch/ProductDetailPanel'
import { productsByCategory } from './merch/products'
import { CATEGORY_LABELS, type Category, type Product } from './merch/types'

/**
 * La Boutique — the full catalogue redesign (hero, category sections,
 * product grid, detail panel with colour/size swatches). The order model
 * underneath (src/merch/OrderForm.tsx) is unchanged from the original
 * beta merch page: no cart, no payment on the site, submissions go to the
 * client's Formspree dashboard, she confirms MCB Juice/bank-transfer
 * payment and places the print order herself.
 *
 * Every product's "photo" is composited in the browser from the client's
 * own logo artwork (src/assets/merch) onto an illustrated base render
 * (src/merch/bases) — see src/merch/README.md for why illustrated bases
 * were used instead of real photography, and how to swap in real photos
 * per product later without touching the compositing logic.
 */

const CATEGORIES: Category[] = ['chasse', 'vetements', 'accessoires', 'enfants', 'animaux']

const CATEGORY_ICON: Record<Category, string | null> = {
  chasse: '🦌',
  vetements: null,
  accessoires: null,
  enfants: '✦',
  animaux: '🐾',
}

export default function MerchPage() {
  const [openProduct, setOpenProduct] = useState<Product | null>(null)
  const sectionRefs = useRef<Partial<Record<Category, HTMLElement | null>>>({})

  function scrollToCategory(category: Category) {
    sectionRefs.current[category]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="leaderboard-page boutique-page">
      <div className="boutique-shell">
        <a className="leaderboard-back" href="#/">
          ← Retour à la carte
        </a>

        <HeroBanner />
        <CategoryNav onSelect={scrollToCategory} />

        {CATEGORIES.map((category) => (
          <section
            key={category}
            ref={(el) => {
              sectionRefs.current[category] = el
            }}
            className={`boutique-category-section boutique-category-section-${category}`}
          >
            <h2 className="boutique-category-heading">
              {CATEGORY_ICON[category] && <span className="boutique-category-icon">{CATEGORY_ICON[category]}</span>}
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="boutique-grid">
              {productsByCategory(category).map((product) => (
                <ProductCard key={product.id} product={product} onOpen={setOpenProduct} />
              ))}
            </div>
          </section>
        ))}

        <div className="merch-boutique-note">
          <strong>La Boutique</strong>
          <span>Lun-Ven : 9h–15h · Sam : 9h–11h</span>
        </div>
      </div>

      {openProduct && <ProductDetailPanel product={openProduct} onClose={() => setOpenProduct(null)} />}
    </div>
  )
}

import { Photo } from './Photo'
import { availableColorIds, imagesFor } from './images'
import { featuredProducts } from './products'

export default function HeroBanner() {
  const featured = featuredProducts()
  return (
    <section className="boutique-hero">
      <div className="boutique-hero-text">
        <span className="leaderboard-badge merch-badge-beta">Aperçu — bêta</span>
        <h1>La Boutique</h1>
        <p>
          Les pièces brodées et gravées du Domaine de Wolmar — à retrouver sur place, ou à réserver
          dès maintenant depuis cette page.
        </p>
      </div>
      <div className="boutique-hero-mockups">
        {featured.map((p) => {
          const availableIds = new Set(availableColorIds(p.id))
          const defaultColorId = p.colors.find((c) => availableIds.has(c.id))?.id ?? p.colors[0].id
          const images = imagesFor(p.id, defaultColorId)
          return (
            <div key={p.id} className="boutique-hero-mockup">
              <Photo image={images[0] ?? null} size="thumb" alt={p.name} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

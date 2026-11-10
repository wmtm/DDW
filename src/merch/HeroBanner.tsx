import MockupCanvas from './MockupCanvas'
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
        {featured.map((p) => (
          <div key={p.id} className="boutique-hero-mockup">
            <MockupCanvas product={p} colorId={p.colors[0].id} />
          </div>
        ))}
      </div>
    </section>
  )
}

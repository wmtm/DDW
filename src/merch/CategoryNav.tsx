import { CATEGORY_LABELS, type Category } from './types'

const CATEGORIES: Category[] = ['vetements', 'accessoires', 'enfants', 'animaux']

/**
 * Scrolls to each category section rather than using real `#anchor` links:
 * the site's top-level routing (src/main.tsx) switches pages purely off
 * `window.location.hash`, so an `href="#vetements"` would change the hash
 * and bounce the visitor off the merch page entirely.
 */
export default function CategoryNav({ onSelect }: { onSelect: (category: Category) => void }) {
  return (
    <nav className="boutique-category-nav">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          className={`boutique-category-link boutique-category-link-${cat}`}
          onClick={() => onSelect(cat)}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </nav>
  )
}

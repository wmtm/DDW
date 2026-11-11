import type { Product } from './types'

/**
 * The whole catalogue in one place — names, descriptions, colours, sizes,
 * which base silhouette and logo placement each product uses. Swapping in
 * real prices, real photography or a different logo zone later only
 * touches this file; nothing in bases/ or mockup.ts needs to change.
 *
 * Every price is a placeholder until the client provides real ones.
 */
const PRIX_SUR_DEMANDE = 'Prix sur demande'
export { PRIX_SUR_DEMANDE }

const ADULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const KIDS_SIZES = ['4-6 ans', '8-10 ans', '12-14 ans']

export const PRODUCTS: Product[] = [
  // ---- Saison de chasse ----
  {
    id: 'tshirt-chasse',
    category: 'chasse',
    name: 'T-shirt Camouflage Wolmar',
    description: 'Coton épais, motif camouflage forestier — la pièce de la saison de chasse.',
    base: 'tshirt',
    colors: [{ id: 'camouflage', label: 'Camouflage', hex: '#7a6b52' }],
    sizes: ADULT_SIZES,
    logoZone: { logo: 'pocket', finish: 'fabric', xPct: 560, yPct: 505, widthPct: 88 },
  },
  {
    id: 'casquette',
    category: 'chasse',
    name: 'Casquette Wolmar',
    description: 'Casquette ajustable, broderie sur la façade avant.',
    base: 'cap',
    colors: [
      { id: 'orange', label: 'Orange fluo', hex: '#ff6a1a' },
      { id: 'noir', label: 'Noir', hex: '#1c1b19' },
      { id: 'kaki', label: 'Kaki', hex: '#54502f' },
      { id: 'sable', label: 'Sable', hex: '#cdbfa0' },
      { id: 'vert', label: 'Vert', hex: '#3a6b3f' },
    ],
    sizes: ['Réglable'],
    logoZone: { logo: 'crest', finish: 'curved', xPct: 500, yPct: 335, widthPct: 170, curve: 0.4 },
    featured: true,
  },
  {
    id: 'carnet-chasse',
    category: 'chasse',
    name: 'Carnet de chasse Wolmar',
    description: 'Carnet de chasse en cuir pleine fleur, gaufré du blason Wolmar — pages météo, vent, lune et observations.',
    base: 'notebook',
    colors: [
      { id: 'beige', label: 'Beige', hex: '#a9754a' },
      { id: 'brun', label: 'Brun', hex: '#4a3626' },
    ],
    sizes: ['Unique'],
    logoZone: { logo: 'pocket', finish: 'engraved', xPct: 500, yPct: 400, widthPct: 42 },
  },

  // ---- Vêtements ----
  {
    id: 'tshirt',
    category: 'vetements',
    name: 'T-shirt Wolmar',
    description: "Coton épais, coupe unisexe. Petit blason sur le cœur, grand visuel dans le dos.",
    base: 'tshirt',
    colors: [
      { id: 'noir', label: 'Noir', hex: '#1c1b19' },
      { id: 'kaki', label: 'Kaki', hex: '#54502f' },
      { id: 'blanc', label: 'Blanc', hex: '#f3ede0' },
    ],
    sizes: ADULT_SIZES,
    logoZone: { logo: 'pocket', finish: 'fabric', xPct: 560, yPct: 505, widthPct: 88 },
    featured: true,
  },
  {
    id: 'polo',
    category: 'vetements',
    name: 'Polo Wolmar',
    description: "Polo piqué résistant, logo brodé sur la poitrine — tenue de terrain élégante.",
    base: 'polo',
    colors: [
      { id: 'noir', label: 'Noir', hex: '#1c1b19' },
      { id: 'blanc', label: 'Blanc', hex: '#f3ede0' },
      { id: 'gris', label: 'Gris', hex: '#9a9a9a' },
    ],
    sizes: ADULT_SIZES,
    logoZone: { logo: 'pocket', finish: 'fabric', xPct: 560, yPct: 510, widthPct: 80 },
  },
  {
    id: 'tablier',
    category: 'vetements',
    name: 'Tablier Wolmar',
    description: 'Tablier en toile robuste, idéal plancha et cuisine de brousse. Logo sur le cœur.',
    base: 'apron',
    colors: [
      { id: 'kaki', label: 'Kaki', hex: '#54502f' },
      { id: 'noir', label: 'Noir', hex: '#1c1b19' },
    ],
    sizes: ['Unique'],
    logoZone: { logo: 'pocket', finish: 'fabric', xPct: 500, yPct: 405, widthPct: 90 },
  },

  // ---- Accessoires ----
  {
    id: 'mug',
    category: 'accessoires',
    name: 'Mug Wolmar',
    description: 'Mug en grès émaillé, logo imprimé sur le flanc.',
    base: 'mug',
    colors: [
      { id: 'noir', label: 'Noir', hex: '#1c1b19' },
      { id: 'blanc', label: 'Blanc', hex: '#f3ede0' },
    ],
    sizes: ['350 ml'],
    logoZone: { logo: 'crest', finish: 'curved', xPct: 500, yPct: 480, widthPct: 130, curve: 0.5 },
    featured: true,
  },
  {
    id: 'gourde',
    category: 'accessoires',
    name: 'Gourde alu Wolmar',
    description: 'Gourde aluminium 750 ml, logo imprimé sur le flanc.',
    base: 'bottle',
    colors: [
      { id: 'argent', label: 'Argent', hex: '#c9ccd1' },
      { id: 'blanc', label: 'Blanc', hex: '#f3ede0' },
    ],
    sizes: ['750 ml'],
    logoZone: { logo: 'crest', finish: 'curved', xPct: 500, yPct: 480, widthPct: 95, curve: 0.55 },
  },
  {
    id: 'golf',
    category: 'accessoires',
    name: 'Balles de golf Wolmar (lot de 3)',
    description: 'Lot de 3 balles de golf, logo discret et centré.',
    base: 'golfBalls',
    colors: [
      { id: 'blanc', label: 'Blanc', hex: '#f5f3ee' },
      { id: 'jaune', label: 'Jaune', hex: '#d9c43a' },
      { id: 'rose', label: 'Rose', hex: '#c77b8f' },
    ],
    sizes: ['Lot de 3'],
    logoZone: { logo: 'crest', finish: 'curved', xPct: 500, yPct: 470, widthPct: 68, curve: 0.6 },
  },

  // ---- Coin des enfants ----
  {
    id: 'tshirt-enfant',
    category: 'enfants',
    name: 'T-shirt enfant Wolmar',
    description: 'Coton doux, coupe enfant. Même esprit que le t-shirt adulte, en petit format.',
    base: 'tshirt',
    colors: [
      { id: 'noir', label: 'Noir', hex: '#1c1b19' },
      { id: 'sable', label: 'Sable', hex: '#cdbfa0' },
      { id: 'bleu', label: 'Bleu', hex: '#2547ab' },
      { id: 'lavande', label: 'Lavande', hex: '#cdb6d3' },
      { id: 'orange', label: 'Orange', hex: '#fc774c' },
      { id: 'blanc', label: 'Blanc', hex: '#f3ede0' },
    ],
    sizes: KIDS_SIZES,
    logoZone: { logo: 'pocket', finish: 'fabric', xPct: 560, yPct: 505, widthPct: 88 },
  },
  {
    id: 'casquette-enfant',
    category: 'enfants',
    name: 'Casquette enfant Wolmar',
    description: 'Casquette ajustable format enfant, broderie façade — même visuel que la version adulte, en taille enfant.',
    base: 'cap',
    colors: [
      { id: 'orange', label: 'Orange fluo', hex: '#ff6a1a' },
      { id: 'noir', label: 'Noir', hex: '#1c1b19' },
      { id: 'kaki', label: 'Kaki', hex: '#54502f' },
      { id: 'sable', label: 'Sable', hex: '#cdbfa0' },
      { id: 'vert', label: 'Vert', hex: '#3a6b3f' },
    ],
    sizes: ['Réglable enfant'],
    logoZone: { logo: 'crest', finish: 'curved', xPct: 500, yPct: 335, widthPct: 170, curve: 0.4 },
  },
  {
    id: 'frisbee',
    category: 'enfants',
    name: 'Frisbee Wolmar',
    description: 'Disque souple pour jouer sur la pelouse du domaine, logo centré.',
    base: 'frisbee',
    colors: [
      { id: 'orange', label: 'Orange', hex: '#c9752f' },
      { id: 'bleu', label: 'Bleu', hex: '#3f6f93' },
      { id: 'rose', label: 'Rose', hex: '#e692b4' },
    ],
    sizes: ['Unique'],
    logoZone: { logo: 'crest', finish: 'print', xPct: 500, yPct: 555, widthPct: 200 },
    featured: true,
  },
  {
    id: 'doudou',
    category: 'enfants',
    name: 'Doudou Cerf Wolmar',
    description: "Peluche cerf toute douce, avec une petite étiquette brodée Wolmar.",
    base: 'plushDeer',
    colors: [{ id: 'sable', label: 'Sable', hex: '#cdbfa0' }],
    sizes: ['Unique'],
    logoZone: { logo: 'pocket', finish: 'fabric', xPct: 626, yPct: 552, widthPct: 32 },
  },
  {
    id: 'gobelet-enfant',
    category: 'enfants',
    name: 'Gobelet enfant Wolmar',
    description: 'Gobelet réutilisable format enfant, logo imprimé.',
    base: 'kidsCup',
    colors: [
      { id: 'bleu', label: 'Bleu', hex: '#3f6f93' },
      { id: 'rose', label: 'Rose', hex: '#c77b8f' },
      { id: 'vert', label: 'Vert', hex: '#5f8f5a' },
      { id: 'orange', label: 'Orange', hex: '#fe8b3a' },
    ],
    sizes: ['250 ml'],
    logoZone: { logo: 'crest', finish: 'curved', xPct: 500, yPct: 540, widthPct: 110, curve: 0.4 },
  },

  // ---- Coin des animaux ----
  {
    id: 'medaille',
    category: 'animaux',
    name: 'Médaille gravée Wolmar',
    description: 'Médaille métal pour collier, blason gravé — finition laiton ou argent.',
    base: 'petTag',
    colors: [
      { id: 'laiton', label: 'Laiton', hex: '#c9a24a' },
      { id: 'argent', label: 'Argent', hex: '#c7cad0' },
    ],
    sizes: ['S', 'M'],
    logoZone: { logo: 'crest', finish: 'engraved', xPct: 500, yPct: 570, widthPct: 200 },
    featured: true,
  },
  {
    id: 'bandana',
    category: 'animaux',
    name: 'Bandana Wolmar',
    description: 'Bandana en coton pour chien, logo imprimé en coin.',
    base: 'bandana',
    colors: [
      { id: 'kaki', label: 'Kaki', hex: '#54502f' },
      { id: 'rouge', label: 'Rouge', hex: '#8f4336' },
      { id: 'blanc', label: 'Blanc', hex: '#f3ede0' },
    ],
    sizes: ['S', 'M', 'L'],
    logoZone: { logo: 'crest', finish: 'fabric', xPct: 500, yPct: 470, widthPct: 220 },
  },
  {
    id: 'laisse',
    category: 'animaux',
    name: 'Laisse Wolmar',
    description: 'Laisse résistante avec passant logoté, finition cuir et métal.',
    base: 'leash',
    colors: [
      { id: 'brun', label: 'Brun', hex: '#4a3626' },
      { id: 'noir', label: 'Noir', hex: '#1c1b19' },
    ],
    sizes: ['Unique'],
    logoZone: { logo: 'pocket', finish: 'engraved', xPct: 500, yPct: 500, widthPct: 46 },
  },
]

export function productsByCategory(category: Product['category']): Product[] {
  return PRODUCTS.filter((p) => p.category === category)
}

export function featuredProducts(): Product[] {
  return PRODUCTS.filter((p) => p.featured)
}

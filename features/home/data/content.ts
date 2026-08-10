/** Fiche produit affichée sur la page d'accueil (bestsellers, ingrédients). */
export type HomeProduct = {
  id: string;
  number: 1 | 2 | 3 | 4 | 5;
  nameKey: string;
  descriptionKey: string;
  price: number;
  /** Photo produit (products/) */
  image: string;
  /** Composition ingrédients (ingredients/) */
  ingredientImage: string;
  /** Lifestyle / résultats cheveux */
  lifestyleImage: string;
  isNew?: boolean;
};

/**
 * Paires 1→5 : Produit N ↔ Ingrédient N
 * - products/produit-N-*.jpg → photo produit
 * - ingredients/ingredient-N.jpg → composition ingrédients
 * - lifestyle/* → résultats / ambiance cheveux
 */
export const CATALOG: HomeProduct[] = [
  {
    id: "beurre-capillaire",
    number: 1,
    nameKey: "home.bestsellers.products.butter.name",
    descriptionKey: "home.bestsellers.products.butter.description",
    price: 28.9,
    image: "/images/products/produit-1-beurre.jpg",
    ingredientImage: "/images/ingredients/ingredient-1.jpg",
    lifestyleImage: "/images/lifestyle/cheveux-pot-alt.jpg",
  },
  {
    id: "demelant-nourrissant",
    number: 2,
    nameKey: "home.bestsellers.products.detangler.name",
    descriptionKey: "home.bestsellers.products.detangler.description",
    price: 25.9,
    image: "/images/products/produit-2-demelant.jpg",
    ingredientImage: "/images/ingredients/ingredient-2.jpg",
    lifestyleImage: "/images/lifestyle/cheveux-spray-alt.jpg",
  },
  {
    id: "masque-capillaire",
    number: 3,
    nameKey: "home.bestsellers.products.mask.name",
    descriptionKey: "home.bestsellers.products.mask.description",
    price: 29.9,
    image: "/images/products/produit-3-masque.jpg",
    ingredientImage: "/images/ingredients/ingredient-3.jpg",
    lifestyleImage: "/images/lifestyle/cheveux-pot.jpg",
  },
  {
    id: "lotion-repousse",
    number: 4,
    nameKey: "home.bestsellers.products.growth.name",
    descriptionKey: "home.bestsellers.products.growth.description",
    price: 32.9,
    image: "/images/products/produit-4-lotion.jpg",
    ingredientImage: "/images/ingredients/ingredient-4.jpg",
    lifestyleImage: "/images/lifestyle/cheveux-spray.jpg",
  },
  {
    id: "savon-solide",
    number: 5,
    nameKey: "home.bestsellers.products.soap.name",
    descriptionKey: "home.bestsellers.products.soap.description",
    price: 12.9,
    image: "/images/products/produit-5-savon.jpg",
    ingredientImage: "/images/ingredients/ingredient-5.jpg",
    lifestyleImage: "/images/lifestyle/cheveux-savon.jpg",
    isNew: true,
  },
];

/** Alias page d’accueil : les 5 produits */
export const BESTSELLERS = CATALOG;

/** Images statiques utilisées par les sections de la page d'accueil (hero, avatars, témoignages). */
export const HOME_IMAGES = {
  hero: "/images/products/produit-1-beurre.jpg",
  feature: "/images/products/produit-4-lotion.jpg",
  featureProduct: "/images/products/produit-4-lotion.jpg",
  avatars: [
    "/images/products/produit-1-beurre.jpg",
    "/images/products/produit-2-demelant.jpg",
    "/images/products/produit-5-savon.jpg",
  ],
  testimonials: [
    "/images/lifestyle/cheveux-spray-alt.jpg",
    "/images/lifestyle/cheveux-pot-alt.jpg",
    "/images/lifestyle/cheveux-savon.jpg",
  ],
} as const;

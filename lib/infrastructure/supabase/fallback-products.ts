import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/**
 * Fallback local si Supabase n'est pas configuré ou si la table est vide.
 * Miroir du seed SQL dans supabase/seed-products.sql
 */
export const FALLBACK_PRODUCTS: ProductRow[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "beurre-capillaire",
    name: "Beurre Capillaire",
    price: 28.9,
    short_description: "Hydrate en profondeur les textures sèches.",
    description:
      "Un beurre riche et onctueux pour nourrir les cheveux texturés en profondeur. Idéal en leave-in, en sealant ou en soin nuit pour retrouver souplesse et éclat.",
    ingredients:
      "Beurre de karité, huile de coco, huile végétale, vitamine E, actifs botaniques.",
    usage:
      "Sur cheveux humides ou secs, prélever une noisette, réchauffer entre les paumes et répartir longueur/pointes. Éviter les racines si le cuir chevelu est gras.",
    image_url: "/images/products/produit-1-beurre.jpg",
    ingredients_image_url: "/images/ingredients/ingredient-1.jpg",
    lifestyle_image_url: "/images/lifestyle/cheveux-pot-alt.jpg",
    category: "hydratation",
    is_new: false,
    stock: 18,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "demelant-nourrissant",
    name: "Démêlant nourrissant",
    price: 25.9,
    short_description: "Démêle en douceur et nourrit les textures.",
    description:
      "Un démêlant nourrissant pensé pour les cheveux bouclés à crépus. Il facilite le démêlage sans casser la fibre et laisse les cheveux souples et brillants.",
    ingredients:
      "Eau de coco, hibiscus, beurre végétal, huiles nourrissantes, actifs démêlants d'origine naturelle.",
    usage:
      "Appliquer section par section sur cheveux mouillés avant le shampoing ou en leave-in léger. Démêler avec les doigts ou un peigne large.",
    image_url: "/images/products/produit-2-demelant.jpg",
    ingredients_image_url: "/images/ingredients/ingredient-2.jpg",
    lifestyle_image_url: "/images/lifestyle/cheveux-spray-alt.jpg",
    category: "demelage",
    is_new: false,
    stock: 18,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "masque-capillaire",
    name: "Masque Capillaire",
    price: 29.9,
    short_description: "Répare et nourrit intensément la fibre.",
    description:
      "Un masque réparateur pour redonner densité et confort aux cheveux fatigués. Sa texture riche enveloppe la fibre pour une réparation visible après quelques utilisations.",
    ingredients:
      "Beurre de karité, coco, cire végétale, huiles fortifiantes, vitamine E.",
    usage:
      "Après le shampoing, appliquer généreusement, laisser poser 15 à 30 minutes sous une charlotte, puis rincer à l'eau tiède.",
    image_url: "/images/products/produit-3-masque.jpg",
    ingredients_image_url: "/images/ingredients/ingredient-3.jpg",
    lifestyle_image_url: "/images/lifestyle/cheveux-pot.jpg",
    category: "soin",
    is_new: false,
    stock: 18,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    slug: "lotion-repousse",
    name: "Lotion Active Repousse",
    price: 32.9,
    short_description: "Hydratante et fortifiante pour stimuler la pousse.",
    description:
      "Lotion hydratante et fortifiante pour stimuler la pousse et renforcer le cuir chevelu. Brume fine idéale en soin quotidien ou après un massage du cuir chevelu.",
    ingredients:
      "Coco, gingembre, amla, huiles botaniques, actifs fortifiants.",
    usage:
      "Vaporiser sur le cuir chevelu propre, masser 2 à 3 minutes. Utiliser 3 à 4 fois par semaine pour un résultat optimal.",
    image_url: "/images/products/produit-4-lotion.jpg",
    ingredients_image_url: "/images/ingredients/ingredient-4.jpg",
    lifestyle_image_url: "/images/lifestyle/cheveux-spray.jpg",
    category: "pousse",
    is_new: false,
    stock: 18,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    slug: "savon-solide",
    name: "Savon solide",
    price: 12.9,
    short_description: "Nettoie en douceur, à base d'ingrédients naturels.",
    description:
      "Un savon solide doux pour un nettoyage respectueux. Formulé avec des matières premières naturelles pour préserver l'équilibre du cuir chevelu et de la fibre.",
    ingredients: "Coco, beurres végétaux, cauris symboliques de pureté, actifs saponifiés naturels.",
    usage:
      "Faire mousser entre les mains ou directement sur cheveux mouillés, masser le cuir chevelu, rincer abondamment. Suivre d'un soin hydratant.",
    image_url: "/images/products/produit-5-savon.jpg",
    ingredients_image_url: "/images/ingredients/ingredient-5.jpg",
    lifestyle_image_url: null,
    category: "nettoyage",
    is_new: true,
    stock: 4,
  },
];

export const PRODUCT_CATEGORIES = [
  "hydratation",
  "demelage",
  "soin",
  "pousse",
  "nettoyage",
] as const;

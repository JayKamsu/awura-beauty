import {
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
} from "@/lib/site";
import { BRAND_LOGOS } from "@/lib/brand";

/** JSON-LD Organization (identité de la marque, utilisé sur les pages principales). */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteUrl("/")}#organization`,
    name: SITE_NAME,
    alternateName: ["Awura", "AwuraBeauty", "Awura Beauty France"],
    legalName: SITE_NAME,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(BRAND_LOGOS.orange),
      caption: `${SITE_NAME} logo`,
    },
    image: absoluteUrl(BRAND_LOGOS.orange),
    email: CONTACT_EMAIL,
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    foundingDate: "2024",
    areaServed: ["FR", "EU"],
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
      alternateName: ["Awura", "AwuraBeauty"],
      logo: absoluteUrl(BRAND_LOGOS.orange),
    },
    knowsAbout: [
      "soins capillaires naturels",
      "cheveux texturés",
      "cheveux afro",
      "cheveux crépus",
      "cheveux métissés",
      "routine capillaire",
      "diagnostic capillaire",
      "cosmétique naturelle",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: CONTACT_EMAIL,
      availableLanguage: ["fr", "en", "es"],
    },
    sameAs: [] as string[],
  };
}

/** JSON-LD WebSite (avec action de recherche du site). */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    name: SITE_NAME,
    alternateName: ["Awura", "AwuraBeauty", "awurabeauty.com"],
    url: absoluteUrl("/"),
    description: SITE_TAGLINE,
    inLanguage: ["fr", "en", "es"],
    publisher: {
      "@id": `${absoluteUrl("/")}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/recherche")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** FAQ homepage — enrichit Google + citations IA. */
export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce qu'Awura Beauty ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Awura Beauty est une marque française de soins capillaires naturels et premium, conçus pour les cheveux texturés, afro, crépus et métissés. Boutique en ligne sur awurabeauty.com.",
        },
      },
      {
        "@type": "Question",
        name: "Pour quels types de cheveux sont faits les produits Awura Beauty ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Les soins Awura Beauty sont pensés pour les cheveux texturés : afro, crépus, bouclés et métissés. Ils hydratent, démêlent, fortifient et subliment la fibre.",
        },
      },
      {
        "@type": "Question",
        name: "Awura Beauty propose-t-il un diagnostic capillaire ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui. Un diagnostic en ligne gratuit (routine + recommandations produits) et un diagnostic présentiel avec trichogramme sont disponibles sur /diagnostic-capillaire.",
        },
      },
      {
        "@type": "Question",
        name: "Où acheter Awura Beauty ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sur la boutique officielle https://awurabeauty.com/boutique. Contact : Care@awurabeauty.com.",
        },
      },
    ],
  };
}

/** JSON-LD Product/Offer pour une fiche produit, avec disponibilité dérivée du stock. */
export function productJsonLd(product: {
  name: string;
  description: string;
  slug: string;
  price: number;
  image_url: string;
  stock: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [absoluteUrl(product.image_url)],
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/boutique/${product.slug}`),
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
  };
}

/** JSON-LD Article ou HowTo selon le type de contenu (blog vs tutoriel). */
export function articleJsonLd(post: {
  title: string;
  excerpt: string;
  slug: string;
  cover_image_url: string;
  published_at: string;
  kind: "article" | "tutorial";
}) {
  const path = post.kind === "tutorial" ? `/tutoriels/${post.slug}` : `/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": post.kind === "tutorial" ? "HowTo" : "Article",
    headline: post.title,
    description: post.excerpt,
    image: [absoluteUrl(post.cover_image_url)],
    datePublished: post.published_at,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(BRAND_LOGOS.orange),
      },
    },
    mainEntityOfPage: absoluteUrl(path),
  };
}

/** JSON-LD BreadcrumbList pour le fil d'ariane d'une page. */
export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** JSON-LD ItemList des témoignages publics. */
export function testimonialsJsonLd(
  items: Array<{
    authorName: string;
    quote: string;
    rating: number;
  }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Témoignages Awura Beauty",
    itemListElement: items.slice(0, 20).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: item.authorName || "Cliente Awura",
        },
        reviewBody: item.quote,
        reviewRating: {
          "@type": "Rating",
          ratingValue: item.rating,
          bestRating: 5,
        },
        itemReviewed: {
          "@type": "Brand",
          name: SITE_NAME,
        },
      },
    })),
  };
}

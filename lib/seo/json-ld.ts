import {
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
} from "@/lib/site";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/brand/logo-orange.png"),
    email: CONTACT_EMAIL,
    description: SITE_DESCRIPTION,
    foundingDate: "2024",
    areaServed: ["FR", "EU"],
    knowsAbout: [
      "soins capillaires naturels",
      "cheveux texturés",
      "cheveux afro",
      "routine capillaire",
    ],
    sameAs: [] as string[],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_TAGLINE,
    inLanguage: ["fr", "en", "es"],
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/boutique")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

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
        url: absoluteUrl("/images/brand/logo-orange.png"),
      },
    },
    mainEntityOfPage: absoluteUrl(path),
  };
}

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

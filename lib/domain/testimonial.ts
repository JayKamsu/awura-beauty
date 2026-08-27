/** Durée de validité d'un lien d'invitation témoignage (jours). */
export const TESTIMONIAL_INVITE_TTL_DAYS = 60;

/** Témoignage affiché publiquement (site, diagnostic ou produit). */
export type PublicTestimonial = {
  id: string;
  kind: "site" | "diagnostic" | "product";
  authorName: string;
  quote: string;
  rating: number;
  imageUrl: string | null;
  href?: string;
  createdAt: string;
};

/** Témoignage site (invitation client ou saisie admin). */
export type SiteTestimonialRow = {
  id: string;
  authorName: string;
  quote: string;
  rating: number;
  imageUrl: string;
  published: boolean;
  source: "invite" | "admin";
  createdAt: string;
};

/** Invitation à laisser un témoignage, identifiée par le hash du jeton. */
export type TestimonialInviteRow = {
  id: string;
  note: string;
  expiresAt: string;
  usedAt: string | null;
  testimonialId: string | null;
  createdAt: string;
};

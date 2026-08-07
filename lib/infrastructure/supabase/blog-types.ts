export type BlogPostKind = "article" | "tutorial";

export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "tip"; text: string }
  | { type: "image"; src: string; alt: string };

export type BlogPost = {
  id: string;
  slug: string;
  kind: BlogPostKind;
  title: string;
  excerpt: string;
  cover_image_url: string;
  published_at: string;
  /** Slug produit lié (tutoriels) */
  product_slug: string | null;
  content: BlogContentBlock[];
};

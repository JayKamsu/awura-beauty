import Image from "next/image";
import Link from "next/link";
import { Stars } from "@/components/ui/stars";
import type { PublicTestimonial } from "@/lib/domain/testimonial";

type TestimonialCardProps = {
  item: PublicTestimonial;
  badge?: string;
  /** Tronque la citation (accueil) pour garder une carte compacte. */
  compact?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Carte témoignage (photo ou initiales, note, citation, attribution). */
export function TestimonialCard({ item, badge, compact = false }: TestimonialCardProps) {
  const name = item.authorName || badge || "";
  const inner = (
    <>
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-primary text-background">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-xs font-semibold tracking-wide">
            {initials(name || "A")}
          </span>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <Stars value={item.rating} />
        <p
          className={`text-sm italic leading-relaxed text-foreground/90 ${
            compact ? "line-clamp-6" : ""
          }`}
        >
          “{item.quote}”
        </p>
        <p className="text-sm font-medium text-muted">
          — {name}
          {badge && item.kind !== "site" ? (
            <span className="ml-2 text-xs font-normal uppercase tracking-wide text-accent">
              {badge}
            </span>
          ) : null}
        </p>
      </div>
    </>
  );

  const className =
    "flex h-full gap-4 rounded-2xl bg-background p-5";

  if (item.href) {
    return (
      <Link href={item.href} className={`${className} transition hover:bg-background-alt`}>
        {inner}
      </Link>
    );
  }

  return <article className={className}>{inner}</article>;
}

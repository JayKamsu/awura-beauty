import type { ReactNode } from "react";

/** Props de la coquille visuelle partagée des blocs Mon compte. */
type AccountSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Coquille visuelle partagée des blocs Mon compte (luxe organique).
 */
export function AccountSection({
  id,
  title,
  subtitle,
  action,
  children,
  className,
}: AccountSectionProps) {
  return (
    <section
      id={id}
      className={[
        "scroll-mt-28 space-y-6 rounded-3xl bg-background-alt/70 p-6 ring-1 ring-border/60 md:p-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-1 w-10 rounded-full bg-accent" aria-hidden />
          <h2 className="font-serif text-2xl text-primary md:text-3xl">{title}</h2>
          {subtitle ? <p className="max-w-2xl text-sm text-muted">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** Classes Tailwind partagées pour les champs de formulaire des blocs Mon compte. */
export const accountFieldClass =
  "w-full rounded-2xl border border-border/80 bg-background px-3.5 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

/** Classes Tailwind partagées pour les panneaux internes des blocs Mon compte. */
export const accountPanelClass =
  "rounded-2xl bg-background/70 p-5 ring-1 ring-border/50";

import Image from "next/image";

type MarkProps = {
  className?: string;
  title?: string;
};

function BrandImg({
  src,
  title,
  className,
  width,
  height,
}: {
  src: string;
  title: string;
  className?: string;
  width: number;
  height: number;
}) {
  return (
    <Image
      src={src}
      alt={title}
      width={width}
      height={height}
      className={className ?? "h-7 w-auto object-contain object-left"}
      unoptimized
    />
  );
}

/** Logo Stripe officiel (couleurs de marque). */
export function StripeMark({ className, title = "Stripe" }: MarkProps) {
  return (
    <BrandImg
      src="/images/payments/stripe-full.svg"
      title={title}
      className={className}
      width={70}
      height={28}
    />
  );
}

/** Logo PayPal officiel (couleurs de marque). */
export function PayPalMark({ className, title = "PayPal" }: MarkProps) {
  return (
    <BrandImg
      src="/images/payments/paypal-full.svg"
      title={title}
      className={className}
      width={70}
      height={28}
    />
  );
}

/** Logo Colissimo / La Poste. */
export function ColissimoMark({ className, title = "Colissimo" }: MarkProps) {
  return (
    <BrandImg
      src="/images/shipping/colissimo.svg"
      title={title}
      className={className ?? "h-8 w-auto object-contain object-left"}
      width={200}
      height={48}
    />
  );
}

/** Logo Mondial Relay. */
export function MondialRelayMark({
  className,
  title = "Mondial Relay",
}: MarkProps) {
  return (
    <BrandImg
      src="/images/shipping/mondial-relay.svg"
      title={title}
      className={className ?? "h-8 w-auto object-contain object-left"}
      width={220}
      height={48}
    />
  );
}

/** Icône retrait sur place (générique Awura). */
export function PickupMark({ className, title = "Retrait" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 48 24"
      className={className ?? "h-7 w-auto"}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path
        fill="currentColor"
        d="M12 4 2 11v11h8V16h12v6h8V11L12 4zm0 3.2 8 5.6V18h-2v-6H6v6H4v-5.2L12 7.2z"
      />
    </svg>
  );
}

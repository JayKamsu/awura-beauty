import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "accent-outline" | "primary-outline" | "ghost";
type ButtonSize = "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-background hover:bg-primary/90 focus-visible:outline-primary",
  "accent-outline":
    "border border-accent bg-transparent text-accent hover:bg-accent/10 focus-visible:outline-accent",
  "primary-outline":
    "border border-primary bg-transparent text-primary hover:bg-primary/10 focus-visible:outline-primary",
  ghost:
    "bg-transparent text-foreground hover:bg-background-alt focus-visible:outline-accent",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 py-3 text-sm",
  lg: "min-h-12 px-6 py-3.5 text-sm tracking-[0.08em]",
  icon: "size-11 p-0",
};

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Désactive le bouton + aria-busy (anti double-clic). */
  pending?: boolean;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  href: string;
};

/** Props du bouton, soit un `<button>` natif soit un lien selon la présence de `href`. */
export type ButtonProps = ButtonAsButton | ButtonAsLink;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium uppercase transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none aria-busy:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

/** Bouton stylé de l'application, rendu comme `<button>` ou comme lien selon les props. */
export function Button(props: ButtonProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";
  const classes = buttonClasses(variant, size, props.className);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {props.children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  const {
    children,
    variant: _variant,
    size: _size,
    className: _className,
    pending = false,
    type = "button",
    disabled,
    ...rest
  } = buttonProps;

  return (
    <button
      type={type}
      className={classes}
      disabled={Boolean(disabled || pending)}
      aria-busy={pending || undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

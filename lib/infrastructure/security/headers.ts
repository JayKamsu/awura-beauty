/**
 * Headers sécurité HTTP (CSP + HSTS + baseline).
 * CSP pragmatique pour Next + Supabase + Stripe/PayPal + Firebase + Sentry + Google Auth.
 */

function supabaseOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

/** Construit la CSP autorisant Supabase/Stripe/PayPal/Firebase/Sentry/Google Auth/Jitsi. */
export function buildContentSecurityPolicy(): string {
  const supabase = supabaseOrigin();
  const connect = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.stripe.com",
    "https://*.stripe.com",
    "https://api-m.paypal.com",
    "https://api-m.sandbox.paypal.com",
    "https://*.paypal.com",
    "https://*.paypalobjects.com",
    "https://*.sentry.io",
    "https://*.ingest.sentry.io",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "https://*.firebase.com",
    "https://fcm.googleapis.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://accounts.google.com",
    "https://*.jit.si",
    "https://meet.jit.si",
    "wss://*.jit.si",
    "wss://meet.jit.si",
    "https://*.jitsi.net",
    "wss://*.jitsi.net",
  ];
  if (supabase) {
    connect.push(supabase);
    connect.push(supabase.replace(/^https:/, "wss:"));
  }

  const img = [
    "'self'",
    "data:",
    "blob:",
    "https://images.unsplash.com",
    "https://*.supabase.co",
    "https://*.stripe.com",
    "https://*.paypal.com",
    "https://*.paypalobjects.com",
    "https://*.googleusercontent.com",
  ];

  const script = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://js.stripe.com",
    "https://*.paypal.com",
    "https://*.paypalobjects.com",
    "https://www.googletagmanager.com",
    "https://apis.google.com",
    "https://accounts.google.com",
    "https://www.gstatic.com",
    "https://*.sentry-cdn.com",
    "https://meet.jit.si",
    "https://*.jit.si",
  ];

  const frame = [
    "'self'",
    "blob:",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    "https://www.paypal.com",
    "https://www.sandbox.paypal.com",
    "https://accounts.google.com",
    "https://meet.jit.si",
    "https://*.jit.si",
  ];

  const directives = [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    `frame-src ${frame.join(" ")}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com https://www.paypal.com https://www.sandbox.paypal.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

/** Headers de sécurité HTTP baseline (framing, MIME sniffing, HSTS, CSP) à appliquer à toutes les réponses. */
export function buildSecurityHeaders(): Array<{ key: string; value: string }> {
  return [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value:
        'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), geolocation=(), payment=(self)',
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(),
    },
  ];
}

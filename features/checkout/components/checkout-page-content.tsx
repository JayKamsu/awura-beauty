"use client";

import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useAuth } from "@/features/auth/context/auth-provider";
import { cartLineKey, useCart } from "@/features/cart/context/cart-provider";
import { RelayPointPicker } from "@/features/checkout/components/relay-point-picker";
import {
  ColissimoMark,
  MondialRelayMark,
  PayPalMark,
  PickupMark,
  StripeMark,
} from "@/features/checkout/components/checkout-brand-marks";
import type { RelayPoint } from "@/lib/domain";
import { formatPrice } from "@/lib/format/price";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import type {
  PaymentMethod,
  ShippingCarrier,
} from "@/lib/infrastructure/supabase/order-types";
import {
  isShippingProfileComplete,
  profileFullName,
} from "@/lib/infrastructure/supabase/profile-types";
import {
  getMyProfile,
  updateMyProfile,
} from "@/lib/infrastructure/supabase/profiles";

const ALL_CARRIERS: ShippingCarrier[] = [
  "laposte",
  "mondial_relay",
  "pickup",
];

type QuoteState = {
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingApplied?: boolean;
  referralDiscount?: number;
  pointsDiscount?: number;
  pointsRedeemed?: number;
  pointsToEarn?: number;
  balance?: number;
  maxRedeemablePoints?: number;
  referralEligible?: boolean;
};

/** Page de commande : adresse, transporteur, points de fidélité et paiement (Stripe, PayPal ou manuel). */
export function CheckoutPageContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const { currency } = usePreferences();
  const { items, subtotal, clearCart, itemCount } = useCart();
  const { locked: pending, run } = useActionLock();
  const paypalCaptureLock = useRef(false);
  const profileLoaded = useRef(false);

  const authHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("manual");
  const [shippingCarrier, setShippingCarrier] =
    useState<ShippingCarrier>("laposte");
  const [enabledCarriers, setEnabledCarriers] =
    useState<ShippingCarrier[]>(ALL_CARRIERS);
  const [selectedRelay, setSelectedRelay] = useState<RelayPoint | null>(null);
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("FR");
  const [addressComplete, setAddressComplete] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState(
    () => process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "",
  );
  const [paypalClientId, setPaypalClientId] = useState(
    () => process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ?? "",
  );
  const [paymentConfigLoaded, setPaymentConfigLoaded] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [awuraOrderId, setAwuraOrderId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/checkout/config")
      .then((r) => r.json())
      .then(
        (json: {
          stripePublishableKey?: string;
          paypalClientId?: string;
        }) => {
          if (cancelled) return;
          if (json.stripePublishableKey?.trim()) {
            setStripePublishableKey(json.stripePublishableKey.trim());
          }
          if (json.paypalClientId?.trim()) {
            setPaypalClientId(json.paypalClientId.trim());
          }
          setPaymentConfigLoaded(true);
        },
      )
      .catch(() => {
        if (!cancelled) setPaymentConfigLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(
        `/compte/connexion?redirect=${encodeURIComponent("/commande")}`,
      );
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || profileLoaded.current) return;
    profileLoaded.current = true;
    setEmail(user.email ?? "");

    void getMyProfile().then((profile) => {
      if (profile) {
        const name = profileFullName(profile);
        if (name) setFullName(name);
        if (profile.phone) setPhone(profile.phone);
        if (profile.address_line1) setLine1(profile.address_line1);
        if (profile.city) setCity(profile.city);
        if (profile.postal_code) setPostalCode(profile.postal_code);
        if (profile.country) setCountry(profile.country);
        const complete = isShippingProfileComplete(profile);
        setAddressComplete(complete);
        setEditingAddress(!complete);
      } else {
        setAddressComplete(false);
        setEditingAddress(true);
      }
      setProfileLoading(false);
    });
  }, [user]);

  const orderItems = useMemo(
    () =>
      items.map((item) => ({
        slug: item.slug,
        quantity: item.quantity,
        colorKey: item.colorKey ?? undefined,
      })),
    [items],
  );

  const quoteItemsKey = useMemo(
    () =>
      JSON.stringify(
        items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
      ),
    [items],
  );

  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    setQuoteLoading(true);

    const params = new URLSearchParams({
      carrier: shippingCarrier,
      items: quoteItemsKey,
      pointsToRedeem: String(pointsToRedeem),
    });

    void fetch(`/api/shipping/quote?${params.toString()}`, {
      headers: authHeaders(),
    })
      .then(async (res) => {
        const json = (await res.json()) as {
          rates?: Array<{ carrier: ShippingCarrier; enabled: boolean }>;
          subtotal?: number;
          shippingFee?: number;
          total?: number;
          quote?: { freeShippingApplied?: boolean };
          loyalty?: {
            referralDiscount?: number;
            pointsDiscount?: number;
            pointsRedeemed?: number;
            pointsToEarn?: number;
            balance?: number;
            maxRedeemablePoints?: number;
            referralEligible?: boolean;
          };
          error?: string;
        };
        if (cancelled) return;
        if (json.rates?.length) {
          const enabled = json.rates
            .filter((rate) => rate.enabled)
            .map((rate) => rate.carrier)
            .filter((carrier): carrier is ShippingCarrier =>
              ALL_CARRIERS.includes(carrier),
            );
          if (enabled.length) {
            setEnabledCarriers(enabled);
            if (!enabled.includes(shippingCarrier)) {
              setShippingCarrier(enabled[0]!);
            }
          }
        }
        if (!res.ok) {
          setQuote({
            subtotal,
            shippingFee: 0,
            total: subtotal,
          });
          return;
        }
        const maxPts = Number(json.loyalty?.maxRedeemablePoints ?? 0);
        if (pointsToRedeem > maxPts) {
          setPointsToRedeem(maxPts);
        }
        setQuote({
          subtotal: Number(json.subtotal ?? subtotal),
          shippingFee: Number(json.shippingFee ?? 0),
          total: Number(json.total ?? subtotal),
          freeShippingApplied: json.quote?.freeShippingApplied,
          referralDiscount: Number(json.loyalty?.referralDiscount ?? 0),
          pointsDiscount: Number(json.loyalty?.pointsDiscount ?? 0),
          pointsRedeemed: Number(json.loyalty?.pointsRedeemed ?? 0),
          pointsToEarn: Number(json.loyalty?.pointsToEarn ?? 0),
          balance: Number(json.loyalty?.balance ?? 0),
          maxRedeemablePoints: maxPts,
          referralEligible: Boolean(json.loyalty?.referralEligible),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setQuote({ subtotal, shippingFee: 0, total: subtotal });
        }
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- authHeaders via session token
  }, [shippingCarrier, quoteItemsKey, items.length, subtotal, pointsToRedeem, session?.access_token]);

  const allowManualCheckout =
    paymentConfigLoaded &&
    !stripePublishableKey &&
    !paypalClientId;

  useEffect(() => {
    if (!paymentConfigLoaded) return;
    if (allowManualCheckout) {
      setPaymentMethod("manual");
      return;
    }
    setPaymentMethod((current) => {
      if (current === "manual") {
        return stripePublishableKey ? "stripe" : "paypal";
      }
      if (current === "stripe" && !stripePublishableKey) return "paypal";
      if (current === "paypal" && !paypalClientId) return "stripe";
      return current;
    });
  }, [
    allowManualCheckout,
    stripePublishableKey,
    paypalClientId,
    paymentConfigLoaded,
  ]);

  const shippingAddress = {
    fullName,
    line1:
      shippingCarrier === "pickup"
        ? line1.trim() || "Retrait sur place"
        : line1,
    city: shippingCarrier === "pickup" ? city.trim() || "—" : city,
    postalCode:
      shippingCarrier === "pickup" ? postalCode.trim() || "00000" : postalCode,
    country,
    phone: phone.trim() || undefined,
    email: email.trim() || undefined,
  };

  const checkoutPayload = () => ({
    email,
    currency,
    items: orderItems,
    shippingAddress,
    shippingCarrier,
    relayPointId:
      shippingCarrier === "mondial_relay" ? selectedRelay?.id ?? null : null,
    pointsToRedeem,
  });

  const persistProfileAddress = async () => {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") || firstName;
    await updateMyProfile({
      first_name: firstName,
      last_name: lastName,
      phone,
      address_line1: line1,
      city,
      postal_code: postalCode,
      country,
    });
  };

  if (authLoading || (!user && itemCount > 0)) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-4 px-4 py-20 text-center">
        <p className="text-muted">{t("checkout.authLoading")}</p>
      </main>
    );
  }

  if (itemCount === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-4 py-20 text-center">
        <h1 className="font-serif text-4xl text-primary">{t("checkout.title")}</h1>
        <p className="text-muted">{t("checkout.emptyCart")}</p>
        <Button href="/boutique">{t("cart.continueShopping")}</Button>
      </main>
    );
  }

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

  const validateShipping = () => {
    if (!fullName.trim() || !email.trim()) {
      setError(t("checkout.addressRequired"));
      setEditingAddress(true);
      return false;
    }

    if (shippingCarrier === "pickup") {
      if (!phone.trim()) {
        setError(t("checkout.phoneRequiredPickup"));
        setEditingAddress(true);
        return false;
      }
      return true;
    }

    if (!line1.trim() || !city.trim() || !postalCode.trim()) {
      setError(t("checkout.addressRequired"));
      setEditingAddress(true);
      return false;
    }
    if (shippingCarrier === "mondial_relay" && !phone.trim()) {
      setError(t("checkout.phoneRequired"));
      setEditingAddress(true);
      return false;
    }
    if (shippingCarrier === "mondial_relay" && !selectedRelay) {
      setError(t("checkout.relayRequired"));
      return false;
    }
    if (!acceptedTerms) {
      setError(t("checkout.acceptTermsRequired"));
      return false;
    }
    return true;
  };

  const startStripe = async () => {
    setError(null);
    if (!validateShipping()) return;
    await persistProfileAddress();
    const response = await fetch("/api/checkout/stripe", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(checkoutPayload()),
    });
    const json = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !json.url) {
      setError(json.error ?? t("checkout.paymentError"));
      return;
    }

    window.location.href = json.url;
  };

  const preparePayPal = async () => {
    setError(null);
    if (!validateShipping()) return;
    await persistProfileAddress();
    const response = await fetch("/api/checkout/paypal/create", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(checkoutPayload()),
    });
    const json = (await response.json()) as {
      paypalOrderId?: string;
      orderId?: string;
      error?: string;
    };

    if (!response.ok || !json.paypalOrderId || !json.orderId) {
      setError(json.error ?? t("checkout.paymentError"));
      return;
    }

    setPaypalOrderId(json.paypalOrderId);
    setAwuraOrderId(json.orderId);
  };

  const startManualCheckout = async () => {
    setError(null);
    if (!validateShipping()) return;
    await persistProfileAddress();
    const response = await fetch("/api/checkout/manual", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(checkoutPayload()),
    });
    const json = (await response.json()) as {
      orderId?: string;
      error?: string;
    };

    if (!response.ok || !json.orderId) {
      setError(json.error ?? t("checkout.paymentError"));
      return;
    }

    clearCart();
    router.push(`/commande/succes?orderId=${json.orderId}`);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      if (paymentMethod === "manual") {
        await startManualCheckout();
        return;
      }
      if (paymentMethod === "stripe") {
        await startStripe();
        return;
      }
      await preparePayPal();
    });
  };

  const showAddressForm = editingAddress || !addressComplete;
  const needsFullAddress = shippingCarrier !== "pickup";
  const displaySubtotal = quote?.subtotal ?? subtotal;
  const displayShipping = quote?.shippingFee ?? 0;
  const displayTotal = quote?.total ?? subtotal + displayShipping;

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-14 lg:grid-cols-[1.2fr_0.8fr]">
      <aside className="h-fit rounded-3xl bg-background-alt p-5 sm:p-6 lg:order-2 lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl text-primary">{t("checkout.summary")}</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const colorLabel = item.colorKey
              ? t(`shop.colors.${item.colorKey}`)
              : null;
            return (
            <li
              key={cartLineKey(item)}
              className="flex justify-between gap-3 text-sm"
            >
              <span className="min-w-0 break-words text-muted">
                {item.name}
                {colorLabel ? ` — ${colorLabel}` : ""} × {item.quantity}
              </span>
              <span className="shrink-0 text-primary">
                {formatPrice(item.unitPrice * item.quantity, currency, i18n.language)}
              </span>
            </li>
            );
          })}
        </ul>
        <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted">{t("cart.subtotal")}</span>
            <span className="text-primary">
              {formatPrice(displaySubtotal, currency, i18n.language)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">{t("checkout.shippingFee")}</span>
            <span className="text-primary">
              {quoteLoading
                ? "…"
                : displayShipping === 0
                  ? t("checkout.shippingFree")
                  : formatPrice(displayShipping, currency, i18n.language)}
            </span>
          </div>
          {quote?.referralDiscount ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted">{t("checkout.referralDiscount")}</span>
              <span className="text-primary">
                −
                {formatPrice(
                  quote.referralDiscount,
                  currency,
                  i18n.language,
                )}
              </span>
            </div>
          ) : null}
          {quote?.pointsDiscount ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted">{t("checkout.pointsDiscount")}</span>
              <span className="text-primary">
                −
                {formatPrice(quote.pointsDiscount, currency, i18n.language)}
              </span>
            </div>
          ) : null}
          {quote?.freeShippingApplied ? (
            <p className="text-xs text-muted">{t("checkout.freeShippingApplied")}</p>
          ) : null}
          {typeof quote?.pointsToEarn === "number" && quote.pointsToEarn > 0 ? (
            <p className="text-xs text-muted">
              {t("checkout.pointsToEarn", { count: quote.pointsToEarn })}
            </p>
          ) : null}
          <div className="flex justify-between gap-3 border-t border-border pt-3">
            <span className="font-medium text-primary">{t("checkout.total")}</span>
            <span className="font-serif text-2xl text-primary">
              {formatPrice(displayTotal, currency, i18n.language)}
            </span>
          </div>
          <p className="pt-2 text-sm text-muted">
            {t(`checkout.carriers.${shippingCarrier}.label`)}
            {selectedRelay ? ` · ${selectedRelay.name}` : ""}
          </p>
        </div>
      </aside>

      <form onSubmit={onSubmit} className="space-y-8 lg:order-1">
        <h1 className="font-serif text-3xl text-primary sm:text-4xl">{t("checkout.title")}</h1>

        {(quote?.balance ?? 0) > 0 || quote?.referralEligible ? (
          <section className="space-y-3 rounded-2xl border border-border p-4">
            <h2 className="font-serif text-2xl text-primary">
              {t("checkout.loyaltyTitle")}
            </h2>
            <p className="text-sm text-muted">
              {t("checkout.loyaltyBalance", { count: quote?.balance ?? 0 })}
            </p>
            {quote?.referralEligible ? (
              <p className="text-sm text-accent">
                {t("checkout.referralEligible")}
              </p>
            ) : null}
            {(quote?.maxRedeemablePoints ?? 0) >= 100 ? (
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">{t("checkout.usePoints")}</span>
                <select
                  className={fieldClass}
                  value={pointsToRedeem}
                  onChange={(e) =>
                    setPointsToRedeem(Number(e.target.value) || 0)
                  }
                >
                  <option value={0}>{t("checkout.usePointsNone")}</option>
                  {Array.from(
                    {
                      length: Math.floor(
                        (quote?.maxRedeemablePoints ?? 0) / 100,
                      ),
                    },
                    (_, i) => (i + 1) * 100,
                  ).map((pts) => (
                    <option key={pts} value={pts}>
                      {t("checkout.usePointsOption", {
                        points: pts,
                        amount: formatPrice(
                          (pts / 100) * 5,
                          currency,
                          i18n.language,
                        ),
                      })}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-primary">{t("checkout.shippingMethod")}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {enabledCarriers.map((carrier) => {
              const active = shippingCarrier === carrier;
              const Mark =
                carrier === "laposte"
                  ? ColissimoMark
                  : carrier === "mondial_relay"
                    ? MondialRelayMark
                    : PickupMark;
              return (
                <button
                  key={carrier}
                  type="button"
                  onClick={() => {
                    setShippingCarrier(carrier);
                    if (carrier !== "mondial_relay") setSelectedRelay(null);
                    setPaypalOrderId(null);
                  }}
                  className={`rounded-2xl border bg-background px-4 py-4 text-left transition ${
                    active
                      ? "border-accent ring-1 ring-accent"
                      : "border-border hover:border-accent"
                  }`}
                >
                  <Mark className="mb-3 h-8 w-auto max-w-[9rem] object-contain object-left" />
                  <span className="block font-medium text-primary">
                    {t(`checkout.carriers.${carrier}.label`)}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {t(`checkout.carriers.${carrier}.hint`)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-2xl text-primary">
              {shippingCarrier === "pickup"
                ? t("checkout.contact")
                : t("checkout.shipping")}
            </h2>
            {needsFullAddress && addressComplete && !editingAddress ? (
              <button
                type="button"
                className="text-sm text-accent hover:text-accent-light"
                onClick={() => setEditingAddress(true)}
              >
                {t("checkout.editAddress")}
              </button>
            ) : null}
          </div>

          {shippingCarrier === "pickup" ? (
            <p className="rounded-2xl bg-background-alt px-4 py-3 text-sm text-muted">
              {t("checkout.pickupNotice")}
            </p>
          ) : null}

          {profileLoading ? (
            <p className="text-sm text-muted">{t("checkout.profileLoading")}</p>
          ) : null}

          {needsFullAddress && !showAddressForm && addressComplete ? (
            <div className="rounded-2xl bg-background-alt px-4 py-4 text-sm text-muted">
              <p className="font-medium text-primary">{fullName}</p>
              <p>{email}</p>
              <p>{phone}</p>
              <p className="mt-2">
                {line1}
                <br />
                {postalCode} {city}
                <br />
                {country}
              </p>
              <p className="mt-2 text-xs">{t("checkout.addressFromProfile")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="text-muted">{t("checkout.email")}</span>
                <input
                  required
                  type="email"
                  className={fieldClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="text-muted">{t("checkout.fullName")}</span>
                <input
                  required
                  className={fieldClass}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="text-muted">{t("checkout.phone")}</span>
                <input
                  required={
                    shippingCarrier === "mondial_relay" ||
                    shippingCarrier === "pickup"
                  }
                  type="tel"
                  className={fieldClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              {needsFullAddress ? (
                <>
                  <label className="space-y-1.5 text-sm sm:col-span-2">
                    <span className="text-muted">{t("checkout.address")}</span>
                    <input
                      required
                      className={fieldClass}
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted">{t("checkout.city")}</span>
                    <input
                      required
                      className={fieldClass}
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setSelectedRelay(null);
                      }}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted">{t("checkout.postalCode")}</span>
                    <input
                      required
                      className={fieldClass}
                      value={postalCode}
                      onChange={(e) => {
                        setPostalCode(e.target.value);
                        setSelectedRelay(null);
                      }}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm sm:col-span-2">
                    <span className="text-muted">{t("checkout.country")}</span>
                    <input
                      required
                      className={fieldClass}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </label>
                  {addressComplete ? (
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setEditingAddress(false)}
                      >
                        {t("checkout.useSavedAddress")}
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          )}

          {shippingCarrier === "mondial_relay" ? (
            <div className="space-y-3 rounded-3xl border border-border p-4 sm:p-5">
              <h3 className="font-serif text-xl text-primary">
                {t("checkout.relayTitle")}
              </h3>
              <RelayPointPicker
                postalCode={postalCode}
                city={city}
                country={country}
                selectedId={selectedRelay?.id ?? null}
                onSelect={setSelectedRelay}
              />
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-primary">{t("checkout.payment")}</h2>
          {allowManualCheckout ? (
            <p className="rounded-2xl bg-background-alt px-4 py-3 text-sm text-muted">
              {t("checkout.manualNotice")}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              (allowManualCheckout
                ? ["manual", "stripe", "paypal"]
                : ["stripe", "paypal"]) as PaymentMethod[]
            ).map((method) => {
              const active = paymentMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method);
                    setPaypalOrderId(null);
                  }}
                  className={`rounded-2xl border bg-background px-4 py-4 text-left transition ${
                    active
                      ? "border-accent ring-1 ring-accent"
                      : "border-border hover:border-accent"
                  }`}
                >
                  {method === "stripe" ? (
                    <StripeMark className="mb-3 h-8 w-auto object-contain object-left" />
                  ) : method === "paypal" ? (
                    <PayPalMark className="mb-3 h-8 w-auto object-contain object-left" />
                  ) : (
                    <span className="mb-3 block text-xs uppercase tracking-wide text-muted">
                      {t("checkout.methods.manual.label")}
                    </span>
                  )}
                  <span className="block font-medium text-primary">
                    {t(`checkout.methods.${method}.label`)}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {t(`checkout.methods.${method}.hint`)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 size-4 shrink-0 rounded border-border accent-primary"
          />
          <span>
            {t("checkout.acceptTermsLead")}{" "}
            <Link
              href="/conditions-utilisation"
              className="text-primary underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
            >
              {t("legal.nav.terms")}
            </Link>
            {", "}
            <Link
              href="/politique-de-retour"
              className="text-primary underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
            >
              {t("legal.nav.returns")}
            </Link>
            {" "}
            {t("checkout.acceptTermsAnd")}{" "}
            <Link
              href="/confidentialite"
              className="text-primary underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
            >
              {t("legal.nav.privacy")}
            </Link>
            .
          </span>
        </label>

        {error ? (
          <p
            id="checkout-error"
            className="text-sm text-accent"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        ) : null}

        {paymentMethod === "manual" ? (
          <Button type="submit" size="lg" pending={pending}>
            {pending ? t("checkout.loading") : t("checkout.payManual")}
          </Button>
        ) : paymentMethod === "stripe" ? (
          stripePublishableKey ? (
            <Button type="submit" size="lg" pending={pending}>
              {pending ? t("checkout.loading") : t("checkout.payStripe")}
            </Button>
          ) : (
            <p className="text-sm text-muted">{t("checkout.stripeNotConfigured")}</p>
          )
        ) : (
          <div className="space-y-4">
            {!paypalOrderId ? (
              paypalClientId ? (
                <Button type="submit" size="lg" pending={pending}>
                  {pending ? t("checkout.loading") : t("checkout.preparePaypal")}
                </Button>
              ) : (
                <p className="text-sm text-muted">{t("checkout.paypalNotConfigured")}</p>
              )
            ) : paypalClientId ? (
              <PayPalScriptProvider
                options={{
                  clientId: paypalClientId,
                  currency: currency,
                }}
              >
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect" }}
                  createOrder={async () => paypalOrderId}
                  onApprove={async () => {
                    if (paypalCaptureLock.current) return;
                    paypalCaptureLock.current = true;
                    try {
                      const response = await fetch(
                        "/api/checkout/paypal/capture",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            paypalOrderId,
                            orderId: awuraOrderId,
                          }),
                        },
                      );
                      if (!response.ok) {
                        setError(t("checkout.paymentError"));
                        paypalCaptureLock.current = false;
                        return;
                      }
                      clearCart();
                      router.push(`/commande/succes?orderId=${awuraOrderId}`);
                    } catch {
                      paypalCaptureLock.current = false;
                      setError(t("checkout.paymentError"));
                    }
                  }}
                  onError={() => setError(t("checkout.paymentError"))}
                />
              </PayPalScriptProvider>
            ) : (
              <p className="text-sm text-muted">{t("checkout.paypalNotConfigured")}</p>
            )}
          </div>
        )}
      </form>
    </main>
  );
}

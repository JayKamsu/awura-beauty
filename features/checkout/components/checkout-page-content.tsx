"use client";

import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useCart } from "@/features/cart/context/cart-provider";
import { RelayPointPicker } from "@/features/checkout/components/relay-point-picker";
import type { RelayPoint } from "@/lib/domain";
import { formatPrice } from "@/lib/format/price";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import type {
  PaymentMethod,
  ShippingCarrier,
} from "@/lib/infrastructure/supabase/order-types";

export function CheckoutPageContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, session } = useAuth();
  const { currency } = usePreferences();
  const { items, subtotal, clearCart, itemCount } = useCart();
  const { locked: pending, run } = useActionLock();
  const paypalCaptureLock = useRef(false);

  const authHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [shippingCarrier, setShippingCarrier] =
    useState<ShippingCarrier>("laposte");
  const [selectedRelay, setSelectedRelay] = useState<RelayPoint | null>(null);
  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("FR");
  const [error, setError] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [awuraOrderId, setAwuraOrderId] = useState<string | null>(null);

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const orderItems = useMemo(
    () =>
      items.map((item) => ({
        product_id: item.productId,
        slug: item.slug,
        name: item.name,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        image_url: item.imageUrl,
      })),
    [items],
  );

  const shippingAddress = {
    fullName,
    line1,
    city,
    postalCode,
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
  });

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
    if (shippingCarrier === "mondial_relay" && !selectedRelay) {
      setError(t("checkout.relayRequired"));
      return false;
    }
    return true;
  };

  const startStripe = async () => {
    setError(null);
    if (!validateShipping()) return;
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

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      if (paymentMethod === "stripe") {
        await startStripe();
        return;
      }
      await preparePayPal();
    });
  };

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-14 lg:grid-cols-[1.2fr_0.8fr]">
      <aside className="h-fit rounded-3xl bg-background-alt p-5 sm:p-6 lg:order-2 lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl text-primary">{t("checkout.summary")}</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0 break-words text-muted">
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0 text-primary">
                {formatPrice(item.unitPrice * item.quantity, currency, i18n.language)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-sm text-muted">{t("cart.subtotal")}</p>
          <p className="font-serif text-3xl text-primary">
            {formatPrice(subtotal, currency, i18n.language)}
          </p>
          <p className="mt-3 text-sm text-muted">
            {t(`checkout.carriers.${shippingCarrier}.label`)}
            {selectedRelay ? ` · ${selectedRelay.name}` : ""}
          </p>
        </div>
      </aside>

      <form onSubmit={onSubmit} className="space-y-8 lg:order-1">
        <h1 className="font-serif text-3xl text-primary sm:text-4xl">{t("checkout.title")}</h1>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-primary">{t("checkout.shippingMethod")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["laposte", "mondial_relay"] as ShippingCarrier[]).map((carrier) => (
              <button
                key={carrier}
                type="button"
                onClick={() => {
                  setShippingCarrier(carrier);
                  if (carrier !== "mondial_relay") setSelectedRelay(null);
                  setPaypalOrderId(null);
                }}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  shippingCarrier === carrier
                    ? "border-primary bg-primary text-background"
                    : "border-border hover:border-accent"
                }`}
              >
                <span className="block font-medium">
                  {t(`checkout.carriers.${carrier}.label`)}
                </span>
                <span
                  className={`mt-1 block text-sm ${
                    shippingCarrier === carrier
                      ? "text-background/80"
                      : "text-muted"
                  }`}
                >
                  {t(`checkout.carriers.${carrier}.hint`)}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-primary">{t("checkout.shipping")}</h2>
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
                required={shippingCarrier === "mondial_relay"}
                type="tel"
                className={fieldClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </label>
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
          </div>

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
          <div className="grid gap-3 sm:grid-cols-2">
            {(["stripe", "paypal"] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setPaymentMethod(method);
                  setPaypalOrderId(null);
                }}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  paymentMethod === method
                    ? "border-primary bg-primary text-background"
                    : "border-border hover:border-accent"
                }`}
              >
                <span className="block font-medium">
                  {t(`checkout.methods.${method}.label`)}
                </span>
                <span
                  className={`mt-1 block text-sm ${
                    paymentMethod === method ? "text-background/80" : "text-muted"
                  }`}
                >
                  {t(`checkout.methods.${method}.hint`)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        ) : null}

        {paymentMethod === "stripe" ? (
          <Button type="submit" size="lg" pending={pending}>
            {pending ? t("checkout.loading") : t("checkout.payStripe")}
          </Button>
        ) : (
          <div className="space-y-4">
            {!paypalOrderId ? (
              <Button type="submit" size="lg" pending={pending}>
                {pending ? t("checkout.loading") : t("checkout.preparePaypal")}
              </Button>
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

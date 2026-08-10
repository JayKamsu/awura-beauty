"use client";

import { useTranslation } from "react-i18next";
import type {
  ShippingCarrier,
  ShippingStatus,
} from "@/lib/infrastructure/supabase/order-types";

const STEPS: ShippingStatus[] = [
  "preparing",
  "shipped",
  "in_transit",
  "delivered",
];

const PICKUP_STEPS: ShippingStatus[] = ["preparing", "shipped", "delivered"];

function stepIndex(status: ShippingStatus, pickup: boolean) {
  const list = pickup ? PICKUP_STEPS : STEPS;
  const index = list.indexOf(status);
  if (index >= 0) return index;
  // in_transit on pickup map → shipped
  if (pickup && status === "in_transit") return 1;
  return 0;
}

/** Props de la frise de suivi de livraison : statut courant et transporteur. */
type ShippingTimelineProps = {
  status: ShippingStatus;
  carrier?: ShippingCarrier | null;
};

/** Frise visuelle des étapes de livraison, adaptée au retrait en magasin ou à l'expédition classique. */
export function ShippingTimeline({ status, carrier }: ShippingTimelineProps) {
  const { t } = useTranslation();
  const pickup = carrier === "pickup";
  const steps = pickup ? PICKUP_STEPS : STEPS;
  const current = stepIndex(status, pickup);

  return (
    <ol className="space-y-3" aria-label={t("account.shippingTimeline")}>
      {steps.map((step, index) => {
        const done = index <= current;
        const active = index === current;
        const label = pickup
          ? t(`account.pickupSteps.${step}`)
          : t(`account.status.shipping.${step}`);

        return (
          <li key={step} className="flex items-start gap-3 text-sm">
            <span
              className={`mt-0.5 inline-flex size-2.5 shrink-0 rounded-full ${
                done ? "bg-accent" : "bg-border"
              }`}
              aria-hidden
            />
            <span
              className={
                active
                  ? "font-medium text-primary"
                  : done
                    ? "text-primary"
                    : "text-muted"
              }
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

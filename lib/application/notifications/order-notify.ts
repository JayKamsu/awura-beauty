/**
 * Notifications commande / livraison (push) avec liens de redirection.
 */
import {
  notifyAdminUsers,
  notifyOrderUser,
} from "@/lib/connectors/firebase";
import { absoluteUrl } from "@/lib/site";
import type {
  ShippingCarrier,
  ShippingStatus,
} from "@/lib/infrastructure/supabase/order-types";

const CARRIER_LABEL: Record<ShippingCarrier, string> = {
  laposte: "Colissimo (domicile)",
  mondial_relay: "Mondial Relay (Point Relais)",
  pickup: "retrait sur place",
};

/** Chemin de la page compte client, ancré sur la commande concernée. */
export function orderAccountPath(orderId: string) {
  return `/compte?order=${encodeURIComponent(orderId)}#commandes`;
}

/** Chemin de la page admin commandes, filtré sur la commande concernée. */
export function orderAdminPath(orderId: string) {
  return `/admin/commandes?order=${encodeURIComponent(orderId)}`;
}

/** URL absolue vers la commande dans le compte client, pour les notifs/emails. */
export function orderAccountLink(orderId: string) {
  return absoluteUrl(orderAccountPath(orderId));
}

/** URL absolue vers la commande côté admin, pour les notifs internes. */
export function orderAdminLink(orderId: string) {
  return absoluteUrl(orderAdminPath(orderId));
}

type OrderNotifyBase = {
  userId: string | null | undefined;
  orderId: string;
  trackingNumber?: string | null;
};

/** Notifie le client (paiement confirmé) et l'équipe admin (nouvelle commande) après un paiement réussi. */
export async function notifyOrderPaid(input: OrderNotifyBase & {
  pickup?: boolean;
}): Promise<void> {
  const pickup = Boolean(input.pickup);
  await notifyOrderUser({
    userId: input.userId,
    title: "Commande confirmée",
    body: pickup
      ? "Paiement reçu. Nous préparons votre retrait sur place."
      : "Merci ! Votre paiement Awura Beauty est confirmé. Votre reçu est disponible dans Mon compte.",
    link: orderAccountLink(input.orderId),
  });

  await notifyAdminUsers({
    title: "Nouvelle commande",
    body: `Commande ${input.orderId.slice(0, 8)} payée.`,
    link: orderAdminLink(input.orderId),
  });
}

/** Notifie le client qu'un remboursement a été enregistré sur sa commande. */
export async function notifyOrderRefunded(input: OrderNotifyBase): Promise<void> {
  await notifyOrderUser({
    userId: input.userId,
    title: "Remboursement enregistré",
    body: "Le remboursement de votre commande Awura Beauty a été enregistré. Consultez le détail dans Mon compte.",
    link: orderAccountLink(input.orderId),
  });
}

/** Notifie le client d'un changement de statut de livraison ; no-op si le statut n'a pas réellement changé. */
export async function notifyShippingStatusChange(input: OrderNotifyBase & {
  status: ShippingStatus;
  previousStatus?: ShippingStatus | null;
  pickup?: boolean;
}): Promise<void> {
  if (input.previousStatus && input.previousStatus === input.status) return;

  const pickup = Boolean(input.pickup);
  let title: string;
  let body: string;

  if (pickup) {
    if (input.status === "shipped") {
      title = "Commande prête au retrait";
      body =
        "Votre commande Awura Beauty est prête. Vous pouvez venir la chercher.";
    } else if (input.status === "delivered") {
      title = "Commande récupérée";
      body = "Merci d’avoir récupéré votre commande Awura Beauty.";
    } else {
      title = "Commande en préparation";
      body =
        "Votre commande est confirmée. Nous vous prévenons dès qu’elle est prête au retrait.";
    }
  } else if (input.status === "preparing") {
    title = "Commande en préparation";
    body = "Votre commande Awura Beauty est en cours de préparation.";
  } else if (input.status === "shipped") {
    title = "Commande expédiée";
    body = input.trackingNumber
      ? `Votre colis est en route (suivi : ${input.trackingNumber}).`
      : "Votre colis Awura Beauty est en route.";
  } else if (input.status === "in_transit") {
    title = "Colis en transit";
    body = input.trackingNumber
      ? `Votre colis avance (suivi : ${input.trackingNumber}).`
      : "Votre colis Awura Beauty est en transit.";
  } else {
    title = "Colis livré";
    body = "Votre commande Awura Beauty a été livrée. Merci !";
  }

  await notifyOrderUser({
    userId: input.userId,
    title,
    body,
    link: orderAccountLink(input.orderId),
  });
}

/** Notifie le client d'un changement de transporteur (avec Point Relais si Mondial Relay). */
export async function notifyCarrierChanged(input: {
  userId: string | null | undefined;
  orderId: string;
  previousCarrier: ShippingCarrier | null;
  shippingCarrier: ShippingCarrier;
  relayPointId?: string | null;
}): Promise<void> {
  const nextLabel = CARRIER_LABEL[input.shippingCarrier];
  const relayHint =
    input.shippingCarrier === "mondial_relay" && input.relayPointId
      ? ` (Point Relais ${input.relayPointId})`
      : "";

  await notifyOrderUser({
    userId: input.userId,
    title: "Mode de livraison mis à jour",
    body: `Votre commande sera livrée via ${nextLabel}${relayHint}. Consultez le détail dans votre compte.`,
    link: orderAccountLink(input.orderId),
  });
}

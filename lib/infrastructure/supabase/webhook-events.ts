import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";

/**
 * Dédupe les événements webhook (Stripe event.id).
 * Retourne true si l’événement est nouveau et doit être traité.
 */
export async function claimWebhookEvent(
  provider: "stripe" | "paypal",
  eventId: string,
): Promise<boolean> {
  if (!eventId) return true;
  const supabase = createAdminSupabaseClient();
  if (!supabase) return true;

  const { error } = await supabase.from("webhook_events").insert({
    provider,
    event_id: eventId,
  });

  if (!error) return true;
  // Conflit unique = déjà traité
  if (error.code === "23505") return false;
  // Table absente en local : ne pas bloquer le paiement
  if (error.message?.includes("webhook_events")) return true;
  return true;
}

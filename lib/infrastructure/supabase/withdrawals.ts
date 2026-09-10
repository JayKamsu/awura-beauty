import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";
import type { WithdrawalDeclaration } from "@/lib/domain/withdrawal";

/** Enregistre une déclaration de rétractation (service_role). */
export async function insertWithdrawalRequest(
  declaration: WithdrawalDeclaration,
  submittedAt: Date,
): Promise<{ id: string } | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("withdrawal_requests")
    .insert({
      first_name: declaration.firstName,
      last_name: declaration.lastName,
      order_ref: declaration.orderRef,
      order_date: declaration.orderDate,
      contract_details: declaration.contractDetails,
      ack_email: declaration.ackEmail,
      submitted_at: submittedAt.toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("[withdrawal] insert", error?.message);
    return null;
  }
  return { id: String((data as { id: string }).id) };
}

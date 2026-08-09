import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";

export type DiagnosticEntitlement = {
  id: string;
  userId: string | null;
  email: string;
  orderId: string;
  status: "available" | "consumed" | "cancelled";
  appointmentId: string | null;
  createdAt: string;
};

function mapEntitlement(row: Record<string, unknown>): DiagnosticEntitlement {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    email: String(row.email ?? "").toLowerCase(),
    orderId: String(row.order_id ?? ""),
    status: (row.status as DiagnosticEntitlement["status"]) ?? "available",
    appointmentId: row.appointment_id ? String(row.appointment_id) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

/** Crée N entitlements (1 par unité de gamme complète). Idempotent par order_id. */
export async function grantDiagnosticEntitlements(input: {
  userId: string | null;
  email: string;
  orderId: string;
  count: number;
}): Promise<number> {
  const count = Math.max(0, Math.floor(input.count));
  if (count === 0) return 0;

  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return 0;

  const { count: existing } = await supabase
    .from("diagnostic_entitlements")
    .select("id", { count: "exact", head: true })
    .eq("order_id", input.orderId);

  if ((existing ?? 0) > 0) return existing ?? 0;

  const email = input.email.trim().toLowerCase();
  const rows = Array.from({ length: count }, () => ({
    user_id: input.userId,
    email,
    order_id: input.orderId,
    source: "gamme-complete",
    status: "available",
  }));

  const { data, error } = await supabase
    .from("diagnostic_entitlements")
    .insert(rows)
    .select("id");

  if (error) return 0;
  return data?.length ?? 0;
}

/** Première entitlement disponible pour userId ou email. */
export async function findAvailableDiagnosticEntitlement(input: {
  userId: string | null;
  email: string;
}): Promise<DiagnosticEntitlement | null> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return null;

  const email = input.email.trim().toLowerCase();

  if (input.userId) {
    const { data } = await supabase
      .from("diagnostic_entitlements")
      .select("*")
      .eq("status", "available")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) return mapEntitlement(data as Record<string, unknown>);
  }

  if (!email) return null;

  const { data } = await supabase
    .from("diagnostic_entitlements")
    .select("*")
    .eq("status", "available")
    .eq("email", email)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return mapEntitlement(data as Record<string, unknown>);
}

export async function consumeDiagnosticEntitlement(input: {
  entitlementId: string;
  appointmentId: string;
}): Promise<boolean> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("diagnostic_entitlements")
    .update({
      status: "consumed",
      appointment_id: input.appointmentId,
      consumed_at: new Date().toISOString(),
    })
    .eq("id", input.entitlementId)
    .eq("status", "available")
    .select("id")
    .maybeSingle();

  return Boolean(!error && data);
}

export async function countAvailableDiagnosticEntitlements(input: {
  userId: string | null;
  email?: string;
}): Promise<number> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return 0;

  if (input.userId) {
    const { count } = await supabase
      .from("diagnostic_entitlements")
      .select("id", { count: "exact", head: true })
      .eq("status", "available")
      .eq("user_id", input.userId);
    if (count && count > 0) return count;
  }

  const email = input.email?.trim().toLowerCase();
  if (!email) return 0;

  const { count } = await supabase
    .from("diagnostic_entitlements")
    .select("id", { count: "exact", head: true })
    .eq("status", "available")
    .eq("email", email);

  return count ?? 0;
}

import { Suspense } from "react";
import { AdminOrdersPanel } from "@/features/admin/components/admin-orders-panel";

export default function AdminCommandesPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersPanel />
    </Suspense>
  );
}

import { Suspense } from "react";
import { AdminConnexionContent } from "@/features/admin/components/admin-connexion-content";

export default function AdminConnexionPage() {
  return (
    <Suspense fallback={null}>
      <AdminConnexionContent />
    </Suspense>
  );
}

import { Suspense } from "react";
import { DiagnosticAppointmentSuccess } from "@/features/diagnostic/components/diagnostic-appointment-success";

/** Page de confirmation après prise de rendez-vous de diagnostic capillaire. */
export default function DiagnosticRdvSuccesPage() {
  return (
    <Suspense fallback={null}>
      <DiagnosticAppointmentSuccess />
    </Suspense>
  );
}

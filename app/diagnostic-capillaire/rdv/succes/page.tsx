import { Suspense } from "react";
import { DiagnosticAppointmentSuccess } from "@/features/diagnostic/components/diagnostic-appointment-success";

export default function DiagnosticRdvSuccesPage() {
  return (
    <Suspense fallback={null}>
      <DiagnosticAppointmentSuccess />
    </Suspense>
  );
}

import { Suspense } from "react";
import { DiagnosticPageContent } from "@/features/diagnostic/components/diagnostic-page-content";

/** Page "Diagnostic capillaire". */
export default function DiagnosticCapillairePage() {
  return (
    <Suspense fallback={null}>
      <DiagnosticPageContent />
    </Suspense>
  );
}

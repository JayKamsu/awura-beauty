import { LegalPage } from "@/features/legal/legal-page";
import { legalPageMetadata } from "@/lib/legal/pages";

export const metadata = legalPageMetadata("politique-de-retour");

/** Page Politique de retour et droit de rétractation. */
export default function PolitiqueDeRetourPage() {
  return <LegalPage slug="politique-de-retour" />;
}

import { LegalPage } from "@/features/legal/legal-page";
import { legalPageMetadata } from "@/lib/legal/pages";

export const metadata = legalPageMetadata("conditions-utilisation");

/** Page Conditions générales d’utilisation et de vente. */
export default function ConditionsUtilisationPage() {
  return <LegalPage slug="conditions-utilisation" />;
}

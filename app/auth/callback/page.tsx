import { Suspense } from "react";
import { AuthCallbackPage } from "@/features/auth/components/auth-callback-page";

export default function AuthCallbackRoute() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackPage />
    </Suspense>
  );
}

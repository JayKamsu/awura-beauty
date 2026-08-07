import { NextResponse } from "next/server";

/** Config Firebase publique pour le service worker FCM. */
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  if (!config.apiKey || !config.projectId) {
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }

  return NextResponse.json(config, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}

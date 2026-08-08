"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { DiagnosticVideoRoom } from "@/features/diagnostic/components/diagnostic-video-room";

type PageProps = {
  params: Promise<{ appointmentId: string }>;
};

function VideoRoomInner({ appointmentId }: { appointmentId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  return (
    <DiagnosticVideoRoom appointmentId={appointmentId} token={token} />
  );
}

export default function DiagnosticVisioPage({ params }: PageProps) {
  const { appointmentId } = use(params);
  return (
    <Suspense fallback={null}>
      <VideoRoomInner appointmentId={appointmentId} />
    </Suspense>
  );
}

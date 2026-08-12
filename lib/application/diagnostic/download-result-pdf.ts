/** Télécharge le PDF du bilan diagnostic via la route API authentifiée (client propriétaire ou admin). */
export async function downloadDiagnosticResultPdf(
  diagnosticId: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`/api/diagnostic/results/${diagnosticId}/pdf`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bilan-diagnostic-awura-${diagnosticId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

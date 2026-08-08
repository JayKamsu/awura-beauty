"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type ProductQrProps = {
  targetUrl: string;
  productName: string;
  className?: string;
};

/** QR généré côté client (libellé + image SVG data). */
export function ProductQr({
  targetUrl,
  productName,
  className = "",
}: ProductQrProps) {
  const { t } = useTranslation();
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then((QRCode) => {
      void QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 200,
        color: {
          dark: "#0F3D2E",
          light: "#E6D9C1",
        },
      }).then((url) => {
        if (!cancelled) setDataUrl(url);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [targetUrl]);

  return (
    <div className={`flex flex-col items-start gap-3 sm:flex-row sm:items-center ${className}`}>
      <div className="rounded-xl border border-border bg-background p-2">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={t("shop.qrAlt", { name: productName })}
            width={160}
            height={160}
            className="size-40"
          />
        ) : (
          <div className="size-40 animate-pulse rounded-lg bg-background-alt" />
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="break-all text-xs text-muted">{targetUrl}</p>
        <a
          href={targetUrl}
          className="text-sm text-accent underline-offset-2 hover:underline"
        >
          {t("shop.qrOpenLink")}
        </a>
      </div>
    </div>
  );
}

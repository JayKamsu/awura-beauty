"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DiagnosticPhoto, DiagnosticPhotoAngle } from "@/lib/domain/diagnostic";

const ANGLES: DiagnosticPhotoAngle[] = [
  "face",
  "profil_gauche",
  "profil_droit",
  "arriere",
  "pointes",
];

const ANGLE_LABELS: Record<DiagnosticPhotoAngle, { fr: string; en: string; es: string }> = {
  face: { fr: "Face", en: "Front", es: "Frente" },
  profil_gauche: { fr: "Profil gauche", en: "Left profile", es: "Perfil izquierdo" },
  profil_droit: { fr: "Profil droit", en: "Right profile", es: "Perfil derecho" },
  arriere: { fr: "Arrière", en: "Back", es: "Atrás" },
  pointes: { fr: "Pointes", en: "Ends", es: "Puntas" },
};

/** Icône simple par angle (silhouette de tête stylisée en SVG, pas de dépendance externe). */
function AngleIcon({ angle }: { angle: DiagnosticPhotoAngle }) {
  const common = "h-7 w-7";
  switch (angle) {
    case "face":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" />
          <circle cx="9" cy="11" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="15" cy="11" r="0.8" fill="currentColor" stroke="none" />
          <path d="M9 15c1 1 5 1 6 0" strokeLinecap="round" />
        </svg>
      );
    case "profil_gauche":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16 4c-4 0-7 3.5-7 8 0 2 .7 3.3 1.5 4.5L9 20h3l.8-2c1.2.3 2.3.2 3.2-.3 1.8-1 2-3 2-3s2-.5 2-2.5-1-3-1-3 .5-1.5-1-3.5S18 4 16 4Z" />
        </svg>
      );
    case "profil_droit":
      return (
        <svg viewBox="0 0 24 24" className={`${common} -scale-x-100`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16 4c-4 0-7 3.5-7 8 0 2 .7 3.3 1.5 4.5L9 20h3l.8-2c1.2.3 2.3.2 3.2-.3 1.8-1 2-3 2-3s2-.5 2-2.5-1-3-1-3 .5-1.5-1-3.5S18 4 16 4Z" />
        </svg>
      );
    case "arriere":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16M8 6c-1 2-1 4 0 6M16 6c1 2 1 4 0 6" strokeLinecap="round" />
        </svg>
      );
    case "pointes":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 4c0 6 0 10-1 16M12 4c0 6 .5 10 0 16M17 4c0 6 1 10 2 16" strokeLinecap="round" />
        </svg>
      );
  }
}

type PhotoUploadState = {
  path: string | null;
  previewUrl: string | null;
  uploading: boolean;
  error: string | null;
};

function emptyState(): PhotoUploadState {
  return { path: null, previewUrl: null, uploading: false, error: null };
}

/**
 * Zone d'upload des 5 photos du diagnostic (face, profils, arrière, pointes).
 * Optionnelle : le client peut passer cette étape. Stocke les chemins privés
 * uploadés et remonte la liste complète via onChange à chaque changement.
 */
export function DiagnosticPhotoUpload({
  sessionId,
  onChange,
}: {
  sessionId: string;
  onChange: (photos: DiagnosticPhoto[]) => void;
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en")
    ? "en"
    : i18n.language?.startsWith("es")
      ? "es"
      : "fr";
  const [states, setStates] = useState<Record<DiagnosticPhotoAngle, PhotoUploadState>>(
    () =>
      Object.fromEntries(ANGLES.map((a) => [a, emptyState()])) as Record<
        DiagnosticPhotoAngle,
        PhotoUploadState
      >,
  );
  const inputRefs = useRef<Partial<Record<DiagnosticPhotoAngle, HTMLInputElement | null>>>({});

  const emitChange = (next: Record<DiagnosticPhotoAngle, PhotoUploadState>) => {
    const photos: DiagnosticPhoto[] = ANGLES.filter((a) => next[a].path).map((a) => ({
      angle: a,
      path: next[a].path as string,
    }));
    onChange(photos);
  };

  const handleFile = async (angle: DiagnosticPhotoAngle, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setStates((prev) => {
      const next = { ...prev, [angle]: { ...prev[angle], uploading: true, error: null, previewUrl } };
      return next;
    });

    const form = new FormData();
    form.append("file", file);
    form.append("angle", angle);
    form.append("sessionId", sessionId);

    try {
      const res = await fetch("/api/diagnostic/photos", { method: "POST", body: form });
      const json = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !json.path) {
        setStates((prev) => {
          const next = {
            ...prev,
            [angle]: { ...prev[angle], uploading: false, error: json.error ?? "Erreur" },
          };
          return next;
        });
        return;
      }
      setStates((prev) => {
        const next = {
          ...prev,
          [angle]: { path: json.path as string, previewUrl, uploading: false, error: null },
        };
        emitChange(next);
        return next;
      });
    } catch {
      setStates((prev) => ({
        ...prev,
        [angle]: { ...prev[angle], uploading: false, error: "Erreur réseau" },
      }));
    }
  };

  const removePhoto = (angle: DiagnosticPhotoAngle) => {
    setStates((prev) => {
      const next = { ...prev, [angle]: emptyState() };
      emitChange(next);
      return next;
    });
    const input = inputRefs.current[angle];
    if (input) input.value = "";
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ANGLES.map((angle) => {
        const state = states[angle];
        const label = ANGLE_LABELS[angle][lang];
        return (
          <div key={angle} className="flex flex-col gap-2">
            <input
              ref={(el) => {
                inputRefs.current[angle] = el;
              }}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(angle, file);
              }}
            />
            <button
              type="button"
              onClick={() => inputRefs.current[angle]?.click()}
              className={`group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed p-3 text-center transition ${
                state.path
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background-alt hover:border-accent hover:bg-accent/5"
              }`}
            >
              {state.previewUrl ? (
                <img
                  src={state.previewUrl}
                  alt={label}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              {state.previewUrl ? (
                <div className="absolute inset-0 bg-black/35" />
              ) : null}
              <div
                className={`relative flex flex-col items-center gap-1.5 ${
                  state.previewUrl ? "text-white" : "text-muted"
                }`}
              >
                {!state.previewUrl ? <AngleIcon angle={angle} /> : null}
                <span className="text-xs font-medium">{label}</span>
                {state.uploading ? (
                  <span className="text-[0.65rem]">…</span>
                ) : state.path ? (
                  <span className="text-[0.65rem] font-medium text-background">✓</span>
                ) : null}
              </div>
            </button>
            {state.error ? (
              <p className="text-center text-[0.7rem] text-accent">{state.error}</p>
            ) : null}
            {state.path ? (
              <button
                type="button"
                onClick={() => removePhoto(angle)}
                className="text-center text-[0.7rem] text-muted underline hover:text-accent"
              >
                {lang === "en" ? "Remove" : lang === "es" ? "Quitar" : "Retirer"}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

"use client";

type AdminFeedbackProps = {
  tone: "success" | "error";
  message: string;
};

export function AdminFeedback({ tone, message }: AdminFeedbackProps) {
  const className =
    tone === "success"
      ? "border-primary/20 bg-primary/5 text-primary"
      : "border-accent/30 bg-accent/10 text-accent";

  return (
    <p
      className={`rounded-xl border px-4 py-3 text-sm ${className}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

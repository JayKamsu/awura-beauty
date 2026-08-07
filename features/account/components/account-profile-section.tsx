"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { getMyProfile, updateMyProfile } from "@/lib/infrastructure/supabase/profiles";
import type { ProfileRow } from "@/lib/infrastructure/supabase/profile-types";

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

type AccountProfileSectionProps = {
  email: string;
  memberSince?: string;
};

export function AccountProfileSection({
  email,
  memberSince,
}: AccountProfileSectionProps) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void getMyProfile().then((data) => {
      if (!mounted) return;
      setProfile(data);
      setFirstName(data?.first_name ?? "");
      setLastName(data?.last_name ?? "");
      setPhone(data?.phone ?? "");
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await updateMyProfile({
      first_name: firstName,
      last_name: lastName,
      phone,
    });
    setPending(false);
    if (result.error || !result.profile) {
      setError(result.error ?? t("account.profileSaveError"));
      return;
    }
    setProfile(result.profile);
    setMessage(t("account.profileSaved"));
  };

  return (
    <section id="profil" className="space-y-4 rounded-2xl border border-border p-6">
      <h2 className="font-serif text-2xl text-primary">{t("account.profileTitle")}</h2>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">{t("account.profileEmail")}</dt>
          <dd className="mt-1 text-foreground">{email}</dd>
        </div>
        {memberSince ? (
          <div>
            <dt className="text-muted">{t("account.profileSince")}</dt>
            <dd className="mt-1 text-foreground">{memberSince}</dd>
          </div>
        ) : null}
      </dl>

      {loading ? (
        <p className="text-sm text-muted">{t("account.profileLoading")}</p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("account.profileFirstName")}</span>
            <input
              className={fieldClass}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("account.profileLastName")}</span>
            <input
              className={fieldClass}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </label>
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="text-muted">{t("account.profilePhone")}</span>
            <input
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              type="tel"
            />
          </label>
          {error ? (
            <p className="text-sm text-accent sm:col-span-2" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="text-sm text-primary sm:col-span-2" role="status">
              {message}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? t("account.profileSaving") : t("account.profileSave")}
            </Button>
          </div>
          {profile?.updated_at &&
          (profile.first_name || profile.last_name || profile.phone) ? (
            <p className="text-xs text-muted sm:col-span-2">
              {t("account.profileUpdatedAt", {
                date: new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(profile.updated_at)),
              })}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}

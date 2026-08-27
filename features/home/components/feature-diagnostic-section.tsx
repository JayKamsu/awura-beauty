"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import {
  cmsOr,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";
import { writeDiagnosticLead } from "@/features/diagnostic/lib/lead-storage";
import { HOME_IMAGES } from "@/features/home/data/content";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import type { DiagnosticChannel } from "@/lib/domain/diagnostic";
import { getMyProfile } from "@/lib/infrastructure/supabase/profiles";
import { profileFullName } from "@/lib/infrastructure/supabase/profile-types";

const fieldClass =
  "w-full rounded-xl border border-border/80 bg-background px-3.5 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

/**
 * Bloc diagnostic accueil — formulaire + feuillage (maquette Luxury Organic).
 */
export function FeatureDiagnosticSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const cms = usePageCmsFields("feature");
  const { locked: pending, run } = useActionLock();
  const leafImage = cmsOr(cms, "image_url", HOME_IMAGES.feature);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hairType, setHairType] = useState("");
  const [concern, setConcern] = useState("");
  const [goal, setGoal] = useState("");
  const [channel, setChannel] = useState<DiagnosticChannel | "">("");
  const [profileFilled, setProfileFilled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user) {
        setProfileFilled(false);
        return;
      }
      let nextName = "";
      const nextEmail = user.email ?? "";
      let nextPhone = "";
      const profile = await getMyProfile();
      if (cancelled) return;
      if (profile) {
        nextName = profileFullName(profile);
        if (profile.phone.trim()) nextPhone = profile.phone.trim();
      }
      const metaName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : "";
      if (!nextName && metaName) nextName = metaName;
      setFullName(nextName);
      setEmail(nextEmail);
      setPhone(nextPhone);
      setProfileFilled(
        Boolean(nextName.trim() && nextEmail.trim() && nextPhone.trim()),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const hairTypes = t("home.diagnostic.options.hairType", {
    returnObjects: true,
  }) as string[];
  const concerns = t("home.diagnostic.options.concern", {
    returnObjects: true,
  }) as string[];
  const goals = t("home.diagnostic.options.goal", {
    returnObjects: true,
  }) as string[];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const [firstName, ...rest] = fullName.trim().split(/\s+/);
      writeDiagnosticLead({
        firstName: firstName || fullName.trim(),
        lastName: rest.join(" "),
        email: email.trim(),
        phone: phone.trim(),
        hairType,
        concern,
        goal,
        channel: channel || "physical",
      });
      router.push(
        `/diagnostic-capillaire?mode=${channel === "online" ? "online" : "physical"}`,
      );
    });
  };

  return (
    <section className="relative overflow-hidden bg-background-alt">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:py-20">
        <div className="relative z-[1] space-y-6">
          <div className="space-y-3">
            <h2 className="font-serif text-3xl text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              {cmsOr(cms, "title", t("home.diagnostic.title"))}
            </h2>
            <p className="font-medium tracking-wide text-accent">
              {t("home.diagnostic.tagline")}
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              {cmsOr(cms, "body", t("home.diagnostic.subtitle"))}
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="grid gap-3 sm:grid-cols-2 sm:gap-4"
          >
            {profileFilled ? (
              <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm sm:col-span-2">
                <p className="font-medium text-primary">{fullName}</p>
                <p className="text-muted">
                  {email}
                  {phone ? ` · ${phone}` : null}
                </p>
              </div>
            ) : (
              <>
                <label className="block space-y-1.5 text-sm sm:col-span-2">
                  <span className="sr-only">
                    {t("home.diagnostic.fields.fullName")}
                  </span>
                  <input
                    required
                    className={fieldClass}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("home.diagnostic.fields.fullName")}
                    autoComplete="name"
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="sr-only">
                    {t("home.diagnostic.fields.email")}
                  </span>
                  <input
                    required
                    type="email"
                    className={fieldClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("home.diagnostic.fields.email")}
                    autoComplete="email"
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="sr-only">
                    {t("home.diagnostic.fields.phone")}
                  </span>
                  <input
                    type="tel"
                    className={fieldClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("home.diagnostic.fields.phone")}
                    autoComplete="tel"
                  />
                </label>
              </>
            )}
            <label className="block space-y-1.5 text-sm">
              <span className="sr-only">{t("home.diagnostic.fields.hairType")}</span>
              <select
                required
                className={fieldClass}
                value={hairType}
                onChange={(e) => setHairType(e.target.value)}
              >
                <option value="">
                  {t("home.diagnostic.fields.hairType")}
                </option>
                {Array.isArray(hairTypes)
                  ? hairTypes.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))
                  : null}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="sr-only">{t("home.diagnostic.fields.concern")}</span>
              <select
                required
                className={fieldClass}
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
              >
                <option value="">
                  {t("home.diagnostic.fields.concern")}
                </option>
                {Array.isArray(concerns)
                  ? concerns.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))
                  : null}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm sm:col-span-2">
              <span className="sr-only">{t("home.diagnostic.fields.goal")}</span>
              <select
                required
                className={fieldClass}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="">{t("home.diagnostic.fields.goal")}</option>
                {Array.isArray(goals)
                  ? goals.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))
                  : null}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm sm:col-span-2">
              <span className="sr-only">
                {t("home.diagnostic.fields.channel")}
              </span>
              <select
                required
                className={fieldClass}
                value={channel}
                onChange={(e) =>
                  setChannel(e.target.value as DiagnosticChannel | "")
                }
              >
                <option value="">
                  {t("home.diagnostic.fields.channel")}
                </option>
                <option value="online">
                  {t("home.diagnostic.fields.channelOnline")}
                </option>
                <option value="physical">
                  {t("home.diagnostic.fields.channelPhysical")}
                </option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="w-full" pending={pending}>
                {cmsOr(cms, "cta_label", t("home.diagnostic.submit"))}
              </Button>
            </div>
          </form>
        </div>

        <div className="relative mx-auto hidden min-h-[28rem] w-full max-w-md lg:block lg:max-w-none lg:min-h-[32rem]">
          <div
            className="absolute -right-6 top-4 h-[72%] w-[78%] overflow-hidden rounded-[2.5rem] bg-primary shadow-lg"
            aria-hidden
          >
            <Image
              src={leafImage}
              alt=""
              fill
              className="object-cover object-center opacity-90"
              sizes="40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/50 via-transparent to-accent-light/20" />
          </div>
          <div
            className="absolute bottom-2 right-8 h-[48%] w-[55%] overflow-hidden rounded-[45%_55%_40%_60%] ring-4 ring-background-alt"
            aria-hidden
          >
            <Image
              src="/images/ingredients/ingredient-1.jpg"
              alt=""
              fill
              className="object-cover scale-110"
              sizes="30vw"
            />
          </div>
          <div
            className="absolute left-0 top-1/3 h-[42%] w-[48%] -rotate-6 overflow-hidden rounded-[60%_40%_55%_45%] ring-4 ring-background-alt"
            aria-hidden
          >
            <Image
              src="/images/ingredients/ingredient-3.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 opacity-40 lg:hidden"
        aria-hidden
      >
        <Image
          src="/images/ingredients/ingredient-1.jpg"
          alt=""
          fill
          className="rounded-full object-cover"
          sizes="160px"
        />
      </div>
    </section>
  );
}

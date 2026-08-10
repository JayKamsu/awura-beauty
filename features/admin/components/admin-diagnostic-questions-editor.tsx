"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { AWURA_PRODUCT_SLUGS } from "@/lib/application/diagnostic/recommend";
import type {
  DiagnosticOption,
  DiagnosticQuestion,
  DiagnosticQuestionChannel,
} from "@/lib/domain/diagnostic";

const CHANNELS: DiagnosticQuestionChannel[] = ["online", "physical_pre", "both"];

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function emptyOptionForm(questionId: string) {
  return {
    id: undefined as string | undefined,
    questionId,
    valueKey: "",
    labelFr: "",
    hintFr: "",
    scoreRules: [] as { slug: string; points: number }[],
  };
}

function scoreRulesToArray(rules: Record<string, number>) {
  return Object.entries(rules).map(([slug, points]) => ({ slug, points }));
}

function scoreRulesToObject(rules: { slug: string; points: number }[]) {
  const out: Record<string, number> = {};
  for (const rule of rules) {
    if (!rule.slug) continue;
    out[rule.slug] = rule.points;
  }
  return out;
}

export function AdminDiagnosticQuestionsEditor({
  questions,
  onReload,
}: {
  questions: DiagnosticQuestion[];
  onReload: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<
    ReturnType<typeof emptyOptionForm> | null
  >(null);
  const [savingOption, setSavingOption] = useState(false);

  const [questionDrafts, setQuestionDrafts] = useState<
    Record<string, Partial<DiagnosticQuestion>>
  >({});

  const draftFor = (q: DiagnosticQuestion) => ({ ...q, ...questionDrafts[q.id] });

  const updateDraft = (id: string, patch: Partial<DiagnosticQuestion>) => {
    setQuestionDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const saveQuestion = async (question: DiagnosticQuestion) => {
    const draft = draftFor(question);
    if (!draft.questionKey.trim() || !draft.titleFr.trim()) {
      setFeedback({ tone: "error", message: t("admin.diagnostic.questionKeyRequired") });
      return;
    }
    setSavingQuestionId(question.id);
    setFeedback(null);
    const res = await adminFetch("/api/admin/diagnostic/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: {
          id: question.id.startsWith("new-") ? undefined : question.id,
          questionKey: draft.questionKey,
          channel: draft.channel,
          position: draft.position,
          enabled: draft.enabled,
          titleFr: draft.titleFr,
          titleEn: draft.titleEn || draft.titleFr,
          titleEs: draft.titleEs || draft.titleFr,
          subtitleFr: draft.subtitleFr,
          subtitleEn: draft.subtitleEn || draft.subtitleFr,
          subtitleEs: draft.subtitleEs || draft.subtitleFr,
        },
      }),
    });
    setSavingQuestionId(null);
    if (!res.ok) {
      setFeedback({ tone: "error", message: t("admin.saveError") });
      return;
    }
    setFeedback({ tone: "success", message: t("admin.diagnostic.questionSaved") });
    setQuestionDrafts((prev) => {
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
    await onReload();
  };

  const deleteQuestion = async (id: string) => {
    await adminFetch(`/api/admin/diagnostic/questions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setFeedback({ tone: "success", message: t("admin.diagnostic.questionDeleted") });
    if (expandedId === id) setExpandedId(null);
    await onReload();
  };

  const addQuestion = () => {
    const id = `new-${Date.now()}`;
    setQuestionDrafts((prev) => ({
      ...prev,
      [id]: {
        id,
        questionKey: "",
        channel: "online",
        position: questions.length,
        enabled: true,
        titleFr: "",
        titleEn: "",
        titleEs: "",
        subtitleFr: "",
        subtitleEn: "",
        subtitleEs: "",
        options: [],
      },
    }));
    // Le brouillon n'a pas encore de contrepartie dans `questions` — on l'affiche via une carte locale.
    setExpandedId(id);
  };

  const startEditOption = (questionId: string, option?: DiagnosticOption) => {
    setEditingOption(
      option
        ? {
            id: option.id,
            questionId,
            valueKey: option.valueKey,
            labelFr: option.labelFr,
            hintFr: option.hintFr,
            scoreRules: scoreRulesToArray(option.scoreRules),
          }
        : emptyOptionForm(questionId),
    );
  };

  const saveOption = async () => {
    if (!editingOption) return;
    if (!editingOption.valueKey.trim() || !editingOption.labelFr.trim()) {
      setFeedback({ tone: "error", message: t("admin.diagnostic.optionRequired") });
      return;
    }
    setSavingOption(true);
    setFeedback(null);
    const question = questions.find((q) => q.id === editingOption.questionId);
    const position = editingOption.id
      ? (question?.options.find((o) => o.id === editingOption.id)?.position ?? 0)
      : (question?.options.length ?? 0);
    const res = await adminFetch("/api/admin/diagnostic/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "option",
        option: {
          id: editingOption.id,
          questionId: editingOption.questionId,
          valueKey: editingOption.valueKey,
          position,
          enabled: true,
          labelFr: editingOption.labelFr,
          labelEn: editingOption.labelFr,
          labelEs: editingOption.labelFr,
          hintFr: editingOption.hintFr,
          hintEn: editingOption.hintFr,
          hintEs: editingOption.hintFr,
          scoreRules: scoreRulesToObject(editingOption.scoreRules),
        },
      }),
    });
    setSavingOption(false);
    if (!res.ok) {
      setFeedback({ tone: "error", message: t("admin.saveError") });
      return;
    }
    setFeedback({ tone: "success", message: t("admin.diagnostic.optionSaved") });
    setEditingOption(null);
    await onReload();
  };

  const deleteOption = async (id: string) => {
    await adminFetch(
      `/api/admin/diagnostic/questions?entity=option&id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    setFeedback({ tone: "success", message: t("admin.diagnostic.optionDeleted") });
    await onReload();
  };

  const draftOnlyIds = Object.keys(questionDrafts).filter(
    (id) => !questions.some((q) => q.id === id),
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("admin.diagnostic.questionsHint")}</p>

      {feedback ? <AdminFeedback tone={feedback.tone} message={feedback.message} /> : null}

      {questions.length === 0 && draftOnlyIds.length === 0 ? (
        <AdminEmptyState message={t("admin.noContent")} />
      ) : null}

      {[...questions, ...draftOnlyIds.map((id) => questionDrafts[id] as DiagnosticQuestion)].map(
        (q) => {
          const draft = draftFor(q);
          const open = expandedId === q.id;
          const isNew = q.id.startsWith("new-");

          return (
            <article key={q.id} className="rounded-2xl border border-border p-4 text-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-primary">
                    {draft.titleFr || draft.questionKey || t("admin.diagnostic.newQuestion")}
                  </p>
                  <p className="text-xs text-muted">
                    {t(`admin.diagnostic.channelOptions.${draft.channel}`)} ·{" "}
                    {draft.questionKey || "—"} · {(q.options ?? []).length}{" "}
                    {t("admin.diagnostic.options")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!isNew ? (
                    <Button
                      type="button"
                      size="md"
                      variant="ghost"
                      onClick={async () => {
                        await adminFetch("/api/admin/diagnostic/questions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            question: {
                              id: q.id,
                              questionKey: q.questionKey,
                              channel: q.channel,
                              position: q.position,
                              enabled: !q.enabled,
                              titleFr: q.titleFr,
                              titleEn: q.titleEn,
                              titleEs: q.titleEs,
                              subtitleFr: q.subtitleFr,
                              subtitleEn: q.subtitleEn,
                              subtitleEs: q.subtitleEs,
                            },
                          }),
                        });
                        await onReload();
                      }}
                    >
                      {q.enabled ? t("admin.diagnostic.disable") : t("admin.diagnostic.enable")}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="md"
                    variant="ghost"
                    onClick={() => setExpandedId(open ? null : q.id)}
                  >
                    {open ? t("admin.diagnostic.closeQuestion") : t("admin.diagnostic.editQuestion")}
                  </Button>
                </div>
              </div>

              {open ? (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1 text-sm">
                      <span className="text-muted">{t("admin.diagnostic.questionKey")}</span>
                      <input
                        className={fieldClass}
                        value={draft.questionKey}
                        onChange={(e) => updateDraft(q.id, { questionKey: e.target.value })}
                      />
                      <span className="block text-xs text-muted">
                        {t("admin.diagnostic.questionKeyHint")}
                      </span>
                    </label>
                    <label className="block space-y-1 text-sm">
                      <span className="text-muted">{t("admin.diagnostic.questionChannel")}</span>
                      <select
                        className={fieldClass}
                        value={draft.channel}
                        onChange={(e) =>
                          updateDraft(q.id, {
                            channel: e.target.value as DiagnosticQuestionChannel,
                          })
                        }
                      >
                        {CHANNELS.map((c) => (
                          <option key={c} value={c}>
                            {t(`admin.diagnostic.channelOptions.${c}`)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block space-y-1 text-sm">
                    <span className="text-muted">{t("admin.diagnostic.questionTitle")}</span>
                    <input
                      className={fieldClass}
                      value={draft.titleFr}
                      onChange={(e) => updateDraft(q.id, { titleFr: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-muted">{t("admin.diagnostic.questionSubtitle")}</span>
                    <input
                      className={fieldClass}
                      value={draft.subtitleFr}
                      onChange={(e) => updateDraft(q.id, { subtitleFr: e.target.value })}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="md"
                      pending={savingQuestionId === q.id}
                      onClick={() => void saveQuestion(q as DiagnosticQuestion)}
                    >
                      {savingQuestionId === q.id
                        ? t("admin.diagnostic.savingQuestion")
                        : t("admin.diagnostic.saveQuestion")}
                    </Button>
                    {!isNew ? (
                      <ConfirmDeleteButton
                        label={t("admin.diagnostic.deleteQuestion")}
                        confirmMessage={t("admin.diagnostic.confirmDeleteQuestion")}
                        onConfirm={() => deleteQuestion(q.id)}
                      />
                    ) : null}
                  </div>

                  {!isNew ? (
                    <div className="space-y-3 border-t border-border pt-4">
                      <div>
                        <p className="font-medium text-primary">
                          {t("admin.diagnostic.questionOptions")}
                        </p>
                        <p className="text-xs text-muted">
                          {t("admin.diagnostic.optionsHint")}
                        </p>
                      </div>

                      <ul className="space-y-2">
                        {(q.options ?? []).map((o) => (
                          <li
                            key={o.id}
                            className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-primary">
                                {o.labelFr || o.valueKey}
                              </p>
                              {Object.keys(o.scoreRules).length > 0 ? (
                                <p className="text-xs text-muted">
                                  {Object.entries(o.scoreRules)
                                    .map(([slug, pts]) => `${slug.replaceAll("-", " ")}: ${pts}`)
                                    .join(" · ")}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 gap-1.5">
                              <Button
                                type="button"
                                size="md"
                                variant="ghost"
                                onClick={() => startEditOption(q.id, o)}
                              >
                                {t("admin.edit")}
                              </Button>
                              <ConfirmDeleteButton
                                label={t("admin.diagnostic.deleteOption")}
                                confirmMessage={t("admin.diagnostic.confirmDeleteOption")}
                                onConfirm={() => deleteOption(o.id)}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>

                      {editingOption?.questionId === q.id ? (
                        <div className="space-y-3 rounded-xl border border-accent/40 bg-accent/5 p-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block space-y-1 text-sm">
                              <span className="text-muted">
                                {t("admin.diagnostic.optionValueKey")}
                              </span>
                              <input
                                className={fieldClass}
                                value={editingOption.valueKey}
                                onChange={(e) =>
                                  setEditingOption({
                                    ...editingOption,
                                    valueKey: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label className="block space-y-1 text-sm">
                              <span className="text-muted">
                                {t("admin.diagnostic.optionLabel")}
                              </span>
                              <input
                                className={fieldClass}
                                value={editingOption.labelFr}
                                onChange={(e) =>
                                  setEditingOption({
                                    ...editingOption,
                                    labelFr: e.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-muted">
                              {t("admin.diagnostic.scoreRules")}
                            </p>
                            <p className="text-xs text-muted">
                              {t("admin.diagnostic.scoreRulesHint")}
                            </p>
                            {editingOption.scoreRules.map((rule, index) => (
                              <div key={index} className="flex flex-wrap items-center gap-2">
                                <select
                                  className={`${fieldClass} sm:max-w-xs`}
                                  value={rule.slug}
                                  onChange={(e) => {
                                    const next = [...editingOption.scoreRules];
                                    next[index] = { ...rule, slug: e.target.value };
                                    setEditingOption({ ...editingOption, scoreRules: next });
                                  }}
                                >
                                  <option value="">
                                    {t("admin.diagnostic.scoreRuleProduct")}
                                  </option>
                                  {AWURA_PRODUCT_SLUGS.map((slug) => (
                                    <option key={slug} value={slug}>
                                      {slug.replaceAll("-", " ")}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  className={`${fieldClass} sm:max-w-24`}
                                  value={rule.points}
                                  placeholder={t("admin.diagnostic.scoreRulePoints")}
                                  onChange={(e) => {
                                    const next = [...editingOption.scoreRules];
                                    next[index] = {
                                      ...rule,
                                      points: Number(e.target.value),
                                    };
                                    setEditingOption({ ...editingOption, scoreRules: next });
                                  }}
                                />
                                <Button
                                  type="button"
                                  size="md"
                                  variant="ghost"
                                  onClick={() => {
                                    const next = editingOption.scoreRules.filter(
                                      (_, i) => i !== index,
                                    );
                                    setEditingOption({ ...editingOption, scoreRules: next });
                                  }}
                                >
                                  {t("admin.diagnostic.removeScoreRule")}
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              size="md"
                              variant="ghost"
                              onClick={() =>
                                setEditingOption({
                                  ...editingOption,
                                  scoreRules: [
                                    ...editingOption.scoreRules,
                                    { slug: "", points: 1 },
                                  ],
                                })
                              }
                            >
                              {t("admin.diagnostic.addScoreRule")}
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="md"
                              pending={savingOption}
                              onClick={() => void saveOption()}
                            >
                              {t("admin.save")}
                            </Button>
                            <Button
                              type="button"
                              size="md"
                              variant="ghost"
                              onClick={() => setEditingOption(null)}
                            >
                              {t("admin.cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="md"
                          variant="primary-outline"
                          onClick={() => startEditOption(q.id)}
                        >
                          {t("admin.diagnostic.addOption")}
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        },
      )}

      <Button type="button" variant="primary-outline" onClick={addQuestion}>
        {t("admin.diagnostic.addQuestion")}
      </Button>
    </div>
  );
}

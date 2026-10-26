import { QUESTION_BY_ID, QUESTIONS, STAGES } from "../data/questions";
import { clarificationLabels } from "./clarify";
import { accessor, answerLabels, isAsked, optionsOf } from "./resolve";
import type { Option, ProjectState, StageId } from "./types";

/** Bentuk permintaan POST /api/ai/suggest (dibatasi sama seperti server). */
export interface SuggestPayload {
  projectName: string;
  idea: string;
  context: { q: string; a: string }[];
  questions: { id: string; text: string; type: "single" | "multi"; options: Option[] }[];
}

export interface Suggestion {
  id: string;
  optionIds: string[];
  reason: string;
}

const MAX_QUESTIONS = 15;
const MAX_CONTEXT = 80;
const MAX_OPTIONS = 40;

/** Pertanyaan yang sudah dijawab pengguna sendiri tidak pernah ditimpa saran AI. */
const answeredByUser = (state: ProjectState, id: string): boolean =>
  state.answers[id]?.decidedBy === "user";

/** Pertanyaan di tahap ini yang bisa diberi saran: tampil, single/multi, belum dijawab pengguna. */
export function suggestableQuestions(state: ProjectState, stage: StageId) {
  const a = accessor(state);
  return QUESTIONS.filter(
    (q) =>
      q.stage === stage &&
      q.type !== "priority" &&
      isAsked(q, a) &&
      !answeredByUser(state, q.id) &&
      optionsOf(q, a).length >= 2,
  ).slice(0, MAX_QUESTIONS);
}

/**
 * Menyusun data untuk /api/ai/suggest: klarifikasi + jawaban pengguna dan saran AI di tahap sebelumnya sebagai
 * konteks, lalu pertanyaan tahap ini beserta opsi yang sedang berlaku (sudah difilter showIf/katalog).
 */
export function buildSuggestPayload(state: ProjectState, stage: StageId): SuggestPayload {
  const a = accessor(state);
  const stageIndex = STAGES.findIndex((s) => s.id === stage);
  const earlier = new Set(STAGES.slice(0, Math.max(stageIndex, 0)).map((s) => s.id));

  const clarifications = state.clarifications
    .map((c) => ({ q: c.text, a: clarificationLabels(c).join(", ") }))
    .filter((c) => c.a !== "");
  // Saran AI yang sudah ada di tahap sebelumnya ikut dikirim (ditandai) agar saran baru konsisten.
  const previous = QUESTIONS.filter(
    (q) =>
      earlier.has(q.stage) &&
      q.type !== "priority" &&
      (answeredByUser(state, q.id) || state.answers[q.id]?.source === "model"),
  )
    .map((q) => {
      const labels = answerLabels(a, q.id).join(", ");
      const fromModel = state.answers[q.id]?.source === "model";
      return { q: q.text, a: labels && fromModel ? `${labels} (saran AI)` : labels };
    })
    .filter((c) => c.a !== "");

  return {
    projectName: state.projectName.trim(),
    idea: state.idea.trim(),
    context: [...clarifications, ...previous].slice(0, MAX_CONTEXT),
    questions: suggestableQuestions(state, stage).map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type === "single" ? "single" : "multi",
      options: optionsOf(q, a)
        .slice(0, MAX_OPTIONS)
        .map((o) => ({ id: o.id, label: o.label })),
    })),
  };
}

/** Opsi yang tidak boleh digabung dengan opsi lain (sama dengan answers.ts). */
const EXCLUSIVE = new Set(["none"]);

/**
 * Menyimpan saran AI sebagai jawaban `decidedBy: "ai", source: "model"` (tetap bertanda [ASUMSI]).
 * Jawaban pengguna tidak ditimpa; opsi yang tidak dikenal dibuang.
 */
export function applySuggestions(state: ProjectState, suggestions: Suggestion[]): ProjectState {
  const a = accessor(state);
  const answers = { ...state.answers };
  for (const s of suggestions) {
    const q = QUESTION_BY_ID[s.id];
    if (!q || q.type === "priority" || answeredByUser(state, s.id)) continue;
    const valid = new Set(optionsOf(q, a).map((o) => o.id));
    let ids = [...new Set(s.optionIds.filter((o) => valid.has(o)))];
    if (q.type === "single") ids = ids.slice(0, 1);
    else if (ids.length > 1) ids = ids.filter((o) => !EXCLUSIVE.has(o));
    if (ids.length === 0) continue;
    answers[s.id] = { decidedBy: "ai", source: "model", optionIds: ids, reason: s.reason };
  }
  return { ...state, answers };
}

/** Jumlah pertanyaan di tahap ini yang sedang memakai saran AI. */
export const modelSuggestionCount = (state: ProjectState, stage: StageId): number =>
  QUESTIONS.filter((q) => q.stage === stage && state.answers[q.id]?.source === "model").length;

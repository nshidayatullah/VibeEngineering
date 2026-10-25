import { QUESTION_BY_ID, QUESTIONS } from "../data/questions";
import type { Accessor, Option, Priority, ProjectState, Question, ResolvedAnswer } from "./types";

export const OTHER = "other";

export const emptyState = (): ProjectState => ({
  version: 1,
  projectName: "",
  idea: "",
  answers: {},
});

const cache = new WeakMap<ProjectState, Accessor>();

/**
 * Membuat accessor untuk satu state. Hasil di-cache per objek state (state diperlakukan immutable),
 * sehingga rekomendasi selalu dihitung dari jawaban terbaru tanpa disimpan.
 */
export function accessor(state: ProjectState): Accessor {
  const cached = cache.get(state);
  if (cached) return cached;

  const memo = new Map<string, ResolvedAnswer>();
  const resolving = new Set<string>();

  const a: Accessor = {
    state,
    val: (id) => a.resolved(id).optionIds,
    has: (id, opt) => a.resolved(id).optionIds.includes(opt),
    first: (id) => a.resolved(id).optionIds[0],
    resolved: (id) => {
      const hit = memo.get(id);
      if (hit) return hit;
      if (resolving.has(id)) throw new Error(`Siklus dependensi pada pertanyaan ${id}`);
      resolving.add(id);
      const r = resolveQuestion(a, id);
      resolving.delete(id);
      memo.set(id, r);
      return r;
    },
  };
  cache.set(state, a);
  return a;
}

export const optionsOf = (q: Question, a: Accessor): Option[] =>
  typeof q.options === "function" ? q.options(a) : q.options;

export const isVisible = (q: Question, a: Accessor): boolean => (q.showIf ? q.showIf(a) : true);

/** Pertanyaan yang ditampilkan di wizard (tampil dan tidak diisi otomatis). */
export const isAsked = (q: Question, a: Accessor): boolean =>
  isVisible(q, a) && !(q.autoAi?.(a) ?? false);

function resolveQuestion(a: Accessor, id: string): ResolvedAnswer {
  const q = QUESTION_BY_ID[id];
  if (!q) throw new Error(`Pertanyaan tidak dikenal: ${id}`);
  const base = {
    questionId: id,
    priorities: {},
    aiPriorityKeys: [],
    hidden: false,
    auto: false,
    skipped: false,
  };

  if (!isVisible(q, a)) return { ...base, decidedBy: "user", optionIds: [], hidden: true };

  const auto = q.autoAi?.(a) ?? false;
  const raw = a.state.answers[id];
  const valid = new Set(optionsOf(q, a).map((o) => o.id));

  const fromAi = (skipped: boolean): ResolvedAnswer => {
    const rec = q.recommend(a);
    const priorities = rec.priorities ?? {};
    return {
      ...base,
      decidedBy: "ai",
      optionIds: rec.optionIds.filter((o) => valid.has(o)),
      priorities,
      aiPriorityKeys: Object.keys(priorities),
      reason: rec.reason,
      auto,
      skipped,
    };
  };

  if (auto || raw?.decidedBy === "ai") return fromAi(false);
  if (!raw) return fromAi(true);

  if (q.type === "priority") {
    const rec = q.recommend(a).priorities ?? {};
    const priorities: Record<string, Priority> = {};
    const aiKeys: string[] = [];
    for (const key of valid) {
      const userP = raw.priorities?.[key];
      const p = userP ?? rec[key] ?? "should";
      priorities[key] = p;
      if (!userP) aiKeys.push(key);
    }
    return { ...base, decidedBy: "user", optionIds: [], priorities, aiPriorityKeys: aiKeys };
  }

  const otherText = raw.otherText?.trim();
  const optionIds = raw.optionIds.filter((o) => valid.has(o) || (o === OTHER && otherText));
  if (optionIds.length === 0) return fromAi(true);
  return {
    ...base,
    decidedBy: "user",
    optionIds: q.type === "single" ? optionIds.slice(0, 1) : optionIds,
    otherText: optionIds.includes(OTHER) ? otherText : undefined,
  };
}

/** Label final sebuah jawaban, misal "Next.js (React)" atau isian Lainnya. */
export function answerLabels(a: Accessor, id: string): string[] {
  const q = QUESTION_BY_ID[id];
  if (!q) return [];
  const r = a.resolved(id);
  const opts = optionsOf(q, a);
  return r.optionIds.map((o) =>
    o === OTHER ? (r.otherText ?? "") : (opts.find((x) => x.id === o)?.label ?? o),
  );
}

export interface StageProgress {
  asked: number;
  answered: number;
}

export function stageProgress(a: Accessor, stage: string): StageProgress {
  const qs = QUESTIONS.filter((q) => q.stage === stage && isAsked(q, a));
  return {
    asked: qs.length,
    answered: qs.filter((q) => a.state.answers[q.id] !== undefined).length,
  };
}

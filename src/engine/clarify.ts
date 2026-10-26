import type { Clarification, Option, ProjectState } from "./types";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isOption = (v: unknown): v is Option =>
  isRecord(v) && typeof v.id === "string" && typeof v.label === "string";

/**
 * Memvalidasi daftar klarifikasi dari server atau dari state tersimpan.
 * `optionIds` boleh tidak ada (respons server); opsi yang tidak dikenal dibuang.
 */
export function parseClarifications(raw: unknown): Clarification[] | null {
  if (!Array.isArray(raw)) return null;
  const out: Clarification[] = [];
  for (const v of raw) {
    if (!isRecord(v)) return null;
    const { id, text, type, options, optionIds } = v;
    if (typeof id !== "string" || typeof text !== "string") return null;
    if (type !== "single" && type !== "multi") return null;
    if (!Array.isArray(options) || !options.every(isOption)) return null;
    const known = new Set(options.map((o) => o.id));
    const picked = Array.isArray(optionIds)
      ? optionIds.filter((o): o is string => typeof o === "string" && known.has(o))
      : [];
    out.push({
      id,
      text,
      type,
      options: options.map((o) => ({ id: o.id, label: o.label })),
      optionIds: type === "single" ? picked.slice(0, 1) : picked,
    });
  }
  return out;
}

export function setClarifications(state: ProjectState, list: Clarification[]): ProjectState {
  return { ...state, clarifications: list };
}

/** single: pilih satu (klik ulang membatalkan); multi: toggle. */
export function answerClarification(
  state: ProjectState,
  id: string,
  optionId: string,
): ProjectState {
  return {
    ...state,
    clarifications: state.clarifications.map((c) => {
      if (c.id !== id) return c;
      const has = c.optionIds.includes(optionId);
      if (c.type === "single") return { ...c, optionIds: has ? [] : [optionId] };
      return {
        ...c,
        optionIds: has ? c.optionIds.filter((o) => o !== optionId) : [...c.optionIds, optionId],
      };
    }),
  };
}

/** Label jawaban klarifikasi; kosong jika dilewati. */
export const clarificationLabels = (c: Clarification): string[] =>
  c.options.filter((o) => c.optionIds.includes(o.id)).map((o) => o.label);

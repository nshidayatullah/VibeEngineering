import { parseClarifications } from "../engine/clarify";
import { emptyState } from "../engine/resolve";
import type { Answer, ProjectState } from "../engine/types";

export const STORAGE_KEY = "vibeplan:v1";

const isAnswer = (v: unknown): v is Answer => {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    (o.decidedBy === "user" || o.decidedBy === "ai") &&
    Array.isArray(o.optionIds) &&
    o.optionIds.every((x) => typeof x === "string") &&
    (o.source === undefined || o.source === "model") &&
    (o.reason === undefined || typeof o.reason === "string")
  );
};

/**
 * Memvalidasi data dari localStorage atau file impor. Mengembalikan null jika tidak valid.
 * Data lama dinaikkan ke version 3: version 1 mendapat `clarifications` kosong; version 2 sama
 * bentuknya, hanya `Answer` kini boleh punya `source`/`reason` (saran AI per tahap).
 */
export function parseState(raw: unknown): ProjectState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1 && o.version !== 2 && o.version !== 3) return null;
  if (typeof o.projectName !== "string" || typeof o.idea !== "string") return null;
  const clarifications = o.version === 1 ? [] : parseClarifications(o.clarifications);
  if (!clarifications) return null;
  if (typeof o.answers !== "object" || o.answers === null) return null;
  const answers: Record<string, Answer> = {};
  for (const [k, v] of Object.entries(o.answers as Record<string, unknown>)) {
    if (!isAnswer(v)) return null;
    answers[k] = v;
  }
  return { version: 3, projectName: o.projectName, idea: o.idea, answers, clarifications };
}

export function loadState(): ProjectState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveState(state: ProjectState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage penuh atau diblokir: aplikasi tetap berjalan tanpa simpan otomatis.
  }
}

export function clearState(): ProjectState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // diabaikan
  }
  return emptyState();
}

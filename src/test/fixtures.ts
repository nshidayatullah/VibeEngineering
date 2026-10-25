import { QUESTIONS } from "../data/questions";
import { chooseAi, selectOption, setOtherText } from "../engine/answers";
import { emptyState } from "../engine/resolve";
import type { ProjectState } from "../engine/types";

export const DATE = "2026-10-25";

export const base = (name = "Kopi Senja", idea = ""): ProjectState => ({
  ...emptyState(),
  projectName: name,
  idea,
});

/** Menerapkan jawaban berurutan: string = opsi, { other } = isian Lainnya, "ai" = rekomendasi. */
export function answer(
  state: ProjectState,
  answers: Record<string, (string | { other: string })[] | "ai">,
): ProjectState {
  let s = state;
  for (const [id, vals] of Object.entries(answers)) {
    if (vals === "ai") {
      s = chooseAi(s, id);
      continue;
    }
    for (const v of vals)
      s = typeof v === "string" ? selectOption(s, id, v) : setOtherText(s, id, v.other);
  }
  return s;
}

/** Semua pertanyaan dijawab "Biarkan AI merekomendasikan". */
export const allAi = (state: ProjectState): ProjectState =>
  QUESTIONS.reduce((s, q) => chooseAi(s, q.id), state);

import { QUESTION_BY_ID } from "../data/questions";
import { OTHER } from "./resolve";
import type { Answer, Priority, ProjectState } from "./types";

/** Opsi yang tidak boleh digabung dengan opsi lain pada pertanyaan multi. */
const EXCLUSIVE = new Set(["none"]);

const put = (state: ProjectState, id: string, answer: Answer | undefined): ProjectState => {
  const answers = { ...state.answers };
  if (answer) answers[id] = answer;
  else delete answers[id];
  return { ...state, answers };
};

const current = (state: ProjectState, id: string): Answer | undefined => {
  const a = state.answers[id];
  return a?.decidedBy === "user" ? a : undefined;
};

export function selectOption(state: ProjectState, id: string, optionId: string): ProjectState {
  const q = QUESTION_BY_ID[id];
  if (!q) return state;
  const prev = current(state, id);
  if (q.type === "single") {
    return put(state, id, { decidedBy: "user", optionIds: [optionId], otherText: prev?.otherText });
  }
  const selected = new Set(prev?.optionIds ?? []);
  if (selected.has(optionId)) selected.delete(optionId);
  else if (EXCLUSIVE.has(optionId)) {
    selected.clear();
    selected.add(optionId);
  } else {
    for (const ex of EXCLUSIVE) selected.delete(ex);
    selected.add(optionId);
  }
  if (selected.size === 0 && !prev?.otherText) return put(state, id, undefined);
  return put(state, id, {
    decidedBy: "user",
    optionIds: [...selected],
    otherText: prev?.otherText,
  });
}

export function setOtherText(state: ProjectState, id: string, text: string): ProjectState {
  const q = QUESTION_BY_ID[id];
  if (!q) return state;
  const prev = current(state, id);
  let optionIds = prev?.optionIds ?? [];
  if (q.type === "single") optionIds = [OTHER];
  else if (!optionIds.includes(OTHER))
    optionIds = [...optionIds.filter((o) => !EXCLUSIVE.has(o)), OTHER];
  return put(state, id, { decidedBy: "user", optionIds, otherText: text });
}

export function chooseAi(state: ProjectState, id: string): ProjectState {
  return put(state, id, { decidedBy: "ai", optionIds: [] });
}

export function clearAnswer(state: ProjectState, id: string): ProjectState {
  return put(state, id, undefined);
}

export function setPriority(
  state: ProjectState,
  id: string,
  key: string,
  priority: Priority,
): ProjectState {
  const prev = current(state, id);
  return put(state, id, {
    decidedBy: "user",
    optionIds: [],
    priorities: { ...(prev?.priorities ?? {}), [key]: priority },
  });
}

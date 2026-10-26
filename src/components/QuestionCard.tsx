import { chooseAi, clearAnswer, selectOption, setOtherText, setPriority } from "../engine/answers";
import { accessor, answerLabels, OTHER, optionsOf } from "../engine/resolve";
import type { Priority, ProjectState, Question } from "../engine/types";
import { Badge } from "./ui";

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "must", label: "Must" },
  { id: "should", label: "Should" },
  { id: "could", label: "Could" },
  { id: "wont", label: "Won't" },
];

interface Props {
  question: Question;
  state: ProjectState;
  onChange: (next: ProjectState) => void;
}

export function QuestionCard({ question: q, state, onChange }: Props) {
  const a = accessor(state);
  const raw = state.answers[q.id];
  const resolved = a.resolved(q.id);
  const options = optionsOf(q, a);
  const isAi = raw?.decidedBy === "ai";
  const userIds = raw?.decidedBy === "user" ? raw.optionIds : [];
  const otherSelected = userIds.includes(OTHER);
  const inputType = q.type === "single" ? "radio" : "checkbox";
  const name = `q-${q.id}`;
  const typeLabel =
    q.type === "single"
      ? "Pilih satu"
      : q.type === "multi"
        ? "Boleh lebih dari satu"
        : "Atur prioritas";

  return (
    <fieldset className="rounded-xl border border-line bg-surface p-5">
      <legend className="float-left mb-3 flex w-full flex-wrap items-baseline justify-between gap-2">
        <span className="text-base font-semibold">
          <span className="mr-2 font-mono text-xs text-muted">{q.id}</span>
          {q.text}
        </span>
        <span className="text-xs text-muted">{typeLabel}</span>
      </legend>
      <div className="clear-left" />
      {q.help && <p className="mb-3 text-sm text-muted">{q.help}</p>}

      {q.type === "priority" ? (
        options.length === 0 ? (
          <p className="text-sm text-muted">Pilih fitur di FEA-01 atau FEA-04 terlebih dahulu.</p>
        ) : (
          <div className="space-y-2">
            {options.map((o) => {
              const current = resolved.priorities[o.id];
              const assumed = resolved.decidedBy === "ai" || resolved.aiPriorityKeys.includes(o.id);
              return (
                <div
                  key={o.id}
                  className="flex flex-col gap-2 rounded-lg border border-line p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm">
                    {o.label} {assumed && <Badge tone="warn">rekomendasi</Badge>}
                  </span>
                  <div className="flex gap-1" role="radiogroup" aria-label={`Prioritas ${o.label}`}>
                    {PRIORITIES.map((p) => (
                      <label
                        key={p.id}
                        className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
                          current === p.id
                            ? assumed
                              ? "bg-warn-bg text-warn ring-1 ring-warn"
                              : "bg-primary text-primary-fg"
                            : "border border-line text-muted hover:bg-accent"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`${name}-${o.id}`}
                          checked={current === p.id}
                          onChange={() => onChange(setPriority(state, q.id, o.id, p.id))}
                          className="sr-only"
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((o) => {
            const checked = !isAi && userIds.includes(o.id);
            return (
              <label
                key={o.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                  checked ? "border-primary bg-accent" : "border-line hover:bg-accent"
                }`}
              >
                <input
                  type={inputType}
                  name={name}
                  checked={checked}
                  onChange={() => onChange(selectOption(state, q.id, o.id))}
                  className="mt-0.5 accent-[var(--color-primary)]"
                />
                <span>
                  <span className="block">{o.label}</span>
                  {o.hint && <span className="block text-xs text-muted">{o.hint}</span>}
                </span>
              </label>
            );
          })}
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
              otherSelected && !isAi ? "border-primary bg-accent" : "border-line hover:bg-accent"
            }`}
          >
            <input
              type={inputType}
              name={name}
              checked={otherSelected && !isAi}
              onChange={() =>
                otherSelected && q.type === "multi"
                  ? onChange(selectOption(state, q.id, OTHER))
                  : onChange(setOtherText(state, q.id, raw?.otherText ?? ""))
              }
              className="mt-0.5 accent-[var(--color-primary)]"
            />
            <span className="w-full">
              <span className="block">✏️ Lainnya (isi sendiri)</span>
              {otherSelected && !isAi && (
                <input
                  type="text"
                  value={raw?.otherText ?? ""}
                  placeholder={q.otherPlaceholder ?? "Tulis jawaban Anda"}
                  aria-label={`Jawaban lain untuk ${q.id}`}
                  onChange={(e) => onChange(setOtherText(state, q.id, e.target.value))}
                  className="mt-2 w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm"
                />
              )}
            </span>
          </label>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={isAi}
          onClick={() => onChange(isAi ? clearAnswer(state, q.id) : chooseAi(state, q.id))}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${isAi ? "bg-warn-bg text-warn ring-1 ring-warn" : "border border-dashed border-line text-muted hover:bg-accent"}`}
        >
          🤖 Biarkan AI merekomendasikan
        </button>
        {raw && !isAi && (
          <button
            type="button"
            onClick={() => onChange(clearAnswer(state, q.id))}
            className="text-xs text-muted underline-offset-2 hover:underline"
          >
            Kosongkan
          </button>
        )}
      </div>

      {resolved.decidedBy === "ai" && q.type !== "priority" && (
        <p className="mt-3 rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">
          <strong>
            {resolved.source === "model"
              ? "🤖 Saran AI:"
              : isAi
                ? "Rekomendasi:"
                : "Jika dilewati:"}
          </strong>{" "}
          {answerLabels(a, q.id).join(", ") || "tidak ada"}
          {resolved.reason && <span className="block text-xs opacity-80">{resolved.reason}</span>}
        </p>
      )}
    </fieldset>
  );
}

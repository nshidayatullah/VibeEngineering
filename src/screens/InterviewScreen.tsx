import { QuestionCard } from "../components/QuestionCard";
import { Button } from "../components/ui";
import { QUESTIONS, STAGES } from "../data/questions";
import { accessor, isAsked, stageProgress } from "../engine/resolve";
import type { ProjectState } from "../engine/types";

interface Props {
  state: ProjectState;
  stageIndex: number;
  onChange: (next: ProjectState) => void;
  onStage: (index: number) => void;
  onBack: () => void;
  onReview: () => void;
}

export function InterviewScreen({ state, stageIndex, onChange, onStage, onBack, onReview }: Props) {
  const a = accessor(state);
  const stage = STAGES[stageIndex] ?? STAGES[0];
  if (!stage) return null;
  const questions = QUESTIONS.filter((q) => q.stage === stage.id && isAsked(q, a));
  const autoCount = QUESTIONS.filter(
    (q) => q.stage === stage.id && !isAsked(q, a) && !a.resolved(q.id).hidden,
  ).length;
  const isLast = stageIndex === STAGES.length - 1;

  const go = (i: number) => {
    onStage(i);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <nav aria-label="Tahap wawancara" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {STAGES.map((s, i) => {
            const p = stageProgress(a, s.id);
            const active = i === stageIndex;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  aria-current={active ? "step" : undefined}
                  onClick={() => go(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${active ? "bg-accent text-fg" : "text-muted hover:bg-accent"}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      p.asked > 0 && p.answered >= p.asked
                        ? "bg-primary text-primary-fg"
                        : "border border-line"
                    }`}
                  >
                    {s.number}
                  </span>
                  <span className="whitespace-nowrap lg:whitespace-normal">
                    {s.title}
                    <span className="block text-xs text-muted">
                      {p.answered}/{p.asked} dijawab
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="min-w-0 space-y-4">
        <header>
          <p className="text-sm text-muted">
            Tahap {stage.number} dari {STAGES.length}
          </p>
          <h2 className="text-2xl font-bold">{stage.title}</h2>
          <p className="text-muted">{stage.description}</p>
          {autoCount > 0 && (
            <p className="mt-2 text-sm text-muted">
              {autoCount} pertanyaan teknis lain diisi otomatis dengan rekomendasi sesuai pilihan
              TEC-01.
            </p>
          )}
        </header>

        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} state={state} onChange={onChange} />
        ))}

        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button onClick={() => (stageIndex === 0 ? onBack() : go(stageIndex - 1))}>
            ← {stageIndex === 0 ? "Ide awal" : "Sebelumnya"}
          </Button>
          <div className="flex gap-2">
            {!isLast && (
              <Button variant="ghost" onClick={onReview}>
                Ke ringkasan
              </Button>
            )}
            <Button variant="primary" onClick={() => (isLast ? onReview() : go(stageIndex + 1))}>
              {isLast ? "Lihat ringkasan →" : "Berikutnya →"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted">
          Pertanyaan yang dilewati otomatis memakai rekomendasi dan ditandai [ASUMSI] di file hasil.
        </p>
      </div>
    </div>
  );
}

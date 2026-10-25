import { Badge, Button, Card } from "../components/ui";
import { QUESTIONS, STAGES, selectedFeatureOptions } from "../data/questions";
import { accessor, answerLabels } from "../engine/resolve";
import type { ProjectState } from "../engine/types";
import { PRIORITY_LABEL } from "../generator/md";

interface Props {
  state: ProjectState;
  onEditStage: (index: number) => void;
  onGenerate: () => void;
}

export function ReviewScreen({ state, onEditStage, onGenerate }: Props) {
  const a = accessor(state);
  const rows = QUESTIONS.map((q) => ({ q, r: a.resolved(q.id) })).filter(({ r }) => !r.hidden);
  const aiCount = rows.filter(({ r }) => r.decidedBy === "ai").length;
  const skipped = rows.filter(({ r }) => r.skipped).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold">Ringkasan keputusan</h2>
        <p className="text-muted">
          {rows.length} keputusan, {aiCount} di antaranya dari rekomendasi ({skipped} karena
          dilewati). Keputusan rekomendasi ditandai [ASUMSI] di file hasil agar mudah ditinjau.
        </p>
        <Button variant="primary" onClick={onGenerate}>
          Buat paket .md →
        </Button>
      </header>

      {STAGES.map((s, i) => {
        const stageRows = rows.filter(({ q }) => q.stage === s.id);
        return (
          <Card key={s.id}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">
                {s.number}. {s.title}
              </h3>
              <Button variant="ghost" onClick={() => onEditStage(i)}>
                Ubah
              </Button>
            </div>
            <dl className="divide-y divide-line">
              {stageRows.map(({ q, r }) => {
                const value =
                  q.type === "priority"
                    ? selectedFeatureOptions(a)
                        .map((o) => `${o.label}: ${PRIORITY_LABEL[r.priorities[o.id] ?? "should"]}`)
                        .join(" · ")
                    : answerLabels(a, q.id).join(", ");
                return (
                  <div
                    key={q.id}
                    className="grid gap-1 py-2 text-sm sm:grid-cols-[1fr_1.2fr] sm:gap-4"
                  >
                    <dt className="text-muted">
                      <span className="mr-1 font-mono text-xs">{q.id}</span>
                      {q.text}
                    </dt>
                    <dd>
                      {value || <span className="text-muted">tidak ada</span>}{" "}
                      {r.decidedBy === "ai" && (
                        <Badge tone="warn">
                          {r.auto ? "otomatis" : r.skipped ? "dilewati" : "rekomendasi"}
                        </Badge>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button variant="primary" onClick={onGenerate}>
          Buat paket .md →
        </Button>
      </div>
    </div>
  );
}

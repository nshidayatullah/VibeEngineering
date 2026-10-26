import { useCallback, useEffect, useRef, useState } from "react";
import { fetchClarifications } from "../ai/client";
import { Button, Card } from "../components/ui";
import { answerClarification, setClarifications } from "../engine/clarify";
import type { ProjectState } from "../engine/types";

interface Props {
  state: ProjectState;
  onChange: (next: ProjectState) => void;
  onBack: () => void;
  onDone: () => void;
}

export function ClarifyScreen({ state, onChange, onBack, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Ref agar hasil permintaan diterapkan ke state terbaru, bukan state saat tombol ditekan.
  const latest = useRef(state);
  latest.current = state;

  const request = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchClarifications(latest.current.projectName, latest.current.idea);
      onChange(setClarifications(latest.current, list));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  const requested = useRef(false);
  useEffect(() => {
    if (requested.current || latest.current.clarifications.length > 0) return;
    requested.current = true;
    void request();
  }, [request]);

  const list = state.clarifications;
  const answered = list.filter((c) => c.optionIds.length > 0).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold">Klarifikasi dari AI</h2>
        <p className="text-muted">
          AI membaca ide Anda dan bertanya hal yang khusus untuk proyek ini. Jawaban masuk ke PRD
          bagian Ringkasan. Pertanyaan yang dilewati diabaikan.
        </p>
      </header>

      {loading && (
        <Card>
          <p role="status" className="text-sm text-muted">
            AI sedang menyusun pertanyaan untuk {state.projectName}…
          </p>
        </Card>
      )}

      {error && !loading && (
        <Card className="space-y-3">
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void request()}>Coba lagi</Button>
            <Button variant="primary" onClick={onDone}>
              Lanjut tanpa klarifikasi →
            </Button>
          </div>
        </Card>
      )}

      {!loading &&
        list.map((c) => (
          <fieldset key={c.id} className="rounded-xl border border-line bg-surface p-5">
            <legend className="float-left mb-3 flex w-full flex-wrap items-baseline justify-between gap-2">
              <span className="text-base font-semibold">
                <span className="mr-2 font-mono text-xs text-muted">{c.id}</span>
                {c.text}
              </span>
              <span className="text-xs text-muted">
                {c.type === "single" ? "Pilih satu" : "Boleh lebih dari satu"}
              </span>
            </legend>
            <div className="clear-left" />
            <div className="grid gap-2 sm:grid-cols-2">
              {c.options.map((o) => {
                const checked = c.optionIds.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                      checked ? "border-primary bg-accent" : "border-line hover:bg-accent"
                    }`}
                  >
                    <input
                      type={c.type === "single" ? "radio" : "checkbox"}
                      name={`k-${c.id}`}
                      checked={checked}
                      onChange={() => onChange(answerClarification(state, c.id, o.id))}
                      className="mt-0.5 accent-[var(--color-primary)]"
                    />
                    <span>{o.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}>
          ← Kembali
        </Button>
        <div className="flex flex-wrap gap-2">
          {list.length > 0 && !loading && (
            <Button onClick={() => void request()}>Minta pertanyaan lain</Button>
          )}
          {list.length > 0 && (
            <Button variant="primary" disabled={loading} onClick={onDone}>
              Lanjut ke wawancara ({answered}/{list.length} dijawab) →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

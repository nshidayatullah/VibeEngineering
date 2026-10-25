import { useMemo, useState } from "react";
import { Badge, Button, Card } from "../components/ui";
import type { ProjectState } from "../engine/types";
import { buildZip, downloadBlob } from "../export/zip";
import { generateAll } from "../generator";

interface Props {
  state: ProjectState;
  date: string;
  onBack: () => void;
}

export function ResultScreen({ state, date, onBack }: Props) {
  const result = useMemo(() => generateAll(state, date), [state, date]);
  const [selected, setSelected] = useState(result.files[0]?.path ?? "");
  const [copied, setCopied] = useState("");
  const [zipping, setZipping] = useState(false);
  const file = result.files.find((f) => f.path === selected) ?? result.files[0];
  const errors = result.issues.filter((i) => i.level === "error");
  const warnings = result.issues.filter((i) => i.level === "warning");

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
    }
  };

  const download = async () => {
    setZipping(true);
    try {
      downloadBlob(
        await buildZip(result.plan.slug, result.files),
        `${result.plan.slug}-vibeplan.zip`,
      );
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Paket untuk {result.plan.name}</h2>
          <p className="text-muted">
            {result.files.length} file · {result.plan.features.length} fitur ·{" "}
            {result.plan.entities.length} entitas · {result.assumptionCount} penanda [ASUMSI]
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onBack}>← Ubah jawaban</Button>
          <Button variant="primary" onClick={download} disabled={zipping}>
            {zipping ? "Menyiapkan…" : "Unduh ZIP"}
          </Button>
        </div>
      </header>

      <Card className="space-y-2">
        <h3 className="font-semibold">Validasi</h3>
        {result.issues.length === 0 ? (
          <p className="text-sm text-ok">
            ✓ Lulus: tidak ada placeholder tersisa, setiap fitur Must punya kriteria, setiap entitas
            dipakai fitur.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {errors.map((i) => (
              <li key={i.message} className="text-danger">
                ✗ {i.message}
              </li>
            ))}
            {warnings.map((i) => (
              <li key={i.message} className="text-warn">
                ! {i.message}
              </li>
            ))}
          </ul>
        )}
        {result.assumptionCount > 0 && (
          <p className="text-sm text-muted">
            Tinjau penanda [ASUMSI] sebelum memberi paket ini ke agen, atau minta agen menanyakannya
            (sudah ada di prompt awal).
          </p>
        )}
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Prompt awal untuk agen</h3>
          <Button variant="ghost" onClick={() => copy("prompt", result.prompt)}>
            {copied === "prompt" ? "Tersalin ✓" : "Salin"}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg bg-bg p-3 font-mono text-xs">
          {result.prompt}
        </pre>
        <p className="text-xs text-muted">
          Ekstrak ZIP ke root repo (AGENTS.md di root, dokumen di docs/), lalu tempel prompt ini ke
          agen.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <nav aria-label="File hasil" className="min-w-0">
          <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col">
            {result.files.map((f) => (
              <li key={f.path} className="shrink-0">
                <button
                  type="button"
                  aria-current={f.path === file?.path ? "page" : undefined}
                  onClick={() => setSelected(f.path)}
                  className={`w-full rounded-lg px-3 py-2 text-left font-mono text-xs transition ${f.path === file?.path ? "bg-accent text-fg" : "text-muted hover:bg-accent"}`}
                >
                  {f.path}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {file && (
          <Card className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-mono text-sm">
                {file.path} <Badge>{file.content.split("\n").length} baris</Badge>
              </span>
              <Button variant="ghost" onClick={() => copy(file.path, file.content)}>
                {copied === file.path ? "Tersalin ✓" : "Salin"}
              </Button>
            </div>
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-bg p-4 font-mono text-xs leading-relaxed">
              {file.content}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}

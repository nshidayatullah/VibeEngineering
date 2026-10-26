import { useRef, useState } from "react";
import { MIN_IDEA } from "../ai/client";
import { Button, Card } from "../components/ui";
import type { ProjectState } from "../engine/types";
import { parseState } from "../storage/persist";

interface Props {
  state: ProjectState;
  hasProgress: boolean;
  aiAvailable: boolean;
  useAi: boolean;
  onUseAi: (on: boolean) => void;
  onChange: (next: ProjectState) => void;
  onStart: () => void;
  onReset: () => void;
}

export function StartScreen({
  state,
  hasProgress,
  aiAvailable,
  useAi,
  onUseAi,
  onChange,
  onStart,
  onReset,
}: Props) {
  const ideaTooShort = state.idea.trim().length < MIN_IDEA;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");

  const importFile = async (file: File) => {
    try {
      const parsed = parseState(JSON.parse(await file.text()));
      if (!parsed) throw new Error("invalid");
      setImportError("");
      onChange(parsed);
    } catch {
      setImportError("File tidak valid. Gunakan vibeplan-answers.json dari ZIP VibePlan.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Rancang aplikasi Anda sebelum AI menulis kodenya
        </h1>
        <p className="text-muted">
          Jawab ±50 pertanyaan pilihan ganda dalam 8 tahap. VibePlan membuat PRD, ARCHITECTURE,
          TECH_STACK, DATA_MODEL, DESIGN, TASKS, dan AGENTS.md supaya AI coding agent tidak menebak.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="project-name" className="text-sm font-medium">
            Nama proyek
          </label>
          <input
            id="project-name"
            value={state.projectName}
            onChange={(e) => onChange({ ...state, projectName: e.target.value })}
            placeholder="contoh: Kopi Senja"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="project-idea" className="text-sm font-medium">
            Ide aplikasi dalam 1–3 kalimat{" "}
            <span className="font-normal text-muted">(opsional)</span>
          </label>
          <textarea
            id="project-idea"
            rows={4}
            value={state.idea}
            onChange={(e) => onChange({ ...state, idea: e.target.value })}
            placeholder="contoh: Toko online kopi dengan langganan bulanan untuk pelanggan di Jakarta."
            className="w-full rounded-lg border border-line bg-bg px-3 py-2"
          />
          <p className="text-xs text-muted">
            Ide dipakai untuk ringkasan PRD dan untuk menebak jenis aplikasi bila Anda memilih
            rekomendasi.
          </p>
        </div>
        {aiAvailable && (
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 text-sm">
            <input
              type="checkbox"
              checked={useAi}
              onChange={(e) => onUseAi(e.target.checked)}
              className="mt-0.5 accent-[var(--color-primary)]"
            />
            <span>
              <span className="block font-medium">🤖 Bantu wawancara dengan AI</span>
              <span className="block text-xs text-muted">
                AI mengajukan 3–5 pertanyaan klarifikasi khusus proyek Anda, lalu bisa mengisi saran
                jawaban di setiap tahap. Nama, ide, dan jawaban dikirim ke server VibePlan dan
                penyedia AI saat dibutuhkan, tidak disimpan.
                {useAi &&
                  ideaTooShort &&
                  ` Tulis ide minimal ${MIN_IDEA} karakter agar AI bisa mengajukan klarifikasi.`}
                {useAi &&
                  state.clarifications.length > 0 &&
                  " Klarifikasi sudah ada; ubah dari layar Ringkasan."}
              </span>
            </span>
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={state.projectName.trim() === ""} onClick={onStart}>
            {hasProgress ? "Lanjutkan wawancara" : "Mulai wawancara"}
          </Button>
          {hasProgress && (
            <Button variant="ghost" onClick={onReset}>
              Mulai baru
            </Button>
          )}
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            Muat jawaban.json
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f);
              e.target.value = "";
            }}
          />
        </div>
        {importError && (
          <p role="alert" className="text-sm text-danger">
            {importError}
          </p>
        )}
      </Card>

      <ul className="grid gap-3 text-sm text-muted sm:grid-cols-3">
        <li className="rounded-lg border border-line p-3">
          <strong className="block text-fg">Tanpa akun</strong>
          {aiAvailable
            ? "Jawaban tersimpan di browser ini; hanya klarifikasi AI yang dikirim ke server."
            : "Semua jawaban tersimpan di browser ini saja."}
        </li>
        <li className="rounded-lg border border-line p-3">
          <strong className="block text-fg">Ragu? Serahkan ke AI</strong>Setiap pertanyaan punya
          rekomendasi yang ditandai [ASUMSI].
        </li>
        <li className="rounded-lg border border-line p-3">
          <strong className="block text-fg">Siap untuk agen</strong>Unduh ZIP, taruh di root repo,
          salin prompt awal.
        </li>
      </ul>
    </div>
  );
}

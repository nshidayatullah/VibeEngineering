import { useRef, useState } from "react";
import { fetchSuggestions } from "../ai/client";
import {
  applySuggestions,
  buildSuggestPayload,
  modelSuggestionCount,
  suggestableQuestions,
} from "../engine/suggest";
import type { ProjectState, StageId } from "../engine/types";
import { Button } from "./ui";

interface Props {
  state: ProjectState;
  stage: StageId;
  onChange: (next: ProjectState) => void;
}

/** Tombol "Isi dengan saran AI" untuk satu tahap. Hanya mengisi pertanyaan yang belum Anda jawab. */
export function AiSuggest({ state, stage, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Hasil diterapkan ke state terbaru agar jawaban yang Anda ubah selama menunggu tidak hilang.
  const latest = useRef(state);
  latest.current = state;

  const open = suggestableQuestions(state, stage).length;
  const hasSuggestions = modelSuggestionCount(state, stage) > 0;

  const request = async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const suggestions = await fetchSuggestions(buildSuggestPayload(latest.current, stage));
      const next = applySuggestions(latest.current, suggestions);
      const filled = Object.keys(next.answers).filter(
        (id) => next.answers[id] !== latest.current.answers[id],
      ).length;
      onChange(next);
      setNotice(
        filled > 0
          ? `AI mengisi ${filled} pertanyaan. Tinjau alasannya; klik opsi lain untuk mengganti.`
          : "AI tidak menemukan saran yang cocok untuk pertanyaan yang tersisa.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {open > 0
            ? `🤖 AI bisa menyarankan jawaban untuk ${open} pertanyaan yang belum Anda jawab di tahap ini, berdasarkan ide, klarifikasi, dan jawaban sebelumnya.`
            : "🤖 Semua pertanyaan di tahap ini sudah Anda jawab sendiri."}
        </p>
        {open > 0 && (
          <Button disabled={loading} onClick={() => void request()}>
            {loading
              ? "AI sedang berpikir…"
              : hasSuggestions
                ? "Minta saran ulang"
                : "Isi dengan saran AI"}
          </Button>
        )}
      </div>
      {notice && (
        <p role="status" className="text-sm text-ok">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

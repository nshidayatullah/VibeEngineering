import { useEffect, useState } from "react";
import { checkAi, MIN_IDEA } from "./ai/client";
import { STAGES } from "./data/questions";
import { emptyState } from "./engine/resolve";
import type { ProjectState } from "./engine/types";
import { ClarifyScreen } from "./screens/ClarifyScreen";
import { InterviewScreen } from "./screens/InterviewScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { StartScreen } from "./screens/StartScreen";
import { clearState, loadState, saveState } from "./storage/persist";

type Screen = "start" | "clarify" | "interview" | "review" | "result";

const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function App() {
  const [initial] = useState(() => loadState());
  const [state, setState] = useState<ProjectState>(initial ?? emptyState());
  const [screen, setScreen] = useState<Screen>("start");
  const [stageIndex, setStageIndex] = useState(0);

  // null = belum dicek; false = service vibeplan-ai tidak ada (misal dev lokal), fitur AI disembunyikan.
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [useAi, setUseAi] = useState(true);

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    void checkAi().then(setAiAvailable);
  }, []);

  const aiOn = aiAvailable === true && useAi;

  const hasProgress = Object.keys(state.answers).length > 0;
  const go = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <button
            type="button"
            onClick={() => go("start")}
            className="flex items-center gap-2 font-semibold"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-fg"
              aria-hidden="true"
            >
              V
            </span>
            VibePlan
          </button>
          {screen !== "start" && (
            <span className="truncate text-sm text-muted">{state.projectName}</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {screen === "start" && (
          <StartScreen
            state={state}
            hasProgress={hasProgress}
            onChange={setState}
            aiAvailable={aiAvailable === true}
            useAi={useAi}
            onUseAi={setUseAi}
            onStart={() =>
              go(
                aiOn && state.clarifications.length === 0 && state.idea.trim().length >= MIN_IDEA
                  ? "clarify"
                  : "interview",
              )
            }
            onReset={() => {
              setState(clearState());
              setStageIndex(0);
            }}
          />
        )}
        {screen === "clarify" && (
          <ClarifyScreen
            state={state}
            onChange={setState}
            onBack={() => go("start")}
            onDone={() => go("interview")}
          />
        )}
        {screen === "interview" && (
          <InterviewScreen
            state={state}
            stageIndex={Math.min(stageIndex, STAGES.length - 1)}
            aiOn={aiOn}
            onChange={setState}
            onStage={setStageIndex}
            onBack={() => go("start")}
            onReview={() => go("review")}
          />
        )}
        {screen === "review" && (
          <ReviewScreen
            state={state}
            onEditStage={(i) => {
              setStageIndex(i);
              go("interview");
            }}
            onEditClarifications={aiAvailable === true ? () => go("clarify") : undefined}
            onGenerate={() => go("result")}
          />
        )}
        {screen === "result" && (
          <ResultScreen state={state} date={today()} onBack={() => go("review")} />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted">
        {aiOn
          ? "Jawaban disimpan di browser ini. Nama, ide, dan jawaban dikirim ke server VibePlan dan penyedia AI hanya saat Anda meminta klarifikasi atau saran AI, dan tidak disimpan di server."
          : "Jawaban hanya disimpan di browser ini. Tidak ada data yang dikirim ke server."}
      </footer>
    </div>
  );
}

import { useEffect, useState } from "react";
import { STAGES } from "./data/questions";
import { emptyState } from "./engine/resolve";
import type { ProjectState } from "./engine/types";
import { InterviewScreen } from "./screens/InterviewScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { StartScreen } from "./screens/StartScreen";
import { clearState, loadState, saveState } from "./storage/persist";

type Screen = "start" | "interview" | "review" | "result";

const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function App() {
  const [initial] = useState(() => loadState());
  const [state, setState] = useState<ProjectState>(initial ?? emptyState());
  const [screen, setScreen] = useState<Screen>("start");
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => saveState(state), [state]);

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
            onStart={() => go("interview")}
            onReset={() => {
              setState(clearState());
              setStageIndex(0);
            }}
          />
        )}
        {screen === "interview" && (
          <InterviewScreen
            state={state}
            stageIndex={Math.min(stageIndex, STAGES.length - 1)}
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
            onGenerate={() => go("result")}
          />
        )}
        {screen === "result" && (
          <ResultScreen state={state} date={today()} onBack={() => go("review")} />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted">
        Jawaban hanya disimpan di browser ini. Tidak ada data yang dikirim ke server.
      </footer>
    </div>
  );
}

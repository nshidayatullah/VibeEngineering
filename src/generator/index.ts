import { ASSUMPTION, buildPlan, type Plan } from "../engine/plan";
import type { GeneratedFile, ProjectState } from "../engine/types";
import { generateAgentExtras, generateAgents, startPrompt } from "./agents";
import { generateArchitecture } from "./architecture";
import { generateDataModel } from "./dataModel";
import { generateDesign } from "./design";
import { doc } from "./md";
import { generatePrd } from "./prd";
import { generateTasks } from "./tasks";
import { generateTechStack } from "./techStack";

export interface ValidationIssue {
  level: "error" | "warning";
  message: string;
}

export interface GenerationResult {
  plan: Plan;
  files: GeneratedFile[];
  issues: ValidationIssue[];
  assumptionCount: number;
  prompt: string;
}

export const ANSWERS_FILE = "vibeplan-answers.json";

export function generateAll(state: ProjectState, date: string): GenerationResult {
  const plan = buildPlan(state, date);
  const prompt = startPrompt(plan);
  const files: GeneratedFile[] = [
    { path: "AGENTS.md", content: generateAgents(plan) },
    ...generateAgentExtras(plan),
    { path: "docs/PRD.md", content: generatePrd(plan) },
    { path: "docs/ARCHITECTURE.md", content: generateArchitecture(plan) },
    { path: "docs/TECH_STACK.md", content: generateTechStack(plan) },
    { path: "docs/DATA_MODEL.md", content: generateDataModel(plan) },
    { path: "docs/DESIGN.md", content: generateDesign(plan) },
    { path: "docs/TASKS.md", content: generateTasks(plan) },
    {
      path: "PROMPT_AWAL.md",
      content: doc(
        "# Prompt awal untuk AI agent",
        "Salin teks di bawah ke agen setelah file paket ini ditaruh di root repo.",
        `\`\`\`text\n${prompt}\n\`\`\``,
      ),
    },
    {
      path: ANSWERS_FILE,
      content: `${JSON.stringify({ ...state, generatedAt: date }, null, 2)}\n`,
    },
  ];
  const issues = validate(plan, files);
  const assumptionCount = files
    .filter((f) => f.path.endsWith(".md"))
    .reduce((n, f) => n + (f.content.match(/\[ASUMSI\]/g)?.length ?? 0), 0);
  return { plan, files, issues, assumptionCount, prompt };
}

const CONFLICT_UI_REACT_ONLY = ["mui", "mantine", "chakra"];

export function validate(plan: Plan, files: GeneratedFile[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const f of files.filter((x) => x.path.endsWith(".md"))) {
    if (/\{\{|\}\}/.test(f.content))
      issues.push({ level: "error", message: `${f.path} masih memuat placeholder {{…}}` });
    if (/<!--/.test(f.content))
      issues.push({ level: "error", message: `${f.path} masih memuat komentar template` });
  }
  for (const feat of plan.features.filter((x) => x.priority === "must")) {
    if (feat.acceptance.length === 0)
      issues.push({
        level: "error",
        message: `${feat.fid} ${feat.label} (Must) tidak punya kriteria penerimaan`,
      });
    if (feat.acceptanceAssumed)
      issues.push({
        level: "warning",
        message: `${feat.fid} ${feat.label}: kriteria penerimaan masih generik ${ASSUMPTION}`,
      });
  }
  for (const e of plan.entities) {
    if (e.usedBy.length === 0)
      issues.push({ level: "warning", message: `Entitas ${e.id} tidak dipakai fitur mana pun` });
  }
  if (!plan.features.some((f) => f.priority === "must"))
    issues.push({ level: "error", message: "Belum ada fitur berprioritas Must" });
  const { framework, ui } = plan.stack;
  if (["nuxt", "sveltekit", "astro"].includes(framework) && CONFLICT_UI_REACT_ONLY.includes(ui))
    issues.push({
      level: "warning",
      message: `Pustaka UI ${plan.stack.info.ui.name} hanya untuk React, tetapi framework ${plan.stack.info.framework.name}`,
    });
  if (plan.a.first("QUA-05") === "full" && plan.a.first("FEA-05") === "collab")
    issues.push({
      level: "warning",
      message: "Offline penuh + kolaborasi bersamaan: tentukan aturan konflik sebelum mengerjakan",
    });
  const mustCount = plan.features.filter((f) => f.priority === "must").length;
  if (plan.a.first("VIS-05") === "week" && mustCount > 5)
    issues.push({
      level: "warning",
      message: `Target < 1 minggu dengan ${mustCount} fitur Must berisiko; pertimbangkan menurunkan sebagian ke Should`,
    });
  if (
    plan.a.val("DAT-05").some((d) => ["financial", "health", "identity"].includes(d)) &&
    !plan.a.has("QUA-03", "encryption")
  )
    issues.push({
      level: "warning",
      message: "Data sensitif disimpan tanpa memilih enkripsi data sensitif (QUA-03)",
    });
  return issues;
}

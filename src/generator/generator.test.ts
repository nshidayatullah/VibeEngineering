import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { setClarifications } from "../engine/clarify";
import { allAi, answer, base, DATE } from "../test/fixtures";
import { generateAll } from ".";

const APP_TYPES = [
  "landing",
  "ecommerce",
  "saas",
  "internal",
  "marketplace",
  "content",
  "booking",
  "tool",
];

const scenarios = {
  kosong: base("Tanpa Jawaban"),
  semuaAi: allAi(base("Kopi Senja", "Toko online kopi dengan langganan bulanan.")),
  ...Object.fromEntries(
    APP_TYPES.map((t) => [`default-${t}`, answer(base(`App ${t}`), { "VIS-01": [t] })]),
  ),
  laravel: answer(base("Klinik"), {
    "VIS-01": ["booking"],
    "TEC-01": ["full"],
    "TEC-02": ["laravel"],
    "TEC-04": ["mysql"],
    "AIW-01": ["cursor", "copilot", "gemini", "kiro", "windsurf", "codex"],
  }),
  python: answer(base("Gudang"), {
    "VIS-01": ["internal"],
    "TEC-01": ["full"],
    "TEC-02": ["vite"],
    "TEC-03": ["python"],
    "QUA-02": ["none"],
    "AIW-03": ["medium"],
  }),
  go: answer(base("Pendek"), {
    "VIS-01": ["tool"],
    "TEC-01": ["full"],
    "TEC-03": ["go"],
    "TEC-04": ["sqlite"],
  }),
  firestore: answer(base("Catatan"), {
    "VIS-01": ["content"],
    "TEC-01": ["full"],
    "TEC-02": ["sveltekit"],
    "TEC-04": ["firestore"],
  }),
  lainnya: answer(base("Kustom", "Aplikasi | pipa"), {
    "VIS-01": ["saas"],
    "FEA-01": ["onboarding", { other: "program poin, cetak invoice" }],
    "DAT-01": [{ other: "Cabang, Supplier" }],
    "DES-04": [{ other: "#0F766E" }],
    "USR-01": ["custom"],
    "USR-03": ["multi_org"],
  }),
};

const headings = (md: string) =>
  md
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => l.replace(/<!--.*?-->/g, "").trim());

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const templatesDir = join(process.cwd(), "templates");
const templates = readdirSync(templatesDir).filter((f) => f.endsWith(".md"));

describe.each(Object.entries(scenarios))("skenario %s", (_name, state) => {
  const result = generateAll(state, DATE);
  const md = result.files.filter((f) => f.path.endsWith(".md"));

  it("tidak menyisakan placeholder atau komentar template (AC-05-3)", () => {
    for (const f of md) {
      expect(f.content, f.path).not.toMatch(/\{\{|\}\}/);
      expect(f.content, f.path).not.toContain("<!--");
      expect(f.content, f.path).not.toContain("undefined");
      expect(f.content, f.path).not.toContain("[object Object]");
    }
  });

  it("lulus validasi tanpa error (AC-05-4)", () => {
    expect(result.issues.filter((i) => i.level === "error")).toEqual([]);
  });

  it("memuat semua heading ## dari templates/ (AC-05-2)", () => {
    for (const t of templates) {
      const out = result.files.find(
        (f) => f.path === (t === "AGENTS.md" || t === "CLAUDE.md" ? t : `docs/${t}`),
      );
      if (t === "CLAUDE.md" && !out) continue;
      expect(out, t).toBeDefined();
      const have = headings(out?.content ?? "");
      for (const h of headings(readFileSync(join(templatesDir, t), "utf8"))) {
        // {{placeholder}} di heading template boleh berisi teks apa pun.
        const pattern = new RegExp(
          `^${h
            .split(/\{\{[^}]+\}\}/)
            .map(escapeRe)
            .join(".+")}$`,
        );
        expect(
          have.some((x) => pattern.test(x)),
          `${t}: ${h}`,
        ).toBe(true);
      }
    }
  });

  it("setiap fitur Must punya kriteria dan setiap tugas fase 1–2 merujuk ID fitur", () => {
    for (const f of result.plan.features.filter((x) => x.priority === "must"))
      expect(f.acceptance.length).toBeGreaterThan(0);
    const tasks = result.files.find((f) => f.path === "docs/TASKS.md")?.content ?? "";
    const body = tasks.slice(tasks.indexOf("## Fase 1"), tasks.indexOf("## Fase 3"));
    for (const block of body.split("### ").slice(1))
      expect(block.split("\n")[0]).toMatch(/\(F-\d{2}\)/);
  });

  it("deterministik (AC-05-1)", () => {
    expect(generateAll(state, DATE).files).toEqual(result.files);
  });
});

describe("file khusus agen (AC-10-1)", () => {
  it("AGENTS.md selalu dibuat, CLAUDE.md hanya jika Claude Code dipilih", () => {
    const paths = generateAll(scenarios.laravel, DATE).files.map((f) => f.path);
    expect(paths).toContain("AGENTS.md");
    expect(paths).not.toContain("CLAUDE.md");
    expect(paths).toEqual(
      expect.arrayContaining([
        ".cursor/rules/project.mdc",
        ".github/copilot-instructions.md",
        "GEMINI.md",
        ".kiro/steering/project.md",
        ".windsurf/rules/project.md",
      ]),
    );
    expect(generateAll(scenarios.semuaAi, DATE).files.map((f) => f.path)).toContain("CLAUDE.md");
  });
});

describe("isi spesifik", () => {
  it("menandai keputusan rekomendasi dengan [ASUMSI] (AC-03-3)", () => {
    const r = generateAll(scenarios.semuaAi, DATE);
    expect(r.assumptionCount).toBeGreaterThan(20);
    expect(r.files.find((f) => f.path === "docs/PRD.md")?.content).toContain(
      "Toko online / e-commerce [ASUMSI]",
    );
  });

  it("memakai isian Lainnya di file hasil", () => {
    const r = generateAll(scenarios.lainnya, DATE);
    const prd = r.files.find((f) => f.path === "docs/PRD.md")?.content ?? "";
    expect(prd).toContain("Program poin");
    expect(prd).toContain("Aplikasi | pipa");
    expect(r.files.find((f) => f.path === "docs/DATA_MODEL.md")?.content).toContain("### Cabang");
    expect(r.files.find((f) => f.path === "docs/DESIGN.md")?.content).toContain("#0F766E");
  });

  it("perintah mengikuti bahasa yang dipilih", () => {
    const agents = (s: keyof typeof scenarios) =>
      generateAll(scenarios[s], DATE).files.find((f) => f.path === "AGENTS.md")?.content ?? "";
    expect(agents("laravel")).toContain("php artisan test");
    expect(agents("python")).toContain("uv run pytest");
    expect(agents("go")).toContain("go test ./...");
    expect(agents("semuaAi")).toContain("pnpm test");
  });

  it("menyertakan jawaban mentah untuk impor ulang", () => {
    const f = generateAll(scenarios.lainnya, DATE).files.find(
      (x) => x.path === "vibeplan-answers.json",
    );
    expect(JSON.parse(f?.content ?? "{}").answers["DES-04"].otherText).toBe("#0F766E");
  });
});

describe("klarifikasi AI di PRD", () => {
  const withClarifications = setClarifications(
    base("Servis AC", "Pemesanan servis AC di Bandung."),
    [
      {
        id: "K-01",
        text: "Siapa yang menetapkan harga?",
        type: "single",
        options: [
          { id: "K-01-a", label: "Teknisi" },
          { id: "K-01-b", label: "Admin" },
        ],
        optionIds: ["K-01-b"],
      },
      {
        id: "K-02",
        text: "Ada garansi?",
        type: "single",
        options: [
          { id: "K-02-a", label: "Ya" },
          { id: "K-02-b", label: "Tidak" },
        ],
        optionIds: [],
      },
    ],
  );
  const prd = (s: typeof withClarifications) =>
    generateAll(s, DATE).files.find((f) => f.path === "docs/PRD.md")?.content ?? "";

  it("menulis jawaban klarifikasi dan melewatkan yang tidak dijawab", () => {
    const content = prd(withClarifications);
    expect(content).toContain("### Klarifikasi awal");
    expect(content).toContain("| Siapa yang menetapkan harga? | Admin |");
    expect(content).not.toContain("Ada garansi?");
  });

  it("tidak menambah bagian jika tidak ada klarifikasi", () => {
    expect(prd(base("Servis AC"))).not.toContain("Klarifikasi awal");
  });
});

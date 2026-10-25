import { hostingName, type Plan, type PlanFeature } from "../engine/plan";
import { doc } from "./md";

interface Task {
  id: string;
  title: string;
  deps: string[];
  refs?: string;
  steps?: string;
  files?: string;
  done: string[];
}

const taskBlock = (t: Task): string =>
  [
    `### ${t.id} · ${t.title}`,
    "- Status: [ ]",
    `- Bergantung pada: ${t.deps.length > 0 ? t.deps.join(", ") : "-"}`,
    ...(t.refs ? [`- Rujukan: ${t.refs}`] : []),
    ...(t.steps ? [`- Langkah: ${t.steps}`] : []),
    ...(t.files ? [`- File yang kemungkinan disentuh: ${t.files}`] : []),
    "- Selesai jika:",
    ...t.done.map((d) => `  - [ ] ${d}`),
  ].join("\n");

export function generateTasks(p: Plan): string {
  const { a, label, stack } = p;
  const c = stack.commands;
  let n = 0;
  const nextId = () => `T-${String(++n).padStart(3, "0")}`;
  const noTests = a.has("QUA-02", "none");
  const e2e = a.has("QUA-02", "e2e");
  const unitTests = a.has("QUA-02", "unit") || a.has("QUA-02", "integration");
  const granularity = a.first("AIW-03") ?? "small";
  const testLine = (f: PlanFeature) =>
    noTests
      ? `Uji manual: semua kriteria ${f.fid} dicoba di browser dan dicatat di Log Pekerjaan`
      : `Tes: ${e2e ? `Playwright untuk alur ${f.label}` : `unit test untuk logika ${f.label}`} mencakup setiap AC ${f.fid}`;

  const t1: Task = {
    id: nextId(),
    title: "Inisialisasi proyek",
    deps: [],
    steps: `buat proyek ${stack.info.framework.name}, pasang linter/formatter, struktur folder sesuai ARCHITECTURE.md §3, catat versi persis di TECH_STACK.md §1.`,
    done: [
      `\`${c.dev}\` berjalan tanpa error`,
      `\`${c.lint}\` dan \`${c.typecheck}\` lulus`,
      "Struktur folder sama dengan ARCHITECTURE.md §3",
      "`.env.example` berisi semua variabel di TECH_STACK.md §6",
    ],
  };
  const t2: Task = {
    id: nextId(),
    title: "Database & skema awal",
    deps: [t1.id],
    refs: "DATA_MODEL.md §1–3",
    done: [
      `\`${c.migrate}\` berjalan di database lokal`,
      "Semua entitas di DATA_MODEL.md ada di skema dengan kolom standar §1",
      "Seed data contoh minimal 3 baris per entitas utama",
    ],
  };
  const foundation: Task[] = [t1, t2];
  const auth = p.features.find((f) => f.key === "auth");
  let authTask: Task | undefined;
  if (auth) {
    authTask = {
      id: nextId(),
      title: `Autentikasi (${auth.fid})`,
      deps: [t2.id],
      refs: `PRD.md ${auth.fid}, ARCHITECTURE.md §5`,
      done: [...auth.acceptance.map((ac) => `${ac}`), testLine(auth)],
    };
    foundation.push(authTask);
  }
  const t4: Task = {
    id: nextId(),
    title: "Layout & design tokens",
    deps: [t1.id],
    refs: "DESIGN.md §2–4",
    done: [
      `Token warna/tipografi terpasang, tema ${label("DES-03")} berfungsi`,
      `Navigasi ${label("DES-07")} tampil di mobile dan desktop`,
      "Komponen dasar DESIGN.md §4 tersedia",
    ],
  };
  foundation.push(t4);

  const base = [t2.id, t4.id, ...(authTask ? [authTask.id] : [])];
  const featureTasks = (f: PlanFeature, deps: string[]): Task[] => {
    const page = f.route.path
      ? `halaman ${f.route.path}`
      : `${f.route.name.toLowerCase()} yang memakai fitur ini`;
    const refs = `PRD.md ${f.fid}, DESIGN.md §5 ${f.route.path ? `route ${f.route.path}` : "(halaman terkait)"}${f.entities.length > 0 ? `, DATA_MODEL.md ${f.entities.join("/")}` : ""}`;
    if (granularity === "small") {
      const data: Task = {
        id: nextId(),
        title: `${f.label}: logika server (${f.fid})`,
        deps,
        refs,
        files: "folder services/ dan actions/ (atau routes/) untuk fitur ini",
        done: [
          "Fungsi server untuk setiap aksi fitur ada, dengan validasi input dan cek izin",
          unitTests
            ? `Unit test fungsi server lulus (\`${c.test}\`)`
            : "Fungsi dicoba manual atau lewat tes alur, hasilnya dicatat",
        ],
      };
      const ui: Task = {
        id: nextId(),
        title: `${f.label}: halaman & alur (${f.fid})`,
        deps: [data.id],
        refs,
        files: `${page} dan komponennya`,
        done: [...f.acceptance, testLine(f)],
      };
      return [data, ui];
    }
    return [
      {
        id: nextId(),
        title: `${f.label} (${f.fid})`,
        deps,
        refs,
        files: `${page}, logika server fitur ini${f.entities.length > 0 ? `, query ${f.entities.join("/")}` : ""}`,
        done: [...f.acceptance, testLine(f)],
      },
    ];
  };

  const musts = p.features.filter((f) => f.priority === "must" && f.key !== "auth");
  const ordered =
    p.mainFlow && musts.includes(p.mainFlow)
      ? [p.mainFlow, ...musts.filter((f) => f !== p.mainFlow)]
      : musts;
  const phase1: Task[] = [];
  let prev: string[] = base;
  for (const f of ordered) {
    const ts = featureTasks(f, prev);
    phase1.push(...ts);
    const last = ts[ts.length - 1];
    if (last && f === ordered[0]) prev = [last.id];
  }
  const phase2: Task[] = [];
  const phase1Last = phase1[phase1.length - 1]?.id;
  for (const f of p.features.filter((x) => x.priority === "should")) {
    phase2.push(...featureTasks(f, phase1Last ? [phase1Last] : base));
  }
  const allBefore = [...phase1, ...phase2].map((t) => t.id);
  const release: Task = {
    id: nextId(),
    title: "Kesiapan produksi",
    deps: allBefore.length > 0 ? [allBefore[allBefore.length - 1] as string] : base,
    done: [
      noTests ? "Build sukses dan alur utama diuji manual" : "Semua tes lulus, build sukses",
      "Variabel lingkungan produksi terdokumentasi di TECH_STACK.md §6",
      `Deploy ke ${hostingName(stack.hosting, a)} berhasil dan alur utama diuji manual`,
      ...(a.first("QUA-01") === "fast" ? ["Lighthouse halaman utama ≥ 90 (mobile)"] : []),
    ],
  };

  const sizeLabel = label("AIW-03");
  return doc(
    `# Rencana Tugas: ${p.name}`,
    `> Kerjakan **satu tugas per sesi/PR**, berurutan. Tugas selesai hanya jika semua poin "Selesai jika" terpenuhi.\n> Ukuran tugas: ${sizeLabel} · Lanjut ke tugas berikutnya: ${label("AIW-04")}`,
    "**Legenda status:** `[ ]` belum · `[~]` dikerjakan · `[x]` selesai · `[!]` terhambat",
    "## Fase 0 · Fondasi",
    ...foundation.map(taskBlock),
    `## Fase 1 · Alur Utama (${p.mainFlow ? `${p.mainFlow.fid} ${p.mainFlow.label}` : "fitur Must"})`,
    ...(phase1.length > 0 ? phase1.map(taskBlock) : ["Tidak ada fitur Must selain fondasi."]),
    "## Fase 2 · Fitur Should",
    ...(phase2.length > 0 ? phase2.map(taskBlock) : ["Tidak ada fitur Should."]),
    "## Fase 3 · Penyempurnaan & Rilis",
    taskBlock(release),
    "## Log Pekerjaan",
    "| Tanggal | Tugas | Catatan |\n|---|---|---|\n| | | |",
  );
}

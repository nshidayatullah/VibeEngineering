import { ASSUMPTION, type Plan } from "../engine/plan";
import { bullets, code, doc, numbered } from "./md";

const DOC_LIST = [
  "- `docs/PRD.md`: fitur, kriteria penerimaan, di luar lingkup",
  "- `docs/ARCHITECTURE.md`: struktur folder, aturan dependensi, ADR",
  "- `docs/TECH_STACK.md`: versi, library disetujui/dilarang, perintah",
  "- `docs/DATA_MODEL.md`: skema & aturan data",
  "- `docs/DESIGN.md`: token, komponen, halaman",
  "- `docs/TASKS.md`: tugas yang sedang dikerjakan",
].join("\n");

export function summary(p: Plan): string {
  const musts = p.features.filter((f) => f.priority === "must").map((f) => f.label);
  const s = p.stack.info;
  return [
    p.idea || `${p.name}: ${p.appTypeLabel.replace(` ${ASSUMPTION}`, "").toLowerCase()}.`,
    `Fitur wajib versi ini: ${musts.join(", ") || "lihat PRD"}.`,
    `Stack: ${s.framework.name}, ${s.db.name}${s.orm ? ` + ${s.orm.name}` : ""}, ${s.ui.name}.`,
  ].join(" ");
}

export function generateAgents(p: Plan): string {
  const { a, label, stack } = p;
  const c = stack.commands;
  const proceed =
    {
      approve: "Berhenti dan tunggu persetujuan pengguna sebelum mengambil tugas berikutnya.",
      tests: "Lanjut ke tugas berikutnya hanya jika semua tes dan build lulus.",
      auto: "Boleh langsung lanjut ke tugas berikutnya; laporkan ringkasan di akhir sesi.",
    }[a.first("AIW-04") ?? "approve"] ??
    a.resolved("AIW-04").otherText ??
    "Tunggu persetujuan pengguna.";
  const convention =
    {
      default: "Ikuti konvensi bawaan framework dan aturan linter; jangan mematikan aturan lint.",
      functional:
        "Gunakan fungsi dan komponen fungsional kecil (≤ 150 baris per file), tanpa class; satu komponen per file, nama file kebab-case.",
    }[a.first("AIW-07") ?? "default"] ??
    a.resolved("AIW-07").otherText ??
    "Ikuti konvensi framework.";
  const git =
    {
      main: "Commit langsung ke main, satu commit per tugas.",
      pr: "Buat branch `task/T-xxx-<ringkas>` per tugas dan satu pull request per tugas. Jangan merge sendiri.",
      manual: "Jangan menjalankan git commit/push; pengguna yang mengurus git.",
    }[a.first("AIW-06") ?? "pr"] ??
    a.resolved("AIW-06").otherText ??
    "Branch per tugas.";
  const comm =
    {
      none: "Pengguna bukan programmer. Jelaskan hasil dalam bahasa sederhana, tanpa istilah teknis, dan beri langkah untuk mencobanya di browser.",
      read: "Pengguna bisa membaca kode sedikit. Jelaskan apa yang berubah dan di file mana, lalu beri langkah mencobanya.",
      dev: "Pengguna adalah developer. Ringkas: apa yang berubah, keputusan penting, dan cara memverifikasi.",
    }[a.first("AIW-02") ?? "read"] ?? "Jelaskan hasil dengan ringkas.";

  const bans = a.val("AIW-05");
  const constraints = [
    'JANGAN mengerjakan apa pun yang tercantum di PRD.md §6 "Di Luar Lingkup".',
    ...(bans.includes("deps")
      ? ["JANGAN menambah/mengganti dependensi tanpa izin (lihat TECH_STACK.md §2–3)."]
      : []),
    ...(bans.includes("schema")
      ? ["JANGAN mengubah skema database tanpa izin; jika disetujui, perbarui DATA_MODEL.md §5."]
      : []),
    ...(bans.includes("tests") ? ["JANGAN menghapus atau melemahkan tes agar lulus."] : []),
    ...(bans.includes("main") ? ["JANGAN push langsung ke branch main."] : []),
    ...(bans.includes("secrets")
      ? ["JANGAN menyimpan rahasia/API key di kode; gunakan variabel lingkungan."]
      : []),
    ...(bans.includes("other") ? [`JANGAN ${a.resolved("AIW-05").otherText ?? ""}`] : []),
    ...(a.val("DAT-05").some((d) => d !== "none")
      ? [`JANGAN menulis data sensitif (${label("DAT-05")}) ke log, pesan error, atau data contoh.`]
      : []),
    "JANGAN mengubah keputusan bertanda [ASUMSI] tanpa bertanya; tanyakan jika asumsi itu menghalangi tugas.",
  ];

  const tests = a.val("QUA-02");
  const dod = [
    'Semua poin "Selesai jika" di tugas tercentang',
    tests.includes("none")
      ? "Lint, cek tipe, dan build lulus; alur diuji manual"
      : "Lint, cek tipe, tes, dan build lulus",
    ...(tests.includes("e2e")
      ? ["Tes Playwright untuk alur yang disentuh ditambah/diperbarui"]
      : []),
    ...(tests.includes("integration") ? ["Integration test untuk endpoint yang disentuh"] : []),
    ...(a.first("DES-08") === "wcag"
      ? ["Halaman yang disentuh lolos cek aksesibilitas (axe) tanpa pelanggaran serius"]
      : []),
  ];

  const isTs = stack.lang === "ts";
  return doc(
    "# AGENTS.md",
    `Instruksi untuk AI coding agent yang bekerja di repo **${p.name}**. Baca file ini setiap awal sesi.`,
    "## Konteks Proyek",
    summary(p),
    `Dokumen rujukan (baca sesuai kebutuhan, jangan menebak):\n${DOC_LIST}`,
    "## Perintah",
    code(
      [
        `${c.dev}        # jalankan dev server`,
        `${c.lint}       # lint`,
        `${c.typecheck}  # cek tipe`,
        `${c.test}       # tes`,
        `${c.build}      # build`,
      ].join("\n"),
      "bash",
    ),
    "## Alur Kerja",
    numbered([
      "Buka `docs/TASKS.md`, ambil tugas `[ ]` pertama yang semua dependensinya `[x]`. Ubah statusnya menjadi `[~]`.",
      "Baca rujukan tugas tersebut. Jika ada yang ambigu atau bertentangan, **berhenti dan tanya**, jangan mengasumsikan.",
      "Kerjakan **hanya** tugas itu. Jangan merapikan atau mengubah kode di luar lingkup tugas.",
      "Jalankan lint, cek tipe, dan tes. Semua harus lulus.",
      'Centang setiap poin "Selesai jika", ubah status menjadi `[x]`, isi Log Pekerjaan.',
      proceed,
    ]),
    "## Konvensi Kode",
    bullets([
      `Bahasa: ${stack.info.lang.name}${isTs ? "; `any` dilarang, gunakan `unknown` + validasi" : ""}`,
      convention,
      `Validasi semua input dari pengguna di server dengan ${stack.info.validation.name}.`,
      `Teks UI dalam ${label("DES-06")}; komentar kode & nama variabel dalam bahasa Inggris.`,
      "Ikuti token di DESIGN.md; tidak ada warna/ukuran hard-code.",
    ]),
    "## Git",
    bullets([git, "Pesan commit: `T-012: <ringkasan>`"]),
    "## Batasan (WAJIB)",
    bullets(constraints),
    "## Definisi Selesai",
    bullets(dod),
    "## Cara Berkomunikasi",
    comm,
  );
}

export function generateClaude(): string {
  return doc(
    "# CLAUDE.md",
    "@AGENTS.md",
    "## Khusus Claude Code",
    bullets([
      "Mulai setiap sesi dengan membaca `docs/TASKS.md` dan tugas aktif.",
      "Gunakan Plan Mode untuk tugas yang menyentuh lebih dari 3 file; tunjukkan rencana sebelum mengubah kode.",
      "Untuk keputusan arsitektur baru, usulkan baris ADR untuk `docs/ARCHITECTURE.md` §10 dan tunggu persetujuan.",
      "Jika kebutuhan tidak jelas, ajukan pertanyaan pilihan ganda (2–4 opsi + rekomendasi) daripada pertanyaan terbuka.",
    ]),
  );
}

const POINTER =
  "Semua aturan proyek ada di `AGENTS.md` (root repo) dan dokumen di `docs/`. Baca `AGENTS.md` dan `docs/TASKS.md` sebelum mengubah kode, lalu kerjakan satu tugas saja.";

export function generateAgentExtras(p: Plan): { path: string; content: string }[] {
  const out: { path: string; content: string }[] = [];
  if (p.agents.includes("claude")) out.push({ path: "CLAUDE.md", content: generateClaude() });
  if (p.agents.includes("cursor"))
    out.push({
      path: ".cursor/rules/project.mdc",
      content: doc(
        "---\ndescription: Aturan proyek\nalwaysApply: true\n---",
        `# ${p.name}`,
        POINTER,
        "@AGENTS.md",
      ),
    });
  if (p.agents.includes("copilot"))
    out.push({
      path: ".github/copilot-instructions.md",
      content: doc(`# ${p.name}`, POINTER, summary(p)),
    });
  if (p.agents.includes("gemini"))
    out.push({ path: "GEMINI.md", content: doc("# GEMINI.md", "@AGENTS.md") });
  if (p.agents.includes("kiro"))
    out.push({
      path: ".kiro/steering/project.md",
      content: doc("---\ninclusion: always\n---", `# ${p.name}`, POINTER, "#[[file:AGENTS.md]]"),
    });
  if (p.agents.includes("windsurf"))
    out.push({
      path: ".windsurf/rules/project.md",
      content: doc("---\ntrigger: always_on\n---", `# ${p.name}`, POINTER),
    });
  return out;
}

export function startPrompt(p: Plan): string {
  return [
    `Kita akan membangun ${p.name}.`,
    "Baca AGENTS.md lalu semua file di docs/ (PRD, ARCHITECTURE, TECH_STACK, DATA_MODEL, DESIGN, TASKS).",
    "Sebelum menulis kode, sebutkan (1) ringkasan aplikasi dalam 3 kalimat, (2) daftar keputusan bertanda [ASUMSI] yang perlu saya konfirmasi, dan (3) pertanyaan jika ada yang bertentangan.",
    "Setelah saya konfirmasi, kerjakan hanya T-001 dari docs/TASKS.md sesuai alur kerja di AGENTS.md.",
  ].join("\n");
}

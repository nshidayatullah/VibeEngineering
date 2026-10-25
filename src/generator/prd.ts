import { ASSUMPTION, type Plan } from "../engine/plan";
import { bullets, doc, numbered, PRIORITY_LABEL, table } from "./md";

const METRICS: Record<string, [string, string, string]> = {
  signups: [
    "Jumlah pendaftar",
    "100 akun dalam 1 bulan setelah rilis",
    "Jumlah baris User baru per minggu",
  ],
  revenue: [
    "Transaksi/pendapatan",
    "20 transaksi berhasil dalam 1 bulan",
    "Pesanan berstatus paid per minggu",
  ],
  time_saved: [
    "Waktu kerja yang dihemat",
    "Proses utama ≥ 50% lebih cepat dari cara lama",
    "Uji waktu sebelum/sesudah dengan 3 pengguna",
  ],
  dau: [
    "Pengguna aktif harian",
    "30% pendaftar aktif mingguan",
    "Analytics: pengguna unik per hari",
  ],
  works: [
    "Berfungsi tanpa error saat demo",
    "Alur utama berjalan end-to-end tanpa error",
    "Uji manual alur utama sebelum demo",
  ],
};

export function generatePrd(p: Plan): string {
  const { a, label } = p;
  const r04 = a.resolved("VIS-04");
  const metricRows = r04.optionIds.map((id) => {
    if (id === "other")
      return [
        r04.otherText ?? "-",
        `${ASSUMPTION} tentukan angka target`,
        "Tentukan bersama pengguna",
      ];
    const m = METRICS[id] ?? [id, "-", "-"];
    return r04.decidedBy === "ai" ? [`${m[0]} ${ASSUMPTION}`, m[1], m[2]] : [...m];
  });

  const personaSkill = label("USR-04");
  const audience = label("VIS-02");
  const roles = p.roles;
  const entityNames = p.entities.map((e) => e.label);
  const roleRows = roles.map((role) =>
    role.startsWith("Admin")
      ? [role, "Semua", "Semua", "Semua", "Semua", ""]
      : role.startsWith("Peran kustom")
        ? [
            role,
            "Diatur Admin",
            "Diatur Admin",
            "Diatur Admin",
            "Diatur Admin",
            "Matriks izin disimpan di database",
          ]
        : [
            role,
            entityNames.length > 0 ? "Data publik + data miliknya" : "Halaman publik",
            p.needsLogin ? "Data miliknya" : "-",
            p.needsLogin ? "Data miliknya" : "-",
            p.needsLogin ? "Data miliknya" : "-",
            roles.length > 2 ? `${ASSUMPTION} rincikan per entitas` : "",
          ],
  );

  const active = p.features.filter((f) => f.priority !== "wont");
  const detailed = p.features.filter((f) => f.priority === "must" || f.priority === "should");
  const outOfScope = [
    ...p.features
      .filter((f) => f.priority === "could")
      .map((f) => `${f.fid} ${f.label} (Could, versi berikutnya)`),
    ...p.features.filter((f) => f.priority === "wont").map((f) => `${f.fid} ${f.label} (Won't)`),
    ...(p.a.first("QUA-05") === "none" ? ["Mode offline"] : []),
    ...(p.a.first("FEA-05") === "none" ? ["Fitur real-time (websocket/live update)"] : []),
    ...(p.a.first("DES-06") !== "i18n" ? ["Multi-bahasa (i18n)"] : []),
    "Fitur apa pun yang tidak tercantum di §4",
  ];

  const flow = p.mainFlow;
  const flowSteps = flow
    ? [
        `${capitalize(flow.story.role)} membuka ${flow.route.path || flow.route.name.toLowerCase()} (${flow.route.name}).`,
        ...(flow.route.access !== "Publik" && p.needsLogin
          ? ["Jika belum login, pengguna diarahkan ke /masuk lalu kembali."]
          : []),
        ...flow.acceptance.slice(0, 3).map((ac) => `${ac}.`),
        `Alur dianggap sempurna jika semua kriteria ${flow.fid} lulus tes.`,
      ]
    : ["Belum ada fitur Must."];

  const openQuestions = [
    ...p.features
      .filter((f) => f.acceptanceAssumed)
      .map((f) => `Kriteria penerimaan ${f.fid} ${f.label} masih generik`),
    ...p.entities.filter((e) => e.custom).map((e) => `Field dan relasi entitas ${e.label}`),
    ...(roles.length > 2 ? ["Matriks izin per entitas untuk setiap peran"] : []),
  ];

  return doc(
    `# PRD: ${p.name}`,
    [
      `> Versi 0.1 · ${p.date} · Status: Draft`,
      "> Sumber kebenaran untuk *apa* yang dibangun. Keputusan teknis ada di [ARCHITECTURE.md](ARCHITECTURE.md) dan [TECH_STACK.md](TECH_STACK.md).",
      `> Item bertanda \`${ASSUMPTION}\` adalah rekomendasi yang belum dikonfirmasi pengguna.`,
    ].join("\n"),
    "## 1. Ringkasan",
    p.idea ||
      `${p.name} adalah ${p.appTypeLabel.replace(` ${ASSUMPTION}`, "").toLowerCase()} untuk ${audience.toLowerCase()}.`,
    bullets([
      `**Jenis aplikasi:** ${p.appTypeLabel}`,
      `**Tujuan tahap ini:** ${label("VIS-03")}`,
      `**Target rilis:** ${label("VIS-05")}`,
    ]),
    "## 2. Masalah & Tujuan",
    `**Masalah yang diselesaikan:** ${p.idea || `${ASSUMPTION} lihat ringkasan; pertajam bersama pengguna.`}`,
    "**Metrik sukses**",
    table(
      ["Metrik", "Target", "Cara ukur"],
      metricRows.length > 0
        ? metricRows
        : [["Berfungsi tanpa error", "Alur utama lulus", "Uji manual"]],
    ),
    "## 3. Pengguna",
    "### Persona",
    table(
      ["Persona", "Deskripsi", "Tujuan utama", "Kemampuan teknis"],
      roles
        .filter((r) => !r.startsWith("Peran kustom"))
        .map((r) => [
          r,
          r.startsWith("Admin") ? "Pengelola aplikasi" : `Bagian dari: ${audience}`,
          r.startsWith("Admin")
            ? "Data selalu akurat dan terkendali"
            : flow
              ? `${capitalize(flow.story.action)}`
              : "Memakai fitur utama",
          r.startsWith("Admin") ? "Terbiasa aplikasi web" : personaSkill,
        ]),
    ),
    "### Peran & hak akses",
    table(["Peran", "Lihat", "Buat", "Ubah", "Hapus", "Catatan"], roleRows),
    "### Autentikasi",
    bullets([
      `Akses: ${label("USR-02")}`,
      `Metode login: ${label("AUTH-01", "Tidak ada login")}`,
      `Pendaftaran: ${label("AUTH-02", "Tidak ada pendaftaran")}`,
      `Organisasi/tim: ${label("USR-03", "Tidak ada")}`,
    ]),
    "## 4. Fitur",
    "### Daftar fitur (MoSCoW)",
    table(
      ["ID", "Fitur", "Prioritas", "Deskripsi singkat"],
      p.features.map((f) => [
        f.fid,
        f.label,
        PRIORITY_LABEL[f.priority] + (f.priorityAssumed ? ` ${ASSUMPTION}` : ""),
        f.description,
      ]),
    ),
    "### Alur utama",
    flow
      ? `**${flow.fid} · ${flow.label}** ${p.a.resolved("FEA-03").decidedBy === "ai" ? ASSUMPTION : ""}`.trim()
      : "",
    numbered(flowSteps),
    `**Pendukung:** ${label("FEA-06", "Tidak ada integrasi")} · Notifikasi: ${label("FEA-07")} · Real-time: ${label("FEA-05")} · Pembayaran: ${label("PAY-01", "Tidak ada")}`,
    "### Detail fitur",
    ...detailed.flatMap((f) => [
      `#### ${f.fid} · ${f.label}`,
      `**User story:** Sebagai ${f.story.role}, saya ingin ${f.story.action} agar ${f.story.benefit}.`,
      `**Kriteria penerimaan (EARS)**${f.acceptanceAssumed ? ` ${ASSUMPTION} generik, tinjau sebelum dikerjakan` : ""}`,
      bullets(f.acceptance.map((ac, i) => `AC-${f.fid.slice(2)}-${i + 1}: ${ac}.`)),
      `**Kasus tepi:** ${f.edgeCases}`,
    ]),
    active.length === detailed.length ? "" : "Fitur Could tidak dirinci; lihat §6.",
    "## 5. Kebutuhan Non-fungsional",
    table(
      ["Aspek", "Kebutuhan terukur"],
      [
        ["Performa", label("QUA-01")],
        ["Skala", `${label("VIS-06")} pengguna dalam 6 bulan; data terbesar ${label("DAT-04")}`],
        ["Keamanan", label("QUA-03")],
        ["Data sensitif", label("DAT-05")],
        ["SEO", label("QUA-04")],
        ["Offline", label("QUA-05")],
        ["Aksesibilitas", label("DES-08")],
        ["Bahasa", label("DES-06")],
        ["Perangkat", label("DES-01")],
      ],
    ),
    "## 6. Di Luar Lingkup (TIDAK dikerjakan)",
    "AI agent DILARANG mengerjakan hal di bawah ini tanpa persetujuan tertulis.",
    bullets(outOfScope),
    "## 7. Pertanyaan Terbuka & Asumsi",
    table(
      ["ID", "Pertanyaan / Asumsi", "Status"],
      [
        ...openQuestions.map((q, i) => [`Q-${String(i + 1).padStart(2, "0")}`, q, "Terbuka"]),
        ...p.assumptions.map((as, i) => [
          `A-${String(i + 1).padStart(2, "0")}`,
          `${as.questionId} ${as.text} → ${as.answer}. Alasan: ${as.reason}`,
          "Asumsi, perlu konfirmasi",
        ]),
      ].concat(
        openQuestions.length + p.assumptions.length === 0
          ? [["-", "Tidak ada asumsi; semua keputusan dibuat pengguna", "Selesai"]]
          : [],
      ),
    ),
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

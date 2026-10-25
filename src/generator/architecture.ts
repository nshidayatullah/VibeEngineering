import { ASSUMPTION, hostingName, type Plan } from "../engine/plan";
import { bullets, code, doc, numbered, table } from "./md";

export function folderTree(p: Plan): string {
  const { framework, backend, orm } = p.stack;
  const schema = orm === "prisma" ? "prisma/schema.prisma        # skema database" : "";
  if (framework === "laravel" || backend === "laravel") {
    return [
      "app/",
      "  Http/Controllers/   # tipis: validasi (Form Request) + panggil Service",
      "  Http/Requests/      # validasi input",
      "  Models/             # Eloquent model (satu per entitas DATA_MODEL)",
      "  Services/           # logika bisnis",
      "  Policies/           # otorisasi per model",
      "database/migrations/  # satu-satunya tempat definisi tabel",
      "resources/js/",
      "  Pages/              # halaman Inertia (route di DESIGN.md §5)",
      "  Components/ui/      # komponen dasar",
      "  Components/         # komponen fitur",
      "routes/web.php",
      "tests/Feature/  tests/Unit/",
    ].join("\n");
  }
  if (p.a.first("TEC-08") === "monorepo" || ["node", "python", "go"].includes(backend)) {
    const api =
      backend === "python"
        ? [
            "  api/                # FastAPI",
            "    app/routers/      # endpoint per fitur",
            "    app/services/     # logika bisnis",
            "    app/models.py     # SQLAlchemy",
            "    tests/",
          ]
        : backend === "go"
          ? [
              "  api/                # Go",
              "    cmd/server/       # main",
              "    internal/http/    # handler per fitur",
              "    internal/service/ # logika bisnis",
              "    internal/store/   # akses database",
              "    migrations/",
            ]
          : [
              "  api/                # Hono",
              "    src/routes/       # endpoint per fitur",
              "    src/services/     # logika bisnis",
              "    src/db/schema.ts  # skema database",
              "    tests/",
            ];
    return [
      "apps/",
      "  web/                # frontend",
      "    src/pages|routes/ # halaman (DESIGN.md §5)",
      "    src/components/ui/",
      "    src/components/",
      ...api,
      "packages/",
      "  shared/             # tipe & skema validasi bersama",
    ].join("\n");
  }
  if (framework === "nuxt") {
    return [
      "app/",
      "  pages/              # route & halaman",
      "  components/ui/",
      "  components/",
      "  composables/",
      "server/",
      "  api/                # endpoint per fitur",
      "  services/           # logika bisnis",
      "  db/schema.ts        # skema database",
      "tests/",
    ].join("\n");
  }
  if (framework === "sveltekit") {
    return [
      "src/",
      "  routes/             # halaman + +page.server.ts (load/actions)",
      "  lib/components/ui/",
      "  lib/components/",
      "  lib/server/services/ # logika bisnis",
      "  lib/server/db/schema.ts",
      "tests/",
    ].join("\n");
  }
  if (framework === "astro") {
    return [
      "src/",
      "  pages/              # route & halaman",
      "  layouts/",
      "  components/",
      "  content/            # konten markdown/koleksi",
      "  lib/                # utilitas murni",
      "public/",
      "tests/",
    ].join("\n");
  }
  return [
    "src/",
    "  app/                # route & halaman (hanya komposisi UI)",
    "  components/ui/      # komponen dasar",
    "  components/         # komponen fitur",
    "  server/",
    "    actions/          # server actions per fitur",
    orm === "prisma"
      ? "    db/client.ts      # klien Prisma"
      : "    db/schema.ts      # skema database (satu-satunya definisi tabel)",
    "    services/         # logika bisnis, tanpa akses request/response",
    "  lib/                # utilitas murni",
    schema,
    "tests/",
  ]
    .filter(Boolean)
    .join("\n");
}

const dependencyRule = (p: Plan): string => {
  const { framework, backend } = p.stack;
  if (framework === "laravel" || backend === "laravel")
    return "`routes → Controllers → Services → Models`. Controller tidak boleh berisi query langsung.";
  if (["node", "python", "go"].includes(backend))
    return "`web → (HTTP) → api/routes → api/services → api/db`. Frontend tidak pernah mengakses database langsung.";
  return "`app → components → server/actions → server/services → server/db`. Tidak boleh arah sebaliknya.";
};

const INTEGRATIONS: Record<string, [string, string, string, string]> = {
  email: [
    "Resend",
    "Email transaksi & verifikasi",
    "SDK resmi dari server",
    "Coba ulang 3x, catat kegagalan; transaksi tidak dibatalkan",
  ],
  whatsapp: [
    "WhatsApp Business API (penyedia resmi)",
    "Notifikasi WhatsApp",
    "HTTP dari server",
    "Jatuhkan ke email bila gagal",
  ],
  sheets: [
    "Google Sheets API",
    "Ekspor/sinkron data",
    "Service account dari server",
    "Tampilkan error, data aplikasi tetap sumber utama",
  ],
  maps: [
    "Google Maps / Leaflet + OpenStreetMap",
    "Peta & lokasi",
    "Komponen di klien",
    "Tampilkan alamat teks bila peta gagal",
  ],
  llm: [
    "Claude API (Anthropic)",
    "Fitur AI",
    "SDK resmi dari server, kunci di env",
    "Timeout 30 detik, pesan ramah, fitur lain tetap jalan",
  ],
  storage: [
    "Cloudflare R2 / S3",
    "Penyimpanan berkas",
    "Presigned URL dari server",
    "Tolak unggah, tampilkan pesan coba lagi",
  ],
  analytics: [
    "Plausible / Umami",
    "Analytics tanpa cookie",
    "Script di layout",
    "Diabaikan bila gagal dimuat",
  ],
};

const PAYMENTS: Record<string, [string, string, string, string]> = {
  local: [
    "Midtrans (Snap)",
    "Pembayaran QRIS/VA/e-wallet",
    "Buat transaksi di server, status lewat webhook",
    "Pesanan tetap pending; webhook idempoten",
  ],
  stripe: [
    "Stripe Checkout",
    "Pembayaran kartu",
    "Checkout Session dari server, status lewat webhook",
    "Pesanan tetap pending; webhook idempoten",
  ],
  recurring: [
    "Midtrans/Stripe Subscription",
    "Tagihan berulang",
    "Webhook mengubah status Subscription",
    "Status past_due + banner pembayaran",
  ],
};

export function generateArchitecture(p: Plan): string {
  const { a, label, stack } = p;
  const info = stack.info;
  const integrations = a.val("FEA-06").filter((x) => x !== "none" && x !== "other");
  const pay = a.first("PAY-01");
  const integrationRows = [
    ...integrations
      .map((id) => INTEGRATIONS[id])
      .filter((x): x is [string, string, string, string] => Boolean(x)),
    ...(pay && PAYMENTS[pay] ? [PAYMENTS[pay]] : []),
    ...(a.has("FEA-06", "other")
      ? [
          [
            a.resolved("FEA-06").otherText ?? "-",
            "Integrasi tambahan",
            `${ASSUMPTION} tentukan`,
            `${ASSUMPTION} tentukan`,
          ],
        ]
      : []),
  ].map((r) => [...r]);

  const diagram = [
    `Browser ─► ${info.framework.name}`,
    stack.backend === "integrated"
      ? `              ├─► Server (${info.backend.name}) ─► ${info.orm?.name ?? "driver"} ─► ${info.db.name}`
      : `              └─► API ${info.backend.name} ─► ${info.orm?.name ?? "driver"} ─► ${info.db.name}`,
    ...(info.auth ? [`              ├─► Auth (${info.auth.name})`] : []),
    ...(integrationRows.length > 0
      ? [`              └─► Layanan eksternal: ${integrationRows.map((r) => r[0]).join(", ")}`]
      : []),
  ].join("\n");

  const components = [
    ["Antarmuka", "Halaman & komponen (DESIGN.md)", `${info.framework.name}, ${info.ui.name}`],
    ["Logika bisnis", "Aturan di PRD §4 dan DATA_MODEL §4", info.backend.name],
    ["Akses data", "Query & migrasi", `${info.orm?.name ?? "driver resmi"} + ${info.db.name}`],
    ...(info.auth ? [["Autentikasi", "Sesi, login, izin", info.auth.name]] : []),
    ["Validasi", "Validasi semua input di server", info.validation.name],
  ];

  const flow = p.mainFlow;
  const flowSteps = flow
    ? [
        `Pengguna membuka ${flow.route.path || flow.route.name}; halaman memuat data lewat ${stack.backend === "integrated" ? "server component/loader" : "request ke API"}.`,
        `Aksi pengguna dikirim ke ${stack.backend === "integrated" ? "server action/endpoint" : "endpoint API"} ${flow.key}.`,
        `Input divalidasi dengan ${info.validation.name}; izin dicek sebelum logika bisnis.`,
        `Service menjalankan aturan bisnis${flow.entities.length > 0 ? ` dan membaca/menulis ${flow.entities.join(", ")}` : ""} dalam satu transaksi.`,
        "Hasil dikembalikan ke UI; UI menampilkan status berhasil/error sesuai DESIGN.md §6.",
      ]
    : ["Belum ada alur utama."];

  const security = [
    ...(a.has("QUA-03", "validation")
      ? ["Semua input divalidasi di server; validasi klien hanya untuk UX."]
      : []),
    ...(a.has("QUA-03", "ratelimit")
      ? [
          "Rate limiting pada login, pendaftaran, dan formulir publik (maks 10 permintaan/menit/IP).",
        ]
      : []),
    ...(a.has("QUA-03", "csrf")
      ? [
          "Proteksi CSRF bawaan framework aktif; tidak ada HTML mentah dari input pengguna (cegah XSS).",
        ]
      : []),
    ...(a.has("QUA-03", "encryption")
      ? ["Kolom data sensitif dienkripsi di level aplikasi; kunci di variabel lingkungan."]
      : []),
    ...(a.has("QUA-03", "2fa")
      ? ["2FA (TOTP) tersedia untuk semua akun dan wajib untuk Admin."]
      : []),
    ...(a.has("QUA-03", "backup")
      ? ["Backup database otomatis harian, simpan 7 hari, uji pemulihan sebulan sekali."]
      : []),
    ...(a.has("QUA-03", "other") ? [a.resolved("QUA-03").otherText ?? ""] : []),
    `Data sensitif: ${label("DAT-05")}. Jangan pernah menulis data ini ke log.`,
    "Rahasia hanya di variabel lingkungan (TECH_STACK.md §6), tidak pernah di repo.",
  ];

  const rendering =
    {
      high: "SSR/SSG untuk halaman publik dengan meta tag lengkap; halaman login boleh dirender di klien",
      some: "Halaman depan SSR/SSG, sisanya bebas",
      none: "Render bebas (aplikasi di balik login); tidak perlu SSR untuk SEO",
    }[a.first("QUA-04") ?? "some"] ?? "Ikuti default framework";

  const tenancy = label("USR-03", "Tidak ada (aplikasi tanpa login)");
  const session = info.auth
    ? `${info.auth.name}, sesi berbasis cookie httpOnly + secure`
    : "Tidak ada sesi (tanpa login)";

  return doc(
    `# Arsitektur: ${p.name}`,
    "> Menjelaskan *bagaimana* sistem disusun. Versi library ada di [TECH_STACK.md](TECH_STACK.md), skema data di [DATA_MODEL.md](DATA_MODEL.md).",
    "## 1. Gambaran Sistem",
    code(diagram),
    "## 2. Komponen",
    table(["Komponen", "Tanggung jawab", "Teknologi"], components),
    "## 3. Struktur Folder",
    `Struktur repo: ${label("TEC-08")}.`,
    code(folderTree(p)),
    `**Aturan dependensi:** ${dependencyRule(p)}`,
    "## 4. Alur Data Utama",
    flow ? `Untuk ${flow.fid} · ${flow.label}:` : "",
    numbered(flowSteps),
    "## 5. Autentikasi & Otorisasi",
    bullets([
      `Mekanisme sesi: ${session}`,
      `Pemeriksaan izin: ${info.auth ? "di setiap aksi server lewat satu helper (misal requireUser()/requireRole()), bukan hanya menyembunyikan tombol" : "tidak ada"}`,
      `Multi-tenant: ${tenancy}${["single_org", "multi_org"].includes(a.first("USR-03") ?? "") ? "; setiap query wajib difilter organization_id" : ""}`,
    ]),
    "## 6. Integrasi Eksternal",
    integrationRows.length > 0
      ? table(["Layanan", "Kegunaan", "Cara panggil", "Penanganan gagal"], integrationRows)
      : "Tidak ada integrasi eksternal. Menambah integrasi butuh persetujuan dan baris ADR baru.",
    "## 7. Rendering, Real-time, Offline",
    bullets([
      `Strategi rendering: ${rendering}`,
      `Real-time: ${label("FEA-05")}`,
      `Offline: ${label("QUA-05")}`,
    ]),
    "## 8. Keamanan",
    bullets(security.filter(Boolean)),
    "## 9. Lingkungan & Deploy",
    table(
      ["Lingkungan", "URL", "Branch", "Database"],
      [
        [
          "Lokal",
          "localhost",
          "-",
          stack.db === "sqlite" ? "file SQLite lokal" : `${info.db.name} lokal (Docker)`,
        ],
        [
          "Produksi",
          `domain di ${hostingName(stack.hosting, a)}`,
          "main",
          `${info.db.name} terkelola`,
        ],
      ],
    ),
    "## 10. Catatan Keputusan Arsitektur (ADR)",
    "Agen wajib menambah baris di sini jika membuat keputusan baru (setelah disetujui).",
    table(
      ["ID", "Tanggal", "Keputusan", "Alasan", "Alternatif yang ditolak"],
      [
        [
          "ADR-001",
          p.date,
          `Framework ${info.framework.name}`,
          info.framework.why + (a.resolved("TEC-02").decidedBy === "ai" ? ` ${ASSUMPTION}` : ""),
          "Lihat opsi TEC-02",
        ],
        [
          "ADR-002",
          p.date,
          `Database ${info.db.name}${info.orm ? ` + ${info.orm.name}` : ""}`,
          info.db.why + (a.resolved("TEC-04").decidedBy === "ai" ? ` ${ASSUMPTION}` : ""),
          "Lihat opsi TEC-04",
        ],
        ["ADR-003", p.date, `Backend: ${info.backend.name}`, info.backend.why, "Lihat opsi TEC-03"],
      ],
    ),
  );
}

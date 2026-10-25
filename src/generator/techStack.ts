import { ASSUMPTION, hostingName, type Plan } from "../engine/plan";
import { code, doc, table } from "./md";

export function generateTechStack(p: Plan): string {
  const { a, stack } = p;
  const { info, commands: c } = stack;
  const mark = (qid: string) =>
    a.resolved(qid).decidedBy === "ai" && !a.resolved(qid).hidden ? ` ${ASSUMPTION}` : "";
  const isJs = ["ts", "js"].includes(stack.lang);
  const monitoring = a.val("QUA-06").filter((m) => m !== "none");
  const monitoringName =
    monitoring.length === 0
      ? "Tidak ada (belum perlu)"
      : monitoring
          .map(
            (m) =>
              ({
                sentry: "Sentry",
                logs: "Log terpusat (Axiom/Better Stack)",
                uptime: "Uptime monitor (Better Stack/UptimeRobot)",
                other: a.resolved("QUA-06").otherText ?? "",
              })[m] ?? m,
          )
          .join(", ");

  const core: string[][] = [
    ["Bahasa", info.lang.name, info.lang.version, info.lang.why + mark("TEC-07")],
    ["Framework", info.framework.name, info.framework.version, info.framework.why + mark("TEC-02")],
    ["Backend", info.backend.name, info.backend.version, info.backend.why + mark("TEC-03")],
    ["Database", info.db.name, info.db.version, info.db.why + mark("TEC-04")],
    [
      "ORM",
      info.orm?.name ?? "Tidak ada (database non-SQL)",
      info.orm?.version ?? "-",
      info.orm ? info.orm.why + mark("TEC-05") : "-",
    ],
    [
      "Auth",
      info.auth?.name ?? "Tidak ada (tanpa login)",
      info.auth?.version ?? "-",
      info.auth?.why ?? "-",
    ],
    ["UI", info.ui.name, info.ui.version, info.ui.why + mark("DES-05")],
    ["Styling", info.styling.name, info.styling.version, info.styling.why],
    ["Validasi", info.validation.name, info.validation.version, info.validation.why],
    ["Testing", info.testing.name, "-", info.testing.why + mark("QUA-02")],
    ["Hosting", hostingName(stack.hosting, a), "-", mark("TEC-06").trim() || "Pilihan pengguna"],
    ["Monitoring", monitoringName, "-", mark("QUA-06").trim() || "Pilihan pengguna"],
  ];

  const approved: string[][] = [
    ...(isJs ? [["Tanggal & waktu", "date-fns 4.x", "Format sesuai DESIGN.md §8"]] : []),
    ...(a.has("FEA-06", "email")
      ? [["Email", isJs ? "resend" : "SDK Resend resmi", "Template email di folder emails/"]]
      : []),
    ...(a.first("PAY-01") === "local"
      ? [["Pembayaran", "midtrans-client", "Hanya dipanggil dari server"]]
      : []),
    ...(a.first("PAY-01") === "stripe" || a.first("PAY-01") === "recurring"
      ? [["Pembayaran", "stripe", "Hanya dipanggil dari server"]]
      : []),
    ...(a.has("FEA-06", "storage")
      ? [["Penyimpanan berkas", isJs ? "@aws-sdk/client-s3" : "SDK S3 resmi", "Kompatibel R2/S3"]]
      : []),
    ...(a.has("FEA-06", "llm")
      ? [
          [
            "AI/LLM",
            isJs ? "@anthropic-ai/sdk" : "SDK Anthropic resmi",
            "Kunci API hanya di server",
          ],
        ]
      : []),
    ...(monitoring.includes("sentry")
      ? [["Error tracking", isJs ? "@sentry/* sesuai framework" : "SDK Sentry resmi", "DSN di env"]]
      : []),
    ...(stack.testing.includes("e2e")
      ? [["Tes E2E", "@playwright/test", "Tes di folder tests/e2e"]]
      : []),
  ];

  const forbidden: string[][] = [
    ...(isJs
      ? [
          ["moment.js", "Besar dan tidak dirawat", "date-fns"],
          ["axios", "Tidak perlu", "fetch bawaan"],
          [
            "lodash",
            "Sebagian besar ada di JavaScript modern",
            "fungsi bawaan / utilitas kecil di lib/",
          ],
          ["jQuery", "Bentrok dengan framework", "API framework"],
        ]
      : []),
    ["Pustaka UI lain", `Sudah memakai ${info.ui.name}`, info.ui.name],
    ...(info.orm
      ? [["ORM/query builder lain", `Sudah memakai ${info.orm.name}`, info.orm.name]]
      : []),
    [
      "Pustaka state global (Redux, MobX, dll.)",
      "Tambah kompleksitas tanpa kebutuhan",
      "state bawaan framework",
    ],
  ];

  const env: string[][] = [
    ["APP_URL", "Ya", "http://localhost:3000", "URL dasar aplikasi"],
    ...(stack.db === "firestore"
      ? [["FIREBASE_PROJECT_ID", "Ya", "my-app", "Proyek Firebase"]]
      : [
          [
            "DATABASE_URL",
            "Ya",
            stack.db === "sqlite"
              ? "file:./dev.db"
              : stack.db === "mongodb"
                ? "mongodb://localhost:27017/app"
                : stack.db === "mysql"
                  ? "mysql://root@localhost:3306/app"
                  : "postgres://postgres@localhost:5432/app",
            "Koneksi database",
          ],
        ]),
    ...(p.needsLogin
      ? [["AUTH_SECRET", "Ya", "string acak 32+ karakter", "Penandatangan sesi"]]
      : []),
    ...(a.has("AUTH-01", "google")
      ? [
          [
            "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET",
            "Ya",
            "dari Google Cloud Console",
            "Login Google",
          ],
        ]
      : []),
    ...(a.has("AUTH-01", "github")
      ? [
          [
            "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET",
            "Ya",
            "dari GitHub Developer Settings",
            "Login GitHub",
          ],
        ]
      : []),
    ...(a.has("FEA-06", "email") ? [["RESEND_API_KEY", "Ya", "re_...", "Kirim email"]] : []),
    ...(a.first("PAY-01") === "local"
      ? [
          [
            "MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY",
            "Ya",
            "SB-Mid-server-...",
            "Pembayaran (sandbox di lokal)",
          ],
        ]
      : []),
    ...(a.first("PAY-01") === "stripe" || a.first("PAY-01") === "recurring"
      ? [
          [
            "STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET",
            "Ya",
            "sk_test_... / whsec_...",
            "Pembayaran",
          ],
        ]
      : []),
    ...(a.has("FEA-06", "storage")
      ? [
          [
            "S3_ENDPOINT / S3_BUCKET / S3_ACCESS_KEY / S3_SECRET_KEY",
            "Ya",
            "https://<akun>.r2.cloudflarestorage.com",
            "Penyimpanan berkas",
          ],
        ]
      : []),
    ...(a.has("FEA-06", "llm") ? [["ANTHROPIC_API_KEY", "Ya", "sk-ant-...", "Fitur AI"]] : []),
    ...(monitoring.includes("sentry")
      ? [["SENTRY_DSN", "Tidak", "https://...@sentry.io/...", "Error tracking produksi"]]
      : []),
  ];

  return doc(
    `# Tech Stack: ${p.name}`,
    "> Versi dikunci. Agen **tidak boleh** menambah, mengganti, atau meng-upgrade dependensi tanpa persetujuan.\n> Versi mayor di bawah dikunci; versi persis dicatat dari lockfile setelah T-001.",
    "## 1. Stack Inti",
    table(["Lapisan", "Pilihan", "Versi", "Alasan"], core),
    "## 2. Library yang Disetujui",
    approved.length > 0
      ? table(["Kebutuhan", "Library", "Catatan"], approved)
      : "Hanya library di §1. Library lain butuh persetujuan.",
    "## 3. Library yang Dilarang",
    table(["Library", "Alasan", "Gunakan ini sebagai gantinya"], forbidden),
    "## 4. Setup Lokal",
    code([`${c.install}`, "cp .env.example .env", `${c.dbSetup}`, `${c.dev}`].join("\n"), "bash"),
    "## 5. Perintah Penting",
    table(
      ["Tujuan", "Perintah"],
      [
        ["Jalankan dev", c.dev],
        ["Lint", c.lint],
        ["Cek tipe", c.typecheck],
        ["Tes", c.test],
        ["Build", c.build],
        ["Migrasi DB", c.migrate],
      ].map(([k, v]) => [k as string, `\`${v}\``]),
    ),
    "## 6. Variabel Lingkungan",
    table(["Nama", "Wajib", "Contoh", "Keterangan"], env),
  );
}

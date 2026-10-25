import type { Accessor, Option, Priority, Question, Stage } from "../engine/types";
import { ENTITIES } from "./entities";
import { FEATURE_BY_ID, featuresForApp, SUPPORT_FEATURES } from "./features";

export const STAGES: Stage[] = [
  {
    id: "visi",
    number: 1,
    title: "Visi & Tujuan",
    description: "Masalah, target pengguna, ukuran sukses",
  },
  {
    id: "pengguna",
    number: 2,
    title: "Pengguna & Peran",
    description: "Jenis pengguna, hak akses, login",
  },
  {
    id: "fitur",
    number: 3,
    title: "Fitur & Alur",
    description: "Fitur inti, prioritas, alur utama",
  },
  { id: "data", number: 4, title: "Data", description: "Entitas, aturan hapus, volume" },
  { id: "desain", number: 5, title: "Desain & UX", description: "Gaya visual, perangkat, bahasa" },
  { id: "teknologi", number: 6, title: "Teknologi", description: "Framework, database, hosting" },
  { id: "kualitas", number: 7, title: "Kualitas", description: "Performa, keamanan, pengujian" },
  { id: "ai", number: 8, title: "Kerja dengan AI", description: "Agen, ukuran tugas, aturan" },
];

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/** Memecah isian "Lainnya" yang dipisah koma/baris menjadi daftar. */
export const splitList = (text: string | undefined): string[] =>
  (text ?? "")
    .split(/[,\n;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

/** Fitur kustom dari isian "Lainnya" di FEA-01 dan FEA-04. */
export const customFeatures = (a: Accessor): Option[] =>
  ["FEA-01", "FEA-04"].flatMap((q) => {
    const r = a.resolved(q);
    if (r.hidden || !r.optionIds.includes("other")) return [];
    return splitList(r.otherText).map((label) => ({
      id: `x-${slugify(label)}`,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    }));
  });

/** Semua fitur terpilih (katalog + pendukung + kustom), urut sesuai pertanyaan. */
export const selectedFeatureOptions = (a: Accessor): Option[] => {
  const ids = [...a.val("FEA-01"), ...a.val("FEA-04")].filter((id) => id !== "other");
  const seen = new Set<string>();
  const out: Option[] = [];
  for (const id of ids) {
    const f = FEATURE_BY_ID[id];
    if (f && !seen.has(id)) {
      seen.add(id);
      out.push({ id, label: f.label });
    }
  }
  for (const c of customFeatures(a)) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
};

const needsLogin = (a: Accessor) => a.first("USR-02") !== "public";
const sqlDb = (a: Accessor) =>
  ["postgres", "mysql", "sqlite", "supabase"].includes(a.first("TEC-04") ?? "");
const hasTransactional = (a: Accessor) =>
  selectedFeatureOptions(a).some((o) => FEATURE_BY_ID[o.id]?.transactional === true);
const appType = (a: Accessor) => a.first("VIS-01");
const isPrototype = (a: Accessor) => ["prototype", "learning"].includes(a.first("VIS-03") ?? "");
const techAuto = (a: Accessor) => a.first("TEC-01") === "all";
/** "Saya pilih bagian penting saja": hanya framework, database, dan hosting yang ditanyakan. */
const techMinorAuto = (a: Accessor) => techAuto(a) || a.first("TEC-01") === "some";

const one = (id: string, reason: string) => ({ optionIds: [id], reason });
const many = (ids: string[], reason: string) => ({ optionIds: ids, reason });

export const QUESTIONS: Question[] = [
  // Tahap 1 · Visi & Tujuan
  {
    id: "VIS-01",
    stage: "visi",
    text: "Jenis aplikasi apa yang paling mendekati ide Anda?",
    help: "Menentukan daftar fitur dan entitas yang ditawarkan di tahap berikutnya.",
    type: "single",
    options: [
      { id: "landing", label: "Landing page / company profile" },
      { id: "ecommerce", label: "Toko online / e-commerce" },
      { id: "saas", label: "SaaS (langganan)" },
      { id: "internal", label: "Dashboard / sistem internal" },
      { id: "marketplace", label: "Marketplace (banyak penjual)" },
      { id: "content", label: "Aplikasi konten / blog / komunitas" },
      { id: "booking", label: "Booking / reservasi" },
      { id: "tool", label: "Alat (tool) satu fungsi" },
    ],
    recommend: (a) => {
      const idea = a.state.idea.toLowerCase();
      const rules: [RegExp, string][] = [
        [/toko|jual|e-?commerce|katalog|produk/, "ecommerce"],
        [/marketplace|penjual|seller/, "marketplace"],
        [/booking|reservasi|jadwal|janji/, "booking"],
        [/blog|artikel|komunitas|forum|konten/, "content"],
        [/langganan|saas|subscription/, "saas"],
        [/internal|karyawan|kantor|inventaris|laporan|dashboard/, "internal"],
        [/profil|landing|company|portofolio/, "landing"],
      ];
      const hit = rules.find(([re]) => re.test(idea));
      return hit
        ? one(hit[1], "Dipilih dari kata kunci di ide Anda.")
        : one(
            "tool",
            "Ide tidak menyebut jenis yang jelas; alat satu fungsi adalah lingkup paling kecil.",
          );
    },
  },
  {
    id: "VIS-02",
    stage: "visi",
    text: "Untuk siapa aplikasi ini?",
    type: "single",
    options: [
      { id: "self", label: "Saya sendiri" },
      { id: "team", label: "Tim/kantor internal" },
      { id: "b2c", label: "Pelanggan bisnis saya (B2C)" },
      { id: "b2b", label: "Perusahaan lain (B2B)" },
      { id: "public", label: "Publik umum" },
    ],
    recommend: (a) => {
      const t = appType(a);
      if (t === "internal") return one("team", "Sistem internal dipakai tim sendiri.");
      if (t === "saas") return one("b2b", "SaaS umumnya dijual ke bisnis.");
      if (t === "tool" || t === "content")
        return one("public", "Alat/konten biasanya terbuka untuk umum.");
      return one("b2c", "Jenis aplikasi ini melayani pelanggan akhir.");
    },
  },
  {
    id: "VIS-03",
    stage: "visi",
    text: "Tujuan utama tahap pertama?",
    type: "single",
    options: [
      { id: "prototype", label: "Prototipe untuk validasi ide" },
      { id: "mvp", label: "MVP untuk pengguna nyata" },
      { id: "production", label: "Produk siap produksi" },
      { id: "learning", label: "Proyek belajar" },
    ],
    recommend: () => one("mvp", "MVP menyeimbangkan kecepatan dan kualitas untuk pengguna nyata."),
  },
  {
    id: "VIS-04",
    stage: "visi",
    text: "Bagaimana Anda mengukur keberhasilan?",
    type: "multi",
    options: [
      { id: "signups", label: "Jumlah pendaftar" },
      { id: "revenue", label: "Transaksi/pendapatan" },
      { id: "time_saved", label: "Waktu kerja yang dihemat" },
      { id: "dau", label: "Pengguna aktif harian" },
      { id: "works", label: "Cukup berfungsi tanpa error untuk demo" },
    ],
    recommend: (a) => {
      if (isPrototype(a))
        return one("works", "Untuk prototipe, ukuran utamanya adalah berfungsi saat demo.");
      const t = appType(a);
      if (t === "internal")
        return one("time_saved", "Sistem internal dinilai dari waktu kerja yang dihemat.");
      if (t === "ecommerce" || t === "marketplace" || t === "booking")
        return many(
          ["revenue", "signups"],
          "Aplikasi transaksi diukur dari transaksi dan pendaftar.",
        );
      return many(["signups", "dau"], "Ukuran umum untuk produk publik.");
    },
  },
  {
    id: "VIS-05",
    stage: "visi",
    text: "Target waktu rilis versi pertama?",
    type: "single",
    options: [
      { id: "week", label: "< 1 minggu" },
      { id: "month", label: "2–4 minggu" },
      { id: "quarter", label: "1–3 bulan" },
      { id: "none", label: "Belum ada target" },
    ],
    recommend: (a) =>
      isPrototype(a)
        ? one("week", "Prototipe sebaiknya cepat agar ide segera divalidasi.")
        : one("month", "2–4 minggu realistis untuk MVP dengan AI agent."),
  },
  {
    id: "VIS-06",
    stage: "visi",
    text: "Skala pengguna yang diharapkan dalam 6 bulan?",
    type: "single",
    options: [
      { id: "xs", label: "< 50" },
      { id: "s", label: "50–1.000" },
      { id: "m", label: "1.000–50.000" },
      { id: "l", label: "> 50.000" },
    ],
    recommend: (a) =>
      ["self", "team"].includes(a.first("VIS-02") ?? "")
        ? one("xs", "Pengguna internal biasanya sedikit.")
        : one("s", "Perkiraan aman untuk versi pertama; arsitektur tetap bisa tumbuh."),
  },

  // Tahap 2 · Pengguna & Peran
  {
    id: "USR-01",
    stage: "pengguna",
    text: "Berapa jenis pengguna (peran) yang berbeda?",
    type: "single",
    options: [
      { id: "single", label: "Satu peran saja" },
      { id: "user_admin", label: "Pengguna + admin" },
      { id: "multi", label: "3–4 peran" },
      { id: "custom", label: "Peran kustom yang bisa diatur admin" },
    ],
    recommend: (a) => {
      const t = appType(a);
      if (t === "marketplace")
        return one("multi", "Marketplace punya pembeli, penjual, dan admin.");
      if (t === "tool" || a.first("VIS-02") === "self")
        return one("single", "Satu jenis pengguna sudah cukup.");
      return one("user_admin", "Pola paling umum: pengguna biasa dan admin pengelola.");
    },
  },
  {
    id: "USR-02",
    stage: "pengguna",
    text: "Apakah pengguna harus login?",
    type: "single",
    options: [
      { id: "public", label: "Tidak, semuanya publik" },
      { id: "partial", label: "Sebagian halaman publik, sebagian butuh login" },
      { id: "all", label: "Seluruh aplikasi butuh login" },
    ],
    recommend: (a) => {
      const t = appType(a);
      if (t === "internal" || t === "saas")
        return one("all", "Data internal/akun harus di balik login.");
      if (t === "landing" && a.first("USR-01") === "single")
        return one("public", "Situs profil tidak butuh login.");
      if (t === "tool") return one("public", "Alat satu fungsi paling mudah dipakai tanpa login.");
      return one("partial", "Pengunjung bisa melihat-lihat, aksi pribadi butuh login.");
    },
  },
  {
    id: "AUTH-01",
    stage: "pengguna",
    text: "Metode login?",
    type: "multi",
    showIf: needsLogin,
    options: [
      { id: "password", label: "Email + password" },
      { id: "magic", label: "Magic link / OTP email" },
      { id: "google", label: "Google" },
      { id: "github", label: "GitHub" },
      { id: "phone", label: "Nomor HP (OTP WhatsApp/SMS)" },
      { id: "sso", label: "SSO perusahaan (SAML/OIDC)" },
    ],
    recommend: (a) =>
      appType(a) === "internal"
        ? one("password", "Untuk tim internal, email + password paling sederhana dikelola admin.")
        : many(
            ["password", "google"],
            "Email + password sebagai dasar, Google untuk daftar cepat.",
          ),
  },
  {
    id: "AUTH-02",
    stage: "pengguna",
    text: "Siapa yang boleh mendaftar?",
    type: "single",
    showIf: needsLogin,
    options: [
      { id: "anyone", label: "Siapa saja" },
      { id: "invite", label: "Hanya lewat undangan" },
      { id: "admin", label: "Didaftarkan admin" },
      { id: "domain", label: "Domain email tertentu saja" },
    ],
    recommend: (a) =>
      appType(a) === "internal"
        ? one("admin", "Akun internal sebaiknya dibuat admin.")
        : one("anyone", "Pendaftaran terbuka memudahkan pengguna baru."),
  },
  {
    id: "USR-03",
    stage: "pengguna",
    text: "Apakah ada konsep organisasi/tim (multi-tenant)?",
    type: "single",
    showIf: needsLogin,
    options: [
      { id: "none", label: "Tidak, tiap pengguna berdiri sendiri" },
      { id: "single_org", label: "Ya, pengguna tergabung dalam satu organisasi" },
      { id: "multi_org", label: "Ya, pengguna bisa ikut banyak organisasi" },
    ],
    recommend: (a) =>
      appType(a) === "saas" && a.first("VIS-02") === "b2b"
        ? one("multi_org", "SaaS B2B biasanya memakai workspace per perusahaan.")
        : one("none", "Tanpa multi-tenant lebih sederhana; tambahkan nanti jika perlu."),
  },
  {
    id: "USR-04",
    stage: "pengguna",
    text: "Tingkat kemampuan teknis pengguna utama?",
    type: "single",
    options: [
      { id: "novice", label: "Awam (perlu panduan)" },
      { id: "regular", label: "Terbiasa aplikasi web" },
      { id: "technical", label: "Teknis/pengembang" },
    ],
    recommend: () => one("regular", "Asumsi umum pengguna web saat ini."),
  },

  // Tahap 3 · Fitur & Alur
  {
    id: "FEA-01",
    stage: "fitur",
    text: "Fitur utama yang dibutuhkan",
    help: "Daftar disesuaikan dengan jenis aplikasi. Fitur lain bisa ditulis di Lainnya, pisahkan dengan koma.",
    type: "multi",
    options: (a) =>
      featuresForApp(appType(a)).map((f) => ({ id: f.id, label: f.label, hint: f.description })),
    otherPlaceholder: "contoh: program poin, cetak invoice",
    recommend: (a) =>
      many(
        featuresForApp(appType(a))
          .filter((f) => f.core)
          .map((f) => f.id),
        "Fitur inti untuk jenis aplikasi ini.",
      ),
  },
  {
    id: "FEA-04",
    stage: "fitur",
    text: "Fitur pendukung",
    type: "multi",
    options: SUPPORT_FEATURES.map((f) => ({ id: f.id, label: f.label, hint: f.description })),
    recommend: (a) => {
      const t = appType(a);
      if (t === "internal")
        return many(
          ["search", "filter", "export_csv"],
          "Data operasional perlu dicari dan diekspor.",
        );
      if (t === "ecommerce" || t === "marketplace")
        return many(["search", "filter", "upload"], "Katalog perlu pencarian dan gambar produk.");
      if (t === "content") return many(["search", "upload"], "Konten perlu pencarian dan gambar.");
      if (t === "landing" || t === "tool")
        return many([], "Tidak perlu fitur pendukung untuk versi pertama.");
      return many(["search"], "Pencarian hampir selalu berguna.");
    },
  },
  {
    id: "FEA-02",
    stage: "fitur",
    text: "Prioritas tiap fitur yang dipilih",
    help: "Must = wajib versi 1 · Should = sebaiknya versi 1 · Could = nanti · Won't = tidak dikerjakan.",
    type: "priority",
    options: selectedFeatureOptions,
    recommend: (a) => {
      const opts = selectedFeatureOptions(a);
      const quick = a.first("VIS-05") === "week";
      let mustCount = 0;
      const priorities: Record<string, Priority> = {};
      for (const o of opts) {
        const f = FEATURE_BY_ID[o.id];
        let p: Priority;
        if (f?.core && (!quick || mustCount < 3)) p = "must";
        else if (f && f.appTypes.length === 0) p = isPrototype(a) ? "could" : "should";
        else p = "should";
        if (p === "must") mustCount++;
        priorities[o.id] = p;
      }
      if (mustCount === 0 && opts[0]) priorities[opts[0].id] = "must";
      return {
        optionIds: [],
        priorities,
        reason: quick
          ? "Fitur inti menjadi Must (maksimal 3 karena target < 1 minggu), sisanya Should/Could."
          : "Fitur inti menjadi Must, fitur tambahan Should, fitur pendukung Should/Could.",
      };
    },
  },
  {
    id: "FEA-03",
    stage: "fitur",
    text: "Alur paling penting yang harus sempurna?",
    type: "single",
    options: (a) => {
      const pr = a.resolved("FEA-02").priorities;
      return selectedFeatureOptions(a).filter((o) => pr[o.id] === "must");
    },
    recommend: (a) => {
      const pr = a.resolved("FEA-02").priorities;
      const firstMust = selectedFeatureOptions(a).find((o) => pr[o.id] === "must");
      return firstMust
        ? one(firstMust.id, "Fitur Must pertama adalah inti nilai aplikasi.")
        : many([], "Belum ada fitur Must.");
    },
  },
  {
    id: "PAY-01",
    stage: "fitur",
    text: "Pembayaran online?",
    type: "single",
    showIf: hasTransactional,
    options: [
      { id: "manual", label: "Tidak, manual/transfer" },
      { id: "local", label: "Payment gateway lokal (Midtrans/Xendit)" },
      { id: "stripe", label: "Stripe" },
      { id: "recurring", label: "Langganan berulang" },
    ],
    recommend: (a) => {
      if (appType(a) === "saas") return one("recurring", "SaaS memakai tagihan berulang.");
      if (a.first("VIS-03") === "prototype")
        return one("manual", "Prototipe cukup transfer manual.");
      return one("local", "Gateway lokal mendukung QRIS, VA, dan e-wallet untuk pasar Indonesia.");
    },
  },
  {
    id: "FEA-05",
    stage: "fitur",
    text: "Kebutuhan real-time?",
    type: "single",
    options: [
      { id: "none", label: "Tidak perlu" },
      { id: "polling", label: "Cukup refresh berkala" },
      { id: "live", label: "Update langsung (chat, notifikasi live)" },
      { id: "collab", label: "Kolaborasi bersamaan (edit bareng)" },
    ],
    recommend: (a) =>
      a.val("FEA-01").includes("chat")
        ? one("live", "Fitur pesan butuh update langsung.")
        : one("none", "Tidak ada fitur yang butuh real-time; lebih sederhana tanpa itu."),
  },
  {
    id: "FEA-06",
    stage: "fitur",
    text: "Integrasi pihak ketiga",
    type: "multi",
    options: [
      { id: "email", label: "Email (Resend/SMTP)" },
      { id: "whatsapp", label: "WhatsApp" },
      { id: "sheets", label: "Google Sheets" },
      { id: "maps", label: "Peta/Maps" },
      { id: "llm", label: "AI/LLM" },
      { id: "storage", label: "Penyimpanan file (S3/R2)" },
      { id: "analytics", label: "Analytics" },
      { id: "none", label: "Tidak ada" },
    ],
    recommend: (a) => {
      const ids: string[] = [];
      if (
        needsLogin(a) ||
        a.val("FEA-01").some((f) => ["email_notif", "newsletter", "invites", "contact"].includes(f))
      )
        ids.push("email");
      if (
        a.val("FEA-04").includes("upload") ||
        ["ecommerce", "marketplace", "content"].includes(appType(a) ?? "")
      )
        ids.push("storage");
      if (!isPrototype(a) && a.first("VIS-02") !== "team" && a.first("VIS-02") !== "self")
        ids.push("analytics");
      return ids.length > 0
        ? many(ids, "Diturunkan dari fitur yang dipilih (login/email, upload, dan produk publik).")
        : one("none", "Fitur yang dipilih tidak membutuhkan layanan eksternal.");
    },
  },
  {
    id: "FEA-07",
    stage: "fitur",
    text: "Notifikasi ke pengguna lewat apa?",
    type: "single",
    options: [
      { id: "none", label: "Tidak ada" },
      { id: "email", label: "Email" },
      { id: "inapp", label: "Dalam aplikasi" },
      { id: "both", label: "Email + dalam aplikasi" },
      { id: "wa", label: "WhatsApp/SMS" },
    ],
    recommend: (a) => {
      const inapp = a.val("FEA-04").includes("inapp_notif");
      const email = a.val("FEA-06").includes("email");
      if (inapp && email) return one("both", "Email dan notifikasi dalam aplikasi sudah dipilih.");
      if (inapp) return one("inapp", "Notifikasi dalam aplikasi sudah dipilih.");
      if (email) return one("email", "Integrasi email sudah dipilih.");
      return one("none", "Tidak ada kanal notifikasi yang dipilih.");
    },
  },

  // Tahap 4 · Data
  {
    id: "DAT-01",
    stage: "data",
    text: "Entitas (tabel) utama",
    help: "Diusulkan dari fitur yang dipilih. Hapus centang yang tidak perlu; tambah entitas lain di Lainnya (pisahkan dengan koma).",
    type: "multi",
    options: (a) =>
      proposedEntities(a).map((id) => ({
        id,
        label: ENTITIES[id]?.label ?? id,
        hint: ENTITIES[id]?.description,
      })),
    otherPlaceholder: "contoh: Cabang, Supplier",
    recommend: (a) => many(proposedEntities(a), "Entitas yang dibutuhkan oleh fitur terpilih."),
  },
  {
    id: "DAT-03",
    stage: "data",
    text: "Jika data dihapus?",
    type: "single",
    options: [
      { id: "hard", label: "Hilang permanen" },
      { id: "soft", label: "Soft delete (bisa dipulihkan)" },
      { id: "archive", label: "Diarsipkan" },
      { id: "deactivate", label: "Tidak boleh dihapus, hanya dinonaktifkan" },
    ],
    recommend: (a) =>
      isPrototype(a)
        ? one("hard", "Prototipe tidak perlu pemulihan data.")
        : one("soft", "Soft delete mencegah kehilangan data karena salah klik."),
  },
  {
    id: "DAT-04",
    stage: "data",
    text: "Perkiraan volume data terbesar dalam 1 tahun?",
    type: "single",
    options: [
      { id: "s", label: "< 10 ribu baris" },
      { id: "m", label: "10 ribu – 1 juta" },
      { id: "l", label: "> 1 juta" },
    ],
    recommend: (a) =>
      ["m", "l"].includes(a.first("VIS-06") ?? "")
        ? one("m", "Skala pengguna menengah ke atas.")
        : one("s", "Skala pengguna kecil."),
  },
  {
    id: "DAT-05",
    stage: "data",
    text: "Data sensitif yang disimpan?",
    type: "multi",
    options: [
      { id: "none", label: "Tidak ada" },
      { id: "personal", label: "Data pribadi (nama, HP, alamat)" },
      { id: "financial", label: "Data keuangan" },
      { id: "health", label: "Data kesehatan" },
      { id: "identity", label: "Dokumen identitas" },
    ],
    recommend: (a) => {
      const ents = a.val("DAT-01");
      const ids: string[] = [];
      if (
        ents.some((e) => ["User", "Booking", "Order", "ContactMessage", "Subscriber"].includes(e))
      )
        ids.push("personal");
      if (ents.some((e) => ["Order", "Payout", "Subscription"].includes(e))) ids.push("financial");
      return ids.length > 0
        ? many(ids, "Diturunkan dari entitas yang menyimpan kontak atau transaksi.")
        : one("none", "Entitas terpilih tidak menyimpan data pribadi.");
    },
  },
  {
    id: "DAT-06",
    stage: "data",
    text: "Perlu riwayat perubahan data?",
    type: "single",
    options: [
      { id: "none", label: "Tidak" },
      { id: "timestamps", label: "Cukup created_at/updated_at" },
      { id: "audit", label: "Siapa mengubah apa (audit log)" },
      { id: "versions", label: "Versi lengkap tiap perubahan" },
    ],
    recommend: (a) =>
      a.val("FEA-04").includes("audit_log")
        ? one("audit", "Fitur log aktivitas sudah dipilih.")
        : one("timestamps", "Cap waktu cukup untuk sebagian besar aplikasi."),
  },
  {
    id: "DAT-07",
    stage: "data",
    text: "Mata uang, zona waktu, format?",
    type: "single",
    options: [
      { id: "id", label: "Rupiah, WIB, format Indonesia" },
      { id: "multi", label: "Multi mata uang/zona waktu" },
      { id: "us", label: "USD, UTC" },
    ],
    recommend: () => one("id", "Target pengguna Indonesia."),
  },

  // Tahap 5 · Desain & UX
  {
    id: "DES-01",
    stage: "desain",
    text: "Perangkat utama pengguna?",
    type: "single",
    options: [
      { id: "mobile", label: "Mobile dulu" },
      { id: "desktop", label: "Desktop dulu" },
      { id: "both", label: "Sama pentingnya" },
    ],
    recommend: (a) =>
      appType(a) === "internal" || appType(a) === "saas"
        ? one("desktop", "Aplikasi kerja lebih sering dibuka di desktop.")
        : one("mobile", "Sebagian besar pengguna Indonesia mengakses lewat HP."),
  },
  {
    id: "DES-02",
    stage: "desain",
    text: "Gaya visual?",
    type: "single",
    options: [
      { id: "minimal", label: "Minimalis bersih (seperti Linear/Notion)" },
      { id: "corporate", label: "Korporat profesional" },
      { id: "playful", label: "Playful & berwarna" },
      { id: "luxury", label: "Mewah/elegan" },
      { id: "brand", label: "Mengikuti brand yang sudah ada" },
    ],
    recommend: () => one("minimal", "Gaya minimalis paling mudah dijaga konsisten oleh AI agent."),
  },
  {
    id: "DES-03",
    stage: "desain",
    text: "Mode tema?",
    type: "single",
    options: [
      { id: "light", label: "Terang saja" },
      { id: "dark", label: "Gelap saja" },
      { id: "system", label: "Terang + gelap (ikut sistem)" },
    ],
    recommend: (a) =>
      isPrototype(a)
        ? one("light", "Satu tema cukup untuk prototipe.")
        : one("system", "Mengikuti preferensi perangkat pengguna."),
  },
  {
    id: "DES-04",
    stage: "desain",
    text: "Warna utama?",
    type: "single",
    options: [
      { id: "blue", label: "Biru" },
      { id: "green", label: "Hijau" },
      { id: "purple", label: "Ungu" },
      { id: "orange", label: "Oranye" },
      { id: "red", label: "Merah" },
      { id: "neutral", label: "Netral/hitam" },
    ],
    otherPlaceholder: "kode warna hex, contoh: #0F766E",
    recommend: (a) => {
      const t = appType(a);
      if (t === "ecommerce" || t === "marketplace")
        return one("orange", "Oranye umum untuk belanja dan ajakan beli.");
      if (t === "booking") return one("green", "Hijau memberi kesan tenang dan tersedia.");
      return one("blue", "Biru netral, kontras baik, dan dipercaya.");
    },
  },
  {
    id: "DES-05",
    stage: "desain",
    text: "Pustaka komponen UI?",
    type: "single",
    options: [
      { id: "shadcn", label: "shadcn/ui" },
      { id: "mui", label: "Material UI" },
      { id: "mantine", label: "Mantine" },
      { id: "chakra", label: "Chakra" },
      { id: "tailwind", label: "Tailwind murni (komponen sendiri)" },
    ],
    recommend: () =>
      one("shadcn", "Komponen disalin ke repo sehingga mudah dibaca dan diubah AI agent."),
  },
  {
    id: "DES-06",
    stage: "desain",
    text: "Bahasa antarmuka?",
    type: "single",
    options: [
      { id: "id", label: "Indonesia" },
      { id: "en", label: "Inggris" },
      { id: "i18n", label: "Indonesia + Inggris (i18n)" },
    ],
    recommend: (a) =>
      a.first("DAT-07") === "us"
        ? one("en", "Format USD/UTC menandakan pengguna internasional.")
        : one("id", "Target pengguna Indonesia."),
  },
  {
    id: "DES-07",
    stage: "desain",
    text: "Struktur navigasi?",
    type: "single",
    options: [
      { id: "sidebar", label: "Sidebar (aplikasi/dashboard)" },
      { id: "topnav", label: "Navbar atas (situs)" },
      { id: "bottomtab", label: "Bottom tab (mobile)" },
      { id: "combo", label: "Kombinasi" },
    ],
    recommend: (a) => {
      const t = appType(a);
      if (t === "internal" || t === "saas")
        return one("sidebar", "Aplikasi kerja dengan banyak menu cocok memakai sidebar.");
      return one("topnav", "Situs publik lazim memakai navbar atas.");
    },
  },
  {
    id: "DES-08",
    stage: "desain",
    text: "Tingkat aksesibilitas?",
    type: "single",
    options: [
      { id: "basic", label: "Dasar (kontras & label)" },
      { id: "wcag", label: "WCAG 2.1 AA" },
      { id: "none", label: "Tidak diprioritaskan" },
    ],
    recommend: (a) =>
      a.first("VIS-03") === "production"
        ? one("wcag", "Produk siap produksi sebaiknya memenuhi WCAG 2.1 AA.")
        : one("basic", "Standar dasar tanpa memperlambat pengembangan."),
  },
  {
    id: "DES-09",
    stage: "desain",
    text: "Ada desain/mockup yang sudah jadi?",
    type: "single",
    options: [
      { id: "none", label: "Belum ada, AI yang merancang" },
      { id: "sketch", label: "Ada sketsa kasar" },
      { id: "figma", label: "Ada file Figma" },
      { id: "reference", label: "Tiru gaya situs referensi" },
    ],
    otherPlaceholder: "URL situs referensi / Figma",
    recommend: () => one("none", "Desain diturunkan dari token di DESIGN.md."),
  },

  // Tahap 6 · Teknologi
  {
    id: "TEC-01",
    stage: "teknologi",
    text: "Seberapa jauh Anda ingin ikut menentukan stack?",
    type: "single",
    options: [
      { id: "all", label: "Tentukan semuanya untuk saya" },
      { id: "some", label: "Saya pilih bagian penting saja" },
      { id: "full", label: "Saya pilih semuanya" },
    ],
    recommend: () =>
      one("all", "Stack yang direkomendasikan saling cocok dan paling dikenal AI agent."),
  },
  {
    id: "TEC-02",
    stage: "teknologi",
    text: "Framework frontend/full-stack?",
    type: "single",
    autoAi: techAuto,
    options: [
      { id: "next", label: "Next.js (React)" },
      { id: "nuxt", label: "Nuxt (Vue)" },
      { id: "sveltekit", label: "SvelteKit" },
      { id: "laravel", label: "Laravel + Inertia" },
      { id: "astro", label: "Astro (konten statis)" },
      { id: "vite", label: "React + Vite (SPA)" },
    ],
    recommend: (a) => {
      if (appType(a) === "landing" && a.first("USR-02") === "public")
        return one("astro", "Situs konten tanpa login paling cepat dan SEO-friendly dengan Astro.");
      return one("next", "Next.js adalah framework full-stack yang paling dikenal AI agent.");
    },
  },
  {
    id: "TEC-03",
    stage: "teknologi",
    text: "Backend?",
    type: "single",
    autoAi: techMinorAuto,
    options: [
      { id: "integrated", label: "Menyatu dengan framework (server actions/API routes)" },
      { id: "node", label: "Backend terpisah Node (Hono)" },
      { id: "python", label: "Python (FastAPI)" },
      { id: "laravel", label: "PHP Laravel" },
      { id: "go", label: "Go" },
      { id: "baas", label: "BaaS (Supabase/Firebase)" },
    ],
    recommend: (a) => {
      const fw = a.first("TEC-02");
      if (fw === "laravel") return one("laravel", "Laravel sudah mencakup backend.");
      if (fw === "vite") return one("node", "SPA butuh API terpisah; Hono ringan dan TypeScript.");
      return one("integrated", "Satu codebase lebih mudah dikelola AI agent.");
    },
  },
  {
    id: "TEC-04",
    stage: "teknologi",
    text: "Database?",
    type: "single",
    autoAi: techAuto,
    options: [
      { id: "postgres", label: "PostgreSQL" },
      { id: "mysql", label: "MySQL" },
      { id: "sqlite", label: "SQLite" },
      { id: "mongodb", label: "MongoDB" },
      { id: "supabase", label: "Supabase (Postgres terkelola)" },
      { id: "firestore", label: "Firebase Firestore" },
    ],
    recommend: (a) => {
      if (a.first("TEC-03") === "baas")
        return one("supabase", "BaaS dipilih; Supabase menyediakan Postgres terkelola.");
      if (a.first("TEC-02") === "laravel" || a.first("TEC-03") === "laravel")
        return one("mysql", "Pasangan bawaan Laravel.");
      if (isPrototype(a) && a.first("VIS-06") === "xs")
        return one("sqlite", "Prototipe kecil cukup SQLite tanpa server database.");
      return one("postgres", "Relasional, andal, tersedia di hampir semua hosting.");
    },
  },
  {
    id: "TEC-05",
    stage: "teknologi",
    text: "Akses database (ORM)?",
    type: "single",
    autoAi: techMinorAuto,
    showIf: sqlDb,
    options: [
      { id: "prisma", label: "Prisma" },
      { id: "drizzle", label: "Drizzle" },
      { id: "eloquent", label: "Eloquent" },
      { id: "sqlalchemy", label: "SQLAlchemy" },
      { id: "sql", label: "SQL langsung" },
    ],
    recommend: (a) => {
      const be = a.first("TEC-03");
      if (be === "laravel" || a.first("TEC-02") === "laravel")
        return one("eloquent", "ORM bawaan Laravel.");
      if (be === "python") return one("sqlalchemy", "ORM standar Python.");
      if (be === "go") return one("sql", "Go umumnya memakai SQL langsung (sqlc/pgx).");
      return one("drizzle", "Skema TypeScript yang eksplisit dan mudah dibaca AI agent.");
    },
  },
  {
    id: "TEC-06",
    stage: "teknologi",
    text: "Hosting?",
    type: "single",
    autoAi: techAuto,
    options: [
      { id: "vercel", label: "Vercel" },
      { id: "netlify", label: "Netlify" },
      { id: "railway", label: "Railway/Render" },
      { id: "vps", label: "VPS sendiri (Docker)" },
      { id: "cloudflare", label: "Cloudflare" },
      { id: "cloud", label: "AWS/GCP" },
    ],
    recommend: (a) => {
      const fw = a.first("TEC-02");
      const be = a.first("TEC-03");
      if (fw === "laravel" || be === "laravel" || be === "python" || be === "go")
        return one("railway", "Backend non-JavaScript paling mudah dideploy di Railway/Render.");
      if (fw === "astro")
        return one("cloudflare", "Situs statis gratis dan cepat di Cloudflare Pages.");
      return one("vercel", "Deploy Next.js tanpa konfigurasi.");
    },
  },
  {
    id: "TEC-07",
    stage: "teknologi",
    text: "Bahasa pemrograman?",
    type: "single",
    autoAi: techMinorAuto,
    options: [
      { id: "ts", label: "TypeScript (strict)" },
      { id: "js", label: "JavaScript" },
      { id: "python", label: "Python" },
      { id: "php", label: "PHP" },
      { id: "go", label: "Go" },
    ],
    recommend: (a) => {
      const be = a.first("TEC-03");
      if (be === "laravel" || a.first("TEC-02") === "laravel")
        return one("php", "Mengikuti Laravel.");
      if (be === "python") return one("python", "Mengikuti FastAPI.");
      if (be === "go") return one("go", "Mengikuti backend Go.");
      return one("ts", "Tipe ketat membuat AI agent lebih jarang salah.");
    },
  },
  {
    id: "TEC-08",
    stage: "teknologi",
    text: "Struktur repo?",
    type: "single",
    autoAi: techMinorAuto,
    options: [
      { id: "single", label: "Satu aplikasi" },
      { id: "monorepo", label: "Monorepo (frontend + backend + paket bersama)" },
    ],
    recommend: (a) =>
      ["node", "python", "go"].includes(a.first("TEC-03") ?? "")
        ? one("monorepo", "Frontend dan backend terpisah lebih rapi dalam monorepo.")
        : one("single", "Satu aplikasi paling sederhana."),
  },

  // Tahap 7 · Kualitas
  {
    id: "QUA-01",
    stage: "kualitas",
    text: "Target performa halaman utama?",
    type: "single",
    options: [
      { id: "standard", label: "Standar (< 3 detik)" },
      { id: "fast", label: "Cepat (< 1 detik, Lighthouse ≥ 90)" },
      { id: "none", label: "Tidak diprioritaskan" },
    ],
    recommend: (a) =>
      ["landing", "ecommerce", "content"].includes(appType(a) ?? "")
        ? one("fast", "Halaman publik yang cepat meningkatkan konversi dan SEO.")
        : one("standard", "Cukup untuk aplikasi di balik login."),
  },
  {
    id: "QUA-02",
    stage: "kualitas",
    text: "Jenis pengujian?",
    type: "multi",
    options: [
      { id: "unit", label: "Unit test logika penting" },
      { id: "integration", label: "Integration test API" },
      { id: "e2e", label: "End-to-end (Playwright)" },
      { id: "none", label: "Tanpa tes otomatis (prototipe)" },
    ],
    recommend: (a) => {
      if (isPrototype(a)) return one("unit", "Unit test minimal menjaga logika inti tetap benar.");
      if (a.first("VIS-03") === "production")
        return many(["unit", "integration", "e2e"], "Produk produksi butuh semua lapisan tes.");
      return many(["unit", "e2e"], "Unit untuk logika, Playwright untuk alur utama.");
    },
  },
  {
    id: "QUA-03",
    stage: "kualitas",
    text: "Keamanan yang wajib?",
    type: "multi",
    options: [
      { id: "validation", label: "Validasi input di server" },
      { id: "ratelimit", label: "Rate limiting" },
      { id: "csrf", label: "Proteksi CSRF/XSS standar" },
      { id: "encryption", label: "Enkripsi data sensitif" },
      { id: "2fa", label: "2FA" },
      { id: "backup", label: "Backup otomatis" },
    ],
    recommend: (a) => {
      const ids = ["validation", "csrf"];
      if (needsLogin(a) || a.val("FEA-01").includes("contact")) ids.push("ratelimit");
      if (a.val("DAT-05").some((d) => ["financial", "health", "identity"].includes(d)))
        ids.push("encryption");
      if (!isPrototype(a)) ids.push("backup");
      return many(ids, "Dasar keamanan web ditambah perlindungan sesuai data yang disimpan.");
    },
  },
  {
    id: "QUA-04",
    stage: "kualitas",
    text: "SEO penting?",
    type: "single",
    options: [
      { id: "high", label: "Sangat penting (konten publik)" },
      { id: "some", label: "Sedikit (halaman depan saja)" },
      { id: "none", label: "Tidak (aplikasi di balik login)" },
    ],
    recommend: (a) => {
      if (a.first("USR-02") === "all") return one("none", "Seluruh aplikasi di balik login.");
      if (["landing", "content", "ecommerce", "marketplace"].includes(appType(a) ?? ""))
        return one("high", "Konten publik perlu ditemukan lewat mesin pencari.");
      return one("some", "Cukup halaman depan.");
    },
  },
  {
    id: "QUA-05",
    stage: "kualitas",
    text: "Perlu bisa dipakai offline?",
    type: "single",
    options: [
      { id: "none", label: "Tidak" },
      { id: "pwa", label: "Bisa dibuka offline (PWA dasar)" },
      { id: "full", label: "Offline penuh dengan sinkronisasi" },
    ],
    recommend: () =>
      one("none", "Offline menambah kompleksitas besar; tidak diperlukan untuk versi pertama."),
  },
  {
    id: "QUA-06",
    stage: "kualitas",
    text: "Monitoring?",
    type: "multi",
    options: [
      { id: "none", label: "Tidak perlu dulu" },
      { id: "sentry", label: "Error tracking (Sentry)" },
      { id: "logs", label: "Log terpusat" },
      { id: "uptime", label: "Uptime monitoring" },
    ],
    recommend: (a) =>
      isPrototype(a)
        ? one("none", "Belum perlu untuk prototipe.")
        : many(["sentry", "uptime"], "Tahu lebih dulu saat ada error atau situs mati."),
  },

  // Tahap 8 · Kerja dengan AI
  {
    id: "AIW-01",
    stage: "ai",
    text: "AI coding agent yang dipakai?",
    help: "Menentukan file instruksi tambahan yang dibuat. AGENTS.md selalu dibuat.",
    type: "multi",
    options: [
      { id: "claude", label: "Claude Code" },
      { id: "cursor", label: "Cursor" },
      { id: "copilot", label: "GitHub Copilot" },
      { id: "codex", label: "OpenAI Codex" },
      { id: "gemini", label: "Gemini CLI" },
      { id: "kiro", label: "Kiro" },
      { id: "windsurf", label: "Windsurf" },
    ],
    recommend: () =>
      one("claude", "Paket ini dirancang untuk Claude Code; AGENTS.md tetap terbaca agen lain."),
  },
  {
    id: "AIW-02",
    stage: "ai",
    text: "Kemampuan coding Anda?",
    type: "single",
    options: [
      { id: "none", label: "Tidak bisa coding" },
      { id: "read", label: "Bisa membaca kode sedikit" },
      { id: "dev", label: "Developer" },
    ],
    recommend: () => one("read", "Asumsi tengah: penjelasan sederhana dengan rujukan file."),
  },
  {
    id: "AIW-03",
    stage: "ai",
    text: "Ukuran tiap tugas untuk AI?",
    type: "single",
    options: [
      { id: "small", label: "Sangat kecil (1 file, mudah dicek)" },
      { id: "medium", label: "Sedang (1 fitur kecil)" },
      { id: "large", label: "Besar (1 modul)" },
    ],
    recommend: (a) =>
      a.first("AIW-02") === "dev"
        ? one("medium", "Developer bisa meninjau satu fitur per tugas.")
        : one("small", "Tugas kecil lebih mudah dicek oleh non-developer."),
  },
  {
    id: "AIW-04",
    stage: "ai",
    text: "Kapan AI boleh lanjut ke tugas berikutnya?",
    type: "single",
    options: [
      { id: "approve", label: "Setelah saya cek dan setujui" },
      { id: "tests", label: "Setelah tes lulus" },
      { id: "auto", label: "Langsung lanjut" },
    ],
    recommend: () => one("approve", "Persetujuan manusia mencegah kesalahan menumpuk."),
  },
  {
    id: "AIW-05",
    stage: "ai",
    text: "Larangan untuk AI?",
    type: "multi",
    options: [
      { id: "deps", label: "Jangan menambah library tanpa izin" },
      { id: "schema", label: "Jangan mengubah skema database tanpa izin" },
      { id: "tests", label: "Jangan menghapus tes" },
      { id: "main", label: "Jangan push langsung ke main" },
      { id: "secrets", label: "Jangan menyimpan rahasia di kode" },
    ],
    recommend: () =>
      many(
        ["deps", "schema", "tests", "main", "secrets"],
        "Semua larangan dasar mencegah kerusakan yang sulit dibalik.",
      ),
  },
  {
    id: "AIW-06",
    stage: "ai",
    text: "Alur git?",
    type: "single",
    options: [
      { id: "main", label: "Langsung di main" },
      { id: "pr", label: "Branch per tugas + pull request" },
      { id: "manual", label: "Saya urus sendiri" },
    ],
    recommend: () => one("pr", "Satu PR per tugas mudah ditinjau dan dibatalkan."),
  },
  {
    id: "AIW-07",
    stage: "ai",
    text: "Gaya kode?",
    type: "single",
    options: [
      { id: "default", label: "Ikuti default framework + linter" },
      { id: "functional", label: "Fungsional, komponen kecil, tanpa class" },
    ],
    otherPlaceholder: "tempel ringkasan style guide Anda",
    recommend: () => one("default", "Konvensi bawaan framework paling dikenal AI agent."),
  },
];

/** Entitas yang diusulkan dari fitur terpilih, urut kemunculan. */
export function proposedEntities(a: Accessor): string[] {
  const ids = new Set<string>();
  if (a.first("USR-02") !== "public") ids.add("User");
  if (["single_org", "multi_org"].includes(a.first("USR-03") ?? "")) {
    ids.add("Organization");
    ids.add("Membership");
  }
  for (const o of selectedFeatureOptions(a)) {
    for (const e of FEATURE_BY_ID[o.id]?.entities ?? []) ids.add(e);
  }
  return [...ids].filter((id) => ENTITIES[id]);
}

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export const questionsForStage = (stage: string): Question[] =>
  QUESTIONS.filter((q) => q.stage === stage);

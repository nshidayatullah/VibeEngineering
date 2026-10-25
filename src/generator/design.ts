import { COLORS, STYLE_PRESETS } from "../data/stacks";
import { ASSUMPTION, type Plan } from "../engine/plan";
import { bullets, doc, table } from "./md";

const HEX = /^#[0-9a-f]{6}$/i;
const DEFAULT_COLOR = { light: "#2563EB", dark: "#60A5FA" };
const DEFAULT_STYLE = {
  font: "Inter",
  radius: "8px (kartu 12px)",
  shadow: "hampir tanpa bayangan; pakai border",
  tone: "ringkas dan netral",
};

export function generateDesign(p: Plan): string {
  const { a, label } = p;
  const style = STYLE_PRESETS[a.first("DES-02") ?? "minimal"] ?? DEFAULT_STYLE;
  const colorId = a.first("DES-04") ?? "blue";
  const customHex = a.resolved("DES-04").otherText?.trim() ?? "";
  const primary =
    colorId === "other"
      ? HEX.test(customHex)
        ? { light: customHex, dark: customHex }
        : DEFAULT_COLOR
      : (COLORS[colorId] ?? DEFAULT_COLOR);
  const theme = a.first("DES-03") ?? "light";
  const dark = (v: string) => (theme === "light" ? "-" : v);
  const lang = a.first("DES-06");
  const novice = a.first("USR-04") === "novice";
  const skillImplication = novice
    ? "setiap layar punya satu aksi utama, label tanpa istilah teknis, dan petunjuk singkat di formulir"
    : a.first("USR-04") === "technical"
      ? "tampilan boleh padat informasi dan mendukung pintasan keyboard"
      : "pola UI umum (tabel, formulir, dialog) tanpa panduan tambahan";

  const routes = new Map<
    string,
    { name: string; access: string; content: string; fids: string[] }
  >();
  const add = (path: string, name: string, access: string, content: string, fid?: string) => {
    const cur = routes.get(path);
    if (cur) {
      if (fid && !cur.fids.includes(fid)) cur.fids.push(fid);
    } else routes.set(path, { name, access, content, fids: fid ? [fid] : [] });
  };
  add(
    "/",
    "Beranda",
    "Publik",
    p.needsLogin ? "Ringkasan nilai aplikasi + tombol masuk/daftar" : "Konten utama aplikasi",
  );
  if (p.needsLogin) {
    add(
      "/masuk",
      "Masuk",
      "Publik",
      "Formulir login",
      p.features.find((f) => f.key === "auth")?.fid,
    );
    if (a.first("AUTH-02") !== "admin")
      add(
        "/daftar",
        "Daftar",
        "Publik",
        "Formulir pendaftaran",
        p.features.find((f) => f.key === "auth")?.fid,
      );
  }
  for (const f of p.features.filter(
    (x) => x.priority !== "wont" && x.key !== "auth" && x.route.path,
  )) {
    add(f.route.path, f.route.name, f.route.access, f.description, f.fid);
  }
  if (p.roles.some((r) => r.startsWith("Admin")))
    add("/admin", "Admin", "Admin", "Menu pengelolaan");

  const nav =
    {
      sidebar:
        "Sidebar kiri (lebar 240px, bisa diciutkan); di mobile menjadi drawer dari tombol menu",
      topnav: "Navbar atas dengan logo kiri dan menu kanan; di mobile menjadi menu hamburger",
      bottomtab: "Bottom tab maksimal 5 item di mobile; di desktop menjadi navbar atas",
      combo: "Navbar atas untuk halaman publik, sidebar untuk halaman setelah login",
    }[a.first("DES-07") ?? "topnav"] ??
    a.resolved("DES-07").otherText ??
    "Navbar atas";

  const fmt = {
    id: ["Rp 12.500", "25 Okt 2026, 14.30 WIB", "1.234.567,89"],
    multi: [
      "sesuai mata uang (Intl.NumberFormat)",
      "sesuai locale & zona waktu pengguna",
      "sesuai locale pengguna",
    ],
    us: ["$12.50", "Oct 25, 2026, 2:30 PM UTC", "1,234,567.89"],
  }[a.first("DAT-07") ?? "id"] ?? ["Rp 12.500", "25 Okt 2026", "1.234.567"];

  const bodyFont = style.font.includes("(") ? "Inter" : style.font;
  return doc(
    `# Desain: ${p.name}`,
    "> Panduan visual & UX. Agen wajib memakai token dan komponen di sini, dan tidak membuat warna/ukuran baru secara hard-code.",
    "## 1. Prinsip",
    bullets([
      `Gaya: ${label("DES-02")}`,
      `Pengguna: ${label("USR-04")}, sehingga ${skillImplication}`,
      `Perangkat utama: ${label("DES-01")}${a.first("DES-01") === "mobile" ? "; rancang di lebar 375px lebih dulu" : ""}`,
      `Bahasa UI: ${label("DES-06")}, nada ${lang === "en" ? "clear and friendly" : style.tone}`,
    ]),
    "## 2. Design Tokens",
    `### Warna (tema: ${label("DES-03")})`,
    colorId === "other" && !HEX.test(customHex)
      ? `${ASSUMPTION} Kode warna "${customHex}" tidak valid; sementara memakai biru.`
      : "",
    table(
      ["Token", "Terang", "Gelap", "Pemakaian"],
      [
        ["--primary", primary.light, dark(primary.dark), "Tombol utama, link"],
        ["--background", "#FFFFFF", dark("#0A0A0A"), "Latar halaman"],
        ["--foreground", "#0A0A0A", dark("#FAFAFA"), "Teks utama"],
        ["--muted", "#737373", dark("#A3A3A3"), "Teks sekunder"],
        ["--border", "#E5E5E5", dark("#262626"), "Garis"],
        ["--destructive", "#DC2626", dark("#F87171"), "Aksi hapus, error"],
        ["--success", "#16A34A", dark("#4ADE80"), "Berhasil"],
      ].map(
        (r) =>
          (theme === "dark"
            ? [r[0] as string, "-", r[2] as string, r[3] as string]
            : r) as string[],
      ),
    ),
    "### Tipografi",
    table(
      ["Token", "Font", "Ukuran", "Berat"],
      [
        ["heading-1", style.font, "30px / 36px", "700"],
        ["heading-2", style.font, "24px / 32px", "600"],
        ["body", bodyFont, "16px / 24px", "400"],
        ["small", bodyFont, "14px / 20px", "400"],
      ],
    ),
    "### Spasi, radius, bayangan",
    bullets([
      `Skala spasi: 4, 8, 12, 16, 24, 32, 48 px`,
      `Radius: ${style.radius}`,
      `Bayangan: ${style.shadow}`,
    ]),
    "## 3. Layout & Navigasi",
    bullets([
      `Pola: ${label("DES-07")}. ${nav}`,
      "Breakpoint: mobile < 640, tablet 640–1024, desktop > 1024",
      `Lebar konten maksimum: ${a.first("DES-07") === "sidebar" ? "1280px (area konten)" : "1120px"}`,
    ]),
    "## 4. Komponen",
    `Pustaka: ${p.stack.info.ui.name}${a.resolved("DES-05").decidedBy === "ai" ? ` ${ASSUMPTION}` : ""}. Gunakan komponen yang ada sebelum membuat baru.`,
    table(
      ["Komponen", "Varian", "Catatan"],
      [
        ["Button", "primary, secondary, ghost, destructive", "Satu tombol primary per layar"],
        [
          "Input / Select / Textarea",
          "default, error",
          "Label selalu terlihat; pesan error di bawah field",
        ],
        ["Card", "default", "Pembungkus konten daftar/ringkasan"],
        ["Dialog", "default, konfirmasi", "Konfirmasi wajib untuk aksi hapus"],
        ["Toast", "success, error", "Tampil 3 detik, pojok kanan bawah"],
        ...(p.features.some((f) =>
          ["records", "core_crud", "inventory", "orders", "booking_admin"].includes(f.key),
        )
          ? [["Table", "default, dengan sortir", "Paginasi di bawah tabel"]]
          : []),
        ...(p.features.some((f) => ["catalog", "listings", "posts", "services"].includes(f.key))
          ? [["ItemCard", "grid, list", "Gambar rasio 4:3, judul maks 2 baris"]]
          : []),
      ],
    ),
    "## 5. Daftar Halaman",
    table(
      ["Route", "Nama", "Akses", "Isi utama", "Fitur"],
      [...routes.entries()].map(([path, r]) => [
        path,
        r.name,
        r.access,
        r.content,
        r.fids.join(", ") || "-",
      ]),
    ),
    "## 6. Pola Status",
    table(
      ["Status", "Perlakuan"],
      [
        ["Memuat", "Skeleton sesuai bentuk konten, bukan spinner layar penuh"],
        ["Kosong", "Ikon/ilustrasi sederhana + kalimat penjelas + tombol aksi pertama"],
        [
          "Error",
          "Pesan jelas dalam bahasa pengguna + tombol Coba lagi; detail teknis hanya di log",
        ],
        ["Berhasil", "Toast 3 detik"],
      ],
    ),
    "## 7. Aksesibilitas",
    bullets([
      `Target: ${label("DES-08")}`,
      "Kontras teks minimal 4.5:1, semua input punya label, bisa dioperasikan dengan keyboard, fokus terlihat.",
    ]),
    "## 8. Format Tampilan",
    bullets([`Uang: ${fmt[0]}`, `Tanggal: ${fmt[1]}`, `Angka: ${fmt[2]}`]),
    "## 9. Referensi",
    bullets([
      label("DES-09"),
      ...(a.first("QUA-04") !== "none"
        ? ["Setiap halaman publik punya <title>, meta description, dan gambar Open Graph."]
        : []),
    ]),
  );
}

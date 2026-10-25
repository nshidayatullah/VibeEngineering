# Bank Pertanyaan Wawancara (Pilihan Ganda)

Draft v0.1, 25 Oktober 2026.

**Aturan umum**
- `[1]` = pilih satu, `[+]` = boleh pilih lebih dari satu, `[1–5]` = skala.
- Setiap pertanyaan otomatis punya dua opsi tambahan: **🤖 Biarkan AI merekomendasikan** dan **✏️ Lainnya (isi sendiri)**. Keduanya tidak ditulis ulang di bawah.
- **Tampil jika** = kondisi agar pertanyaan muncul (wawancara adaptif).
- **→** = bagian template yang diisi oleh jawaban.

Tahap 0 bukan pilihan ganda: pengguna menulis ide aplikasi dalam 1–3 kalimat. Teks ini dipakai AI untuk mengisi contoh di opsi dan memilih paket pertanyaan yang relevan.

---

## Tahap 1 · Visi & Tujuan

**VIS-01 `[1]` Jenis aplikasi apa yang paling mendekati ide Anda?**
a) Landing page / company profile · b) Toko online / e-commerce · c) SaaS (langganan) · d) Dashboard / sistem internal · e) Marketplace (banyak penjual) · f) Aplikasi konten / blog / komunitas · g) Booking / reservasi · h) Alat (tool) satu fungsi
→ PRD.ringkasan, memilih paket pertanyaan lanjutan

**VIS-02 `[1]` Untuk siapa aplikasi ini?**
a) Saya sendiri · b) Tim/kantor internal · c) Pelanggan bisnis saya (B2C) · d) Perusahaan lain (B2B) · e) Publik umum
→ PRD.target_pengguna

**VIS-03 `[1]` Tujuan utama tahap pertama?**
a) Prototipe untuk validasi ide · b) MVP untuk pengguna nyata · c) Produk siap produksi · d) Proyek belajar
→ PRD.tujuan, TASKS.kedalaman, AGENTS.standar_kualitas

**VIS-04 `[+]` Bagaimana Anda mengukur keberhasilan?**
a) Jumlah pendaftar · b) Transaksi/pendapatan · c) Waktu kerja yang dihemat · d) Pengguna aktif harian · e) Cukup "berfungsi tanpa error" untuk demo
→ PRD.metrik_sukses

**VIS-05 `[1]` Target waktu rilis versi pertama?**
a) < 1 minggu · b) 2–4 minggu · c) 1–3 bulan · d) Belum ada target
→ PRD.timeline, TASKS.jumlah_fase

**VIS-06 `[1]` Skala pengguna yang diharapkan dalam 6 bulan?**
a) < 50 · b) 50–1.000 · c) 1.000–50.000 · d) > 50.000
→ ARCHITECTURE.skala, TECH_STACK.hosting

## Tahap 2 · Pengguna & Peran

**USR-01 `[1]` Berapa jenis pengguna (peran) yang berbeda?**
a) Satu peran saja · b) Pengguna + admin · c) 3–4 peran · d) Peran kustom yang bisa diatur admin
→ PRD.peran, DATA_MODEL.roles

**USR-02 `[1]` Apakah pengguna harus login?**
a) Tidak, semuanya publik · b) Sebagian halaman publik, sebagian butuh login · c) Seluruh aplikasi butuh login
→ PRD.akses, ARCHITECTURE.auth

**AUTH-01 `[+]` Metode login?** *(Tampil jika USR-02 ≠ a)*
a) Email + password · b) Magic link / OTP email · c) Google · d) GitHub · e) Nomor HP (OTP WhatsApp/SMS) · f) SSO perusahaan (SAML/OIDC)
→ TECH_STACK.auth, PRD.fitur_auth

**AUTH-02 `[1]` Siapa yang boleh mendaftar?** *(Tampil jika USR-02 ≠ a)*
a) Siapa saja · b) Hanya lewat undangan · c) Didaftarkan admin · d) Domain email tertentu saja
→ PRD.aturan_registrasi

**USR-03 `[1]` Apakah ada konsep organisasi/tim (multi-tenant)?**
a) Tidak, tiap pengguna berdiri sendiri · b) Ya, pengguna tergabung dalam satu organisasi · c) Ya, pengguna bisa ikut banyak organisasi
→ ARCHITECTURE.tenancy, DATA_MODEL

**USR-04 `[1]` Tingkat kemampuan teknis pengguna utama?**
a) Awam (perlu panduan) · b) Terbiasa aplikasi web · c) Teknis/pengembang
→ DESIGN.kompleksitas_ui, PRD.persona

## Tahap 3 · Fitur & Alur

**FEA-01 `[+]` Fitur umum yang dibutuhkan** *(opsi diisi AI dari ide + VIS-01; contoh untuk toko online)*
a) Katalog produk · b) Keranjang · c) Checkout & pembayaran · d) Riwayat pesanan · e) Manajemen stok · f) Kupon/diskon · g) Ulasan produk · h) Notifikasi email
→ PRD.fitur

**FEA-02 Prioritas tiap fitur yang dipilih** *(matriks: tiap fitur dari FEA-01 dipilih satu)*
Must (wajib v1) · Should (sebaiknya v1) · Could (nanti) · Won't (tidak dikerjakan)
→ PRD.prioritas_MoSCoW, PRD.di_luar_lingkup, TASKS.urutan

**FEA-03 `[1]` Alur paling penting yang harus sempurna?** *(opsi = fitur Must)*
→ PRD.alur_utama, TASKS.fase_1

**FEA-04 `[+]` Fitur pendukung**
a) Pencarian · b) Filter & sortir · c) Ekspor CSV/Excel · d) Impor data · e) Upload file/gambar · f) Notifikasi dalam aplikasi · g) Log aktivitas (audit trail) · h) Dashboard statistik
→ PRD.fitur

**PAY-01 `[1]` Pembayaran online?** *(Tampil jika ada fitur transaksi)*
a) Tidak, manual/transfer · b) Payment gateway lokal (Midtrans/Xendit) · c) Stripe · d) Langganan berulang
→ TECH_STACK.payment, ARCHITECTURE.integrasi

**FEA-05 `[1]` Kebutuhan real-time?**
a) Tidak perlu · b) Cukup refresh berkala · c) Update langsung (chat, notifikasi live) · d) Kolaborasi bersamaan (edit bareng)
→ ARCHITECTURE.realtime, TECH_STACK

**FEA-06 `[+]` Integrasi pihak ketiga**
a) Email (Resend/SMTP) · b) WhatsApp · c) Google Sheets · d) Peta/Maps · e) AI/LLM · f) Penyimpanan file (S3/R2) · g) Analytics · h) Tidak ada
→ ARCHITECTURE.integrasi, TECH_STACK.layanan

**FEA-07 `[1]` Notifikasi ke pengguna lewat apa?**
a) Tidak ada · b) Email · c) Dalam aplikasi · d) Email + dalam aplikasi · e) WhatsApp/SMS
→ PRD.notifikasi

## Tahap 4 · Data

**DAT-01 Entitas utama** *(AI mengusulkan daftar dari ide + fitur; pengguna centang/hapus/tambah)*
Contoh: Pengguna, Produk, Pesanan, ItemPesanan, Kategori
→ DATA_MODEL.entitas

**DAT-02 Relasi antar entitas** *(untuk tiap pasangan yang diusulkan AI)*
"Satu Pesanan memiliki ___ ItemPesanan": a) satu · b) banyak · c) tidak berhubungan
→ DATA_MODEL.relasi

**DAT-03 `[1]` Jika data dihapus?**
a) Hilang permanen · b) Soft delete (bisa dipulihkan) · c) Diarsipkan · d) Tidak boleh dihapus, hanya dinonaktifkan
→ DATA_MODEL.aturan_hapus, AGENTS.konvensi

**DAT-04 `[1]` Perkiraan volume data terbesar dalam 1 tahun?**
a) < 10 ribu baris · b) 10 ribu – 1 juta · c) > 1 juta
→ ARCHITECTURE.indexing, DATA_MODEL.indeks

**DAT-05 `[+]` Data sensitif yang disimpan?**
a) Tidak ada · b) Data pribadi (nama, HP, alamat) · c) Data keuangan · d) Data kesehatan · e) Dokumen identitas
→ PRD.keamanan, ARCHITECTURE.keamanan, AGENTS.batasan

**DAT-06 `[1]` Perlu riwayat perubahan data?**
a) Tidak · b) Cukup created_at/updated_at · c) Siapa mengubah apa (audit log) · d) Versi lengkap tiap perubahan
→ DATA_MODEL.kolom_standar

**DAT-07 `[1]` Mata uang, zona waktu, format?**
a) Rupiah, WIB, format Indonesia · b) Multi mata uang/zona waktu · c) USD, UTC
→ DATA_MODEL.tipe, DESIGN.format

## Tahap 5 · Desain & UX

**DES-01 `[1]` Perangkat utama pengguna?**
a) Mobile dulu · b) Desktop dulu · c) Sama pentingnya
→ DESIGN.breakpoint, PRD.platform

**DES-02 `[1]` Gaya visual?**
a) Minimalis bersih (seperti Linear/Notion) · b) Korporat profesional · c) Playful & berwarna · d) Mewah/elegan · e) Mengikuti brand yang sudah ada
→ DESIGN.gaya, DESIGN.tokens

**DES-03 `[1]` Mode tema?**
a) Terang saja · b) Gelap saja · c) Terang + gelap (ikut sistem)
→ DESIGN.tema

**DES-04 `[1]` Warna utama?** *(palet contoh ditampilkan)*
a) Biru · b) Hijau · c) Ungu · d) Oranye · e) Merah · f) Netral/hitam · g) Saya punya kode warna
→ DESIGN.tokens.warna

**DES-05 `[1]` Pustaka komponen UI?**
a) shadcn/ui · b) Material UI · c) Mantine · d) Chakra · e) Tailwind murni (komponen sendiri)
→ TECH_STACK.ui, DESIGN.komponen

**DES-06 `[1]` Bahasa antarmuka?**
a) Indonesia · b) Inggris · c) Indonesia + Inggris (i18n)
→ DESIGN.bahasa, ARCHITECTURE.i18n

**DES-07 `[1]` Struktur navigasi?**
a) Sidebar (aplikasi/dashboard) · b) Navbar atas (situs) · c) Bottom tab (mobile) · d) Kombinasi
→ DESIGN.layout

**DES-08 `[1]` Tingkat aksesibilitas?**
a) Dasar (kontras & label) · b) WCAG 2.1 AA · c) Tidak diprioritaskan
→ DESIGN.aksesibilitas, AGENTS.checklist

**DES-09 `[1]` Ada desain/mockup yang sudah jadi?**
a) Belum ada, AI yang merancang · b) Ada sketsa kasar · c) Ada file Figma · d) Tiru gaya situs referensi (isi URL)
→ DESIGN.referensi

## Tahap 6 · Teknologi

**TEC-01 `[1]` Seberapa jauh Anda ingin ikut menentukan stack?**
a) Tentukan semuanya untuk saya · b) Saya pilih bagian penting saja · c) Saya pilih semuanya
→ jika (a), TEC-02..07 diisi AI dan ditandai `[ASUMSI]`

**TEC-02 `[1]` Framework frontend/full-stack?**
a) Next.js (React) · b) Nuxt (Vue) · c) SvelteKit · d) Laravel + Inertia · e) Astro (konten statis) · f) React + Vite (SPA)
→ TECH_STACK.frontend

**TEC-03 `[1]` Backend?**
a) Menyatu dengan framework (server actions/API routes) · b) Backend terpisah Node (Hono/Express/NestJS) · c) Python (FastAPI/Django) · d) PHP Laravel · e) Go · f) BaaS (Supabase/Firebase)
→ TECH_STACK.backend, ARCHITECTURE.layer

**TEC-04 `[1]` Database?**
a) PostgreSQL · b) MySQL · c) SQLite · d) MongoDB · e) Supabase (Postgres terkelola) · f) Firebase Firestore
→ TECH_STACK.database

**TEC-05 `[1]` Akses database (ORM)?** *(Tampil jika DB SQL)*
a) Prisma · b) Drizzle · c) Eloquent · d) SQLAlchemy · e) SQL langsung
→ TECH_STACK.orm

**TEC-06 `[1]` Hosting?**
a) Vercel · b) Netlify · c) Railway/Render · d) VPS sendiri (Docker) · e) Cloudflare · f) AWS/GCP
→ TECH_STACK.hosting, ARCHITECTURE.deploy

**TEC-07 `[1]` Bahasa pemrograman?**
a) TypeScript (strict) · b) JavaScript · c) Python · d) PHP · e) Go
→ TECH_STACK.bahasa, AGENTS.konvensi

**TEC-08 `[1]` Struktur repo?**
a) Satu aplikasi · b) Monorepo (frontend + backend + paket bersama)
→ ARCHITECTURE.struktur_folder

## Tahap 7 · Kualitas & Non-fungsional

**QUA-01 `[1]` Target performa halaman utama?**
a) Standar (< 3 detik) · b) Cepat (< 1 detik, Lighthouse ≥ 90) · c) Tidak diprioritaskan
→ PRD.non_fungsional

**QUA-02 `[+]` Jenis pengujian?**
a) Unit test logika penting · b) Integration test API · c) End-to-end (Playwright) · d) Tanpa tes otomatis (prototipe)
→ TECH_STACK.testing, AGENTS.definisi_selesai, TASKS.verifikasi

**QUA-03 `[+]` Keamanan yang wajib?**
a) Validasi input di server · b) Rate limiting · c) Proteksi CSRF/XSS standar · d) Enkripsi data sensitif · e) 2FA · f) Backup otomatis
→ ARCHITECTURE.keamanan, AGENTS.batasan

**QUA-04 `[1]` SEO penting?**
a) Sangat penting (konten publik) · b) Sedikit (halaman depan saja) · c) Tidak (aplikasi di balik login)
→ ARCHITECTURE.rendering, DESIGN.meta

**QUA-05 `[1]` Perlu bisa dipakai offline?**
a) Tidak · b) Bisa dibuka offline (PWA dasar) · c) Offline penuh dengan sinkronisasi
→ ARCHITECTURE.offline

**QUA-06 `[+]` Monitoring?**
a) Tidak perlu dulu · b) Error tracking (Sentry) · c) Log terpusat · d) Uptime monitoring
→ TECH_STACK.observability

## Tahap 8 · Cara Kerja dengan AI Agent

**AIW-01 `[+]` AI coding agent yang dipakai?**
a) Claude Code · b) Cursor · c) GitHub Copilot · d) OpenAI Codex · e) Gemini CLI · f) Kiro · g) Windsurf
→ menentukan file yang dibuat (CLAUDE.md, AGENTS.md, .cursor/rules, .github/copilot-instructions.md)

**AIW-02 `[1]` Kemampuan coding Anda?**
a) Tidak bisa coding · b) Bisa membaca kode sedikit · c) Developer
→ AGENTS.gaya_penjelasan, TASKS.ukuran

**AIW-03 `[1]` Ukuran tiap tugas untuk AI?**
a) Sangat kecil (1 file, mudah dicek) · b) Sedang (1 fitur kecil) · c) Besar (1 modul)
→ TASKS.granularitas

**AIW-04 `[1]` Kapan AI boleh lanjut ke tugas berikutnya?**
a) Setelah saya cek dan setujui · b) Setelah tes lulus · c) Langsung lanjut
→ AGENTS.alur_kerja

**AIW-05 `[+]` Larangan untuk AI?**
a) Jangan menambah library tanpa izin · b) Jangan mengubah skema database tanpa izin · c) Jangan menghapus tes · d) Jangan push langsung ke main · e) Jangan menyimpan rahasia di kode
→ AGENTS.batasan, CLAUDE.batasan

**AIW-06 `[1]` Alur git?**
a) Langsung di main · b) Branch per tugas + pull request · c) Saya urus sendiri
→ AGENTS.git

**AIW-07 `[1]` Gaya kode?**
a) Ikuti default framework + linter (ESLint/Prettier) · b) Saya punya style guide (isi) · c) Fungsional, komponen kecil, tanpa class
→ AGENTS.konvensi

---

## Tahap Klarifikasi (dihasilkan AI)

Setelah tahap 8, AI membaca semua jawaban dan membuat 3–10 pertanyaan pilihan ganda tambahan. Contoh pemicu:

| Konflik/celah terdeteksi | Contoh pertanyaan klarifikasi |
|---|---|
| QUA-05 = offline penuh **dan** FEA-05 = kolaborasi bersamaan | "Jika dua orang mengedit data yang sama saat offline, mana yang menang? a) Edit terakhir · b) Tampilkan konflik untuk dipilih · c) Kunci data saat diedit" |
| DAT-05 = data keuangan **dan** QUA-03 tidak memilih enkripsi | "Data keuangan akan disimpan. Tambahkan enkripsi kolom? a) Ya · b) Tidak, cukup enkripsi database bawaan hosting" |
| VIS-05 = < 1 minggu **dan** > 8 fitur Must | "Target 1 minggu dengan 9 fitur wajib berisiko. a) Turunkan sebagian ke Should · b) Mundurkan target · c) Tetap" |
| Fitur "Ulasan" tanpa aturan moderasi | "Ulasan tampil kapan? a) Langsung · b) Setelah disetujui admin · c) Hanya pembeli terverifikasi" |
| Peran ≥ 3 tanpa matriks akses | Tabel centang: peran × aksi (lihat/buat/ubah/hapus) per entitas |

## Pertanyaan Kriteria Penerimaan (per fitur Must)

Untuk setiap fitur Must, AI mengusulkan 3–6 kriteria penerimaan format EARS dan pengguna memilih **Setuju / Ubah / Hapus** per baris. Contoh untuk "Checkout":

- KETIKA keranjang kosong, SISTEM HARUS menonaktifkan tombol Checkout. ✅ / ✏️ / 🗑️
- KETIKA pembayaran berhasil, SISTEM HARUS mengurangi stok dan mengirim email konfirmasi. ✅ / ✏️ / 🗑️
- JIKA stok tidak cukup saat checkout, MAKA SISTEM HARUS menampilkan pesan dan membatalkan item tersebut. ✅ / ✏️ / 🗑️

Inilah langkah yang paling berpengaruh pada presisi, karena kriteria ini menjadi "definisi selesai" dan dasar tes di `TASKS.md`.

## Format penyimpanan jawaban (usulan)

```json
{
  "projectId": "prj_123",
  "idea": "Toko online kopi dengan langganan bulanan",
  "answers": [
    { "q": "VIS-01", "options": ["ecommerce"], "decidedBy": "user" },
    { "q": "TEC-04", "options": ["postgres"], "decidedBy": "ai", "reason": "Relasi pesanan-produk kuat, cocok SQL" },
    { "q": "FEA-04", "options": ["search", "upload"], "freeText": null, "decidedBy": "user" }
  ],
  "clarifications": [ { "q": "CLR-01", "text": "...", "options": ["last_write"], "decidedBy": "user" } ],
  "acceptance": { "F-03": [ { "id": "AC-03-1", "text": "KETIKA ...", "status": "approved" } ] }
}
```

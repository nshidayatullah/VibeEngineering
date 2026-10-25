# Riset: Aplikasi Perancang Web App untuk Vibe Engineering

> Tanggal: 25 Oktober 2026
> Tujuan: merancang aplikasi yang mewawancarai pengguna dengan pertanyaan pilihan ganda, lalu menghasilkan paket file `.md` yang membuat AI coding agent (Claude Code, Cursor, Codex, Kiro, Copilot, dll.) membangun web app secara presisi.

---

## 1. Masalah yang diselesaikan

"Vibe coding" (menyuruh AI membuat aplikasi lewat prompt bebas) cepat, tapi hasilnya sering meleset karena:

1. **Kebutuhan ambigu.** Prompt seperti "buat aplikasi kasir" menyisakan ratusan keputusan (multi-toko? stok? pajak? login?) yang lalu ditebak oleh AI.
2. **Konteks hilang antar sesi.** AI tidak ingat keputusan kemarin, sehingga stack, gaya kode, dan struktur folder berubah-ubah.
3. **Tidak ada definisi "selesai".** Tanpa kriteria penerimaan, AI berhenti di tengah atau malah menambah fitur yang tidak diminta.
4. **Lingkup terlalu besar per langkah.** Satu prompt untuk seluruh aplikasi menghasilkan kode rapuh yang sulit diperbaiki.

"Vibe engineering" adalah versi disiplinnya: AI tetap menulis kode, tapi manusia menyediakan **spesifikasi, batasan, dan rencana kerja tertulis** yang menjadi sumber kebenaran.

## 2. Temuan riset: praktik yang sudah terbukti

| Pendekatan | Inti | Yang kita ambil |
|---|---|---|
| **Spec-Driven Development (SDD)** | Spesifikasi ditulis dulu, kode diturunkan dari spesifikasi. Dibahas Martin Fowler / Thoughtworks sebagai pola utama AI-assisted dev. | Alur *spec → plan → tasks → implement* |
| **GitHub Spec Kit** | CLI `specify` dengan tahap `constitution`, `specify`, `clarify`, `plan`, `tasks`, `implement`. Tahap *clarify* khusus untuk menanyakan bagian yang ambigu. | Konsep "konstitusi" (aturan proyek yang tidak boleh dilanggar) dan tahap klarifikasi |
| **Kiro (AWS)** | Tiga file per fitur: `requirements.md` (user story + kriteria penerimaan format EARS), `design.md`, `tasks.md`. Plus "steering files" (`product.md`, `tech.md`, `structure.md`). | Format EARS untuk kriteria penerimaan; pemisahan file per topik |
| **BMAD Method** | Persona agen (analyst, PM, architect, dev) yang menghasilkan PRD dan arsitektur bertahap, lalu "story" kecil. | Wawancara bertahap per peran |
| **AGENTS.md** | Standar terbuka (didukung OpenAI Codex, Cursor, Gemini, Copilot, dll.) berupa "README untuk agen": perintah build/test, gaya kode, batasan. | File wajib di root repo |
| **CLAUDE.md** | File memori proyek yang otomatis dibaca Claude Code setiap sesi. | Dihasilkan dari isi yang sama dengan AGENTS.md |

**Kesimpulan riset:** presisi datang dari tiga hal, yaitu (a) kebutuhan yang tidak ambigu, (b) keputusan teknis yang dikunci, dan (c) tugas kecil yang masing-masing punya kriteria selesai. Pertanyaan pilihan ganda adalah cara paling efektif untuk (a) dan (b) karena memaksa keputusan eksplisit, cepat dijawab oleh non-programmer, dan hasilnya terstruktur sehingga bisa diolah mesin.

## 3. Mengapa wawancara pilihan ganda

- **Mengurangi beban kognitif.** Pengguna mengenali pilihan lebih mudah daripada mengarang jawaban dari nol.
- **Menampilkan keputusan yang tidak terpikirkan.** Contoh: "Bagaimana data dihapus? Hard delete / soft delete / arsip". Kebanyakan orang tidak sadar ini perlu diputuskan.
- **Hasil terstruktur.** Setiap jawaban punya ID sehingga bisa dipetakan langsung ke bagian template.
- **Tetap fleksibel.** Setiap pertanyaan punya opsi **"Lainnya (isi sendiri)"** dan **"Biarkan AI merekomendasikan"**. Opsi kedua tetap tercatat sebagai keputusan, lengkap dengan alasan rekomendasinya.
- **Adaptif.** Pertanyaan lanjutan muncul berdasarkan jawaban sebelumnya (misalnya pertanyaan pembayaran hanya muncul jika ada fitur transaksi).

## 4. Konsep aplikasi

### 4.1 Nama kerja
**VibePlan** (bisa diganti).

### 4.2 Alur pengguna

```
[1] Ide singkat      →  pengguna menulis 1–3 kalimat ide aplikasi
[2] Wawancara        →  8 tahap pertanyaan pilihan ganda (± 40–70 pertanyaan, adaptif)
[3] Klarifikasi AI   →  AI membaca semua jawaban, mencari konflik/celah, lalu bertanya 3–10 pertanyaan pilihan ganda tambahan
[4] Review ringkas   →  pengguna melihat ringkasan keputusan dan bisa mengubah jawaban
[5] Generate         →  aplikasi membuat paket .md
[6] Ekspor           →  unduh ZIP / salin ke repo GitHub / salin prompt awal untuk agen
```

### 4.3 Delapan tahap wawancara
1. **Visi & tujuan**: masalah, target pengguna, ukuran sukses
2. **Pengguna & peran**: jenis pengguna, hak akses, autentikasi
3. **Fitur & alur**: fitur inti, prioritas (MoSCoW), alur utama
4. **Data**: entitas, relasi, volume, aturan penghapusan
5. **Desain & UX**: gaya visual, perangkat, bahasa, aksesibilitas
6. **Teknologi**: frontend, backend, database, hosting
7. **Kualitas & non-fungsional**: performa, keamanan, pengujian
8. **Cara kerja dengan AI**: agen yang dipakai, ukuran tugas, aturan kode

Detail pertanyaannya ada di [`02-bank-pertanyaan-wawancara.md`](02-bank-pertanyaan-wawancara.md).

### 4.4 Paket file yang dihasilkan

| File | Isi | Dibaca agen kapan |
|---|---|---|
| `PRD.md` | Visi, persona, fitur, user story, kriteria penerimaan (EARS), di luar lingkup | Awal proyek & tiap fitur |
| `ARCHITECTURE.md` | Komponen sistem, struktur folder, alur data, keputusan arsitektur (ADR singkat) | Saat membuat modul baru |
| `TECH_STACK.md` | Versi tiap teknologi, library yang dipakai/dilarang, perintah setup | Setiap sesi |
| `DATA_MODEL.md` | Entitas, field, tipe, relasi, aturan validasi | Saat menyentuh database |
| `DESIGN.md` | Design tokens, komponen, layout, daftar halaman | Saat membuat UI |
| `TASKS.md` | Daftar tugas bertahap, dependensi, definisi selesai per tugas | Setiap sesi kerja |
| `AGENTS.md` | Aturan kerja untuk semua agen: perintah, konvensi, batasan | Otomatis tiap sesi |
| `CLAUDE.md` | Sama dengan AGENTS.md + rujukan file lain (format Claude Code) | Otomatis tiap sesi |

Template masing-masing ada di folder [`/templates`](../../templates).

### 4.5 Prinsip penulisan file agar AI presisi
1. **Spesifik dan terukur.** Tulis "Halaman daftar produk memuat ≤ 1 detik untuk 1.000 produk", jangan "aplikasi harus cepat".
2. **Kriteria penerimaan format EARS.** `KETIKA <pemicu>, SISTEM HARUS <respon>`. Mudah diubah menjadi tes.
3. **Sebutkan yang di luar lingkup.** Bagian "Tidak dikerjakan" mencegah AI menambah fitur sendiri.
4. **Kunci versi.** `Next.js 15.x`, bukan "Next.js terbaru".
5. **Tugas kecil.** Satu tugas = satu perubahan yang bisa direview (idealnya < 300 baris diff) dan punya cara verifikasi.
6. **Satu sumber kebenaran.** File lain merujuk, tidak menyalin ulang. AGENTS.md/CLAUDE.md tetap pendek (< 200 baris) dan menunjuk ke file detail.
7. **Tandai asumsi.** Keputusan dari opsi "Biarkan AI merekomendasikan" ditandai `[ASUMSI]` agar mudah ditinjau.

## 5. Arsitektur aplikasi VibePlan (usulan)

### 5.1 Komponen
```
┌──────────────────────────┐
│  Frontend (Next.js)       │  wizard wawancara, review, preview .md
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  API / Server Actions     │
│  - Question Engine        │  memilih pertanyaan berikutnya (aturan kondisi)
│  - Clarifier (LLM)        │  mendeteksi konflik/celah → pertanyaan tambahan
│  - Generator              │  mengisi template dari jawaban (+ LLM untuk narasi)
│  - Exporter               │  ZIP, push ke GitHub
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  Database (Postgres)      │  projects, answers, generated_files, versions
└──────────────────────────┘
```

### 5.2 Bank pertanyaan sebagai data, bukan kode
Simpan pertanyaan di file YAML/JSON agar mudah ditambah tanpa mengubah kode:

```yaml
- id: AUTH-01
  stage: pengguna
  text: "Bagaimana pengguna masuk ke aplikasi?"
  type: single        # single | multi | scale
  options:
    - { id: none, label: "Tidak perlu login" }
    - { id: email, label: "Email + password" }
    - { id: magic, label: "Magic link via email" }
    - { id: oauth, label: "Login Google/GitHub" }
    - { id: ai, label: "Biarkan AI merekomendasikan" }
    - { id: other, label: "Lainnya", freeText: true }
  showIf: "USR-02 != 'public_only'"
  mapsTo: [PRD.roles, ARCHITECTURE.auth, TECH_STACK.auth]
```

- `showIf`: kondisi tampil (wawancara adaptif)
- `mapsTo`: bagian template mana yang diisi jawaban ini
- Jawaban disimpan sebagai `{ questionId, optionIds[], freeText?, decidedBy: "user" | "ai" }`

### 5.3 Peran LLM (dibatasi)
LLM **tidak** mengarang kebutuhan. Perannya hanya:
1. **Klarifikasi**: membaca jawaban dan menghasilkan pertanyaan pilihan ganda tambahan untuk konflik (misal: "offline-first" tapi "real-time kolaborasi").
2. **Rekomendasi**: mengisi pertanyaan yang dijawab "Biarkan AI merekomendasikan" lengkap dengan alasan, ditandai `[ASUMSI]`.
3. **Narasi**: mengubah jawaban terstruktur menjadi kalimat (user story, deskripsi) di template.
4. **Pemecahan tugas**: menyusun `TASKS.md` dari PRD + arsitektur.

Output LLM diminta dalam JSON terstruktur (schema), lalu dirender ke template oleh kode, sehingga format file selalu konsisten.

### 5.4 Validasi otomatis sebelum ekspor
- Setiap fitur "Must" punya minimal 1 kriteria penerimaan.
- Setiap entitas di `DATA_MODEL.md` dipakai oleh minimal 1 fitur.
- Setiap tugas di `TASKS.md` merujuk ke ID fitur/kriteria.
- Tidak ada placeholder `{{...}}` yang tersisa.
- Jumlah `[ASUMSI]` ditampilkan ke pengguna sebelum ekspor.

## 6. Rencana pengembangan (MVP → lanjut)

| Fase | Lingkup |
|---|---|
| **MVP** | Wizard wawancara statis (tanpa LLM), template diisi langsung dari jawaban, ekspor ZIP |
| **v1** | Klarifikasi & rekomendasi LLM, pembuatan TASKS.md otomatis, simpan proyek |
| **v2** | Push langsung ke GitHub, versi & diff dokumen, template per jenis aplikasi (SaaS, toko online, dashboard internal, landing page) |
| **v3** | "Mode lanjutan": impor repo yang sudah ada lalu wawancara hanya untuk fitur baru |

Rekomendasinya, MVP itu sendiri dibangun memakai paket `.md` dari folder `templates/` ini (dogfooding).

## 7. Sumber
- [Understanding Spec-Driven Development: Kiro, spec-kit, and Tessl (Martin Fowler)](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [From chat to specs: a deep dive into AI-assisted development with Kiro](https://kiro.dev/blog/from-chat-to-specs-deep-dive/)
- [Introducing Kiro](https://kiro.dev/blog/introducing-kiro/)
- [Spec-Driven Development: How Kiro and AI Agents Build From Specs](https://www.morphllm.com/spec-driven-development)
- [Comprehensive Guide to Spec-Driven Development: Kiro, GitHub Spec Kit, and BMAD-METHOD](https://medium.com/@visrow/comprehensive-guide-to-spec-driven-development-kiro-github-spec-kit-and-bmad-method-5d28ff61b9b1)
- [7 Spec-Driven Development Tools: Spec Kit, Kiro, OpenSpec, Tessl & More](https://ssojet.com/blog/best-spec-driven-development-tools)
- [9 PRD and Spec Templates Built for AI Coding Agents](https://ssojet.com/blog/prd-spec-templates-ai-agents)
- [AGENTS.md: A new standard for coding agents (InfoQ)](https://infoq.com/news/2025/08/agents-md/)
- [AGENTS.md: inside the open standard for briefing coding agents](https://dev.to/dublecc/agentsmd-inside-the-open-standard-for-briefing-coding-agents-4fag)

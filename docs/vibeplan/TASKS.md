# Rencana Tugas: VibePlan

> Kerjakan **satu tugas per sesi/PR**, berurutan. Tugas selesai hanya jika semua poin "Selesai jika" terpenuhi.
> Ukuran tugas: sedang (1 fitur) · Lanjut ke tugas berikutnya: setelah pengguna menyetujui

**Legenda status:** `[ ]` belum · `[~]` dikerjakan · `[x]` selesai · `[!]` terhambat

## Fase 0 · Fondasi
### T-001 · Inisialisasi proyek
- Status: [x]
- Bergantung pada: -
- Selesai jika:
  - [x] `pnpm dev` dan `pnpm build` berjalan
  - [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` lulus
  - [x] Struktur folder sama dengan ARCHITECTURE.md §3

### T-002 · Model data & resolver
- Status: [x]
- Bergantung pada: T-001
- Rujukan: ARCHITECTURE.md §4
- Selesai jika:
  - [x] Tipe `ProjectState`, `Answer`, `Question`, `ResolvedAnswer` di `src/engine/types.ts`
  - [x] `resolve.ts` menangani `showIf`, `autoAi`, AI, dilewati, opsi tidak valid (tes `resolve.test.ts`)

### T-003 · Bank pertanyaan & katalog
- Status: [x]
- Bergantung pada: T-002
- Rujukan: docs/research/02-bank-pertanyaan-wawancara.md
- Selesai jika:
  - [x] Semua pertanyaan tahap 1–8 ada, kecuali DAT-02 (PRD §6)
  - [x] Katalog fitur untuk 8 jenis aplikasi + 8 fitur pendukung, masing-masing dengan AC EARS
  - [x] Setiap pertanyaan punya `recommend` yang hanya memilih opsi valid (tes)

### T-004 · Layout & design tokens
- Status: [x]
- Bergantung pada: T-001
- Rujukan: DESIGN.md §2–4
- Selesai jika:
  - [x] Token terang/gelap di `src/index.css`
  - [x] Tidak ada scroll horizontal di lebar 375px

## Fase 1 · Alur Utama (F-02 Wawancara → F-06 Ekspor)
### T-005 · Ide awal & simpan otomatis (F-01, F-07)
- Status: [x]
- Bergantung pada: T-004
- Selesai jika:
  - [x] AC-01-1, AC-01-2, AC-01-3
  - [x] AC-07-1, AC-07-2 (tes `persist.test.ts`)

### T-006 · Wawancara 8 tahap (F-02, F-03)
- Status: [x]
- Bergantung pada: T-003, T-005
- Selesai jika:
  - [x] AC-02-1 s/d AC-02-6
  - [x] AC-03-1 s/d AC-03-5

### T-007 · Review keputusan (F-04)
- Status: [x]
- Bergantung pada: T-006
- Selesai jika:
  - [x] AC-04-1, AC-04-2, AC-04-3

### T-008 · Generator paket .md (F-05)
- Status: [x]
- Bergantung pada: T-003
- Rujukan: templates/*.md
- Selesai jika:
  - [x] AC-05-1 s/d AC-05-4 diuji di `generator.test.ts` untuk 15 skenario (8 jenis aplikasi, 4 stack, semua-AI, kosong, isian Lainnya)

### T-009 · Pratinjau & ekspor ZIP (F-06)
- Status: [x]
- Bergantung pada: T-008
- Selesai jika:
  - [x] AC-06-1 s/d AC-06-4 (diuji manual lewat skrip Playwright sekali jalan di luar repo: ZIP terunduh berisi 10 file; belum ada tes E2E permanen)

## Fase 2 · Fitur Should
### T-010 · Validasi sebelum ekspor (F-08)
- Status: [x]
- Bergantung pada: T-008
- Selesai jika:
  - [x] AC-08-1

### T-011 · Impor jawaban (F-09)
- Status: [x]
- Bergantung pada: T-005
- Selesai jika:
  - [x] AC-09-1, AC-09-2

### T-012 · File khusus agen (F-10)
- Status: [x]
- Bergantung pada: T-008
- Selesai jika:
  - [x] AC-10-1 (tes)

## Fase 3 · Penyempurnaan & Rilis
### T-013 · CI
- Status: [x]
- Bergantung pada: T-001
- Selesai jika:
  - [x] GitHub Actions menjalankan lint, typecheck, test, build pada setiap PR

### T-014 · Deploy
- Status: [x]
- Bergantung pada: T-013
- Rujukan: DEPLOY.md, `deploy/`
- Selesai jika:
  - [x] Hosting dipilih (PRD Q-02): VPS sendiri + nginx
  - [x] Konfigurasi nginx dan `deploy/deploy.sh` ada di repo dan diuji lokal (200 untuk `/` dan rute lain, aset immutable, CSP tanpa error di browser, ZIP terunduh)
  - [x] `dist/` terdeploy di https://vibeplan.emha.web.id dengan HTTPS
  - [x] Alur utama diuji manual di URL produksi (DEPLOY.md §5)

### T-015 · Uji dengan pengguna nyata
- Status: [ ]
- Bergantung pada: T-014
- Selesai jika:
  - [ ] Satu orang awam menyelesaikan wawancara ≤ 15 menit (PRD §2)
  - [ ] Paket hasilnya dipakai Claude Code untuk T-001 tanpa pertanyaan yang seharusnya sudah dijawab paket

## Fase 4 · v1: Klarifikasi AI (9router)
Rancangan: [AI-9ROUTER.md](AI-9ROUTER.md), ARCHITECTURE ADR-007, PRD F-11.

### T-016 · Service `vibeplan-ai`
- Status: [x]
- Bergantung pada: -
- Selesai jika:
  - [x] `server/main.ts` melayani `GET /api/ai/health` dan `POST /api/ai/clarify`, tanpa dependensi npm
  - [x] Validasi masukan, prompt di server, validasi jawaban model + 1x coba ulang, rate limit, timeout (tes `server/clarify.test.ts`)

### T-017 · Layar klarifikasi & PRD hasil (F-11)
- Status: [x]
- Bergantung pada: T-016
- Selesai jika:
  - [x] AC-11-1 s/d AC-11-6 (tes `src/engine/clarify.test.ts`, `src/generator/generator.test.ts`, uji browser 375px & 1280px)
  - [x] `ProjectState` version 2; data version 1 dinaikkan oleh `parseState` (tes `persist.test.ts`)

### T-018 · Deploy service AI
- Status: [ ]
- Bergantung pada: T-017
- Rujukan: DEPLOY.md §7
- Selesai jika:
  - [ ] `vibeplan-ai` berjalan di VPS (systemd), `/etc/vibeplan-ai.env` terisi, blok `location /api/ai/` aktif di nginx
  - [ ] `curl https://vibeplan.emha.web.id/api/ai/health` → `{"ok":true}`
  - [ ] Klarifikasi dicoba di produksi dengan satu ide nyata; tidak ada error CSP di Console

## Log Pekerjaan
| Tanggal | Tugas | Catatan |
|---|---|---|
| 2026-10-25 | T-001 s/d T-013 | MVP pertama: wizard statis, generator, ZIP, CI. 97 tes lulus. |
| 2026-10-26 | T-014 | Produksi live di https://vibeplan.emha.web.id (nginx di VPS, sertifikat Let's Encrypt s/d 2027-01-23, auto-renew). Cek §5: `/` dan rute lain 200 dengan CSP, HTTP 301 ke HTTPS, aset immutable. Alur penuh sampai ZIP (10 file, 0 placeholder) dan reload localStorage lulus tanpa error console/CSP. Catatan: Node di VPS 26, bukan 22 sesuai `.nvmrc`. |
| 2026-10-26 | T-016, T-017 | Klarifikasi awal AI lewat 9router: service `vibeplan-ai`, layar klarifikasi, state version 2. 116 tes lulus. |

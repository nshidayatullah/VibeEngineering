# AGENTS.md

Instruksi untuk AI coding agent yang bekerja di repo **VibePlan**. Baca file ini setiap awal sesi.

## Konteks Proyek
VibePlan adalah SPA statis (React + Vite) dengan satu service kecil opsional `server/` untuk klarifikasi awal lewat LLM 9router (ADR-007), yang mewawancarai pengguna dengan pertanyaan pilihan ganda lalu menghasilkan paket `.md` (PRD, ARCHITECTURE, TECH_STACK, DATA_MODEL, DESIGN, TASKS, AGENTS, CLAUDE) dan mengekspornya sebagai ZIP.

Dokumen rujukan (baca sesuai kebutuhan, jangan menebak):
- `docs/vibeplan/PRD.md`: fitur, kriteria penerimaan, di luar lingkup
- `docs/vibeplan/ARCHITECTURE.md`: struktur folder, aturan dependensi, alur data, ADR
- `docs/vibeplan/TECH_STACK.md`: versi, library disetujui/dilarang, perintah
- `docs/vibeplan/DESIGN.md`: token, komponen, layar
- `docs/vibeplan/TASKS.md`: tugas yang sedang dikerjakan
- `docs/vibeplan/DEPLOY.md`: cara rilis ke produksi (VPS + nginx)
- `docs/vibeplan/AI-9ROUTER.md`: rancangan klarifikasi AI dan service `vibeplan-ai`
- `docs/research/`: riset konsep dan bank pertanyaan asli
- `templates/`: struktur acuan file hasil

## Perintah
```bash
pnpm dev        # jalankan dev server
pnpm lint       # lint (Biome)
pnpm typecheck  # cek tipe
pnpm test       # tes (Vitest)
pnpm build      # build ke dist/
pnpm ai:dev     # service klarifikasi AI lokal (butuh .env.ai, lihat AI-9ROUTER.md §5)
```

## Alur Kerja
1. Buka `docs/vibeplan/TASKS.md`, ambil tugas `[ ]` pertama yang semua dependensinya `[x]`. Ubah statusnya menjadi `[~]`.
2. Baca rujukan tugas tersebut. Jika ada yang ambigu atau bertentangan, **berhenti dan tanya**, jangan mengasumsikan.
3. Kerjakan **hanya** tugas itu. Jangan merapikan atau mengubah kode di luar lingkup tugas.
4. Jalankan lint, cek tipe, dan tes. Semua harus lulus.
5. Centang setiap poin "Selesai jika", ubah status menjadi `[x]`, isi Log Pekerjaan.
6. Tunggu persetujuan pengguna sebelum mengambil tugas berikutnya.

## Konvensi Kode
- Bahasa: TypeScript strict; `any` dilarang.
- Logika di `src/engine/` dan `src/generator/` berupa fungsi murni tanpa React; state diperlakukan immutable.
- Pertanyaan, opsi, fitur, entitas, dan versi stack adalah **data** di `src/data/`, bukan di komponen.
- `recommend()` dan `showIf()` hanya boleh membaca pertanyaan yang muncul lebih awal di `QUESTIONS`.
- Mengubah struktur `templates/*.md` berarti generator yang sesuai juga diubah; tes heading template di `src/generator/generator.test.ts` harus tetap lulus.
- Teks UI dan file hasil dalam Bahasa Indonesia; nama variabel dalam bahasa Inggris, komentar boleh Indonesia.
- Warna hanya lewat token di `src/index.css`; tidak ada warna hard-code di komponen.

## Git
- Satu branch dan satu pull request per tugas ke `main`. Jangan merge sendiri.
- Pesan commit: `T-012: <ringkasan>`

## Batasan (WAJIB)
- JANGAN mengerjakan apa pun yang tercantum di PRD.md §6 "Di Luar Lingkup" (terutama LLM selain F-11 dan backend selain `vibeplan-ai`).
- JANGAN menambah/mengganti dependensi tanpa izin (lihat TECH_STACK.md §2–3).
- JANGAN mengubah bentuk `ProjectState` tanpa izin; jika disetujui, naikkan `version` dan tangani data lama di `parseState`.
- JANGAN menghapus atau melemahkan tes agar lulus.
- JANGAN mengirim data pengguna ke jaringan, kecuali nama & ide ke `/api/ai/clarify` saat pengguna memilih klarifikasi AI.
- JANGAN menaruh API key atau prompt LLM di kode klien; keduanya hanya di `server/`.
- JANGAN memakai `dangerouslySetInnerHTML`.

## Definisi Selesai
- Semua poin "Selesai jika" di tugas tercentang
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, dan `pnpm build` lulus
- Perubahan UI dicoba di lebar 375px dan 1280px, mode terang dan gelap

## Cara Berkomunikasi
Pengguna bisa membaca kode sedikit dan lebih suka Bahasa Indonesia. Jelaskan apa yang berubah dan di file mana, lalu beri langkah mencobanya di browser.

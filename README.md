# VibePlan · VibeEngineering

Aplikasi web yang mewawancarai Anda dengan **pertanyaan pilihan ganda** tentang ide web app, lalu membuat paket `.md` (PRD, ARCHITECTURE, TECH_STACK, DATA_MODEL, DESIGN, TASKS, AGENTS, CLAUDE) supaya AI coding agent membangun aplikasi itu secara presisi.

MVP ini berjalan penuh di browser: tanpa server, tanpa LLM, tanpa akun. Jawaban tersimpan di `localStorage`.

## Menjalankan
```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # situs statis di dist/
```

## Cara pakai
1. Isi nama proyek dan ide 1–3 kalimat.
2. Jawab 8 tahap pertanyaan. Ragu? Pilih **🤖 Biarkan AI merekomendasikan** atau lewati saja; keputusannya ditandai `[ASUMSI]`.
3. Tinjau ringkasan, tekan **Buat paket .md**, lalu **Unduh ZIP**.
4. Ekstrak ke root repo baru dan tempel prompt awal ke agen Anda.

## Isi repo
| Path | Isi |
|---|---|
| [docs/vibeplan/](docs/vibeplan) | Spesifikasi VibePlan sendiri: PRD, ARCHITECTURE, TECH_STACK, DESIGN, TASKS |
| [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) | Aturan untuk AI agent yang mengerjakan repo ini |
| [docs/research/](docs/research) | Riset konsep dan bank pertanyaan asli |
| [templates/](templates) | Struktur acuan file hasil; tes memastikan generator mengikutinya |
| `src/data/` | Bank pertanyaan, katalog fitur & entitas, tabel stack |
| `src/engine/` | Resolver jawaban & rekomendasi, model Plan |
| `src/generator/` | Pembuat tiap file `.md` + validasi |

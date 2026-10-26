# Tech Stack: VibePlan

> Versi dikunci. Agen **tidak boleh** menambah, mengganti, atau meng-upgrade dependensi tanpa persetujuan.
> Versi persis ada di `package.json` dan `pnpm-lock.yaml`.

## 1. Stack Inti
| Lapisan | Pilihan | Versi | Alasan |
|---|---|---|---|
| Bahasa | TypeScript (strict, `noUncheckedIndexedAccess`) | 7.0.2 | Tipe ketat; generator banyak memetakan data |
| Framework | React (SPA, tanpa router) | 19.3.1 | Alur 4 layar cukup dengan state, tidak perlu router |
| Build | Vite | 8.3.5 | Build statis cepat, output bisa dihosting di mana saja |
| Backend | Service `vibeplan-ai` (`server/`), Node ≥ 22.18 menjalankan `.ts` langsung, tanpa dependensi npm | - | Hanya untuk klarifikasi AI lewat 9router (ADR-007) |
| Database | Tidak ada (`localStorage`, kunci `vibeplan:v1`) | - | Hanya progres satu pengguna di satu browser |
| ORM | Tidak ada | - | - |
| Auth | Tidak ada | - | Tanpa akun |
| UI | Komponen sendiri (`src/components/ui.tsx`) | - | Hanya Button, Badge, Card; tidak perlu pustaka |
| Styling | Tailwind CSS via `@tailwindcss/vite` | 4.3.3 | Token warna di `src/index.css` (`@theme`) |
| ZIP | JSZip (dimuat lazy) | 3.10.2 | Membuat ZIP di browser |
| Validasi | Fungsi sendiri (`parseState`) | - | Satu bentuk data kecil; Zod tidak sebanding ukurannya |
| Testing | Vitest | 5.0.5 | Unit test engine & generator di Node |
| Lint/format | Biome | 2.6.3 | Satu alat untuk lint + format + urut import |
| Hosting | VPS sendiri + nginx (situs statis) | - | `dist/` disalin ke `/var/www/vibeplan`; lihat [DEPLOY.md](DEPLOY.md). `base: "./"` tetap dipakai |
| Monitoring | Tidak ada | - | Tanpa server |

## 2. Library yang Disetujui
| Kebutuhan | Library | Catatan |
|---|---|---|
| UI | react, react-dom | |
| ZIP | jszip | Hanya diimpor lewat `import()` di `src/export/zip.ts` |
| Styling | tailwindcss, @tailwindcss/vite | |
| Dev | vite, @vitejs/plugin-react, typescript, vitest, @biomejs/biome, @types/* | |

## 3. Library yang Dilarang
| Library | Alasan | Gunakan ini sebagai gantinya |
|---|---|---|
| Router (react-router, TanStack Router) | Hanya 4 layar | state `screen` di `App.tsx` |
| State global (Redux, Zustand, Jotai) | State kecil dan immutable | `useState` + fungsi murni di `src/engine/answers.ts` |
| Pustaka UI (MUI, shadcn, Mantine) | Menambah ukuran bundle | `src/components/ui.tsx` |
| Template engine (Handlebars, Mustache) | Generator harus bertipe dan bisa diuji | fungsi TypeScript di `src/generator/` |
| SDK LLM apa pun | 9router sudah OpenAI-compatible; cukup `fetch` di `server/clarify.ts` | `fetch` bawaan Node |
| ESLint/Prettier | Sudah memakai Biome | Biome |

## 4. Setup Lokal
```bash
pnpm install
pnpm dev        # http://localhost:5173
```

## 5. Perintah Penting
| Tujuan | Perintah |
|---|---|
| Jalankan dev | `pnpm dev` |
| Lint | `pnpm lint` |
| Format otomatis | `pnpm format` |
| Cek tipe | `pnpm typecheck` |
| Tes | `pnpm test` |
| Build | `pnpm build` (hasil di `dist/`) |
| Pratinjau build | `pnpm preview` |
| Deploy ke VPS | `./deploy/deploy.sh` (di VPS, dari root repo) |
| Migrasi DB | Tidak ada |

## 6. Variabel Lingkungan
Aplikasi klien tidak memakai env. Service `vibeplan-ai` membaca env berikut (contoh: `deploy/vibeplan-ai.env.example`; di VPS: `/etc/vibeplan-ai.env`; di lokal: `.env.ai`, diabaikan git):

| Nama | Wajib | Bawaan | Isi |
|---|---|---|---|
| `VIBEPLAN_AI_UPSTREAM` | - | `http://127.0.0.1:20128/v1` | Basis URL 9router |
| `VIBEPLAN_AI_KEY` | - | kosong | API key 9router (rahasia) |
| `VIBEPLAN_AI_MODEL` | ya | - | Nama model/combo di 9router |
| `VIBEPLAN_AI_PORT` / `VIBEPLAN_AI_HOST` | - | `8787` / `127.0.0.1` | Alamat service |
| `VIBEPLAN_AI_MAX_TOKENS` | - | `1200` | Batas token jawaban |
| `VIBEPLAN_AI_TIMEOUT_MS` | - | `40000` | Timeout per panggilan 9router |
| `VIBEPLAN_AI_RATE_MINUTE` / `VIBEPLAN_AI_RATE_DAY` | - | `5` / `50` | Rate limit per IP (hanya `/clarify`) |
| `VIBEPLAN_AI_TEMPERATURE` | - | `0.2` | Suhu model; rendah agar JSON lebih rapi |
| `VIBEPLAN_AI_JSON_MODE` | - | `0` | `1` = kirim `response_format: json_object` (hanya jika model mendukung) |

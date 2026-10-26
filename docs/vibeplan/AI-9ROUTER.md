# Rancangan: Klarifikasi awal dengan AI lewat 9router (v1)

> Status: **Disetujui 2026-10-26** (ADR-007). Pengguna memilih: proxy kecil di VPS, dan AI hanya untuk klarifikasi di awal.

## 1. Tujuan
Wawancara memakai pertanyaan tetap, sehingga belum "mengenal" proyek pengguna. Sebelum wawancara dimulai, AI membaca nama dan ide proyek lalu mengajukan **3–5 pertanyaan pilihan ganda** yang khusus untuk proyek itu (masalah inti, situasi pemakaian, aturan bisnis, pembeda). Jawabannya masuk ke PRD hasil, lalu wizard 8 tahap berjalan seperti biasa.

Yang tidak berubah: wizard tetap pilihan ganda, rekomendasi per pertanyaan tetap aturan statis, generator tetap deterministik, dan **semua alur tetap jalan tanpa AI**.

## 2. Arsitektur
```
Browser (SPA statis)
  │  GET /api/ai/health, POST /api/ai/clarify, POST /api/ai/suggest   (origin sama → CSP tetap)
  ▼
nginx  vibeplan.emha.web.id
  │  location /api/ai/ → limit_req 12/menit/IP (burst 10), body ≤ 32 KB (health tanpa limit)
  ▼
vibeplan-ai  (server/main.ts, Node ≥ 22.18 tanpa dependensi, systemd, 127.0.0.1:8787)
  │  validasi masukan, menyusun prompt sendiri, validasi jawaban model, rate limit, timeout
  │  Authorization: Bearer <VIBEPLAN_AI_KEY dari /etc/vibeplan-ai.env>
  ▼
9router  (VIBEPLAN_AI_UPSTREAM, misal http://127.0.0.1:20128/v1/chat/completions)
```

Alasan memilih proxy kecil (bukan nginx langsung ke 9router atau key di browser):
- API key 9router tidak pernah sampai ke browser.
- Service **tidak** meneruskan prompt dari klien. Klien hanya mengirim nama dan ide; prompt disusun di server. Situs publik tidak bisa dipakai sebagai relay LLM umum.
- Model, `max_tokens`, dan suhu dikunci di server lewat env.

## 3. Kontrak API
| Endpoint | Masukan | Keluaran |
|---|---|---|
| `GET /api/ai/health` | - | `{ "ok": true }` |
| `POST /api/ai/suggest` | `{ projectName, idea, context: [{ q, a }] (≤ 80), questions: [{ id, text, type: "single"\|"multi", options: [{ id, label }] }] (1–15, opsi 2–40) }` | `{ suggestions: [{ id, optionIds, reason }] }` (hanya ID yang dikirim; single = 1 opsi) |
| `POST /api/ai/clarify` | `{ projectName, idea }` (nama 1–80, ide 10–2000 karakter) | `{ questions: [{ id: "K-01", text, type: "single"\|"multi", options: [{ id: "K-01-a", label }] }] }` (3–5 pertanyaan, 2–6 opsi) |

Kode error: `400 bad_request/bad_name/bad_idea`, `415`, `429 rate_limited`, `502 upstream/bad_model`, `504 timeout`.

Pengamanan di service (`server/clarify.ts`):
- Data pengguna dikirim ke model sebagai JSON di pesan `user`, dengan instruksi bahwa isinya data, bukan perintah.
- Jawaban model diparse (toleran terhadap blok kode, teks di sekitarnya, dan koma di akhir), opsi duplikat/kosong dibuang, ID diberikan server. Jika tidak valid, coba ulang satu kali. Suhu bawaan 0.2; `response_format` bisa diaktifkan lewat `VIBEPLAN_AI_JSON_MODE=1`.
- Rate limit per IP di memori (bawaan 10/menit, 150/hari, gabungan `/clarify` + `/suggest`) di samping `limit_req` nginx.
- Log hanya path, status, dan durasi; isi ide tidak dicatat.

## 4. Klien
| Bagian | File |
|---|---|
| Cek ketersediaan & panggilan API | `src/ai/client.ts` |
| Validasi & ubah state klarifikasi (fungsi murni) | `src/engine/clarify.ts` |
| Layar klarifikasi | `src/screens/ClarifyScreen.tsx` |
| Pilihan **🤖 Klarifikasi ide dengan AI** (hanya muncul jika service tersedia) | `src/screens/StartScreen.tsx` |
| Ringkasan klarifikasi + **Ubah** | `src/screens/ReviewScreen.tsx` |
| PRD hasil §1 → `### Klarifikasi awal` (yang dilewati tidak ditulis) | `src/generator/prd.ts` |

`ProjectState` naik ke **version 2** dengan field `clarifications`. `parseState` menaikkan data version 1 (localStorage lama dan `vibeplan-answers.json` lama) dengan `clarifications: []`.

## 5. Saran AI per tahap (F-12, ADR-008)
Di atas pertanyaan setiap tahap ada tombol **Isi dengan saran AI** (`src/components/AiSuggest.tsx`).
1. `buildSuggestPayload` (`src/engine/suggest.ts`) mengambil pertanyaan single/multi yang tampil dan belum dijawab pengguna (maks 15), opsi yang berlaku saat itu, lalu konteks: jawaban klarifikasi + jawaban pengguna di tahap sebelumnya.
2. Server (`server/suggest.ts`) menyusun prompt, memanggil 9router, dan membuang ID pertanyaan/opsi yang tidak dikirim.
3. `applySuggestions` menyimpan hasilnya sebagai `{ decidedBy: "ai", source: "model", optionIds, reason }`. Jawaban pengguna tidak ditimpa; opsi `none` dibuang bila digabung opsi lain.
4. Resolver memakai saran model selama opsinya masih valid; jika tidak (misal VIS-01 berubah sehingga katalog fitur berganti), kembali ke `recommend()` statis. Semua tetap bertanda `[ASUMSI]`.

Pertanyaan bertipe prioritas (FEA-02) belum diberi saran model.

## 6. Menjalankan di lokal
```bash
cp deploy/vibeplan-ai.env.example .env.ai   # isi VIBEPLAN_AI_UPSTREAM, VIBEPLAN_AI_KEY, VIBEPLAN_AI_MODEL
pnpm ai:dev                                 # service di 127.0.0.1:8787
pnpm dev                                    # Vite meneruskan /api/ai ke service
```
Tanpa `pnpm ai:dev`, aplikasi berjalan seperti sebelumnya dan pilihan AI tidak muncul.

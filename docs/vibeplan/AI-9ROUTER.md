# Rancangan: Wawancara interaktif dengan 9router (v1)

> Status: **DRAF, menunggu persetujuan**. Belum ada kode yang diubah. Setelah disetujui, ringkasannya masuk ke ARCHITECTURE.md §6 & §10 (ADR-007), PRD §4–§6, dan TASKS.md (T-016…T-021).

## 1. Tujuan
Wawancara saat ini memakai pertanyaan tetap dan rekomendasi dari aturan statis, sehingga belum "mengenal" proyek pengguna. Dengan 9router (router LLM OpenAI-compatible yang sudah berjalan di VPS yang sama), VibePlan akan:

1. **Klarifikasi awal:** setelah nama & ide diisi, AI mengajukan 2–4 pertanyaan pilihan ganda yang khusus untuk proyek itu.
2. **Pertanyaan lanjutan per tahap:** di akhir tiap tahap, AI boleh mengajukan 0–3 pertanyaan pilihan ganda tambahan berdasarkan jawaban sejauh ini.
3. **Rekomendasi kontekstual:** tombol **🤖 Biarkan AI merekomendasikan** memakai model; alasannya merujuk ide proyek. Pilihan tetap dibatasi ke opsi yang ada.

Prinsip yang tidak berubah: tetap pilihan ganda, generator tetap deterministik, dan **semua alur tetap jalan tanpa AI** (aturan statis jadi cadangan).

## 2. Arsitektur
```
Browser (SPA statis)
  │  POST /api/ai/*   (origin sama → CSP connect-src 'self' TIDAK perlu diubah)
  ▼
nginx  vibeplan.emha.web.id
  │  location /api/ai/  → limit_req, client_max_body_size 16k
  ▼
vibeplan-ai  (Node 26, tanpa dependensi, systemd, 127.0.0.1:8787)
  │  menyusun prompt sendiri, validasi input & output, rate limit, timeout
  │  Authorization: Bearer <VIBEPLAN_AI_KEY dari /etc/vibeplan-ai.env>
  ▼
9router  (127.0.0.1:<port>/v1/chat/completions, atau https://9router.emha.web.id/v1)
```

### Kenapa proxy kecil, bukan nginx langsung ke 9router
- API key 9router tidak pernah sampai ke browser.
- Service **tidak** meneruskan prompt dari klien. Klien hanya mengirim data terstruktur (nama, ide, jawaban); prompt disusun di server. Jadi situs publik tidak berubah jadi relay LLM gratis.
- Model, `max_tokens`, dan suhu dikunci di server lewat env.
- Karena satu origin, CSP tetap `connect-src 'self'`.

## 3. Kontrak API (`vibeplan-ai`)
Semua respons JSON. Kesalahan: `{ "error": "<kode>" }` dengan status 400/429/502/504.

| Endpoint | Masukan | Keluaran |
|---|---|---|
| `GET /api/ai/health` | - | `{ "ok": true, "model": "<nama>" }` |
| `POST /api/ai/clarify` | `{ projectName, idea, stage, answered: [{ q, a }] }` | `{ questions: [{ id, text, type: "single"\|"multi", options: [{ id, label }] }] }` (maks 4 pertanyaan, 2–6 opsi) |
| `POST /api/ai/recommend` | `{ projectName, idea, question: { id, text, type, options: [{ id, label }] }, answered: [{ q, a }] }` | `{ optionIds: [...], reason }` (opsi wajib berasal dari `options`) |

Batas masukan: `projectName` ≤ 80 karakter, `idea` ≤ 2000, `answered` ≤ 80 butir, total body ≤ 16 KB.

Pengamanan di service:
- Output model diparse sebagai JSON dan divalidasi; jika tidak valid, satu kali coba ulang, lalu `502`.
- Rate limit per IP di memori (misal 30 permintaan/menit, 300/hari) + `limit_req` nginx.
- Timeout ke 9router 30 detik → `504`.
- Log hanya status, durasi, dan endpoint; isi ide tidak dicatat.

## 4. Perubahan di klien
| Bagian | Perubahan |
|---|---|
| `src/ai/client.ts` (baru) | `fetch` ke `/api/ai/*` dengan `AbortController` (timeout 25 detik), parse & validasi respons |
| Deteksi | Saat mulai, `GET /api/ai/health`. Jika gagal (lokal tanpa service, offline), semua tombol AI disembunyikan dan aplikasi berperilaku seperti sekarang |
| Toggle | Di layar mulai: **Gunakan AI untuk wawancara** (aktif jika tersedia) + catatan bahwa ide & jawaban dikirim ke server VibePlan dan penyedia LLM |
| State | `ProjectState` mendapat field opsional `clarifications: [{ id, stage, text, type, options, optionIds }]` dan `Answer.ai?: { optionIds, reason, basedOn }`. `version` tetap 1; `parseState` menerima state lama |
| Rekomendasi | Hasil AI disimpan beserta `basedOn` (hash jawaban sebelumnya). Jika jawaban awal berubah, rekomendasi AI dianggap basi: resolver memakai aturan statis dan UI menawarkan **Perbarui rekomendasi AI** (ADR-004 tetap berlaku untuk aturan statis) |
| Generator | PRD mendapat bagian konteks dari klarifikasi; alasan AI ikut di `[ASUMSI]`. Generator hanya membaca state, tidak memanggil AI, jadi AC-05-1 (deterministik) tetap terpenuhi |

## 5. Perubahan dokumen yang diusulkan
- **ADR-007** (ARCHITECTURE §10): "Fitur AI lewat service `vibeplan-ai` di VPS yang memanggil 9router; prompt disusun di server, key di env, origin sama." Ditolak: nginx langsung ke 9router (relay terbuka), key di browser (hanya pemilik key yang bisa pakai).
- **ARCHITECTURE §6** Integrasi eksternal: 9router.
- **PRD §5**: "Tidak ada data yang keluar dari browser" menjadi "Tanpa AI, tidak ada data keluar dari browser. Dengan AI aktif, nama, ide, dan jawaban dikirim ke server VibePlan dan penyedia LLM; tidak disimpan di server". Offline: semua alur tetap jalan tanpa AI.
- **PRD §6**: hapus "LLM apa pun" dari Di Luar Lingkup; tambah fitur F-11 (klarifikasi), F-12 (pertanyaan lanjutan), F-13 (rekomendasi AI) dengan AC EARS.
- **DEPLOY.md**: bagian baru untuk `vibeplan-ai` (unit systemd, env, blok nginx).

## 6. Rencana tugas
| ID | Tugas | Selesai jika |
|---|---|---|
| T-016 | Service `server/vibeplan-ai.mjs` + tes validasi | Tes Vitest untuk validasi input/output & rate limit lulus; tanpa dependensi npm |
| T-017 | Konfigurasi deploy | `deploy/vibeplan-ai.service`, `deploy/vibeplan-ai.env.example`, blok `location /api/ai/` di nginx, DEPLOY.md diperbarui |
| T-018 | Klien AI + deteksi + toggle | Tanpa service, UI identik dengan sekarang (tes); dengan mock, tombol AI muncul |
| T-019 | Klarifikasi awal & pertanyaan lanjutan (F-11, F-12) | Jawaban klarifikasi tersimpan, ikut di PRD hasil |
| T-020 | Rekomendasi AI (F-13) | Opsi di luar daftar ditolak; rekomendasi basi terdeteksi; fallback ke aturan statis |
| T-021 | Deploy & uji di produksi | Hermes memasang service; alur dengan AI diuji di https://vibeplan.emha.web.id |

## 7. Yang perlu dipastikan di VPS
- Port lokal 9router dan apakah endpoint `/v1/chat/completions` membutuhkan API key.
- Nama model (atau combo) di 9router yang dipakai untuk VibePlan.
- Port 8787 bebas.

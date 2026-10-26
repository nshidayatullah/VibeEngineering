# Arsitektur: VibePlan

> Menjelaskan *bagaimana* VibePlan disusun. Versi library ada di [TECH_STACK.md](TECH_STACK.md).

## 1. Gambaran Sistem
```
Browser
  └─ React SPA (Vite)
       ├─ screens/      Start → Interview → Review → Result
       ├─ engine/       resolve (showIf, autoAi, rekomendasi) + answers (ubah state)
       ├─ data/         bank pertanyaan, katalog fitur & entitas, tabel stack
       ├─ generator/    ProjectState → Plan → 8+ file .md + validasi
       ├─ export/       JSZip (lazy) → unduhan
       ├─ storage/      localStorage "vibeplan:v1"
       └─ ai/           fetch ke /api/ai/* (klarifikasi awal, opsional)
                          │ nginx → vibeplan-ai (server/, Node, systemd) → 9router
```
Tidak ada database. Satu-satunya API adalah service kecil `vibeplan-ai` untuk klarifikasi awal (ADR-007, [AI-9ROUTER.md](AI-9ROUTER.md)). Tanpa service itu, tidak ada permintaan jaringan setelah halaman dimuat.

## 2. Komponen
| Komponen | Tanggung jawab | File |
|---|---|---|
| Bank pertanyaan | Data pertanyaan, opsi, `showIf`, `autoAi`, `recommend` | `src/data/questions.ts` |
| Katalog | Fitur per jenis aplikasi (+ AC EARS) dan entitas (+ field) | `src/data/features.ts`, `src/data/entities.ts` |
| Tabel stack | Versi mayor, perintah, warna, gaya | `src/data/stacks.ts` |
| Resolver | Menghitung jawaban final per pertanyaan, termasuk rekomendasi | `src/engine/resolve.ts` |
| Pengubah jawaban | Fungsi murni untuk memilih opsi, Lainnya, AI, prioritas | `src/engine/answers.ts` |
| Plan | Model tengah: fitur ber-ID, entitas, stack, asumsi | `src/engine/plan.ts` |
| Generator | Satu fungsi per file hasil + validasi | `src/generator/*.ts` |
| UI | Layar & kartu pertanyaan | `src/screens/`, `src/components/` |

## 3. Struktur Folder
```
src/
  data/          # konten: pertanyaan, katalog, stack (tanpa React)
  engine/        # logika murni: types, resolve, answers, plan
  generator/     # Plan → markdown; satu file per dokumen
  export/        # ZIP & unduhan
  storage/       # localStorage + parseState
  ai/            # fetch ke /api/ai/* (klarifikasi awal)
  components/    # komponen UI kecil
  screens/       # satu komponen per layar
  test/          # fixture tes
  App.tsx, main.tsx, index.css
server/          # service vibeplan-ai (Node, tanpa dependensi): clarify.ts murni + main.ts HTTP
templates/       # struktur acuan file hasil (dicek oleh tes)
docs/research/   # riset & bank pertanyaan versi dokumen
docs/vibeplan/   # spesifikasi VibePlan sendiri
```
**Aturan dependensi:** `screens/components → engine/generator/export/storage → data`. `data/` hanya boleh mengimpor tipe dari `engine/types.ts`. `engine/` dan `generator/` tidak boleh mengimpor React atau API browser (selain `export/`, `storage/`, dan `ai/`). `server/` berdiri sendiri: tidak mengimpor dari `src/` dan sebaliknya.

## 4. Alur Data Utama
1. Setiap aksi pengguna memanggil fungsi murni di `engine/answers.ts` yang mengembalikan `ProjectState` baru (immutable).
2. `App` menyimpan state ke `localStorage` setiap kali berubah.
3. Saat render, `accessor(state)` membuat pembaca jawaban yang di-cache per objek state. `resolved(id)`:
   - `showIf` false → `hidden` (jawaban diabaikan);
   - `autoAi` true, jawaban "AI", atau tidak dijawab → hasil `recommend()` (bertanda `[ASUMSI]`);
   - selain itu → opsi pengguna, setelah opsi yang tidak lagi valid dibuang.
4. `recommend()` dan `showIf()` hanya boleh membaca pertanyaan yang muncul **lebih awal** di `QUESTIONS`; siklus dilempar sebagai error.
5. `generateAll(state, date)` → `buildPlan()` (fitur diurut Must→Won't lalu diberi ID F-01…) → generator per file → `validate()`.
6. `buildZip()` memuat JSZip secara lazy dan membungkus semua file dalam folder `<slug>/`.

## 5. Autentikasi & Otorisasi
- Mekanisme sesi: tidak ada
- Pemeriksaan izin: tidak ada
- Multi-tenant: tidak ada

## 6. Integrasi Eksternal
| Layanan | Untuk apa | Lewat |
|---|---|---|
| 9router (router LLM OpenAI-compatible di VPS yang sama) | Pertanyaan klarifikasi awal (F-11) dan saran per tahap (F-12) | `server/main.ts` → `VIBEPLAN_AI_UPSTREAM/chat/completions`. Klien hanya memanggil `/api/ai/*` |

Menambah integrasi lain butuh baris ADR baru.

## 7. Rendering, Real-time, Offline
- Strategi rendering: SPA di klien; `index.html` memuat judul dan meta description
- Real-time: tidak ada
- Offline: setelah dimuat, semua alur berjalan tanpa jaringan

## 8. Keamanan
- Tidak ada `dangerouslySetInnerHTML`; pratinjau markdown ditampilkan sebagai teks di `<pre>`.
- File impor divalidasi `parseState()` sebelum dipakai; data tidak valid ditolak tanpa mengubah state.
- Tidak ada rahasia di repo. API key 9router hanya di `/etc/vibeplan-ai.env` di VPS.
- Service AI tidak meneruskan prompt dari klien: menerima nama & ide, menyusun prompt sendiri, memvalidasi jawaban model, rate limit per IP, log tanpa isi ide.

## 9. Lingkungan & Deploy
| Lingkungan | URL | Branch | Database |
|---|---|---|---|
| Lokal | localhost:5173 | - | localStorage |
| Produksi | https://vibeplan.emha.web.id (nginx di VPS, lihat [DEPLOY.md](DEPLOY.md)) | main | localStorage |

## 10. Catatan Keputusan Arsitektur (ADR)
| ID | Tanggal | Keputusan | Alasan | Alternatif yang ditolak |
|---|---|---|---|---|
| ADR-001 | 2026-10-25 | SPA statis React + Vite, tanpa backend | MVP tanpa LLM tidak butuh server; hosting gratis | Next.js (fitur server tidak dipakai) |
| ADR-002 | 2026-10-25 | Generator berupa fungsi TypeScript, bukan substitusi `{{placeholder}}` | Banyak bagian template berupa daftar/tabel berulang dan logika kondisional | Mengisi `templates/*.md` dengan string replace (meninggalkan placeholder) |
| ADR-003 | 2026-10-25 | `templates/*.md` tetap acuan struktur; tes memastikan semua heading `##` ada di hasil | Satu sumber kebenaran untuk struktur dokumen | Menyalin template ke kode |
| ADR-004 | 2026-10-25 | Rekomendasi dihitung ulang dari jawaban terbaru, tidak disimpan | Mencegah rekomendasi basi saat jawaban awal diubah | Menyimpan hasil rekomendasi di state |
| ADR-005 | 2026-10-25 | Relasi entitas diambil dari katalog (FK di field), bukan pertanyaan DAT-02 | DAT-02 butuh usulan pasangan entitas oleh LLM | Matriks relasi manual |
| ADR-006 | 2026-10-26 | Produksi di VPS sendiri: nginx melayani `dist/` statis dengan CSP ketat, tanpa proses Node | VPS sudah ada dan memakai nginx; situs statis tidak butuh proses yang berjalan | Next.js/Node + systemd di port sendiri (butuh server), Vercel/Netlify/GitHub Pages (pengguna memilih VPS) |
| ADR-007 | 2026-10-26 | Klarifikasi awal AI lewat service kecil `vibeplan-ai` (Node tanpa dependensi, systemd, 127.0.0.1:8787) di belakang nginx `/api/ai/`, yang memanggil 9router; prompt disusun di server, key di env, origin sama sehingga CSP tetap `connect-src 'self'` | Key tidak bocor, situs tidak jadi relay LLM terbuka, tetap tanpa build server | nginx langsung ke 9router (siapa pun bisa memakai kuota LLM untuk prompt apa pun), key diisi pengguna di browser (hanya pemilik key yang bisa memakai) |
| ADR-008 | 2026-10-26 | Saran AI per tahap disimpan di `Answer` sebagai `decidedBy: "ai", source: "model"` + `reason` (`ProjectState` version 3); resolver memakainya selama opsinya valid, selain itu kembali ke `recommend()` statis. Klien mengirim opsi yang berlaku, server memvalidasi jawaban model terhadapnya | Satu jalur `[ASUMSI]` untuk semua rekomendasi; generator tetap deterministik karena hanya membaca state; katalog tetap di klien | Menerapkan saran sebagai jawaban pengguna (jejak asumsi hilang), katalog disalin ke server (dua sumber kebenaran) |

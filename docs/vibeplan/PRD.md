# PRD: VibePlan (MVP)

> Versi 0.1 · 25 Oktober 2026 · Status: Disetujui untuk MVP
> Sumber kebenaran untuk *apa* yang dibangun. Keputusan teknis ada di [ARCHITECTURE.md](ARCHITECTURE.md) dan [TECH_STACK.md](TECH_STACK.md).
> Latar belakang & riset: [docs/research/01-riset-konsep-aplikasi.md](../research/01-riset-konsep-aplikasi.md).

## 1. Ringkasan
VibePlan adalah aplikasi web yang mewawancarai pengguna dengan pertanyaan pilihan ganda tentang ide web app mereka, lalu menghasilkan paket file `.md` (PRD, ARCHITECTURE, TECH_STACK, DATA_MODEL, DESIGN, TASKS, AGENTS, CLAUDE) yang membuat AI coding agent membangun aplikasi itu secara presisi.

- **Jenis aplikasi:** alat (tool) satu fungsi, statis, berjalan penuh di browser
- **Tujuan tahap ini:** MVP untuk pengguna nyata: wizard statis **tanpa LLM**, template diisi langsung dari jawaban, ekspor ZIP
- **Target rilis:** 1 PR berisi spesifikasi + aplikasi yang bisa di-build dan dideploy sebagai situs statis

## 2. Masalah & Tujuan
**Masalah yang diselesaikan:** prompt bebas ke AI coding agent menyisakan ratusan keputusan yang ditebak AI. VibePlan memaksa keputusan itu dibuat secara eksplisit dan cepat, lalu menuliskannya dalam format yang dibaca agen setiap sesi.

**Metrik sukses**
| Metrik | Target | Cara ukur |
|---|---|---|
| Waktu dari ide ke ZIP | ≤ 15 menit untuk pengguna awam | Uji manual dengan 1 ide contoh |
| Placeholder tersisa di file hasil | 0 | Tes otomatis `src/generator/generator.test.ts` |
| Keselarasan struktur dengan `templates/` | Semua heading `##` template ada di file hasil | Tes otomatis `src/generator/generator.test.ts` |

## 3. Pengguna
### Persona
| Persona | Deskripsi | Tujuan utama | Kemampuan teknis |
|---|---|---|---|
| Pembuat non-programmer | Punya ide aplikasi, memakai AI agent untuk membangunnya | Mendapat spesifikasi yang membuat AI tidak menebak | Awam s/d bisa membaca kode sedikit |
| Developer solo | Memakai Claude Code/Cursor sehari-hari | Menghemat waktu menulis PRD/AGENTS.md | Developer |

### Peran & hak akses
Satu peran saja (pengguna anonim). Tidak ada login dan akun. Data hanya dikirim ke server saat klarifikasi AI (F-11): nama dan ide proyek, tanpa disimpan.

### Autentikasi
- Akses: publik, tanpa login
- Metode login: tidak ada
- Pendaftaran: tidak ada

## 4. Fitur
### Daftar fitur (MoSCoW)
| ID | Fitur | Prioritas | Deskripsi singkat |
|---|---|---|---|
| F-01 | Ide awal | Must | Pengguna mengisi nama proyek dan ide 1–3 kalimat |
| F-02 | Wawancara 8 tahap | Must | Pertanyaan pilihan ganda dari bank pertanyaan, per tahap, adaptif (`showIf`) |
| F-03 | Opsi "AI rekomendasi" & "Lainnya" | Must | Setiap pertanyaan punya dua opsi tambahan; rekomendasi berasal dari aturan statis |
| F-04 | Review keputusan | Must | Ringkasan semua jawaban per tahap, penanda `[ASUMSI]`, tombol ubah |
| F-05 | Generate paket `.md` | Must | Mengisi struktur `templates/*.md` dari jawaban secara deterministik |
| F-06 | Pratinjau & ekspor ZIP | Must | Lihat tiap file, salin, unduh ZIP berisi semua file + `vibeplan-answers.json` |
| F-07 | Simpan otomatis | Must | Progres tersimpan di `localStorage` dan dipulihkan saat halaman dibuka lagi |
| F-08 | Validasi sebelum ekspor | Should | Cek placeholder tersisa, fitur Must tanpa kriteria, entitas tanpa fitur, jumlah `[ASUMSI]` |
| F-09 | Impor jawaban | Should | Memuat `vibeplan-answers.json` dari ZIP sebelumnya untuk melanjutkan/merevisi |
| F-10 | File khusus agen | Should | Sesuai AIW-01: `CLAUDE.md`, `.cursor/rules/project.mdc`, `.github/copilot-instructions.md`, `GEMINI.md`, `.kiro/steering/project.md`, `.windsurf/rules/project.md` |
| F-11 | Klarifikasi awal dengan AI | Should | Sebelum wawancara, AI (lewat 9router) membaca nama & ide lalu mengajukan 3–5 pertanyaan pilihan ganda khusus proyek; jawaban masuk PRD hasil. Lihat [AI-9ROUTER.md](AI-9ROUTER.md) |

### Alur utama
1. Pengguna membuka VibePlan, mengisi nama proyek dan ide (F-01).
1a. Jika AI tersedia dan dipilih, pengguna menjawab 3–5 pertanyaan klarifikasi dari AI (F-11).
2. Pengguna menjawab 8 tahap; pertanyaan yang tidak relevan disembunyikan (F-02, F-03).
3. Pengguna meninjau keputusan dan memperbaiki yang perlu (F-04).
4. Pengguna menekan **Buat paket**, melihat pratinjau, lalu mengunduh ZIP (F-05, F-06, F-08).

### Detail fitur
#### F-01 · Ide awal
**User story:** Sebagai pembuat, saya ingin menulis ide singkat agar file hasil punya konteks proyek.

**Kriteria penerimaan (EARS)**
- AC-01-1: KETIKA nama proyek kosong, SISTEM HARUS menonaktifkan tombol **Mulai wawancara**.
- AC-01-2: KETIKA pengguna menekan **Mulai wawancara**, SISTEM HARUS menampilkan Tahap 1.
- AC-01-3: JIKA ada progres tersimpan, MAKA SISTEM HARUS menawarkan **Lanjutkan** dan **Mulai baru**.

**Kasus tepi:** ide kosong diperbolehkan; PRD lalu memakai kalimat dari jenis aplikasi (VIS-01).

#### F-02 · Wawancara 8 tahap
**User story:** Sebagai pembuat, saya ingin memilih jawaban dari opsi agar tidak perlu mengarang spesifikasi dari nol.

**Kriteria penerimaan (EARS)**
- AC-02-1: SISTEM HARUS memuat pertanyaan dari `src/data/questions.ts`, bukan dari kode komponen.
- AC-02-2: KETIKA kondisi `showIf` sebuah pertanyaan tidak terpenuhi, SISTEM HARUS menyembunyikannya dan mengabaikan jawabannya saat generate.
- AC-02-3: KETIKA pertanyaan bertipe `single`, SISTEM HARUS mengizinkan tepat satu opsi; bertipe `multi`, satu atau lebih.
- AC-02-4: KETIKA TEC-01 = "Tentukan semuanya untuk saya", SISTEM HARUS menyembunyikan TEC-02..TEC-08 dan mengisinya dengan rekomendasi bertanda `[ASUMSI]`.
- AC-02-5: SISTEM HARUS menampilkan indikator progres per tahap (terjawab / total yang tampil).
- AC-02-6: Opsi FEA-01 dan DAT-01 HARUS berasal dari katalog sesuai jenis aplikasi (VIS-01); FEA-02 menampilkan matriks prioritas untuk fitur terpilih; FEA-03 hanya berisi fitur Must.

**Kasus tepi:** pengguna mengubah VIS-01 setelah memilih fitur; fitur yang tidak ada di katalog baru dibuang dari jawaban.

#### F-03 · Opsi "AI rekomendasi" & "Lainnya"
**User story:** Sebagai pembuat, saya ingin menyerahkan keputusan yang tidak saya pahami tanpa kehilangan jejaknya.

**Kriteria penerimaan (EARS)**
- AC-03-1: KETIKA pengguna memilih **🤖 Biarkan AI merekomendasikan**, SISTEM HARUS menampilkan opsi yang direkomendasikan beserta alasannya.
- AC-03-2: Rekomendasi HARUS dihitung ulang dari jawaban terbaru setiap kali dibaca (tidak disimpan basi).
- AC-03-3: SISTEM HARUS menandai setiap keputusan dari rekomendasi dengan `[ASUMSI]` di file hasil.
- AC-03-4: KETIKA pengguna memilih **✏️ Lainnya**, SISTEM HARUS menampilkan kolom teks dan memakai teks itu di file hasil.
- AC-03-5: JIKA pertanyaan yang tampil dilewati, MAKA SISTEM HARUS memperlakukannya sebagai rekomendasi AI.

#### F-04 · Review keputusan
**Kriteria penerimaan (EARS)**
- AC-04-1: SISTEM HARUS menampilkan setiap pertanyaan yang tampil beserta jawabannya, dikelompokkan per tahap.
- AC-04-2: SISTEM HARUS menampilkan jumlah keputusan `[ASUMSI]`.
- AC-04-3: KETIKA pengguna menekan **Ubah** pada satu tahap, SISTEM HARUS membuka tahap tersebut.

#### F-05 · Generate paket `.md`
**Kriteria penerimaan (EARS)**
- AC-05-1: Generator HARUS deterministik: jawaban sama menghasilkan file identik (tanggal diambil dari parameter).
- AC-05-2: Setiap heading `##` di `templates/<FILE>.md` HARUS muncul di file hasil yang sama.
- AC-05-3: File hasil TIDAK BOLEH memuat `{{`, `}}`, atau komentar HTML petunjuk template.
- AC-05-4: Setiap fitur Must HARUS punya ≥ 1 kriteria penerimaan EARS; setiap entitas HARUS dipakai ≥ 1 fitur; setiap tugas fase 1–2 HARUS merujuk ID fitur.

#### F-06 · Pratinjau & ekspor ZIP
**Kriteria penerimaan (EARS)**
- AC-06-1: SISTEM HARUS menampilkan daftar file dan isi file terpilih.
- AC-06-2: KETIKA pengguna menekan **Salin**, SISTEM HARUS menyalin isi file ke clipboard dan menampilkan konfirmasi.
- AC-06-3: KETIKA pengguna menekan **Unduh ZIP**, SISTEM HARUS mengunduh `<slug-proyek>-vibeplan.zip` dengan `AGENTS.md` di root dan dokumen di `docs/`.
- AC-06-4: SISTEM HARUS menampilkan prompt awal yang bisa disalin untuk agen.

#### F-07 · Simpan otomatis
- AC-07-1: KETIKA jawaban berubah, SISTEM HARUS menyimpannya ke `localStorage` kunci `vibeplan:v1`.
- AC-07-2: JIKA `localStorage` tidak tersedia atau datanya rusak, MAKA SISTEM HARUS tetap berjalan dengan state kosong.

#### F-08 · Validasi sebelum ekspor
- AC-08-1: SISTEM HARUS menampilkan hasil validasi (lulus/peringatan) di layar hasil, di atas pratinjau file.

#### F-09 · Impor jawaban
- AC-09-1: KETIKA pengguna memilih file `vibeplan-answers.json` yang valid, SISTEM HARUS memulihkan nama, ide, dan jawaban.
- AC-09-2: JIKA file tidak valid, MAKA SISTEM HARUS menampilkan pesan error dan tidak mengubah state.

#### F-10 · File khusus agen
- AC-10-1: `AGENTS.md` HARUS selalu dibuat; file lain hanya jika agennya dipilih di AIW-01.

#### F-11 · Klarifikasi awal dengan AI
**User story:** Sebagai pembuat, saya ingin AI menanyakan hal khusus tentang proyek saya agar paket hasil tidak generik.

**Kriteria penerimaan (EARS)**
- AC-11-1: JIKA `GET /api/ai/health` gagal, MAKA SISTEM HARUS menyembunyikan pilihan AI dan berjalan seperti tanpa F-11.
- AC-11-2: KETIKA AI dipilih, ide ≥ 10 karakter, dan belum ada klarifikasi, lalu pengguna menekan **Mulai wawancara**, SISTEM HARUS membuka layar klarifikasi dan meminta pertanyaan ke `POST /api/ai/clarify`.
- AC-11-3: SISTEM HARUS menampilkan 3–5 pertanyaan pilihan ganda (single/multi) dan menyimpan jawabannya di `ProjectState.clarifications`.
- AC-11-4: JIKA permintaan gagal, MAKA SISTEM HARUS menampilkan pesan, tombol **Coba lagi**, dan **Lanjut tanpa klarifikasi**.
- AC-11-5: PRD hasil HARUS memuat `### Klarifikasi awal` berisi pertanyaan yang dijawab; yang dilewati tidak ditulis.
- AC-11-6: API key 9router TIDAK BOLEH ada di kode klien; prompt disusun di server (ARCHITECTURE ADR-007).

**Kasus tepi:** ide diubah setelah klarifikasi; pengguna memakai **Minta pertanyaan lain** dari layar klarifikasi (lewat **Ubah** di Ringkasan).

## 5. Kebutuhan Non-fungsional
| Aspek | Kebutuhan terukur |
|---|---|
| Performa | Bundle JS gzip < 150 KB; generate < 200 ms |
| Skala | Tidak relevan: semua berjalan di browser pengguna |
| Keamanan | Tanpa AI, tidak ada data yang keluar dari browser. Dengan AI, hanya nama & ide yang dikirim ke `/api/ai/clarify`; tidak ada `dangerouslySetInnerHTML` |
| Data sensitif | Tidak disimpan di server mana pun (service AI tidak mencatat isi ide) |
| SEO | Sedikit: judul & meta description halaman |
| Offline | Setelah dimuat, seluruh alur berjalan tanpa jaringan; hanya klarifikasi AI (opsional) yang butuh jaringan |
| Aksesibilitas | Dasar: semua opsi bisa dipilih dengan keyboard, label jelas, kontras ≥ 4.5:1 |
| Bahasa | Antarmuka & file hasil dalam Bahasa Indonesia |

## 6. Di Luar Lingkup (TIDAK dikerjakan)
- LLM selain klarifikasi awal (F-11): pertanyaan lanjutan per tahap, narasi AI, rekomendasi per pertanyaan berbasis model
- Pertanyaan kriteria penerimaan interaktif per fitur (Setuju/Ubah/Hapus) (fase v1)
- DAT-02 matriks relasi interaktif; relasi diambil dari katalog entitas
- Login, akun, database, sinkronisasi antar perangkat; backend selain service `vibeplan-ai` (ADR-007)
- Push langsung ke GitHub, versi & diff dokumen (fase v2)
- Template per jenis aplikasi di luar katalog bawaan, impor repo yang sudah ada (fase v3)

## 7. Pertanyaan Terbuka & Asumsi
| ID | Pertanyaan / Asumsi | Status |
|---|---|---|
| Q-01 | Versi stack di TECH_STACK hasil hanya mengunci versi mayor; versi persis dicatat agen dari lockfile di T-001 | Asumsi |
| Q-02 | Hosting VibePlan sendiri | Selesai: VPS sendiri + nginx di vibeplan.emha.web.id (ARCHITECTURE ADR-006) |

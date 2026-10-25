# Desain: VibePlan

> Panduan visual & UX. Agen wajib memakai token di `src/index.css` dan komponen di `src/components/ui.tsx`.

## 1. Prinsip
- Gaya: minimalis bersih
- Pengguna: awam s/d developer, sehingga setiap pertanyaan menampilkan rekomendasi dan alasannya
- Perangkat utama: desktop dan mobile sama pentingnya; tidak ada scroll horizontal di lebar 375px
- Bahasa UI: Indonesia, sapaan "Anda"

## 2. Design Tokens
Token didefinisikan di `@theme` pada `src/index.css` dan ditimpa untuk `prefers-color-scheme: dark`.

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| primary | #4f46e5 | #818cf8 | Tombol utama, opsi terpilih |
| bg | #f8fafc | #0b1020 | Latar halaman |
| surface | #ffffff | #121a2e | Kartu |
| fg | #0f172a | #e2e8f0 | Teks utama |
| muted | #64748b | #94a3b8 | Teks sekunder |
| line | #e2e8f0 | #24304a | Garis |
| accent | #eef2ff | #1e2547 | Hover, latar opsi terpilih |
| warn / warn-bg | #b45309 / #fffbeb | #fbbf24 / #2a2110 | Rekomendasi & [ASUMSI] |
| danger | #dc2626 | #f87171 | Error |
| ok | #15803d | #4ade80 | Validasi lulus |

## 3. Layout & Navigasi
- Header berisi logo (kembali ke awal) dan nama proyek
- Wawancara: daftar 8 tahap di kiri (desktop) atau baris geser horizontal (mobile), pertanyaan tahap aktif di kanan
- Lebar konten maksimum: 72rem

## 4. Komponen
| Komponen | Varian | Catatan |
|---|---|---|
| Button | primary, secondary, ghost, danger | Satu tombol primary per area |
| Badge | muted, warn, ok, primary | `warn` untuk rekomendasi/otomatis/dilewati |
| Card | default | Pembungkus bagian |
| QuestionCard | single, multi, priority | Opsi berupa input native di dalam label; selalu ada "Lainnya" dan "Biarkan AI merekomendasikan" |

## 5. Daftar Halaman
| Layar | Isi utama | Fitur |
|---|---|---|
| Start | Nama, ide, Mulai/Lanjutkan/Mulai baru, Muat jawaban.json | F-01, F-07, F-09 |
| Interview | 8 tahap, kartu pertanyaan, navigasi tahap | F-02, F-03 |
| Review | Semua keputusan per tahap + tombol Ubah | F-04 |
| Result | Validasi, prompt awal, daftar file, pratinjau, Salin, Unduh ZIP | F-05, F-06, F-08, F-10 |

## 6. Pola Status
| Status | Perlakuan |
|---|---|
| Memuat | Tombol ZIP menampilkan "Menyiapkan…" |
| Kosong | Matriks prioritas tanpa fitur menampilkan petunjuk memilih fitur |
| Error | Impor tidak valid: pesan merah `role="alert"` |
| Berhasil | Tombol Salin berubah menjadi "Tersalin ✓" selama 2 detik |

## 7. Aksesibilitas
- Target: dasar. Opsi memakai `input` radio/checkbox native, setiap kartu adalah `fieldset` + `legend`, fokus terlihat (`:focus-visible`).

## 8. Format Tampilan
- Tanggal di file hasil: `YYYY-MM-DD` dari tanggal lokal pengguna.

## 9. Referensi
- Struktur dokumen hasil: `templates/*.md`

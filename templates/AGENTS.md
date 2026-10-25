# AGENTS.md

Instruksi untuk AI coding agent yang bekerja di repo **{{project.name}}**. Baca file ini setiap awal sesi.

## Konteks Proyek
{{one_paragraph_summary}}

Dokumen rujukan (baca sesuai kebutuhan, jangan menebak):
- `docs/PRD.md`: fitur, kriteria penerimaan, di luar lingkup
- `docs/ARCHITECTURE.md`: struktur folder, aturan dependensi, ADR
- `docs/TECH_STACK.md`: versi, library disetujui/dilarang, perintah
- `docs/DATA_MODEL.md`: skema & aturan data
- `docs/DESIGN.md`: token, komponen, halaman
- `docs/TASKS.md`: tugas yang sedang dikerjakan

## Perintah
```bash
{{dev_command}}        # jalankan dev server
{{lint_command}}       # lint
{{typecheck_command}}  # cek tipe
{{test_command}}       # tes
{{build_command}}      # build
```

## Alur Kerja
1. Buka `docs/TASKS.md`, ambil tugas `[ ]` pertama yang semua dependensinya `[x]`. Ubah statusnya menjadi `[~]`.
2. Baca rujukan tugas tersebut. Jika ada yang ambigu atau bertentangan, **berhenti dan tanya**, jangan mengasumsikan.
3. Kerjakan **hanya** tugas itu. Jangan merapikan atau mengubah kode di luar lingkup tugas.
4. Jalankan lint, cek tipe, dan tes. Semua harus lulus.
5. Centang setiap poin "Selesai jika", ubah status menjadi `[x]`, isi Log Pekerjaan.
6. {{AIW-04}}  <!-- contoh: Tunggu persetujuan pengguna sebelum lanjut. -->

## Konvensi Kode <!-- AIW-07, TEC-07 -->
- Bahasa: {{TEC-07}}{{strict_note}}
- {{convention}}  <!-- contoh: komponen fungsional, satu komponen per file, nama file kebab-case -->
- Validasi semua input dari pengguna di server dengan {{validation}}.
- Teks UI dalam {{DES-06}}; komentar kode & nama variabel dalam bahasa Inggris.
- Ikuti token di DESIGN.md; tidak ada warna/ukuran hard-code.

## Git <!-- AIW-06 -->
- {{git_flow}}  <!-- contoh: branch `task/T-012-checkout`, satu PR per tugas -->
- Pesan commit: `T-012: <ringkasan>`

## Batasan (WAJIB) <!-- AIW-05, QUA-03, DAT-05 -->
- JANGAN mengerjakan apa pun yang tercantum di PRD.md §6 "Di Luar Lingkup".
- JANGAN menambah/mengganti dependensi tanpa izin (lihat TECH_STACK.md §2–3).
- JANGAN mengubah skema database tanpa izin; jika disetujui, perbarui DATA_MODEL.md §5.
- JANGAN menghapus atau melemahkan tes agar lulus.
- JANGAN menyimpan rahasia/API key di kode; gunakan variabel lingkungan.
- {{extra_constraint}}

## Definisi Selesai <!-- QUA-02 -->
- Semua poin "Selesai jika" di tugas tercentang
- Lint, cek tipe, tes, dan build lulus
- {{extra_dod}}  <!-- contoh: tes Playwright untuk alur yang disentuh -->

## Cara Berkomunikasi <!-- AIW-02 -->
{{communication_style}}  <!-- contoh: Pengguna bukan programmer. Jelaskan hasil dalam bahasa sederhana dan beri langkah untuk mencobanya di browser. -->

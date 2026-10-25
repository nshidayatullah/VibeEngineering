# Rencana Tugas: {{project.name}}

> Kerjakan **satu tugas per sesi/PR**, berurutan. Tugas selesai hanya jika semua poin "Selesai jika" terpenuhi.
> Ukuran tugas: {{AIW-03}} · Lanjut ke tugas berikutnya: {{AIW-04}}

**Legenda status:** `[ ]` belum · `[~]` dikerjakan · `[x]` selesai · `[!]` terhambat

## Fase 0 · Fondasi
### T-001 · Inisialisasi proyek
- Status: [ ]
- Bergantung pada: -
- Langkah: buat proyek {{TEC-02}}, pasang linter/formatter, struktur folder sesuai ARCHITECTURE.md §3.
- Selesai jika:
  - [ ] `{{dev_command}}` berjalan tanpa error
  - [ ] `{{lint_command}}` dan `{{typecheck_command}}` lulus
  - [ ] Struktur folder sama dengan ARCHITECTURE.md §3

### T-002 · Database & skema awal
- Status: [ ]
- Bergantung pada: T-001
- Rujukan: DATA_MODEL.md §3
- Selesai jika:
  - [ ] Migrasi pertama berjalan di database lokal
  - [ ] Semua entitas di DATA_MODEL.md ada di skema

### T-003 · Autentikasi
- Status: [ ]
- Bergantung pada: T-002
- Rujukan: PRD.md §3, ARCHITECTURE.md §5
- Selesai jika:
  - [ ] {{auth_acceptance}}

### T-004 · Layout & design tokens
- Status: [ ]
- Bergantung pada: T-001
- Rujukan: DESIGN.md §2–3
- Selesai jika:
  - [ ] Token warna/tipografi terpasang, tema {{DES-03}} berfungsi
  - [ ] Navigasi {{DES-07}} tampil di mobile dan desktop

## Fase 1 · Alur Utama ({{FEA-03}})
<!-- Satu atau lebih tugas per fitur Must, urut sesuai alur utama -->
### T-0{{n}} · {{feature}} ({{feature_id}})
- Status: [ ]
- Bergantung pada: {{deps}}
- Rujukan: PRD.md {{feature_id}}, DESIGN.md §5 route {{route}}
- File yang kemungkinan disentuh: {{files}}
- Selesai jika:
  - [ ] {{AC-xx-1}}
  - [ ] {{AC-xx-2}}
  - [ ] Tes: {{test_description}}

## Fase 2 · Fitur Should
<!-- ... -->

## Fase 3 · Penyempurnaan & Rilis
### T-0{{n}} · Kesiapan produksi
- Selesai jika:
  - [ ] Semua tes lulus, build sukses
  - [ ] Variabel lingkungan produksi terdokumentasi di TECH_STACK.md §6
  - [ ] Deploy ke {{TEC-06}} berhasil dan alur utama diuji manual

## Log Pekerjaan
| Tanggal | Tugas | Catatan |
|---|---|---|
| | | |

# Arsitektur: {{project.name}}

> Menjelaskan *bagaimana* sistem disusun. Versi library ada di [TECH_STACK.md](TECH_STACK.md), skema data di [DATA_MODEL.md](DATA_MODEL.md).

## 1. Gambaran Sistem
```
{{diagram}}
<!-- contoh:
Browser ─► Next.js (App Router, Server Components)
              ├─► Server Actions ─► Drizzle ─► PostgreSQL
              ├─► Auth (Better Auth)
              └─► Layanan eksternal: Midtrans, Resend, R2
-->
```

## 2. Komponen
| Komponen | Tanggung jawab | Teknologi |
|---|---|---|
| {{component}} | {{responsibility}} | {{tech}} |

## 3. Struktur Folder <!-- TEC-08 -->
```
{{folder_tree}}
<!-- contoh:
src/
  app/            # route & halaman (hanya komposisi UI)
  components/ui/  # komponen dasar (shadcn)
  components/     # komponen fitur
  server/
    actions/      # server actions per fitur
    db/schema.ts  # skema database (satu-satunya tempat definisi tabel)
    services/     # logika bisnis, tanpa akses request/response
  lib/            # utilitas murni
tests/
-->
```
**Aturan dependensi:** `app → components → server/actions → server/services → server/db`. Tidak boleh arah sebaliknya.

## 4. Alur Data Utama
<!-- Untuk alur di PRD §4 "Alur utama" -->
1. {{step}}

## 5. Autentikasi & Otorisasi <!-- USR-02, AUTH-*, USR-03 -->
- Mekanisme sesi: {{session}}
- Pemeriksaan izin: {{where_checked}}  <!-- contoh: di setiap server action lewat helper requireRole() -->
- Multi-tenant: {{USR-03}}

## 6. Integrasi Eksternal <!-- FEA-06, PAY-01 -->
| Layanan | Kegunaan | Cara panggil | Penanganan gagal |
|---|---|---|---|
| {{service}} | {{use}} | {{how}} | {{fallback}} |

## 7. Rendering, Real-time, Offline <!-- QUA-04, FEA-05, QUA-05 -->
- Strategi rendering: {{ssr_ssg_csr}}
- Real-time: {{FEA-05}}
- Offline: {{QUA-05}}

## 8. Keamanan <!-- QUA-03, DAT-05 -->
- {{security_measure}}

## 9. Lingkungan & Deploy <!-- TEC-06 -->
| Lingkungan | URL | Branch | Database |
|---|---|---|---|
| Lokal | localhost | - | {{local_db}} |
| Produksi | {{url}} | main | {{prod_db}} |

## 10. Catatan Keputusan Arsitektur (ADR)
<!-- Satu baris per keputusan penting. Agen wajib menambah baris di sini jika membuat keputusan baru (setelah disetujui). -->
| ID | Tanggal | Keputusan | Alasan | Alternatif yang ditolak |
|---|---|---|---|---|
| ADR-001 | {{date}} | {{decision}} | {{why}} | {{rejected}} |

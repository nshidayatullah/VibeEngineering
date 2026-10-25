# Tech Stack: {{project.name}}

> Versi dikunci. Agen **tidak boleh** menambah, mengganti, atau meng-upgrade dependensi tanpa persetujuan.

## 1. Stack Inti
| Lapisan | Pilihan | Versi | Alasan |
|---|---|---|---|
| Bahasa | {{TEC-07}} | {{ver}} | |
| Framework | {{TEC-02}} | {{ver}} | |
| Backend | {{TEC-03}} | {{ver}} | |
| Database | {{TEC-04}} | {{ver}} | |
| ORM | {{TEC-05}} | {{ver}} | |
| Auth | {{AUTH-01}} | {{ver}} | |
| UI | {{DES-05}} | {{ver}} | |
| Styling | {{styling}} | {{ver}} | |
| Validasi | {{validation}} | {{ver}} | <!-- contoh: Zod --> |
| Testing | {{QUA-02}} | {{ver}} | |
| Hosting | {{TEC-06}} | - | |
| Monitoring | {{QUA-06}} | - | |

## 2. Library yang Disetujui
| Kebutuhan | Library | Catatan |
|---|---|---|
| {{need}} | {{lib}} | |

## 3. Library yang Dilarang
| Library | Alasan | Gunakan ini sebagai gantinya |
|---|---|---|
| {{lib}} | {{why}} | {{alternative}} |
<!-- contoh: moment.js → date-fns; axios → fetch bawaan -->

## 4. Setup Lokal
```bash
{{install_command}}     # contoh: pnpm install
cp .env.example .env
{{db_setup_command}}    # contoh: pnpm db:migrate
{{dev_command}}         # contoh: pnpm dev
```

## 5. Perintah Penting
| Tujuan | Perintah |
|---|---|
| Jalankan dev | {{dev_command}} |
| Lint | {{lint_command}} |
| Cek tipe | {{typecheck_command}} |
| Tes | {{test_command}} |
| Build | {{build_command}} |
| Migrasi DB | {{migrate_command}} |

## 6. Variabel Lingkungan
| Nama | Wajib | Contoh | Keterangan |
|---|---|---|---|
| DATABASE_URL | Ya | postgres://... | |
| {{ENV}} | {{required}} | {{example}} | |

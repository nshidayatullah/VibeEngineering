# Model Data: {{project.name}}

> Definisi resmi ada di `{{schema_path}}`. Dokumen ini adalah rancangannya. Perubahan skema harus disetujui dan dicatat di §5.

## 1. Konvensi <!-- DAT-03, DAT-06, DAT-07 -->
- Primary key: {{pk_type}}  <!-- contoh: text cuid2 / uuid -->
- Kolom standar di setiap tabel: {{standard_columns}}  <!-- created_at, updated_at, deleted_at? -->
- Penghapusan: {{DAT-03}}
- Uang: {{money_type}}  <!-- contoh: integer dalam rupiah, tanpa desimal -->
- Waktu: disimpan UTC, ditampilkan {{timezone}}
- Penamaan: tabel {{table_case}}, kolom {{column_case}}

## 2. Diagram Relasi
```
{{erd}}
<!-- contoh:
User 1───* Order 1───* OrderItem *───1 Product *───1 Category
-->
```

## 3. Entitas
<!-- Ulangi per entitas dari DAT-01 -->
### {{Entity}}
{{entity_description}}

| Field | Tipe | Wajib | Unik | Default | Validasi / Keterangan |
|---|---|---|---|---|---|
| id | {{pk_type}} | Ya | Ya | auto | |
| {{field}} | {{type}} | {{req}} | {{unique}} | {{default}} | {{rule}} |

**Relasi:** {{relations}}
**Indeks:** {{indexes}}
**Dipakai oleh fitur:** {{feature_ids}}

## 4. Aturan Bisnis Data
- {{rule}}  <!-- contoh: stok tidak boleh negatif; satu email hanya satu akun -->

## 5. Riwayat Perubahan Skema
| Tanggal | Perubahan | Migrasi |
|---|---|---|
| {{date}} | Skema awal | {{migration_name}} |

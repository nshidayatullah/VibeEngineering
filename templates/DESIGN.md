# Desain: {{project.name}}

> Panduan visual & UX. Agen wajib memakai token dan komponen di sini, dan tidak membuat warna/ukuran baru secara hard-code.

## 1. Prinsip
- Gaya: {{DES-02}}
- Pengguna: {{USR-04}}, sehingga {{implication}}
- Perangkat utama: {{DES-01}}
- Bahasa UI: {{DES-06}}, nada {{tone}}  <!-- contoh: santai, pakai "kamu" -->

## 2. Design Tokens
### Warna <!-- DES-04, DES-03 -->
| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| --primary | {{hex}} | {{hex}} | Tombol utama, link |
| --background | {{hex}} | {{hex}} | Latar halaman |
| --foreground | {{hex}} | {{hex}} | Teks utama |
| --muted | {{hex}} | {{hex}} | Teks sekunder |
| --border | {{hex}} | {{hex}} | Garis |
| --destructive | {{hex}} | {{hex}} | Aksi hapus, error |
| --success | {{hex}} | {{hex}} | Berhasil |

### Tipografi
| Token | Font | Ukuran | Berat |
|---|---|---|---|
| heading-1 | {{font}} | {{size}} | {{weight}} |
| body | {{font}} | {{size}} | {{weight}} |

### Spasi, radius, bayangan
- Skala spasi: {{spacing_scale}}  <!-- 4, 8, 12, 16, 24, 32 -->
- Radius: {{radius}}
- Bayangan: {{shadow}}

## 3. Layout & Navigasi <!-- DES-07 -->
- Pola: {{DES-07}}
- Breakpoint: mobile < 640, tablet 640–1024, desktop > 1024
- Lebar konten maksimum: {{max_width}}

## 4. Komponen <!-- DES-05 -->
Pustaka: {{DES-05}}. Gunakan komponen yang ada sebelum membuat baru.

| Komponen | Varian | Catatan |
|---|---|---|
| Button | primary, secondary, ghost, destructive | Satu tombol primary per layar |
| {{component}} | {{variants}} | |

## 5. Daftar Halaman
| Route | Nama | Akses | Isi utama | Fitur |
|---|---|---|---|---|
| / | {{name}} | Publik | {{content}} | F-01 |
| {{route}} | {{name}} | {{role}} | {{content}} | {{feature_ids}} |

## 6. Pola Status
| Status | Perlakuan |
|---|---|
| Memuat | {{loading}}  <!-- skeleton, bukan spinner layar penuh --> |
| Kosong | {{empty}}  <!-- ilustrasi + ajakan aksi --> |
| Error | {{error}}  <!-- pesan jelas + tombol coba lagi --> |
| Berhasil | {{success}}  <!-- toast 3 detik --> |

## 7. Aksesibilitas <!-- DES-08 -->
- Target: {{DES-08}}
- Kontras teks minimal 4.5:1, semua input punya label, bisa dioperasikan dengan keyboard, fokus terlihat.

## 8. Format Tampilan <!-- DAT-07 -->
- Uang: {{money_format}}  <!-- Rp 12.500 -->
- Tanggal: {{date_format}}  <!-- 25 Okt 2026 -->
- Angka: {{number_format}}

## 9. Referensi <!-- DES-09 -->
- {{reference}}

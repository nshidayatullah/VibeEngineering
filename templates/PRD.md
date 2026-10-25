# PRD: {{project.name}}

> Versi {{doc.version}} · {{doc.date}} · Status: Draft
> Sumber kebenaran untuk *apa* yang dibangun. Keputusan teknis ada di [ARCHITECTURE.md](ARCHITECTURE.md) dan [TECH_STACK.md](TECH_STACK.md).
> Item bertanda `[ASUMSI]` adalah rekomendasi AI yang belum dikonfirmasi pengguna.

## 1. Ringkasan
{{idea}}  <!-- Tahap 0 -->

- **Jenis aplikasi:** {{VIS-01}}
- **Tujuan tahap ini:** {{VIS-03}}
- **Target rilis:** {{VIS-05}}

## 2. Masalah & Tujuan
**Masalah yang diselesaikan:** {{problem}}

**Metrik sukses** <!-- VIS-04 -->
| Metrik | Target | Cara ukur |
|---|---|---|
| {{metric}} | {{target}} | {{how}} |

## 3. Pengguna
### Persona <!-- VIS-02, USR-04 -->
| Persona | Deskripsi | Tujuan utama | Kemampuan teknis |
|---|---|---|---|
| {{persona}} | {{desc}} | {{goal}} | {{skill}} |

### Peran & hak akses <!-- USR-01, Klarifikasi -->
| Peran | Lihat | Buat | Ubah | Hapus | Catatan |
|---|---|---|---|---|---|
| {{role}} | {{entities}} | {{entities}} | {{entities}} | {{entities}} | |

### Autentikasi <!-- USR-02, AUTH-01, AUTH-02 -->
- Akses: {{USR-02}}
- Metode login: {{AUTH-01}}
- Pendaftaran: {{AUTH-02}}

## 4. Fitur
### Daftar fitur (MoSCoW) <!-- FEA-01, FEA-02, FEA-04 -->
| ID | Fitur | Prioritas | Deskripsi singkat |
|---|---|---|---|
| F-01 | {{feature}} | Must | {{desc}} |

### Alur utama <!-- FEA-03 -->
1. {{step}}

### Detail fitur
<!-- Ulangi blok ini untuk setiap fitur Must dan Should -->
#### F-01 · {{feature}}
**User story:** Sebagai {{role}}, saya ingin {{action}} agar {{benefit}}.

**Kriteria penerimaan (EARS)**
- AC-01-1: KETIKA {{trigger}}, SISTEM HARUS {{response}}.
- AC-01-2: JIKA {{condition}}, MAKA SISTEM HARUS {{response}}.
- AC-01-3: SELAMA {{state}}, SISTEM HARUS {{response}}.

**Kasus tepi:** {{edge_cases}}

## 5. Kebutuhan Non-fungsional <!-- QUA-*, DAT-05, VIS-06 -->
| Aspek | Kebutuhan terukur |
|---|---|
| Performa | {{QUA-01}} |
| Skala | {{VIS-06}} |
| Keamanan | {{QUA-03}} |
| Data sensitif | {{DAT-05}} |
| SEO | {{QUA-04}} |
| Offline | {{QUA-05}} |
| Aksesibilitas | {{DES-08}} |
| Bahasa | {{DES-06}} |

## 6. Di Luar Lingkup (TIDAK dikerjakan)
<!-- Semua fitur "Won't" dan "Could" + hal yang eksplisit ditolak. AI DILARANG mengerjakan ini. -->
- {{out_of_scope}}

## 7. Pertanyaan Terbuka & Asumsi
| ID | Pertanyaan / Asumsi | Status |
|---|---|---|
| Q-01 | {{question}} | Terbuka |

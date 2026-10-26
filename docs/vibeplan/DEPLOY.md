# Deploy: VibePlan

> Produksi: **https://vibeplan.emha.web.id**, situs statis yang dilayani nginx di VPS sendiri (ADR-006).
> Tidak ada proses Node yang berjalan di server; Node hanya dipakai untuk build.

## 1. Prasyarat di VPS
| Kebutuhan | Cek | Catatan |
|---|---|---|
| Node 22 | `node -v` | Sesuai `.nvmrc`. Dengan nvm: `nvm install && nvm use` di root repo |
| pnpm 10 | `pnpm -v` | `corepack enable` memakai versi dari `packageManager` di `package.json` |
| nginx | `nginx -v` | Sudah terpasang |
| rsync | `rsync --version` | `sudo apt install rsync` jika belum ada |
| certbot + plugin nginx | `certbot --version` | `sudo apt install certbot python3-certbot-nginx` |
| DNS | `dig +short vibeplan.emha.web.id` | Record A (dan AAAA jika ada IPv6) mengarah ke IP VPS |
| Firewall | port 80 dan 443 terbuka | Diperlukan certbot dan pengunjung |

## 2. Ambil kode (sekali)
```bash
git clone https://github.com/nshidayatullah/vibeengineering.git ~/vibeplan
cd ~/vibeplan
git checkout main
```

## 3. Pasang konfigurasi nginx (sekali)
```bash
sudo cp deploy/nginx-vibeplan.conf /etc/nginx/sites-available/vibeplan
sudo ln -s /etc/nginx/sites-available/vibeplan /etc/nginx/sites-enabled/vibeplan
sudo nginx -t && sudo systemctl reload nginx
```
Konfigurasi ini hanya menambah satu `server` untuk `vibeplan.emha.web.id`, jadi situs lain di VPS (misal Grafana) tidak tersentuh. Jika VPS tidak punya IPv6, hapus baris `listen [::]:80;`.

## 4. Build dan rilis
```bash
./deploy/deploy.sh
```
Skrip ini menarik `main` terbaru, menjalankan lint, cek tipe, tes, dan build, lalu menyalin `dist/` ke `/var/www/vibeplan`. Jika ada langkah yang gagal, skrip berhenti dan situs yang sedang berjalan tidak berubah. Folder tujuan bisa diganti dengan `VIBEPLAN_TARGET=/path ./deploy/deploy.sh`.

Setelah rilis pertama, aktifkan HTTPS (sekali):
```bash
sudo certbot --nginx -d vibeplan.emha.web.id
```
Certbot menambah blok `listen 443` dan pengalihan dari HTTP, lalu memperpanjang sertifikat otomatis.

Untuk rilis berikutnya, cukup jalankan `./deploy/deploy.sh` lagi.

## 5. Cek setelah deploy
```bash
curl -sI https://vibeplan.emha.web.id/ | grep -iE 'HTTP|cache-control|content-security'
curl -sI https://vibeplan.emha.web.id/rute/apa/saja | head -1     # harus 200 (fallback SPA)
```
Lalu di browser:
1. Buka https://vibeplan.emha.web.id, isi nama proyek, klik **Mulai wawancara**.
2. Jawab beberapa pertanyaan, klik **Ke ringkasan**, lalu buat paket.
3. Klik **Unduh ZIP**. File `<nama-proyek>-vibeplan.zip` harus terunduh.
4. Muat ulang halaman. Jawaban harus tetap ada (localStorage).
5. Buka DevTools → Console. Tidak boleh ada error, termasuk pelanggaran Content-Security-Policy.

## 6. Kembali ke versi sebelumnya
```bash
git checkout <sha-lama>
pnpm install --frozen-lockfile && pnpm build
sudo rsync -a --delete dist/ /var/www/vibeplan/
git checkout main
```

## 7. Service klarifikasi AI (`vibeplan-ai`, sekali)
Fitur klarifikasi AI (PRD F-11) butuh service kecil yang memanggil 9router. Tanpa langkah ini situs tetap jalan, hanya pilihan AI yang tidak muncul.

1. Pastikan Node ≥ 22.18 (`node -v`) dan catat path-nya (`command -v node`). Jika bukan `/usr/bin/node`, ubah `ExecStart` di `deploy/vibeplan-ai.service`.
2. Isi konfigurasi (key hanya ada di file ini, mode 600):
   ```bash
   sudo install -m 600 -o root -g root deploy/vibeplan-ai.env.example /etc/vibeplan-ai.env
   sudo nano /etc/vibeplan-ai.env   # isi VIBEPLAN_AI_UPSTREAM, VIBEPLAN_AI_KEY, VIBEPLAN_AI_MODEL
   ```
3. Salin kode dan pasang unit systemd:
   ```bash
   sudo mkdir -p /opt/vibeplan-ai
   sudo rsync -a --delete --exclude '*.test.ts' server/ /opt/vibeplan-ai/
   sudo cp deploy/vibeplan-ai.service /etc/systemd/system/
   sudo systemctl daemon-reload && sudo systemctl enable --now vibeplan-ai
   curl -s http://127.0.0.1:8787/api/ai/health          # {"ok":true}
   ```
4. Tambahkan ke nginx. Certbot sudah mengubah `/etc/nginx/sites-available/vibeplan`, jadi **jangan menimpa file itu**; sisipkan saja:
   - baris `limit_req_zone ... zone=vibeplan_ai ...` di paling atas file (di luar blok `server`);
   - blok `location /api/ai/ { ... }` di dalam blok `server` yang `listen 443`.
   Salin keduanya dari `deploy/nginx-vibeplan.conf`, lalu `sudo nginx -t && sudo systemctl reload nginx`.
5. Uji:
   ```bash
   curl -s https://vibeplan.emha.web.id/api/ai/health
   curl -s -X POST https://vibeplan.emha.web.id/api/ai/clarify -H 'Content-Type: application/json' \
     -d '{"projectName":"Servis AC","idea":"Aplikasi pemesanan servis AC untuk teknisi freelance di Bandung."}'
   journalctl -u vibeplan-ai -n 20 --no-pager
   ```

Rilis berikutnya: `./deploy/deploy.sh` ikut menyalin `server/` dan me-restart `vibeplan-ai` jika unitnya terpasang.

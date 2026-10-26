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

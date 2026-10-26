#!/usr/bin/env bash
# Build VibePlan dari branch main lalu salin hasilnya ke folder yang dilayani nginx.
# Jalankan di VPS dari root repo: ./deploy/deploy.sh
set -euo pipefail

TARGET="${VIBEPLAN_TARGET:-/var/www/vibeplan}"

git fetch origin main
git checkout main
git pull --ff-only origin main

pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# Salin isi dist/ ke folder nginx. --delete membuang aset build lama.
sudo mkdir -p "$TARGET"
sudo rsync -a --delete dist/ "$TARGET/"

# Service klarifikasi AI (opsional): hanya diperbarui jika unit systemd sudah dipasang (DEPLOY.md §7).
AI_DIR="${VIBEPLAN_AI_DIR:-/opt/vibeplan-ai}"
if [ -f /etc/systemd/system/vibeplan-ai.service ]; then
  sudo mkdir -p "$AI_DIR"
  sudo rsync -a --delete --exclude '*.test.ts' server/ "$AI_DIR/"
  sudo systemctl restart vibeplan-ai
  echo "vibeplan-ai diperbarui di $AI_DIR"
fi

echo "Deploy selesai: $(git rev-parse --short HEAD) → $TARGET"

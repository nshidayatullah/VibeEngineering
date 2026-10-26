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

echo "Deploy selesai: $(git rev-parse --short HEAD) → $TARGET"

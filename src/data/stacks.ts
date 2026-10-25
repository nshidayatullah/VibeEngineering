/**
 * Versi mayor yang dikunci untuk paket hasil. Versi persis dicatat agen dari lockfile di T-001.
 * Perbarui tabel ini (dan tanggalnya) saat versi mayor baru dirilis.
 */
export const STACK_VERSIONS_DATE = "Oktober 2026";

export interface TechInfo {
  name: string;
  version: string;
  why: string;
}

export const FRAMEWORKS: Record<string, TechInfo> = {
  next: {
    name: "Next.js (App Router)",
    version: "16.x",
    why: "Full-stack React, paling dikenal AI agent",
  },
  nuxt: { name: "Nuxt", version: "4.x", why: "Full-stack Vue dengan konvensi kuat" },
  sveltekit: { name: "SvelteKit", version: "3.x", why: "Ringan, sedikit boilerplate" },
  laravel: {
    name: "Laravel + Inertia (React)",
    version: "Laravel 13.x, Inertia 3.x",
    why: "Ekosistem PHP lengkap",
  },
  astro: { name: "Astro", version: "7.x", why: "HTML statis, sangat cepat, SEO baik" },
  vite: {
    name: "React + Vite (SPA)",
    version: "React 19.x, Vite 8.x",
    why: "SPA sederhana tanpa server rendering",
  },
};

export const BACKENDS: Record<string, TechInfo> = {
  integrated: {
    name: "Server actions / API routes bawaan framework",
    version: "-",
    why: "Satu codebase, satu deploy",
  },
  node: {
    name: "Hono (Node.js)",
    version: "Hono 4.x, Node.js 22 LTS",
    why: "API TypeScript ringan",
  },
  python: {
    name: "FastAPI",
    version: "FastAPI 0.12x, Python 3.13",
    why: "API Python dengan validasi Pydantic",
  },
  laravel: { name: "Laravel", version: "13.x", why: "Backend PHP lengkap" },
  go: { name: "Go (net/http + chi)", version: "Go 1.25", why: "Biner tunggal, performa tinggi" },
  baas: {
    name: "Supabase (BaaS)",
    version: "supabase-js 2.x",
    why: "Auth, database, storage siap pakai",
  },
};

export const DATABASES: Record<string, TechInfo> = {
  postgres: { name: "PostgreSQL", version: "17", why: "Relasional, andal, banyak hosting" },
  mysql: { name: "MySQL", version: "8.4 LTS", why: "Pasangan umum Laravel/PHP" },
  sqlite: { name: "SQLite", version: "3.x", why: "Tanpa server database, cocok skala kecil" },
  mongodb: { name: "MongoDB", version: "8.x", why: "Dokumen fleksibel" },
  supabase: {
    name: "Supabase (PostgreSQL terkelola)",
    version: "PostgreSQL 17",
    why: "Postgres + auth + storage terkelola",
  },
  firestore: { name: "Firebase Firestore", version: "-", why: "NoSQL terkelola, real-time bawaan" },
};

export const ORMS: Record<string, TechInfo> = {
  prisma: { name: "Prisma", version: "7.x", why: "Skema deklaratif, migrasi otomatis" },
  drizzle: {
    name: "Drizzle ORM + drizzle-kit",
    version: "0.4x",
    why: "Skema TypeScript eksplisit, SQL-like",
  },
  eloquent: { name: "Eloquent", version: "bawaan Laravel", why: "ORM bawaan Laravel" },
  sqlalchemy: { name: "SQLAlchemy + Alembic", version: "2.x", why: "ORM standar Python" },
  sql: { name: "SQL langsung (driver resmi)", version: "-", why: "Kontrol penuh atas query" },
};

export const HOSTING: Record<string, string> = {
  vercel: "Vercel",
  netlify: "Netlify",
  railway: "Railway / Render",
  vps: "VPS sendiri (Docker Compose)",
  cloudflare: "Cloudflare (Pages/Workers)",
  cloud: "AWS / GCP",
};

export const UI_LIBS: Record<string, TechInfo> = {
  shadcn: {
    name: "shadcn/ui + Tailwind CSS",
    version: "Tailwind 4.x",
    why: "Komponen disalin ke repo, mudah diubah",
  },
  mui: { name: "Material UI", version: "9.x", why: "Komponen lengkap bergaya Material" },
  mantine: { name: "Mantine", version: "9.x", why: "Komponen & hooks lengkap" },
  chakra: { name: "Chakra UI", version: "3.x", why: "Komponen aksesibel berbasis props" },
  tailwind: {
    name: "Tailwind CSS (komponen sendiri)",
    version: "4.x",
    why: "Kontrol penuh tanpa pustaka",
  },
};

export const AUTH_LIBS: Record<string, TechInfo> = {
  next: {
    name: "Better Auth",
    version: "1.x",
    why: "Auth TypeScript self-hosted, mendukung email & OAuth",
  },
  nuxt: { name: "Better Auth", version: "1.x", why: "Auth TypeScript self-hosted" },
  sveltekit: { name: "Better Auth", version: "1.x", why: "Auth TypeScript self-hosted" },
  vite: { name: "Better Auth (di backend)", version: "1.x", why: "Auth TypeScript self-hosted" },
  astro: { name: "Better Auth", version: "1.x", why: "Auth TypeScript self-hosted" },
  laravel: {
    name: "Laravel Breeze / Socialite",
    version: "bawaan Laravel",
    why: "Starter kit resmi Laravel",
  },
  python: { name: "FastAPI Users", version: "14.x", why: "Auth siap pakai untuk FastAPI" },
  go: { name: "Sesi cookie + golang.org/x/oauth2", version: "-", why: "Tanpa framework auth" },
  baas: { name: "Supabase Auth", version: "bawaan Supabase", why: "Sudah termasuk di Supabase" },
};

export interface Commands {
  install: string;
  dev: string;
  lint: string;
  typecheck: string;
  test: string;
  build: string;
  migrate: string;
  dbSetup: string;
}

export function commandsFor(lang: string, framework: string, orm: string, db: string): Commands {
  const migrate =
    {
      prisma: "pnpm prisma migrate dev",
      drizzle: "pnpm drizzle-kit migrate",
      eloquent: "php artisan migrate",
      sqlalchemy: "uv run alembic upgrade head",
      sql: "jalankan file di migrations/ berurutan (lihat README)",
    }[orm] ?? (db === "firestore" || db === "mongodb" ? "tidak ada migrasi (skema di kode)" : "-");

  if (lang === "php" || framework === "laravel") {
    return {
      install: "composer install && npm install",
      dev: "composer run dev",
      lint: "./vendor/bin/pint --test",
      typecheck: "./vendor/bin/phpstan analyse",
      test: "php artisan test",
      build: "npm run build",
      migrate,
      dbSetup: "php artisan migrate --seed",
    };
  }
  if (lang === "python") {
    return {
      install: "uv sync",
      dev: "uv run fastapi dev app/main.py",
      lint: "uv run ruff check .",
      typecheck: "uv run mypy app",
      test: "uv run pytest",
      build: "docker build -t app .",
      migrate,
      dbSetup: "uv run alembic upgrade head",
    };
  }
  if (lang === "go") {
    return {
      install: "go mod download",
      dev: "go run ./cmd/server",
      lint: "golangci-lint run",
      typecheck: "go vet ./...",
      test: "go test ./...",
      build: "go build -o bin/server ./cmd/server",
      migrate,
      dbSetup: migrate,
    };
  }
  return {
    install: "pnpm install",
    dev: "pnpm dev",
    lint: "pnpm lint",
    typecheck: lang === "js" ? "pnpm lint  # JavaScript: tidak ada cek tipe" : "pnpm typecheck",
    test: "pnpm test",
    build: "pnpm build",
    migrate,
    dbSetup: migrate.startsWith("pnpm") ? migrate : "pnpm db:setup",
  };
}

export const SCHEMA_PATH: Record<string, string> = {
  prisma: "prisma/schema.prisma",
  drizzle: "src/server/db/schema.ts",
  eloquent: "database/migrations/",
  sqlalchemy: "app/models.py",
  sql: "migrations/",
};

export const COLORS: Record<string, { light: string; dark: string }> = {
  blue: { light: "#2563EB", dark: "#60A5FA" },
  green: { light: "#16A34A", dark: "#4ADE80" },
  purple: { light: "#7C3AED", dark: "#A78BFA" },
  orange: { light: "#EA580C", dark: "#FB923C" },
  red: { light: "#DC2626", dark: "#F87171" },
  neutral: { light: "#171717", dark: "#FAFAFA" },
};

export const STYLE_PRESETS: Record<
  string,
  { font: string; radius: string; shadow: string; tone: string }
> = {
  minimal: {
    font: "Inter",
    radius: "8px (kartu 12px)",
    shadow: "hampir tanpa bayangan; pakai border",
    tone: "ringkas dan netral",
  },
  corporate: {
    font: "IBM Plex Sans",
    radius: "6px",
    shadow: "lembut (0 1px 2px)",
    tone: 'formal, memakai "Anda"',
  },
  playful: {
    font: "Nunito",
    radius: "16px",
    shadow: "sedang dan berwarna",
    tone: 'santai, memakai "kamu"',
  },
  luxury: {
    font: "Playfair Display (judul) + Inter (isi)",
    radius: "2px",
    shadow: "sangat tipis",
    tone: "elegan dan tenang",
  },
  brand: {
    font: "font brand (isi di §9 Referensi)",
    radius: "ikuti brand",
    shadow: "ikuti brand",
    tone: "ikuti panduan brand",
  },
};

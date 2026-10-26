import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  // Dev lokal: jalankan service dengan `pnpm ai:dev` agar fitur AI muncul.
  server: { proxy: { "/api/ai": "http://127.0.0.1:8787" } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "server/**/*.test.ts"],
  },
});

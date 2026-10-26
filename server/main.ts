// vibeplan-ai: service kecil di belakang nginx yang memanggil 9router (klarifikasi awal & saran per tahap).
// Jalankan: node server/main.ts (Node ≥ 22.18, tanpa dependensi npm). Konfigurasi lewat env.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  type FetchFn,
  type HandlerResult,
  handleClarify,
  type ModelConfig,
  RateLimiter,
} from "./clarify.ts";
import { handleSuggest } from "./suggest.ts";

const env = (name: string, fallback?: string): string => {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") throw new Error(`Env ${name} wajib diisi`);
  return v;
};

const cfg: ModelConfig = {
  upstream: env("VIBEPLAN_AI_UPSTREAM", "http://127.0.0.1:20128/v1"),
  apiKey: process.env.VIBEPLAN_AI_KEY ?? "",
  model: env("VIBEPLAN_AI_MODEL"),
  maxTokens: Number(env("VIBEPLAN_AI_MAX_TOKENS", "1200")),
  timeoutMs: Number(env("VIBEPLAN_AI_TIMEOUT_MS", "40000")),
  temperature: Number(env("VIBEPLAN_AI_TEMPERATURE", "0.2")),
  jsonMode: process.env.VIBEPLAN_AI_JSON_MODE === "1",
};
const host = env("VIBEPLAN_AI_HOST", "127.0.0.1");
const port = Number(env("VIBEPLAN_AI_PORT", "8787"));
const limiter = new RateLimiter(
  Number(env("VIBEPLAN_AI_RATE_MINUTE", "10")),
  Number(env("VIBEPLAN_AI_RATE_DAY", "150")),
);
const MAX_BODY = 32 * 1024;

type Handler = (raw: unknown, cfg: ModelConfig, fetchFn: FetchFn) => Promise<HandlerResult>;
const ROUTES: Record<string, Handler> = {
  "/api/ai/clarify": handleClarify,
  "/api/ai/suggest": handleSuggest,
};

const send = (res: ServerResponse, status: number, body: Record<string, unknown>) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
};

const readBody = (req: IncomingMessage): Promise<string | null> =>
  new Promise((resolve) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        resolve(null);
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(null));
  });

const server = createServer(async (req, res) => {
  const started = Date.now();
  const path = (req.url ?? "").split("?")[0] ?? "";
  const handler = req.method === "POST" ? ROUTES[path] : undefined;
  // Service hanya mendengar 127.0.0.1, jadi X-Real-IP selalu diisi nginx.
  const ip = String(req.headers["x-real-ip"] ?? req.socket.remoteAddress ?? "-");
  let status = 404;
  try {
    if (req.method === "GET" && path === "/api/ai/health") {
      status = 200;
      send(res, status, { ok: true });
    } else if (handler) {
      if (!String(req.headers["content-type"] ?? "").startsWith("application/json")) {
        status = 415;
        send(res, status, { error: "bad_request" });
      } else if (!limiter.allow(ip)) {
        status = 429;
        send(res, status, { error: "rate_limited" });
      } else {
        const text = await readBody(req);
        let raw: unknown;
        try {
          raw = text === null ? undefined : JSON.parse(text);
        } catch {
          raw = undefined;
        }
        const result = await handler(raw, cfg, fetch);
        status = result.status;
        send(res, status, result.body);
      }
    } else send(res, status, { error: "not_found" });
  } catch {
    status = 500;
    if (!res.headersSent) send(res, status, { error: "internal" });
  }
  // Isi ide tidak pernah dicatat.
  console.log(JSON.stringify({ path, status, ms: Date.now() - started }));
});

server.listen(port, host, () => {
  console.log(`vibeplan-ai mendengar di http://${host}:${port} → ${cfg.upstream} (${cfg.model})`);
});

import { describe, expect, it } from "vitest";
import {
  askModel,
  buildMessages,
  type FetchFn,
  handleClarify,
  looksEnglish,
  type ModelConfig,
  parseClarifyRequest,
  parseModelQuestions,
  RateLimiter,
  removeTrailingCommas,
} from "./clarify.ts";

const cfg: ModelConfig = {
  upstream: "http://router.test/v1/",
  apiKey: "rahasia",
  model: "vibeplan",
  maxTokens: 500,
  timeoutMs: 1000,
  temperature: 0.2,
  jsonMode: false,
};

const IDEA = "Aplikasi pemesanan servis AC untuk teknisi freelance di Bandung.";

const reply = (questions: unknown) =>
  JSON.stringify({ choices: [{ message: { content: JSON.stringify({ questions }) } }] });

const q = (text: string, options: string[], type = "single") => ({ text, type, options });
const THREE = [
  q("Siapa yang menetapkan harga servis?", ["Teknisi", "Admin", "Harga tetap"]),
  q("Bagaimana pelanggan membayar?", ["Tunai", "Transfer"], "multi"),
  q("Apakah ada garansi servis?", ["Ya, 30 hari", "Tidak"]),
];

describe("parseClarifyRequest", () => {
  it("menerima nama dan ide valid lalu merapikan spasi", () => {
    expect(parseClarifyRequest({ projectName: "  Servis\tAC ", idea: IDEA })).toEqual({
      ok: true,
      value: { projectName: "Servis AC", idea: IDEA },
    });
  });

  it("menolak masukan rusak, nama kosong, dan ide terlalu pendek atau panjang", () => {
    expect(parseClarifyRequest(null)).toEqual({ ok: false, error: "bad_request" });
    expect(parseClarifyRequest({ projectName: 1, idea: IDEA }).ok).toBe(false);
    expect(parseClarifyRequest({ projectName: " ", idea: IDEA })).toEqual({
      ok: false,
      error: "bad_name",
    });
    expect(parseClarifyRequest({ projectName: "A", idea: "pendek" })).toEqual({
      ok: false,
      error: "bad_idea",
    });
    expect(parseClarifyRequest({ projectName: "A", idea: "x".repeat(2001) }).ok).toBe(false);
  });
});

describe("buildMessages", () => {
  it("menaruh data pengguna sebagai JSON di pesan user, bukan di system prompt", () => {
    const [system, user] = buildMessages({ projectName: "Servis AC", idea: IDEA });
    expect(system?.role).toBe("system");
    expect(system?.content).not.toContain(IDEA);
    expect(user?.content).toContain(JSON.stringify(IDEA));
  });
});

describe("parseModelQuestions", () => {
  it("memberi ID stabil dan menerima JSON yang dibungkus blok kode", () => {
    const r = parseModelQuestions(
      `Berikut:\n\`\`\`json\n${JSON.stringify({ questions: THREE })}\n\`\`\``,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.map((x) => x.id)).toEqual(["K-01", "K-02", "K-03"]);
    expect(r.value[0]?.options.map((o) => o.id)).toEqual(["K-01-a", "K-01-b", "K-01-c"]);
    expect(r.value[1]?.type).toBe("multi");
  });

  it("membuang pertanyaan yang opsinya kurang dari 2, opsi ganda, dan memotong ke 5 pertanyaan", () => {
    const r = parseModelQuestions(
      JSON.stringify({
        questions: [q("Satu opsi saja?", ["Ya"]), q("Ganda?", ["A", "A", "B"]), ...THREE, ...THREE],
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(5);
    expect(r.value[0]?.text).toBe("Ganda?");
    expect(r.value[0]?.options.map((o) => o.label)).toEqual(["A", "B"]);
  });

  it("menolak jawaban yang bukan JSON atau kurang dari 3 pertanyaan", () => {
    expect(parseModelQuestions("maaf, saya tidak bisa").ok).toBe(false);
    expect(parseModelQuestions(JSON.stringify({ questions: THREE.slice(0, 2) })).ok).toBe(false);
  });
});

describe("JSON berisik dari model", () => {
  it("menghapus koma di akhir objek/array tanpa menyentuh isi string", () => {
    expect(removeTrailingCommas('{"a":["x, ]","y",],}')).toBe('{"a":["x, ]","y"]}');
    expect(removeTrailingCommas('{"a":"kutip \\" ,}"  ,\n}')).toBe('{"a":"kutip \\" ,}"  \n}');
  });

  it("menerima jawaban model dengan koma di akhir", () => {
    const noisy = `{"questions":[${THREE.map((x) => `{"text":${JSON.stringify(x.text)},"type":"${x.type}","options":[${x.options.map((o) => JSON.stringify(o)).join(",")},],}`).join(",")},]}`;
    expect(() => JSON.parse(noisy)).toThrow();
    expect(parseModelQuestions(noisy).ok).toBe(true);
  });
});

describe("bahasa jawaban model", () => {
  it("mengenali teks Inggris tanpa salah menandai teks Indonesia berisi istilah teknis", () => {
    expect(looksEnglish("Who is the target customer? What do you want to sell to them?")).toBe(
      true,
    );
    expect(
      looksEnglish("Siapa yang menentukan harga servis? Admin atau teknisi lewat dashboard"),
    ).toBe(false);
  });

  it("menolak pertanyaan berbahasa Inggris agar dicoba ulang", () => {
    const en = [
      q("Who is the target customer for this app?", ["Homeowner", "Rental manager"]),
      q("How do you want to handle the payment?", ["Cash", "Transfer"]),
      q("What is the main problem that you solve?", ["Slow booking", "No reviews"]),
    ];
    expect(parseModelQuestions(JSON.stringify({ questions: en }))).toEqual({
      ok: false,
      error: "bad_model",
    });
  });
});

describe("RateLimiter", () => {
  it("membatasi per menit dan per hari, per IP", () => {
    let t = 0;
    const rl = new RateLimiter(2, 3, () => t);
    expect([rl.allow("a"), rl.allow("a"), rl.allow("a")]).toEqual([true, true, false]);
    expect(rl.allow("b")).toBe(true);
    t = 60_000;
    expect([rl.allow("a"), rl.allow("a")]).toEqual([true, false]);
    t = 86_400_000;
    expect(rl.allow("a")).toBe(true);
  });
});

describe("handleClarify", () => {
  const ok = { projectName: "Servis AC", idea: IDEA };

  it("memanggil chat/completions dengan model dan key dari konfigurasi server", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn: FetchFn = async (url, init) => {
      calls.push({ url, init });
      return new Response(reply(THREE));
    };
    const r = await handleClarify(ok, cfg, fetchFn);
    expect(r.status).toBe(200);
    expect(r.body.questions).toHaveLength(3);
    expect(calls[0]?.url).toBe("http://router.test/v1/chat/completions");
    expect((calls[0]?.init.headers as Record<string, string> | undefined)?.Authorization).toBe(
      "Bearer rahasia",
    );
    const body = JSON.parse(String(calls[0]?.init.body));
    expect(body.model).toBe("vibeplan");
    expect(body.max_tokens).toBe(500);
    expect(body.temperature).toBe(0.2);
    expect(body.response_format).toBeUndefined();
  });

  it("mengirim response_format hanya jika jsonMode aktif", async () => {
    let sent: Record<string, unknown> = {};
    await handleClarify(ok, { ...cfg, jsonMode: true }, async (_url, init) => {
      sent = JSON.parse(String(init.body));
      return new Response(reply(THREE));
    });
    expect(sent.response_format).toEqual({ type: "json_object" });
  });

  it("menolak masukan tidak valid tanpa memanggil 9router", async () => {
    let called = false;
    const r = await handleClarify({ projectName: "A", idea: "" }, cfg, async () => {
      called = true;
      return new Response("");
    });
    expect(r).toEqual({ status: 400, body: { error: "bad_idea" } });
    expect(called).toBe(false);
  });

  it("mencoba ulang sekali jika jawaban model tidak valid", async () => {
    let n = 0;
    const r = await handleClarify(ok, cfg, async () => {
      n += 1;
      return new Response(
        n === 1
          ? JSON.stringify({ choices: [{ message: { content: "bukan json" } }] })
          : reply(THREE),
      );
    });
    expect(n).toBe(2);
    expect(r.status).toBe(200);
  });

  it("tidak mencoba ulang jika percobaan pertama sudah memakan lebih dari setengah timeout", async () => {
    let t = 0;
    let calls = 0;
    const r = await askModel(
      cfg,
      [],
      async () => {
        calls += 1;
        t += 600;
        return new Response(JSON.stringify({ choices: [{ message: { content: "x" } }] }));
      },
      () => ({ ok: false, error: "bad_model" }),
      () => t,
    );
    expect(calls).toBe(1);
    expect(r).toEqual({ ok: false, error: "bad_model" });
  });

  it("mengembalikan 502 jika 9router error dan 504 jika timeout", async () => {
    expect(
      (await handleClarify(ok, cfg, async () => new Response("x", { status: 500 }))).status,
    ).toBe(502);
    const timeout = await handleClarify(ok, cfg, async () => {
      throw new DOMException("t", "TimeoutError");
    });
    expect(timeout).toEqual({ status: 504, body: { error: "timeout" } });
  });
});

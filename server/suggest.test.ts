import { describe, expect, it } from "vitest";
import type { ModelConfig } from "./clarify.ts";
import {
  buildSuggestMessages,
  handleSuggest,
  parseSuggestions,
  parseSuggestRequest,
  type SuggestQuestion,
} from "./suggest.ts";

const cfg: ModelConfig = {
  upstream: "http://router.test/v1",
  apiKey: "",
  model: "m",
  maxTokens: 500,
  timeoutMs: 1000,
  temperature: 0.2,
  jsonMode: false,
};

const QUESTIONS: SuggestQuestion[] = [
  {
    id: "VIS-01",
    text: "Jenis aplikasi?",
    type: "single",
    options: [
      { id: "booking", label: "Booking" },
      { id: "ecommerce", label: "Toko online" },
    ],
  },
  {
    id: "FEA-01",
    text: "Fitur inti?",
    type: "multi",
    options: [
      { id: "calendar", label: "Kalender" },
      { id: "payment", label: "Pembayaran" },
      { id: "chat", label: "Chat" },
    ],
  },
];

const REQUEST = {
  projectName: "Servis AC",
  idea: "Pemesanan servis AC untuk teknisi freelance di Bandung.",
  context: [{ q: "Siapa yang menetapkan harga?", a: "Admin" }],
  questions: QUESTIONS,
};

const reply = (suggestions: unknown) =>
  new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify({ suggestions }) } }] }),
  );

describe("parseSuggestRequest", () => {
  it("menerima permintaan valid", () => {
    const r = parseSuggestRequest(REQUEST);
    expect(r.ok).toBe(true);
  });

  it("menolak pertanyaan kosong, ID aneh, opsi kurang dari 2, atau ID ganda", () => {
    expect(parseSuggestRequest({ ...REQUEST, questions: [] })).toEqual({
      ok: false,
      error: "bad_questions",
    });
    const [vis] = QUESTIONS;
    if (!vis) throw new Error("fixture");
    for (const bad of [
      { ...vis, id: "VIS 01" },
      { ...vis, options: [{ id: "a", label: "A" }] },
      { ...vis, type: "priority" },
    ])
      expect(parseSuggestRequest({ ...REQUEST, questions: [bad] }).ok).toBe(false);
    expect(parseSuggestRequest({ ...REQUEST, questions: [vis, vis] }).ok).toBe(false);
  });

  it("menolak jika tidak ada ide maupun konteks", () => {
    expect(parseSuggestRequest({ ...REQUEST, idea: "", context: [] })).toEqual({
      ok: false,
      error: "bad_idea",
    });
  });
});

describe("buildSuggestMessages", () => {
  it("menaruh data pengguna dan opsi sebagai JSON di pesan user", () => {
    const req = parseSuggestRequest(REQUEST);
    if (!req.ok) throw new Error("fixture");
    const [system, user] = buildSuggestMessages(req.value);
    expect(system?.content).not.toContain("Bandung");
    expect(user?.content).toContain('"id":"calendar"');
    expect(user?.content).toContain("Siapa yang menetapkan harga?");
  });
});

describe("parseSuggestions", () => {
  it("membuang opsi dan pertanyaan yang tidak dikirim, memotong single ke satu opsi", () => {
    const r = parseSuggestions(
      JSON.stringify({
        suggestions: [
          { id: "VIS-01", optionIds: ["booking", "ecommerce"], reason: "Pemesanan jadwal teknisi" },
          { id: "FEA-01", optionIds: ["calendar", "hack", "calendar"], reason: 3 },
          { id: "XXX-01", optionIds: ["a"], reason: "-" },
        ],
      }),
      QUESTIONS,
    );
    expect(r).toEqual({
      ok: true,
      value: [
        { id: "VIS-01", optionIds: ["booking"], reason: "Pemesanan jadwal teknisi" },
        { id: "FEA-01", optionIds: ["calendar"], reason: "" },
      ],
    });
  });

  it("gagal jika tidak ada saran yang valid", () => {
    expect(
      parseSuggestions(
        JSON.stringify({ suggestions: [{ id: "VIS-01", optionIds: ["x"] }] }),
        QUESTIONS,
      ).ok,
    ).toBe(false);
  });
});

describe("handleSuggest", () => {
  it("mengembalikan saran yang sudah divalidasi", async () => {
    const r = await handleSuggest(REQUEST, cfg, async () =>
      reply([{ id: "FEA-01", optionIds: ["calendar", "payment"], reason: "Jadwal & bayar" }]),
    );
    expect(r).toEqual({
      status: 200,
      body: {
        suggestions: [
          { id: "FEA-01", optionIds: ["calendar", "payment"], reason: "Jadwal & bayar" },
        ],
      },
    });
  });

  it("menolak permintaan tidak valid tanpa memanggil 9router", async () => {
    let called = false;
    const r = await handleSuggest({ ...REQUEST, questions: "x" }, cfg, async () => {
      called = true;
      return reply([]);
    });
    expect(r.status).toBe(400);
    expect(called).toBe(false);
  });
});

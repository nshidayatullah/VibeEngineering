import { describe, expect, it } from "vitest";
import { answer, base } from "../test/fixtures";
import { setClarifications } from "./clarify";
import { accessor } from "./resolve";
import { applySuggestions, buildSuggestPayload, modelSuggestionCount } from "./suggest";

const IDEA = "Pemesanan servis AC untuk teknisi freelance di Bandung.";

describe("buildSuggestPayload", () => {
  it("mengirim pertanyaan tahap ini yang belum dijawab pengguna, dengan opsi yang berlaku", () => {
    const s = answer(base("Servis AC", IDEA), { "VIS-02": ["b2c"] });
    const p = buildSuggestPayload(s, "visi");
    const ids = p.questions.map((q) => q.id);
    expect(ids).toContain("VIS-01");
    expect(ids).not.toContain("VIS-02");
    expect(p.questions.find((q) => q.id === "VIS-01")?.options.map((o) => o.id)).toContain(
      "booking",
    );
    expect(p.questions.every((q) => q.type === "single" || q.type === "multi")).toBe(true);
  });

  it("memakai klarifikasi dan jawaban pengguna di tahap sebelumnya sebagai konteks", () => {
    const s = setClarifications(answer(base("Servis AC", IDEA), { "VIS-01": ["booking"] }), [
      {
        id: "K-01",
        text: "Siapa yang menetapkan harga?",
        type: "single",
        options: [
          { id: "K-01-a", label: "Teknisi" },
          { id: "K-01-b", label: "Admin" },
        ],
        optionIds: ["K-01-b"],
      },
    ]);
    const p = buildSuggestPayload(s, "fitur");
    expect(p.context[0]).toEqual({ q: "Siapa yang menetapkan harga?", a: "Admin" });
    expect(p.context.some((c) => c.a === "Booking / reservasi")).toBe(true);
    expect(p.questions.some((q) => q.id === "FEA-02")).toBe(false);
  });
});

describe("applySuggestions", () => {
  it("menyimpan saran sebagai rekomendasi model yang dipakai resolver", () => {
    const s = applySuggestions(base("Servis AC", IDEA), [
      { id: "VIS-01", optionIds: ["booking"], reason: "Pelanggan memesan jadwal teknisi" },
    ]);
    const r = accessor(s).resolved("VIS-01");
    expect(r.decidedBy).toBe("ai");
    expect(r.source).toBe("model");
    expect(r.optionIds).toEqual(["booking"]);
    expect(r.reason).toBe("Pelanggan memesan jadwal teknisi");
    expect(modelSuggestionCount(s, "visi")).toBe(1);
  });

  it("tidak menimpa jawaban pengguna dan membuang opsi tidak dikenal", () => {
    const start = answer(base("Servis AC", IDEA), { "VIS-01": ["tool"] });
    const s = applySuggestions(start, [
      { id: "VIS-01", optionIds: ["booking"], reason: "-" },
      { id: "VIS-02", optionIds: ["tidak-ada"], reason: "-" },
    ]);
    expect(s.answers["VIS-01"]).toEqual(start.answers["VIS-01"]);
    expect(s.answers["VIS-02"]).toBeUndefined();
  });

  it("kembali ke aturan statis jika opsi saran tidak lagi valid", () => {
    const s = applySuggestions(base("Servis AC", IDEA), [
      { id: "VIS-01", optionIds: ["booking"], reason: "-" },
    ]);
    const broken = {
      ...s,
      answers: {
        ...s.answers,
        "VIS-01": { decidedBy: "ai" as const, source: "model" as const, optionIds: ["hilang"] },
      },
    };
    expect(accessor(broken).resolved("VIS-01").source).toBe("rules");
  });
});

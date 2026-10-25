import { describe, expect, it } from "vitest";
import { QUESTION_BY_ID, QUESTIONS } from "../data/questions";
import { answer, base } from "../test/fixtures";
import { setPriority } from "./answers";
import { accessor, isAsked } from "./resolve";

describe("resolve", () => {
  it("menyembunyikan pertanyaan login jika aplikasi publik (AC-02-2)", () => {
    const a = accessor(answer(base(), { "USR-02": ["public"], "AUTH-01": ["password"] }));
    expect(a.resolved("AUTH-01").hidden).toBe(true);
    expect(a.val("AUTH-01")).toEqual([]);
  });

  it("mengisi TEC-02..08 otomatis jika TEC-01 = tentukan semuanya (AC-02-4)", () => {
    const s = answer(base(), { "TEC-01": ["all"], "TEC-02": ["nuxt"] });
    const a = accessor(s);
    const q = QUESTION_BY_ID["TEC-02"];
    expect(q && isAsked(q, a)).toBe(false);
    expect(a.resolved("TEC-02").decidedBy).toBe("ai");
    expect(a.first("TEC-02")).toBe("next");
  });

  it("hanya menanyakan framework, database, dan hosting jika TEC-01 = bagian penting", () => {
    const a = accessor(answer(base(), { "TEC-01": ["some"] }));
    const asked = QUESTIONS.filter((q) => q.stage === "teknologi" && isAsked(q, a)).map(
      (q) => q.id,
    );
    expect(asked).toEqual(["TEC-01", "TEC-02", "TEC-04", "TEC-06"]);
  });

  it("memakai rekomendasi untuk pertanyaan yang dilewati (AC-03-5)", () => {
    const r = accessor(base()).resolved("DES-02");
    expect(r.decidedBy).toBe("ai");
    expect(r.skipped).toBe(true);
    expect(r.optionIds).toEqual(["minimal"]);
    expect(r.reason).toBeTruthy();
  });

  it("menghitung ulang rekomendasi dari jawaban terbaru (AC-03-2)", () => {
    const shop = accessor(answer(base(), { "VIS-01": ["ecommerce"], "DES-04": "ai" }));
    const booking = accessor(answer(base(), { "VIS-01": ["booking"], "DES-04": "ai" }));
    expect(shop.first("DES-04")).toBe("orange");
    expect(booking.first("DES-04")).toBe("green");
  });

  it("membuang fitur yang tidak ada di katalog jenis aplikasi baru", () => {
    const s = answer(base(), { "VIS-01": ["ecommerce"], "FEA-01": ["catalog", "cart"] });
    const changed = answer(s, { "VIS-01": ["booking"] });
    const r = accessor(changed).resolved("FEA-01");
    expect(r.decidedBy).toBe("ai");
    expect(r.optionIds).not.toContain("catalog");
  });

  it("mengisi prioritas yang belum diatur dengan rekomendasi", () => {
    let s = answer(base(), { "VIS-01": ["ecommerce"], "FEA-01": ["catalog", "coupons"] });
    s = setPriority(s, "FEA-02", "coupons", "wont");
    const r = accessor(s).resolved("FEA-02");
    expect(r.priorities).toMatchObject({ catalog: "must", coupons: "wont" });
    expect(r.aiPriorityKeys).toContain("catalog");
    expect(r.aiPriorityKeys).not.toContain("coupons");
  });

  it("menampilkan PAY-01 hanya bila ada fitur transaksi", () => {
    expect(
      accessor(answer(base(), { "VIS-01": ["ecommerce"], "FEA-01": ["catalog"] })).resolved(
        "PAY-01",
      ).hidden,
    ).toBe(true);
    expect(
      accessor(answer(base(), { "VIS-01": ["ecommerce"], "FEA-01": ["checkout"] })).resolved(
        "PAY-01",
      ).hidden,
    ).toBe(false);
  });

  it("setiap rekomendasi hanya memilih opsi yang valid", () => {
    for (const app of [
      "landing",
      "ecommerce",
      "saas",
      "internal",
      "marketplace",
      "content",
      "booking",
      "tool",
    ]) {
      const a = accessor(answer(base(), { "VIS-01": [app] }));
      for (const q of QUESTIONS) {
        const r = a.resolved(q.id);
        if (!r.hidden && q.type !== "priority" && q.id !== "FEA-04")
          expect(r.optionIds.length, `${app} ${q.id}`).toBeGreaterThan(0);
      }
    }
  });
});

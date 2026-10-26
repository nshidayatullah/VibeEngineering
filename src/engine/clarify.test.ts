import { describe, expect, it } from "vitest";
import { base } from "../test/fixtures";
import { answerClarification, parseClarifications, setClarifications } from "./clarify";

const SERVER = [
  {
    id: "K-01",
    text: "Siapa yang menetapkan harga?",
    type: "single",
    options: [
      { id: "K-01-a", label: "Teknisi" },
      { id: "K-01-b", label: "Admin" },
    ],
  },
  {
    id: "K-02",
    text: "Cara bayar?",
    type: "multi",
    options: [
      { id: "K-02-a", label: "Tunai" },
      { id: "K-02-b", label: "Transfer" },
    ],
  },
];

describe("parseClarifications", () => {
  it("menerima respons server tanpa optionIds dan mengisinya kosong", () => {
    const list = parseClarifications(SERVER);
    expect(list?.map((c) => c.optionIds)).toEqual([[], []]);
  });

  it("membuang jawaban yang tidak ada di opsi dan memotong single ke satu jawaban", () => {
    const [first] = SERVER;
    const list = parseClarifications([{ ...first, optionIds: ["K-01-a", "K-01-b", "zz"] }]);
    expect(list?.[0]?.optionIds).toEqual(["K-01-a"]);
  });

  it("menolak bentuk yang salah", () => {
    expect(parseClarifications({})).toBeNull();
    expect(parseClarifications([{ ...SERVER[0], options: [{ id: 1 }] }])).toBeNull();
  });
});

describe("answerClarification", () => {
  const s = setClarifications(base(), parseClarifications(SERVER) ?? []);

  it("single: memilih satu, klik ulang membatalkan", () => {
    const a = answerClarification(s, "K-01", "K-01-a");
    expect(a.clarifications[0]?.optionIds).toEqual(["K-01-a"]);
    const b = answerClarification(a, "K-01", "K-01-b");
    expect(b.clarifications[0]?.optionIds).toEqual(["K-01-b"]);
    expect(answerClarification(b, "K-01", "K-01-b").clarifications[0]?.optionIds).toEqual([]);
  });

  it("multi: toggle tanpa mengubah state lama", () => {
    const a = answerClarification(s, "K-02", "K-02-a");
    const b = answerClarification(a, "K-02", "K-02-b");
    expect(b.clarifications[1]?.optionIds).toEqual(["K-02-a", "K-02-b"]);
    expect(answerClarification(b, "K-02", "K-02-a").clarifications[1]?.optionIds).toEqual([
      "K-02-b",
    ]);
    expect(s.clarifications[1]?.optionIds).toEqual([]);
  });
});

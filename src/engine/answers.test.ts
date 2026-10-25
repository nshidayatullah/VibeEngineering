import { describe, expect, it } from "vitest";
import { base } from "../test/fixtures";
import { chooseAi, clearAnswer, selectOption, setOtherText } from "./answers";

describe("answers", () => {
  it("single: memilih satu opsi saja (AC-02-3)", () => {
    const s = selectOption(selectOption(base(), "VIS-03", "mvp"), "VIS-03", "prototype");
    expect(s.answers["VIS-03"]?.optionIds).toEqual(["prototype"]);
  });

  it("multi: toggle opsi, dan 'none' eksklusif", () => {
    let s = selectOption(base(), "FEA-06", "email");
    s = selectOption(s, "FEA-06", "maps");
    expect(s.answers["FEA-06"]?.optionIds).toEqual(["email", "maps"]);
    s = selectOption(s, "FEA-06", "none");
    expect(s.answers["FEA-06"]?.optionIds).toEqual(["none"]);
    s = selectOption(s, "FEA-06", "email");
    expect(s.answers["FEA-06"]?.optionIds).toEqual(["email"]);
    s = selectOption(s, "FEA-06", "email");
    expect(s.answers["FEA-06"]).toBeUndefined();
  });

  it("Lainnya menyimpan teks bebas (AC-03-4)", () => {
    const s = setOtherText(base(), "DES-04", "#0F766E");
    expect(s.answers["DES-04"]).toEqual({
      decidedBy: "user",
      optionIds: ["other"],
      otherText: "#0F766E",
    });
  });

  it("AI rekomendasi dan kosongkan", () => {
    const s = chooseAi(base(), "DES-04");
    expect(s.answers["DES-04"]?.decidedBy).toBe("ai");
    expect(clearAnswer(s, "DES-04").answers["DES-04"]).toBeUndefined();
  });

  it("tidak mengubah state lama (immutable)", () => {
    const s0 = base();
    selectOption(s0, "VIS-03", "mvp");
    expect(s0.answers).toEqual({});
  });
});

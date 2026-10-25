import { describe, expect, it } from "vitest";
import { parseState } from "./persist";

describe("parseState (AC-07-2, AC-09)", () => {
  it("menerima state valid", () => {
    const s = {
      version: 1,
      projectName: "A",
      idea: "",
      answers: { "VIS-01": { decidedBy: "user", optionIds: ["tool"] } },
    };
    expect(parseState(s)).toEqual(s);
  });

  it("menolak data rusak", () => {
    expect(parseState(null)).toBeNull();
    expect(parseState({ version: 2, projectName: "A", idea: "", answers: {} })).toBeNull();
    expect(
      parseState({
        version: 1,
        projectName: "A",
        idea: "",
        answers: { x: { decidedBy: "robot", optionIds: [] } },
      }),
    ).toBeNull();
  });

  it("mengabaikan field tambahan seperti generatedAt dari file ekspor", () => {
    expect(
      parseState({
        version: 1,
        projectName: "A",
        idea: "",
        answers: {},
        generatedAt: "2026-10-25",
      }),
    ).toEqual({
      version: 1,
      projectName: "A",
      idea: "",
      answers: {},
    });
  });
});

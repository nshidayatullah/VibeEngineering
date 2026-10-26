import { describe, expect, it } from "vitest";
import { parseState } from "./persist";

const CLARIFICATION = {
  id: "K-01",
  text: "Siapa yang menetapkan harga?",
  type: "single",
  options: [
    { id: "K-01-a", label: "Teknisi" },
    { id: "K-01-b", label: "Admin" },
  ],
  optionIds: ["K-01-b"],
};

describe("parseState (AC-07-2, AC-09)", () => {
  it("menerima state valid", () => {
    const s = {
      version: 3,
      projectName: "A",
      idea: "",
      answers: { "VIS-01": { decidedBy: "user", optionIds: ["tool"] } },
      clarifications: [CLARIFICATION],
    };
    expect(parseState(s)).toEqual(s);
  });

  it("menaikkan state version 1 ke version 3 dengan klarifikasi kosong", () => {
    expect(
      parseState({
        version: 1,
        projectName: "A",
        idea: "",
        answers: { "VIS-01": { decidedBy: "user", optionIds: ["tool"] } },
      }),
    ).toEqual({
      version: 3,
      projectName: "A",
      idea: "",
      answers: { "VIS-01": { decidedBy: "user", optionIds: ["tool"] } },
      clarifications: [],
    });
  });

  it("menaikkan version 2 dan mempertahankan saran AI di jawaban", () => {
    const answers = {
      "VIS-01": { decidedBy: "ai", optionIds: ["booking"], source: "model", reason: "Jadwal" },
    };
    expect(
      parseState({ version: 2, projectName: "A", idea: "", answers, clarifications: [] }),
    ).toEqual({ version: 3, projectName: "A", idea: "", answers, clarifications: [] });
  });

  it("menolak data rusak", () => {
    expect(parseState(null)).toBeNull();
    expect(parseState({ version: 4, projectName: "A", idea: "", answers: {} })).toBeNull();
    expect(
      parseState({
        version: 1,
        projectName: "A",
        idea: "",
        answers: { x: { decidedBy: "robot", optionIds: [] } },
      }),
    ).toBeNull();
    expect(parseState({ version: 3, projectName: "A", idea: "", answers: {} })).toBeNull();
    expect(
      parseState({
        version: 3,
        projectName: "A",
        idea: "",
        answers: { x: { decidedBy: "ai", optionIds: ["a"], source: "robot" } },
        clarifications: [],
      }),
    ).toBeNull();
    expect(
      parseState({
        version: 3,
        projectName: "A",
        idea: "",
        answers: {},
        clarifications: [{ ...CLARIFICATION, type: "priority" }],
      }),
    ).toBeNull();
  });

  it("mengabaikan field tambahan seperti generatedAt dari file ekspor", () => {
    expect(
      parseState({
        version: 3,
        projectName: "A",
        idea: "",
        answers: {},
        clarifications: [],
        generatedAt: "2026-10-25",
      }),
    ).toEqual({
      version: 3,
      projectName: "A",
      idea: "",
      answers: {},
      clarifications: [],
    });
  });
});

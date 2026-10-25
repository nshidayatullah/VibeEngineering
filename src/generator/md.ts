const cell = (v: string): string => v.replace(/\|/g, "\\|").replace(/\n/g, " ");

export const table = (headers: string[], rows: string[][]): string =>
  [
    `| ${headers.map(cell).join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
    ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`),
  ].join("\n");

export const bullets = (items: string[]): string => items.map((i) => `- ${i}`).join("\n");

export const numbered = (items: string[]): string =>
  items.map((i, n) => `${n + 1}. ${i}`).join("\n");

export const code = (body: string, lang = ""): string => `\`\`\`${lang}\n${body}\n\`\`\``;

/** Menggabungkan blok dengan satu baris kosong dan menutup file dengan newline. */
export const doc = (...blocks: (string | false | undefined)[]): string =>
  `${blocks.filter((b): b is string => typeof b === "string" && b.length > 0).join("\n\n")}\n`;

export const PRIORITY_LABEL = {
  must: "Must",
  should: "Should",
  could: "Could",
  wont: "Won't",
} as const;

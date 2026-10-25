import type { FieldDef, FieldType } from "../data/entities";
import { SCHEMA_PATH } from "../data/stacks";
import { ASSUMPTION, type Plan } from "../engine/plan";
import { bullets, code, doc, table } from "./md";

const TYPE_LABEL: Record<FieldType, string> = {
  id: "id",
  text: "text",
  longtext: "text (panjang)",
  email: "text (email)",
  integer: "integer",
  money: "money",
  boolean: "boolean",
  timestamp: "timestamp",
  date: "date",
  enum: "enum",
  ref: "ref",
  json: "json",
  url: "text (URL)",
};

export function generateDataModel(p: Plan): string {
  const { a, label, stack } = p;
  const pk =
    stack.db === "mongodb" || stack.db === "firestore"
      ? "string (ID dokumen bawaan)"
      : "text (cuid2)";
  const money =
    {
      id: "integer dalam rupiah (tanpa desimal)",
      multi: "integer satuan terkecil + kolom currency (ISO 4217)",
      us: "integer dalam sen (USD)",
    }[a.first("DAT-07") ?? "id"] ?? "integer satuan terkecil";
  const tz =
    { id: "Asia/Jakarta (WIB)", multi: "zona waktu pengguna", us: "UTC" }[
      a.first("DAT-07") ?? "id"
    ] ?? "UTC";
  const del = a.first("DAT-03");
  const hist = a.first("DAT-06");
  const standard = [
    ...(hist === "none" ? [] : ["created_at", "updated_at"]),
    ...(del === "soft" ? ["deleted_at"] : []),
    ...(del === "archive" ? ["archived_at"] : []),
    ...(hist === "audit" ? ["created_by", "updated_by"] : []),
  ];
  const schemaPath =
    SCHEMA_PATH[stack.orm] ??
    (stack.db === "firestore" || stack.db === "mongodb"
      ? "src/server/db/models.ts"
      : "migrations/");
  const typeName = (f: FieldDef) =>
    f.type === "ref"
      ? `ref → ${f.ref}`
      : f.type === "money"
        ? "integer (uang)"
        : TYPE_LABEL[f.type];

  const ids = new Set(p.entities.map((e) => e.id));
  const relations: string[] = [];
  for (const e of p.entities) {
    for (const f of e.fields) {
      if (f.type === "ref" && f.ref && ids.has(f.ref))
        relations.push(`${f.ref} 1───* ${e.id}   (${e.id}.${f.name})`);
    }
  }
  if (ids.has("Tag") && ids.has("Post")) relations.push("Post *───* Tag   (tabel post_tags)");

  const entityBlocks = p.entities.flatMap((e) => {
    const rels = e.fields
      .filter((f) => f.type === "ref" && f.ref)
      .map((f) => `milik satu ${f.ref} lewat ${f.name}${f.required ? "" : " (opsional)"}`);
    const inbound = p.entities.flatMap((o) =>
      o.fields.filter((f) => f.ref === e.id).map(() => `punya banyak ${o.id}`),
    );
    return [
      `### ${e.id}`,
      `${e.label}. ${e.description}`,
      table(
        ["Field", "Tipe", "Wajib", "Unik", "Default", "Validasi / Keterangan"],
        [
          ["id", pk, "Ya", "Ya", "auto", ""],
          ...e.fields.map((f) => [
            f.name,
            typeName(f),
            f.required ? "Ya" : "Tidak",
            f.unique ? "Ya" : "Tidak",
            f.default ?? "-",
            f.rule ?? "",
          ]),
          ...standard.map((s) => [
            s,
            s.endsWith("_by") ? "ref → User" : "timestamp",
            s === "created_at" || s === "updated_at" ? "Ya" : "Tidak",
            "Tidak",
            s === "created_at" || s === "updated_at" ? "now()" : "-",
            "kolom standar",
          ]),
        ],
      ),
      `**Relasi:** ${[...rels, ...new Set(inbound)].join("; ") || "tidak ada"}`,
      `**Indeks:** ${e.indexes.join(", ") || "hanya primary key"}`,
      `**Dipakai oleh fitur:** ${e.usedBy.join(", ") || `${ASSUMPTION} belum dipetakan ke fitur`}`,
    ];
  });

  const rules = [
    ...p.entities.flatMap((e) => e.rules.map((r) => `${e.id}: ${r}`)),
    ...(del === "deactivate"
      ? ["Data tidak pernah dihapus; gunakan kolom status/is_active untuk menonaktifkan."]
      : []),
    ...(del === "soft"
      ? ["Query default selalu mengecualikan baris dengan deleted_at terisi."]
      : []),
    ...(["single_org", "multi_org"].includes(a.first("USR-03") ?? "")
      ? ["Setiap tabel milik tenant punya organization_id dan selalu difilter."]
      : []),
    "Uang tidak pernah disimpan sebagai float.",
  ];

  return doc(
    `# Model Data: ${p.name}`,
    `> Definisi resmi ada di \`${schemaPath}\`. Dokumen ini adalah rancangannya. Perubahan skema harus disetujui dan dicatat di §5.`,
    "## 1. Konvensi",
    bullets([
      `Primary key: ${pk}`,
      `Kolom standar di setiap tabel: ${standard.join(", ") || "tidak ada"} (${label("DAT-06")})`,
      `Penghapusan: ${label("DAT-03")}`,
      `Uang: ${money}`,
      `Waktu: disimpan UTC, ditampilkan ${tz}`,
      "Penamaan: tabel snake_case jamak (products), kolom snake_case",
      `Volume terbesar 1 tahun: ${label("DAT-04")}${a.first("DAT-04") === "s" ? "" : "; setiap kolom filter/sortir wajib berindeks"}`,
    ]),
    "## 2. Diagram Relasi",
    code(
      relations.length > 0
        ? relations.join("\n")
        : p.entities.map((e) => e.id).join("   ") || "Tidak ada entitas",
    ),
    "## 3. Entitas",
    ...(entityBlocks.length > 0
      ? entityBlocks
      : ["Tidak ada entitas yang disimpan (aplikasi tanpa database)."]),
    "## 4. Aturan Bisnis Data",
    bullets(rules),
    "## 5. Riwayat Perubahan Skema",
    table(
      ["Tanggal", "Perubahan", "Migrasi"],
      [[p.date, "Skema awal", stack.orm ? "0001_init" : "-"]],
    ),
  );
}

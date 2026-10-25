import { ENTITIES, type FieldDef } from "../data/entities";
import { type Access, FEATURE_BY_ID } from "../data/features";
import {
  QUESTION_BY_ID,
  QUESTIONS,
  selectedFeatureOptions,
  slugify,
  splitList,
} from "../data/questions";
import {
  AUTH_LIBS,
  BACKENDS,
  type Commands,
  commandsFor,
  DATABASES,
  FRAMEWORKS,
  HOSTING,
  ORMS,
  type TechInfo,
  UI_LIBS,
} from "../data/stacks";
import { accessor, answerLabels, OTHER } from "./resolve";
import type { Accessor, Priority, ProjectState } from "./types";

export const ASSUMPTION = "[ASUMSI]";

export interface PlanFeature {
  fid: string;
  key: string;
  label: string;
  description: string;
  priority: Priority;
  priorityAssumed: boolean;
  story: { role: string; action: string; benefit: string };
  acceptance: string[];
  /** Kriteria penerimaan dibuat generik (fitur kustom) dan wajib ditinjau. */
  acceptanceAssumed: boolean;
  edgeCases: string;
  entities: string[];
  route: { path: string; name: string; access: Access };
}

export interface PlanEntity {
  id: string;
  label: string;
  description: string;
  fields: FieldDef[];
  indexes: string[];
  rules: string[];
  custom: boolean;
  usedBy: string[];
}

export interface Stack {
  lang: string;
  framework: string;
  backend: string;
  db: string;
  orm: string;
  hosting: string;
  ui: string;
  testing: string[];
  monitoring: string[];
  info: {
    lang: TechInfo;
    framework: TechInfo;
    backend: TechInfo;
    db: TechInfo;
    orm: TechInfo | null;
    ui: TechInfo;
    auth: TechInfo | null;
    validation: TechInfo;
    styling: TechInfo;
    testing: TechInfo;
  };
  commands: Commands;
}

export interface Plan {
  a: Accessor;
  name: string;
  slug: string;
  idea: string;
  date: string;
  appType: string;
  appTypeLabel: string;
  needsLogin: boolean;
  roles: string[];
  features: PlanFeature[];
  mainFlow: PlanFeature | undefined;
  entities: PlanEntity[];
  stack: Stack;
  agents: string[];
  assumptions: { questionId: string; text: string; answer: string; reason: string }[];
  /** Label final + penanda [ASUMSI] bila diputuskan rekomendasi. */
  label: (questionId: string, fallback?: string) => string;
}

const PRIORITY_ORDER: Priority[] = ["must", "should", "could", "wont"];

export function buildPlan(state: ProjectState, date: string): Plan {
  const a = accessor(state);
  const label = (id: string, fallback = "Tidak berlaku"): string => {
    const r = a.resolved(id);
    if (r.hidden) return fallback;
    const labels = answerLabels(a, id).filter((l) => l.length > 0);
    if (labels.length === 0) return fallback;
    return labels.join(", ") + (r.decidedBy === "ai" ? ` ${ASSUMPTION}` : "");
  };

  const appType = a.first("VIS-01") ?? "tool";
  const name = state.projectName.trim() || "Proyek Tanpa Nama";
  const needsLogin = a.first("USR-02") !== "public";
  const features = buildFeatures(a, needsLogin);
  const entities = buildEntities(a, features);
  const stack = buildStack(a);
  const mainKey = a.first("FEA-03");

  const assumptions = QUESTIONS.flatMap((q) => {
    const r = a.resolved(q.id);
    if (r.hidden || r.decidedBy !== "ai" || q.type === "priority") return [];
    const answer = answerLabels(a, q.id).join(", ");
    if (!answer) return [];
    return [{ questionId: q.id, text: q.text, answer, reason: r.reason ?? "" }];
  });

  return {
    a,
    name,
    slug: slugify(name) || "proyek",
    idea: state.idea.trim(),
    date,
    appType,
    appTypeLabel: label("VIS-01"),
    needsLogin,
    roles: buildRoles(a, appType, needsLogin),
    features,
    mainFlow:
      features.find((f) => f.key === mainKey) ??
      features.find((f) => f.priority === "must" && f.key !== "auth"),
    entities,
    stack,
    agents: a.val("AIW-01").filter((x) => x !== OTHER),
    assumptions,
    label,
  };
}

function buildRoles(a: Accessor, appType: string, needsLogin: boolean): string[] {
  const base = needsLogin ? "Pengguna" : "Pengunjung";
  switch (a.first("USR-01")) {
    case "single":
      return [base];
    case "multi":
      return (
        {
          marketplace: ["Pembeli", "Penjual", "Admin"],
          content: ["Pembaca", "Penulis", "Moderator", "Admin"],
          internal: ["Staf", "Manajer", "Admin"],
          booking: ["Pelanggan", "Staf", "Admin"],
        }[appType] ?? ["Pengguna", "Editor", "Admin"]
      );
    case "custom":
      return [base, "Admin", "Peran kustom (diatur Admin)"];
    default:
      return [base, "Admin"];
  }
}

function authFeature(a: Accessor): PlanFeature {
  const methods = a.val("AUTH-01");
  const ac = [
    "KETIKA pengguna yang belum login membuka halaman yang butuh login, SISTEM HARUS mengarahkan ke /masuk lalu kembali ke halaman semula setelah berhasil",
  ];
  if (methods.includes("password")) {
    ac.push(
      "KETIKA pengguna mendaftar dengan email + password ≥ 8 karakter, SISTEM HARUS membuat akun dan mengirim email verifikasi",
    );
    ac.push(
      "JIKA email atau password salah, MAKA SISTEM HARUS menampilkan pesan umum tanpa menyebut field mana yang salah",
    );
  }
  if (methods.includes("magic"))
    ac.push(
      "KETIKA pengguna meminta magic link, SISTEM HARUS mengirim tautan sekali pakai yang berlaku 15 menit",
    );
  if (methods.includes("google") || methods.includes("github"))
    ac.push(
      "KETIKA login OAuth berhasil untuk email baru, SISTEM HARUS membuat akun dan langsung masuk",
    );
  if (methods.includes("phone"))
    ac.push(
      "KETIKA pengguna memasukkan OTP yang benar dalam 5 menit, SISTEM HARUS memasukkan pengguna",
    );
  if (methods.includes("sso"))
    ac.push(
      "KETIKA pengguna dengan domain perusahaan masuk, SISTEM HARUS mengarahkannya ke penyedia SSO",
    );
  const reg = a.first("AUTH-02");
  if (reg === "invite")
    ac.push(
      "JIKA seseorang mendaftar tanpa tautan undangan yang valid, MAKA SISTEM HARUS menolak pendaftaran",
    );
  if (reg === "admin")
    ac.push("SISTEM HARUS menyembunyikan halaman daftar; akun hanya dibuat oleh Admin");
  if (reg === "domain")
    ac.push(
      "JIKA domain email tidak termasuk daftar yang diizinkan, MAKA SISTEM HARUS menolak pendaftaran",
    );
  ac.push("KETIKA pengguna menekan Keluar, SISTEM HARUS menghapus sesi di server dan di browser");
  return {
    fid: "",
    key: "auth",
    label: "Autentikasi",
    description: `Masuk/keluar dengan ${answerLabels(a, "AUTH-01").join(", ") || "metode yang dipilih"}.`,
    priority: "must",
    priorityAssumed: false,
    story: {
      role: "pengguna",
      action: "masuk ke akun saya",
      benefit: "data saya aman dan hanya bisa saya akses",
    },
    acceptance: ac,
    acceptanceAssumed: false,
    edgeCases:
      "Sesi kedaluwarsa saat mengisi formulir: data formulir tidak hilang setelah login ulang.",
    entities: ["User"],
    route: { path: "/masuk", name: "Masuk", access: "Publik" },
  };
}

function buildFeatures(a: Accessor, needsLogin: boolean): PlanFeature[] {
  const pr = a.resolved("FEA-02");
  const list: PlanFeature[] = [];
  if (needsLogin) list.push(authFeature(a));
  for (const o of selectedFeatureOptions(a)) {
    const def = FEATURE_BY_ID[o.id];
    const priority = pr.priorities[o.id] ?? "should";
    const priorityAssumed = pr.decidedBy === "ai" || pr.aiPriorityKeys.includes(o.id);
    if (def) {
      list.push({
        fid: "",
        key: def.id,
        label: def.label,
        description: def.description,
        priority,
        priorityAssumed,
        story: def.story,
        acceptance: def.acceptance,
        acceptanceAssumed: false,
        edgeCases: def.edgeCases,
        entities: def.entities,
        route: def.route,
      });
    } else {
      const lower = o.label.toLowerCase();
      list.push({
        fid: "",
        key: o.id,
        label: o.label,
        description: `Fitur tambahan dari pengguna: ${o.label}.`,
        priority,
        priorityAssumed,
        story: {
          role: "pengguna",
          action: `memakai fitur ${lower}`,
          benefit: "kebutuhan saya terpenuhi",
        },
        acceptance: [
          `KETIKA pengguna menyelesaikan aksi utama ${lower} dengan input valid, SISTEM HARUS menyimpan hasilnya dan menampilkan konfirmasi`,
          `JIKA input ${lower} tidak valid, MAKA SISTEM HARUS menampilkan pesan error di field terkait tanpa menghapus isian`,
        ],
        acceptanceAssumed: true,
        edgeCases: `${ASSUMPTION} Kasus tepi untuk ${lower} belum didefinisikan; tanyakan ke pengguna sebelum mengerjakan.`,
        entities: [],
        route: {
          path: `/${slugify(o.label)}`,
          name: o.label,
          access: needsLogin ? "Login" : "Publik",
        },
      });
    }
  }
  const sorted = [...list].sort(
    (x, y) => PRIORITY_ORDER.indexOf(x.priority) - PRIORITY_ORDER.indexOf(y.priority),
  );
  return sorted.map((f, i) => ({ ...f, fid: `F-${String(i + 1).padStart(2, "0")}` }));
}

function buildEntities(a: Accessor, features: PlanFeature[]): PlanEntity[] {
  const r = a.resolved("DAT-01");
  const active = features.filter((f) => f.priority !== "wont");
  const ids = r.optionIds.filter((o) => o !== OTHER && ENTITIES[o]);
  // Entitas yang dirujuk lewat foreign key ikut dimasukkan agar skema konsisten.
  for (let i = 0; i < ids.length; i++) {
    for (const f of ENTITIES[ids[i] as string]?.fields ?? []) {
      if (f.ref && f.required && !ids.includes(f.ref)) ids.push(f.ref);
    }
  }
  const out: PlanEntity[] = ids.map((id) => {
    const e = ENTITIES[id] as (typeof ENTITIES)[string];
    const usedBy = active.filter((f) => f.entities.includes(id)).map((f) => f.fid);
    return {
      ...e,
      fields: e.fields.filter((f) => !f.ref || f.required || ids.includes(f.ref)),
      custom: false,
      usedBy,
    };
  });
  if (r.optionIds.includes(OTHER)) {
    for (const labelText of splitList(r.otherText)) {
      out.push({
        id:
          labelText
            .replace(/[^A-Za-z0-9]+/g, " ")
            .replace(/(?:^|\s)(\w)/g, (_, c: string) => c.toUpperCase())
            .replace(/\s/g, "") || "Custom",
        label: labelText,
        description: `${ASSUMPTION} Entitas tambahan dari pengguna. Field di bawah adalah titik awal; konfirmasi sebelum T-002.`,
        fields: [{ name: "name", type: "text", required: true, rule: "2–120 karakter" }],
        indexes: [],
        rules: [],
        custom: true,
        usedBy: active.filter((f) => f.acceptanceAssumed).map((f) => f.fid),
      });
    }
  }
  return out;
}

function buildStack(a: Accessor): Stack {
  const lang = a.first("TEC-07") ?? "ts";
  const framework = a.first("TEC-02") ?? "next";
  const backend = a.first("TEC-03") ?? "integrated";
  const db = a.first("TEC-04") ?? "postgres";
  const orm = a.first("TEC-05") ?? "";
  const hosting = a.first("TEC-06") ?? "vercel";
  const ui = a.first("DES-05") ?? "shadcn";
  const testing = a.val("QUA-02");
  const monitoring = a.val("QUA-06");
  const custom = (id: string): TechInfo => ({
    name: a.resolved(id).otherText ?? "-",
    version: "-",
    why: "Pilihan pengguna",
  });
  const pick = (map: Record<string, TechInfo>, id: string, qid: string): TechInfo =>
    id === OTHER ? custom(qid) : (map[id] ?? custom(qid));

  const langInfo: TechInfo =
    lang === OTHER
      ? custom("TEC-07")
      : ({
          ts: {
            name: "TypeScript (strict)",
            version: "7.x (atau 5.9.x bila tooling framework belum mendukung 7)",
            why: "Tipe ketat mengurangi kesalahan AI",
          },
          js: { name: "JavaScript (ESM)", version: "ES2023", why: "Tanpa langkah kompilasi tipe" },
          python: { name: "Python", version: "3.13", why: "Ekosistem data & API" },
          php: { name: "PHP", version: "8.4", why: "Mengikuti Laravel" },
          go: { name: "Go", version: "1.25", why: "Biner tunggal, performa tinggi" },
        }[lang] as TechInfo);

  let uiInfo = pick(UI_LIBS, ui, "DES-05");
  if (ui === "shadcn" && framework === "nuxt")
    uiInfo = { ...uiInfo, name: "shadcn-vue + Tailwind CSS" };
  if (ui === "shadcn" && framework === "sveltekit")
    uiInfo = { ...uiInfo, name: "shadcn-svelte + Tailwind CSS" };

  const validation: TechInfo =
    lang === "python"
      ? { name: "Pydantic", version: "2.x", why: "Validasi bawaan FastAPI" }
      : lang === "php"
        ? {
            name: "Laravel Form Request",
            version: "bawaan Laravel",
            why: "Validasi bawaan Laravel",
          }
        : lang === "go"
          ? { name: "go-playground/validator", version: "v10", why: "Validasi struct" }
          : { name: "Zod", version: "4.x", why: "Satu skema untuk validasi klien & server" };

  const styling: TechInfo = ["shadcn", "tailwind"].includes(ui)
    ? { name: "Tailwind CSS", version: "4.x", why: "Utility-first, token via CSS variables" }
    : { name: `Bawaan ${uiInfo.name}`, version: "-", why: "Mengikuti pustaka komponen" };

  const unitRunner =
    lang === "python"
      ? "pytest 8.x"
      : lang === "php"
        ? "Pest 4.x"
        : lang === "go"
          ? "go test"
          : "Vitest 4.x";
  const testNames = testing.includes("none")
    ? "Tanpa tes otomatis"
    : [
        testing.includes("unit") || testing.includes("integration") ? unitRunner : "",
        testing.includes("e2e") ? "Playwright 1.x" : "",
      ]
        .filter(Boolean)
        .join(" + ") || unitRunner;

  return {
    lang,
    framework,
    backend,
    db,
    orm,
    hosting,
    ui,
    testing,
    monitoring,
    info: {
      lang: langInfo,
      framework: pick(FRAMEWORKS, framework, "TEC-02"),
      backend: pick(BACKENDS, backend, "TEC-03"),
      db: pick(DATABASES, db, "TEC-04"),
      orm: orm ? pick(ORMS, orm, "TEC-05") : null,
      ui: uiInfo,
      auth:
        a.first("USR-02") === "public"
          ? null
          : (AUTH_LIBS[backend === "integrated" ? framework : backend] ?? AUTH_LIBS.next ?? null),
      validation,
      styling,
      testing: { name: testNames, version: "-", why: "Sesuai QUA-02" },
    },
    commands: commandsFor(lang, framework, orm, db),
  };
}

export const hostingName = (id: string, a: Accessor): string =>
  id === OTHER ? (a.resolved("TEC-06").otherText ?? "-") : (HOSTING[id] ?? id);

export const questionText = (id: string): string => QUESTION_BY_ID[id]?.text ?? id;

export type StageId =
  | "visi"
  | "pengguna"
  | "fitur"
  | "data"
  | "desain"
  | "teknologi"
  | "kualitas"
  | "ai";

export interface Stage {
  id: StageId;
  number: number;
  title: string;
  description: string;
}

export interface Option {
  id: string;
  label: string;
  hint?: string;
}

export type Priority = "must" | "should" | "could" | "wont";

export interface Recommendation {
  optionIds: string[];
  /** Hanya untuk pertanyaan bertipe priority. */
  priorities?: Record<string, Priority>;
  reason: string;
}

export interface Question {
  id: string;
  stage: StageId;
  text: string;
  help?: string;
  /** single = pilih satu, multi = boleh lebih dari satu, priority = matriks MoSCoW. */
  type: "single" | "multi" | "priority";
  options: Option[] | ((a: Accessor) => Option[]);
  /** Pertanyaan disembunyikan (dan jawabannya diabaikan) jika fungsi ini mengembalikan false. */
  showIf?: (a: Accessor) => boolean;
  /** Jika true, pertanyaan tidak ditanyakan dan otomatis diisi rekomendasi. */
  autoAi?: (a: Accessor) => boolean;
  /** Placeholder untuk kolom "Lainnya". */
  otherPlaceholder?: string;
  /** Aturan statis pengganti LLM. Hanya boleh membaca pertanyaan yang muncul lebih awal. */
  recommend: (a: Accessor) => Recommendation;
}

/** Pembaca jawaban yang sudah di-resolve; dipakai oleh showIf, recommend, dan generator. */
export interface Accessor {
  state: ProjectState;
  /** Opsi final (termasuk hasil rekomendasi). Kosong jika pertanyaan tersembunyi. */
  val: (questionId: string) => string[];
  has: (questionId: string, optionId: string) => boolean;
  first: (questionId: string) => string | undefined;
  resolved: (questionId: string) => ResolvedAnswer;
}

export interface Answer {
  /** "ai" berarti pengguna memilih "Biarkan AI merekomendasikan". */
  decidedBy: "user" | "ai";
  optionIds: string[];
  /** Diisi jika pengguna memilih "Lainnya". */
  otherText?: string;
  priorities?: Record<string, Priority>;
}

export interface ProjectState {
  version: 1;
  projectName: string;
  idea: string;
  answers: Record<string, Answer>;
}

/** Jawaban yang sudah final: rekomendasi sudah dihitung, opsi tak valid sudah dibuang. */
export interface ResolvedAnswer {
  questionId: string;
  decidedBy: "user" | "ai";
  optionIds: string[];
  otherText?: string;
  priorities: Record<string, Priority>;
  reason?: string;
  /** Prioritas yang tidak diatur pengguna (diisi rekomendasi). */
  aiPriorityKeys: string[];
  /** showIf false: jawaban diabaikan. */
  hidden: boolean;
  /** autoAi true: tidak ditanyakan, diisi rekomendasi. */
  auto: boolean;
  /** Pertanyaan tampil tetapi tidak dijawab. */
  skipped: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

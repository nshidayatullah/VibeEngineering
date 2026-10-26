import { parseClarifications } from "../engine/clarify";
import type { Clarification } from "../engine/types";

/** Endpoint service vibeplan-ai; origin sama sehingga CSP connect-src 'self' cukup. */
const BASE = "/api/ai";
/** Ide minimal agar AI punya cukup konteks; sama dengan batas di server. */
export const MIN_IDEA = 10;

/** True jika service vibeplan-ai bisa dihubungi (di lokal tanpa service: false). */
export async function checkAi(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data: unknown = await res.json();
    return typeof data === "object" && data !== null && (data as { ok?: unknown }).ok === true;
  } catch {
    return false;
  }
}

const MESSAGES: Record<string, string> = {
  rate_limited: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
  bad_idea: "Ide terlalu pendek atau terlalu panjang untuk diklarifikasi AI.",
  timeout: "AI terlalu lama menjawab. Coba lagi.",
  bad_model: "Jawaban AI tidak bisa dipakai. Coba lagi.",
};
const FALLBACK = "AI sedang tidak tersedia. Anda bisa lanjut tanpa klarifikasi.";

/** Meminta 3–5 pertanyaan klarifikasi. Melempar Error berpesan Bahasa Indonesia jika gagal. */
export async function fetchClarifications(
  projectName: string,
  idea: string,
): Promise<Clarification[]> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/clarify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName: projectName.trim(), idea: idea.trim() }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    throw new Error(FALLBACK);
  }
  const data: unknown = await res.json().catch(() => undefined);
  const body = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
  if (!res.ok) throw new Error(MESSAGES[String(body.error)] ?? FALLBACK);
  const list = parseClarifications(body.questions);
  if (!list || list.length === 0) throw new Error(MESSAGES.bad_model);
  return list;
}

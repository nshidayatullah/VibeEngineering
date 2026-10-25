import type { GeneratedFile } from "../engine/types";

/** Membuat ZIP dengan semua file di dalam satu folder `<slug>/`. */
export async function buildZip(slug: string, files: GeneratedFile[]): Promise<Blob> {
  // Dimuat saat dibutuhkan agar bundle awal tetap kecil.
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const root = zip.folder(slug) ?? zip;
  for (const f of files) root.file(f.path, f.content);
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

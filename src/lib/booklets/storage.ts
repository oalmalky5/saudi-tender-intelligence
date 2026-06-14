import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BOOKLET_STORAGE_ROOT = path.join(process.cwd(), "storage", "booklets");

export function hashBooklet(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function bookletStoragePath(tenderId: string, sha256: string): string {
  return path.join(BOOKLET_STORAGE_ROOT, tenderId, `${sha256}.pdf`);
}

export async function storeBooklet(
  tenderId: string,
  sha256: string,
  bytes: Uint8Array,
): Promise<string> {
  const storedPath = bookletStoragePath(tenderId, sha256);
  await mkdir(path.dirname(storedPath), { recursive: true });
  await writeFile(storedPath, bytes, { flag: "wx" }).catch((error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      return;
    }
    throw error;
  });
  return storedPath;
}

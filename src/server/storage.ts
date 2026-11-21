import fs from "fs";
import path from "path";

export const DATA_DIR = path.resolve(process.cwd(), "data");
export const PUBLIC_DIR = path.resolve(process.cwd(), "public");
export const PRIVATE_PROOFS_DIR = path.join(DATA_DIR, "proofs");
export const PUBLIC_DISH_UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads", "dishes");
export const PUBLIC_ADMIN_UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads", "admin");

export function ensureCoreDirectories() {
  [DATA_DIR, PRIVATE_PROOFS_DIR, PUBLIC_DISH_UPLOADS_DIR, PUBLIC_ADMIN_UPLOADS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

export function resolveSafePath(rootDir: string, ...segments: string[]): string {
  const rootResolved = path.resolve(rootDir);
  const candidate = path.resolve(rootResolved, ...segments);
  if (candidate !== rootResolved && !candidate.startsWith(rootResolved + path.sep)) {
    throw new Error("Invalid file path outside permitted directory.");
  }
  return candidate;
}

export function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed reading JSON file ${filePath}:`, err);
    return fallback;
  }
}

export function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch (err) {
    console.error(`Failed writing JSON file ${filePath}:`, err);
    return false;
  }
}

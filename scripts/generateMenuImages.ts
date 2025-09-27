import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const DATA_JSON = path.join(ROOT, "src/data/jommechu/jommechu_dataset_v2_full.json");
const KFOOD_ROOT = path.join(ROOT, "public/kfood");
const OUT_JSON = path.join(ROOT, "public/kfood-index.json");
const exts = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function randPick<T>(arr: T[]): T {
  const idx = crypto.randomInt(0, arr.length);
  return arr[idx];
}

async function readJson<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

async function dirExists(p: string) {
  try {
    return (await fs.stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

async function main() {
  type Item = { name_ko?: string; id?: string };
  const items = await readJson<Item[]>(DATA_JSON);
  const allowed = new Set<string>();
  for (const it of items) {
    const key = (it.name_ko || it.id || "").trim();
    if (key) allowed.add(key);
  }

  if (!(await dirExists(KFOOD_ROOT))) {
    console.error(`[ERR] Not found: ${KFOOD_ROOT}`);
    process.exit(1);
  }

  const map: Record<string, string> = {};
  const byMenuDir = new Map<string, string[]>();

  for await (const file of walk(KFOOD_ROOT)) {
    const ext = path.extname(file).toLowerCase();
    if (!exts.has(ext)) continue;
    const dir = path.dirname(file);
    const menuName = path.basename(dir);
    if (!allowed.has(menuName)) continue;
    const arr = byMenuDir.get(dir) ?? [];
    arr.push(file);
    byMenuDir.set(dir, arr);
  }

  for (const [dir, files] of byMenuDir) {
    if (!files.length) continue;
    const menuName = path.basename(dir);
    const chosen = randPick(files);
    const relative = path
      .relative(KFOOD_ROOT, chosen)
      .split(path.sep)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    map[menuName] = `/kfood/${relative}`;
  }

  await fs.writeFile(OUT_JSON, JSON.stringify(map, null, 2), "utf8");

  const totalAllowed = allowed.size;
  const mapped = Object.keys(map).length;
  const missing = [...allowed].filter((name) => !map[name]);
  console.log(`Allowed from dataset: ${totalAllowed}`);
  console.log(`Mapped with images:  ${mapped}`);
  if (missing.length) {
    console.warn(`No image found for ${missing.length} menus: ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? "..." : ""}`);
  }
  console.log(`Saved: ${OUT_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

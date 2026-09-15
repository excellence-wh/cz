import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Template, TemplateManifest } from "./types.ts";

const MANIFEST_FILE = "template.json";

function isManifest(value: unknown): value is TemplateManifest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.kind === "string" &&
    Array.isArray(v.tags)
  );
}

async function loadManifest(dir: string): Promise<TemplateManifest | undefined> {
  try {
    const raw = await readFile(join(dir, MANIFEST_FILE), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isManifest(parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

/** 扫描模板根目录，返回所有合法模板（按 title 排序）。无 manifest 的目录被忽略。 */
export async function loadTemplates(templatesDir: string): Promise<Template[]> {
  const entries = await readdir(templatesDir, { withFileTypes: true }).catch(() => []);

  const templates: Template[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(templatesDir, entry.name);
    const manifest = await loadManifest(dir);
    if (manifest) templates.push({ manifest, dir });
  }

  return templates.sort((a, b) => a.manifest.title.localeCompare(b.manifest.title));
}

/** 按 id（或目录名）查找单个模板。 */
export async function loadTemplate(
  templatesDir: string,
  id: string,
): Promise<Template | undefined> {
  const templates = await loadTemplates(templatesDir);
  return templates.find((t) => t.manifest.id === id);
}

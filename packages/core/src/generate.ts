import { exec, execFile } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, sep } from "node:path";
import { promisify } from "node:util";
import type { GenerateOptions, GenerateResult } from "./types.ts";
import { render, renderPath } from "./variables.ts";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

/**
 * 模板内文件名需要重命名的情况。
 * npm 发布时会剔除 `.gitignore` / `.npmignore`，因此在模板里用 `_` 前缀，生成时还原。
 */
const RENAME: Record<string, string> = {
  _gitignore: ".gitignore",
  _npmignore: ".npmignore",
};

const MANIFEST_FILE = "template.json";

/** 不参与文本渲染的二进制/资源后缀。 */
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".icns",
  ".pdf",
  ".zip",
  ".gz",
  ".tgz",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
]);

interface ResolvedFile {
  /** 源文件绝对路径 */
  abs: string;
  /** 渲染后、相对目标目录的路径 */
  targetRel: string;
  /** 渲染前、相对源目录的路径 */
  sourceRel: string;
}

async function collectFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile()) {
        out.push(abs);
      }
    }
  }
  await walk(root);
  return out;
}

async function isEmptyDir(dir: string): Promise<boolean> {
  try {
    return (await readdir(dir)).length === 0;
  } catch {
    return false;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 先收集共享层，再用模板层覆盖同名目标路径。
 * 返回值保持插入顺序，但覆盖后的文件只保留模板层来源。
 */
async function resolveFiles(
  roots: string[],
  variables: Record<string, string>,
): Promise<ResolvedFile[]> {
  const byTarget = new Map<string, ResolvedFile>();

  for (const root of roots) {
    for (const abs of await collectFiles(root)) {
      const relFromRoot = relative(root, abs);
      const segments = relFromRoot.split(sep);
      if (segments.includes(MANIFEST_FILE)) continue;

      // 统一为 `/` 分隔，避免 Windows 下把路径分隔符差异误报成重命名
      const sourceRel = renderPath(relFromRoot.split(sep).join("/"), variables);
      const targetRel = segments
        .map((segment) => RENAME[segment] ?? renderPath(segment, variables))
        .join("/");

      byTarget.set(targetRel, { abs, targetRel, sourceRel });
    }
  }

  return [...byTarget.values()];
}

/** 把一个模板目录（叠加共享层）渲染落盘到 targetDir。 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { template, targetDir, variables, onProgress } = options;
  const log = onProgress ?? (() => {});

  if (!(await pathExists(template.dir))) {
    throw new Error(`模板目录不存在：${template.dir}`);
  }

  if ((await pathExists(targetDir)) && !(await isEmptyDir(targetDir)) && options.force !== true) {
    throw new Error(`目标目录已存在且非空：${targetDir}（使用 force 覆盖）`);
  }

  const roots = [options.sharedDir, template.dir].filter(
    (root): root is string => typeof root === "string" && root.length > 0,
  );
  const resolved = await resolveFiles(roots, variables);
  const files: string[] = [];
  const renamed: Array<{ from: string; to: string }> = [];

  for (const file of resolved) {
    const targetAbs = join(targetDir, ...file.targetRel.split("/"));
    await mkdir(dirname(targetAbs), { recursive: true });

    if (BINARY_EXTENSIONS.has(extname(file.abs).toLowerCase())) {
      await copyFile(file.abs, targetAbs);
    } else {
      const raw = await readFile(file.abs, "utf8");
      await writeFile(targetAbs, render(raw, variables), "utf8");
    }

    files.push(file.targetRel);
    if (file.targetRel !== file.sourceRel) {
      renamed.push({ from: file.sourceRel, to: file.targetRel });
      log(`  ${file.sourceRel} → ${file.targetRel}`);
    } else {
      log(`  ${file.targetRel}`);
    }
  }

  if (options.initGit === true) {
    await initGit(targetDir);
  }

  return { targetDir, files, renamed };
}

/** 在目标目录执行 `git init -b main`（已存在仓库则跳过）。 */
export async function initGit(dir: string): Promise<boolean> {
  if (await pathExists(join(dir, ".git"))) return false;
  try {
    await execFileAsync("git", ["init", "-q", "-b", "main"], { cwd: dir });
    return true;
  } catch {
    // 老版本 git 不支持 -b，退回默认分支
    await execFileAsync("git", ["init", "-q"], { cwd: dir });
    return true;
  }
}

/** 在目标目录安装依赖。 */
export async function installDependencies(
  dir: string,
  packageManager: "pnpm" | "npm" | "yarn" | "bun" = "pnpm",
): Promise<void> {
  // 用 exec（走 shell）而非 execFile：Windows 上 pnpm/npm 是 .cmd shim，
  // execFile 不带 shell 会 ENOENT，而 shell:true + args 会触发 DEP0190。
  await execAsync(`${packageManager} install`, { cwd: dir });
}

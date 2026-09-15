import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { loadTemplates } from "@excellence-wh/core";
import { templatesDir } from "@excellence-wh/templates";

const execFileAsync = promisify(execFile);

const CLI_ENTRY = fileURLToPath(new URL("../dist/index.js", import.meta.url));

/** 所有模板都必须铺上的「通用 AI 开发环境」文件。 */
const REQUIRED_AGENT_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  "CONVENTIONS.md",
  ".cursor/rules/00-agents.mdc",
  ".github/copilot-instructions.md",
  ".windsurfrules",
  ".clinerules",
  ".roo/rules/00-project.md",
  ".aider.conf.yml",
  "mcp.json",
  ".editorconfig",
  ".gitignore",
  "docs/adr/README.md",
  "docs/spec/README.md",
];

const BINARY_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff2"]);

/** 递归收集相对路径，统一用 `/` 分隔。 */
async function walk(dir: string, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix.length > 0 ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...(await walk(join(dir, entry.name), rel)));
    } else {
      out.push(rel);
    }
  }
  return out;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

describe("端到端生成（每个模板）", () => {
  it("CLI 能生成全部模板，且结果干净、AI 环境齐全", async () => {
    const templates = await loadTemplates(templatesDir);
    assert.ok(templates.length > 0, "没有可用模板");

    for (const { manifest } of templates) {
      const root = await mkdtemp(join(tmpdir(), `cz-e2e-${manifest.id}-`));
      const targetDir = join(root, manifest.id);

      const { stderr } = await execFileAsync(
        process.execPath,
        [CLI_ENTRY, targetDir, "-t", manifest.id, "-y", "--no-install", "--no-git"],
        { cwd: root },
      );
      assert.equal(stderr.trim(), "", `${manifest.id} 生成时有 stderr 输出`);

      const files = await walk(targetDir);

      // 1. 通用 AI 开发环境齐全
      for (const required of REQUIRED_AGENT_FILES) {
        assert.ok(files.includes(required), `${manifest.id} 缺少 ${required}`);
      }

      // 2. 点文件重命名、manifest 不落盘
      assert.ok(!files.includes("_gitignore"), `${manifest.id} 的 _gitignore 未被重命名`);
      assert.ok(!files.includes("template.json"), `${manifest.id} 的 template.json 落盘了`);

      // 3. 零残留占位符
      for (const rel of files) {
        const ext = rel.slice(rel.lastIndexOf("."));
        if (BINARY_EXTENSIONS.has(ext)) continue;
        const content = await readFile(join(targetDir, rel), "utf8");
        assert.ok(
          !content.includes("{{"),
          `${manifest.id}/${rel} 残留未渲染占位符：${content.slice(content.indexOf("{{"), content.indexOf("{{") + 40)}`,
        );
      }

      // 4. Node 系模板的 package.json 合法且 name 正确
      if (files.includes("package.json")) {
        const pkg = JSON.parse(await readFile(join(targetDir, "package.json"), "utf8")) as {
          name?: string;
        };
        assert.equal(pkg.name, manifest.id, `${manifest.id} 的 package.json name 不正确`);
      }

      // 5. Go 模板的 go.mod 模块名正确
      if (files.includes("go.mod")) {
        const goMod = await readFile(join(targetDir, "go.mod"), "utf8");
        assert.match(goMod, new RegExp(`^module ${manifest.id}$`, "m"));
      }
    }
  });

  it("未知模板返回非零退出码并给出可用模板", async () => {
    const root = await mkdtemp(join(tmpdir(), "cz-e2e-unknown-"));
    await assert.rejects(
      execFileAsync(
        process.execPath,
        [CLI_ENTRY, join(root, "x"), "-t", "does-not-exist", "-y", "--no-install", "--no-git"],
        { cwd: root },
      ),
      (error: unknown) => {
        const e = error as { code?: number; stderr?: string };
        assert.equal(e.code, 1);
        assert.match(e.stderr ?? "", /未知模板/);
        return true;
      },
    );
  });

  it("非交互模式下缺少目标目录时报错", async () => {
    const root = await mkdtemp(join(tmpdir(), "cz-e2e-nodir-"));
    await assert.rejects(
      execFileAsync(process.execPath, [CLI_ENTRY, "-t", "ts-cli", "-y", "--no-install"], {
        cwd: root,
      }),
      (error: unknown) => {
        const e = error as { code?: number; stderr?: string };
        assert.equal(e.code, 1);
        assert.match(e.stderr ?? "", /目标目录/);
        return true;
      },
    );
  });

  it("--list 列出所有模板", async () => {
    const { stdout } = await execFileAsync(process.execPath, [CLI_ENTRY, "--list"]);
    for (const id of ["ts-cli", "node-lib", "react-vite", "react-next", "go-service", "go-gin"]) {
      assert.ok(stdout.includes(id), `--list 输出缺少 ${id}`);
    }
    assert.ok(await exists(CLI_ENTRY));
  });
});

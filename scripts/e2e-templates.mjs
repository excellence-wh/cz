#!/usr/bin/env node
// @ts-check
/**
 * 重型端到端验证：对每个模板都真正「生成 → 安装依赖 → 跑 verify」。
 *
 * 与 `apps/cli/test/generate.test.ts`（快速冒烟，跑在 CI）不同，这个脚本需要
 * 网络、pnpm、Go 工具链，耗时较长，因此不进入默认 `pnpm verify`。
 *
 *   pnpm build && pnpm test:e2e
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CLI = join(ROOT, "apps", "cli", "dist", "index.js");
const TEMPLATES_DIR = join(ROOT, "packages", "templates", "templates");

/** @returns {string[]} */
function listTemplates() {
  return readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((id) => existsSync(join(TEMPLATES_DIR, id, "template.json")))
    .sort();
}

/**
 * @param {string} command
 * @param {string} cwd
 * @returns {boolean}
 */
function run(command, cwd) {
  const result = spawnSync(command, { cwd, shell: true, stdio: "inherit" });
  return result.status === 0;
}

/** @param {string} targetDir @returns {string | undefined} */
function verifyCommandFor(targetDir) {
  if (existsSync(join(targetDir, "package.json"))) {
    const pkg = JSON.parse(readFileSync(join(targetDir, "package.json"), "utf8"));
    if (!pkg.scripts?.verify) return undefined;
    return "pnpm install && pnpm verify";
  }
  if (existsSync(join(targetDir, "go.mod"))) {
    return "go vet ./... && go test ./... && go build -o bin/server ./cmd/server";
  }
  return undefined;
}

function main() {
  if (!existsSync(CLI)) {
    console.error("✖ 找不到 CLI 构建产物，请先执行 `pnpm build`");
    process.exitCode = 1;
    return;
  }

  const ids = listTemplates();
  if (ids.length === 0) {
    console.error("✖ 没有发现任何模板");
    process.exitCode = 1;
    return;
  }

  /** @type {Array<{ id: string; ok: boolean; reason?: string }>} */
  const results = [];

  for (const id of ids) {
    console.log(`\n\x1b[1m\x1b[36m▶ ${id}\x1b[0m`);
    const root = mkdtempSync(join(tmpdir(), `cz-e2e-${id}-`));
    const targetDir = join(root, id);

    if (!run(`node "${CLI}" "${targetDir}" -t ${id} -y --no-git`, root)) {
      results.push({ id, ok: false, reason: "生成失败" });
      continue;
    }

    const verify = verifyCommandFor(targetDir);
    if (verify === undefined) {
      results.push({ id, ok: true, reason: "无 verify 命令（仅生成）" });
      continue;
    }

    const ok = run(verify, targetDir);
    results.push({ id, ok, reason: ok ? undefined : `verify 失败：${verify}` });
  }

  console.log("\n\x1b[1m汇总\x1b[0m");
  for (const { id, ok, reason } of results) {
    const mark = ok ? "\x1b[32m✔\x1b[0m" : "\x1b[31m✖\x1b[0m";
    console.log(`  ${mark} ${id.padEnd(12)} ${reason ?? ""}`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`\n${failed.length}/${results.length} 个模板验证失败`);
    process.exitCode = 1;
  } else {
    console.log(`\n全部 ${results.length} 个模板通过`);
  }
}

main();

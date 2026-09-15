#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { loadTemplates } from "@excellence-wh/core";
import { templatesDir } from "@excellence-wh/templates";
import pc from "picocolors";
import { parseCliOptions } from "./args.ts";
import { runCli } from "./run.ts";

const HELP = `${pc.bold("@excellence-wh/cz")} — AI-first 项目脚手架生成器

${pc.bold("用法")}
  cz [目录] [选项]

${pc.bold("选项")}
  -t, --template <id>   指定模板 id（跳过选择）
  -y, --yes             使用默认值，不进入交互
  -f, --force           目标目录非空时覆盖
  -l, --list            列出所有模板
      --no-install      生成后不安装依赖
      --no-git          生成后不执行 git init
  -h, --help            显示帮助
  -v, --version         显示版本

${pc.bold("示例")}
  cz my-app                     # 交互式生成
  cz my-app -t ts-cli           # 直接用 TypeScript CLI 模板
  cz my-app -t react-app -y     # 全默认，非交互
  cz --list                     # 查看可用模板
`;

async function readVersion(): Promise<string> {
  try {
    const raw = await readFile(new URL("../package.json", import.meta.url), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function listTemplates(): Promise<void> {
  const templates = await loadTemplates(templatesDir);
  if (templates.length === 0) {
    process.stdout.write("（没有可用模板）\n");
    return;
  }
  process.stdout.write(`${pc.bold("可用模板")}\n`);
  const width = Math.max(...templates.map((t) => t.manifest.id.length));
  for (const { manifest } of templates) {
    process.stdout.write(
      `  ${pc.cyan(manifest.id.padEnd(width))}  ${manifest.description} ${pc.dim(`[${manifest.kind}]`)}\n`,
    );
  }
}

async function main(): Promise<number> {
  // 容忍 `pnpm cli -- --list` 这类工具注入的前导 `--`
  const argv = process.argv.slice(2);
  const normalized = argv[0] === "--" ? argv.slice(1) : argv;
  const options = parseCliOptions(normalized);

  if (options.help) {
    process.stdout.write(HELP);
    return 0;
  }

  if (options.version) {
    process.stdout.write(`${await readVersion()}\n`);
    return 0;
  }

  if (options.list) {
    await listTemplates();
    return 0;
  }

  return runCli(options);
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${pc.red("✖")} ${message}\n`);
    process.exitCode = 1;
  });

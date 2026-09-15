import { basename, join, resolve } from "node:path";
import * as p from "@clack/prompts";
import {
  defaultVariables,
  generate,
  installDependencies,
  loadTemplates,
  type Template,
} from "@excellence-wh/core";
import { templatesDir } from "@excellence-wh/templates";
import pc from "picocolors";
import type { CliOptions } from "./args.ts";

const sharedDir = join(templatesDir, "_shared");

const KIND_LABEL: Record<string, string> = {
  ts: "TypeScript",
  node: "Node.js",
  react: "React",
  go: "Go",
};

function pickFallback(templates: Template[]): Template | undefined {
  return templates.find((t) => t.manifest.id === "ts-cli") ?? templates[0];
}

function resolveTemplate(templates: Template[], id: string | undefined): Template | undefined {
  if (id === undefined) return undefined;
  return templates.find((t) => t.manifest.id === id);
}

/** 打印并返回错误码。 */
export async function runCli(options: CliOptions): Promise<number> {
  const templates = await loadTemplates(templatesDir);
  if (templates.length === 0) {
    process.stderr.write(pc.red("未找到任何模板。\n"));
    return 1;
  }

  const interactive = options.yes !== true && process.stdout.isTTY === true;
  const selected = resolveTemplate(templates, options.template);

  if (options.template !== undefined && selected === undefined) {
    process.stderr.write(pc.red(`未知模板：${options.template}\n`));
    process.stderr.write(`可用模板：${templates.map((t) => t.manifest.id).join(", ")}\n`);
    return 1;
  }

  if (interactive) {
    p.intro(`${pc.bgCyan(pc.black(" @excellence-wh/cz "))} 项目生成器 · ${pc.dim("AI-first")}`);
  }

  // 1. 目标目录
  let dir = options.dir;
  if (dir === undefined) {
    if (!interactive) {
      process.stderr.write(pc.red("非交互模式下必须指定目标目录，例如：cz my-app\n"));
      return 1;
    }
    const answer = await p.text({
      message: "项目目录",
      placeholder: "my-app",
      defaultValue: "my-app",
    });
    if (p.isCancel(answer)) {
      p.cancel("已取消");
      return 1;
    }
    dir = answer;
  }

  // 2. 模板
  let template = selected;
  if (template === undefined) {
    if (!interactive) {
      template = pickFallback(templates);
    } else {
      const answer = await p.select<string>({
        message: "选择模板",
        options: templates.map((t) => ({
          value: t.manifest.id,
          label: `${t.manifest.title}  ${pc.dim(`[${KIND_LABEL[t.manifest.kind] ?? t.manifest.kind}]`)}`,
          hint: t.manifest.description,
        })),
      });
      if (p.isCancel(answer)) {
        p.cancel("已取消");
        return 1;
      }
      template = resolveTemplate(templates, answer);
    }
  }

  if (template === undefined) {
    process.stderr.write(pc.red("未能确定模板。\n"));
    return 1;
  }

  // 3. 描述
  const defaultDescription = `A ${template.manifest.title} project.`;
  let description = defaultDescription;
  if (interactive) {
    const answer = await p.text({
      message: "一句话描述（可留空）",
      placeholder: defaultDescription,
      defaultValue: defaultDescription,
    });
    if (p.isCancel(answer)) {
      p.cancel("已取消");
      return 1;
    }
    description = answer.trim() || defaultDescription;
  }

  // 4. 确认
  const targetDir = resolve(process.cwd(), dir);
  if (interactive) {
    const ok = await p.confirm({
      message: `在 ${pc.cyan(targetDir)} 使用模板 ${pc.cyan(template.manifest.id)} 生成项目？`,
    });
    if (p.isCancel(ok) || ok !== true) {
      p.cancel("已取消");
      return 1;
    }
  }

  const projectName = basename(targetDir);
  const variables: Record<string, string> = {
    ...defaultVariables(projectName, { description }),
    ...template.manifest.variables,
  };

  const spinner = interactive ? p.spinner() : undefined;

  try {
    spinner?.start("正在生成文件…");
    const result = await generate({
      template,
      sharedDir,
      targetDir,
      variables,
      initGit: options.git,
      force: options.force,
    });
    spinner?.stop(`已生成 ${pc.green(String(result.files.length))} 个文件`);

    if (options.install && template.manifest.install === true) {
      const pm = template.manifest.packageManager ?? "pnpm";
      spinner?.start(`正在安装依赖（${pm}）…`);
      await installDependencies(targetDir, pm);
      spinner?.stop("依赖安装完成");
    }
  } catch (error) {
    spinner?.error("生成失败");
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${pc.red("✖")} ${message}\n`);
    return 1;
  }

  const steps = [
    `cd ${dir}`,
    options.install && template.manifest.install === true
      ? undefined
      : template.manifest.variables?.installCommand,
    template.manifest.variables?.verifyCommand,
  ].filter((step): step is string => typeof step === "string" && step.length > 0);

  const hintLines = (template.manifest.hints ?? []).map((hint) => `${pc.gray("•")} ${hint}`);

  if (interactive) {
    p.note(
      [
        ...steps.map((step) => `${pc.gray("$")} ${pc.cyan(step)}`),
        ...(hintLines.length > 0 ? ["", ...hintLines] : []),
      ].join("\n"),
      "下一步",
    );
    p.outro(`项目已就绪：${pc.green(targetDir)}`);
  } else {
    process.stdout.write(`${pc.green("✔")} 已生成 ${targetDir}\n`);
    for (const step of steps) process.stdout.write(`  ${pc.gray("$")} ${step}\n`);
  }

  return 0;
}

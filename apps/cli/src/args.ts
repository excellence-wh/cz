import { parseArgs } from "node:util";

export interface CliOptions {
  /** 目标目录（位置参数） */
  dir?: string;
  /** 模板 id */
  template?: string;
  /** 全部使用默认值，不进入交互 */
  yes: boolean;
  /** 生成后安装依赖（`--no-install` 关闭） */
  install: boolean;
  /** 生成后 git init（`--no-git` 关闭） */
  git: boolean;
  /** 目标目录非空时覆盖 */
  force: boolean;
  /** 只列出模板 */
  list: boolean;
  help: boolean;
  version: boolean;
}

export function parseCliOptions(argv: string[]): CliOptions {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      template: { type: "string", short: "t" },
      yes: { type: "boolean", short: "y", default: false },
      force: { type: "boolean", short: "f", default: false },
      list: { type: "boolean", short: "l", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
      "no-install": { type: "boolean", default: false },
      "no-git": { type: "boolean", default: false },
    },
    allowPositionals: true,
    strict: false,
  });

  const dir = positionals[0];
  const rawTemplate = values.template;
  const template = typeof rawTemplate === "string" ? rawTemplate : undefined;

  return {
    ...(dir !== undefined ? { dir } : {}),
    ...(template !== undefined ? { template } : {}),
    yes: values.yes === true,
    install: values["no-install"] !== true,
    git: values["no-git"] !== true,
    force: values.force === true,
    list: values.list === true,
    help: values.help === true,
    version: values.version === true,
  };
}

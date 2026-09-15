export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export type TemplateKind = "ts" | "node" | "react" | "go";

/** 每个模板目录下的 `template.json`。必须是合法 JSON（不含 {{变量}}）。 */
export interface TemplateManifest {
  /** 唯一 id，等于目录名 */
  id: string;
  /** 展示名 */
  title: string;
  /** 一句话描述 */
  description: string;
  /** 归类，用于 CLI 展示与筛选 */
  kind: TemplateKind;
  /** 搜索/过滤标签 */
  tags: string[];
  /** 生成完成后打印给用户的提示 */
  hints?: string[];
  /** 生成后是否需要安装依赖 */
  install?: boolean;
  /** 推荐包管理器（Node 系模板） */
  packageManager?: PackageManager;
  /**
   * 模板内置变量。会与 `defaultVariables()` 合并，供共享层（`templates/_shared`）渲染，
   * 例如 `stack` / `installCommand` / `buildCommand` / `testCommand`。
   */
  variables?: Record<string, string>;
}

export interface Template {
  manifest: TemplateManifest;
  /** 模板源目录绝对路径 */
  dir: string;
}

export interface GenerateOptions {
  template: Template;
  /**
   * 共享层目录（如 `templates/_shared`）。先复制共享层，再用模板同名文件覆盖，
   * 从而实现「AI 开发环境所有项目通用 + 技术栈差异由模板提供」。
   */
  sharedDir?: string;
  /** 目标目录绝对路径 */
  targetDir: string;
  /** 渲染变量，见 `defaultVariables()` */
  variables: Record<string, string>;
  /** 是否执行 git init */
  initGit?: boolean;
  /** 目标目录已存在且非空时是否覆盖 */
  force?: boolean;
  onProgress?: (message: string) => void;
}

export interface GenerateResult {
  targetDir: string;
  /** 相对目标目录的、渲染后的文件列表 */
  files: string[];
  /** 发生重命名的文件，如 `_gitignore` → `.gitignore` */
  renamed: Array<{ from: string; to: string }>;
}

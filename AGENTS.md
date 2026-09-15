# AGENTS.md

本文件是本仓库（`@excellence-wh/cz` 脚手架 monorepo）的**单一事实源**。所有 AI 工具（Claude Code、Cursor、Copilot、Windsurf、Gemini CLI、Aider、Cline…）都应以它为准。

## 这是什么仓库

一个「AI-first 项目脚手架」：

- `apps/cli` — 交互式生成器 `@excellence-wh/cz`（bin：`cz` / `create-cz`）
- `packages/core` — 生成引擎（模板解析、变量替换、去重叠复制、后置步骤）
- `packages/templates` — 模板素材，位于 `packages/templates/templates/`
  - `_shared/`：所有模板共享的 AI 开发环境层（本文件的「模板版」就是它）
  - `<id>/`：各技术栈模板，会覆盖 `_shared/` 的同名文件
- `config/` — 跨项目共享配置（`mcp.json`）
- `deploy/` + `.devcontainer/` — 开发容器（Node + pnpm + Go）
- `scripts/` — 仓库级校验（`repo-config.test.mjs` / `e2e-templates.mjs`）
- `.changeset/` — 版本与发布

## 常用命令

| 目的 | 命令 |
| --- | --- |
| 安装依赖 | `pnpm install` |
| 构建全部 | `pnpm build` |
| 类型检查 | `pnpm typecheck` |
| Lint / 格式 | `pnpm lint` / `pnpm lint:fix` |
| 测试（单测 + 模板冒烟） | `pnpm test` |
| 仓库配置校验 | `pnpm test:repo` |
| 重型端到端（真装依赖） | `pnpm test:e2e` |
| 死代码检查 | `pnpm knip` |
| **一次性全量校验** | `pnpm verify` |
| 本地运行生成器 | `pnpm cli -- --help` |
| 记录变更 / 发布 | `pnpm changeset` / `pnpm release` |

> 提交前 / 宣告任务完成前，务必跑 `pnpm verify`（已含 `test:repo`）。

## 测试策略

改动哪一块，就至少要跑对应的一层：

| 改动 | 必须验证 |
| --- | --- |
| `packages/core` 引擎 | `pnpm --filter @excellence-wh/core test` |
| `apps/cli` 参数 / 流程 | `pnpm --filter @excellence-wh/cz test`（含全模板生成冒烟） |
| 模板文件 / `_shared/` | `pnpm --filter @excellence-wh/cz test`（会断言零残留 `{{占位符}}`） |
| 版本、发布、容器、`config/` | `pnpm test:repo` |
| 模板依赖升级 / 构建脚本 | `pnpm test:e2e`（真 `install` + `verify`） |

## 硬性约定

- **ESM only**，Node `>=20.19.0`，包管理用 pnpm workspace。
- 包 scope 为 `@excellence-wh/*`；内部依赖用 `workspace:*`；仓库内部共享的 devDependencies 写 `catalog:`。
- 源码内部导入使用 **`.ts`** 扩展名；构建时由 `rewriteRelativeImportExtensions` 重写为 `.js`，
  这样 `node --test` 能直接跑 TS 源码（Node 24 type stripping），无需额外构建步骤。
- **模板不是源码**：`packages/templates/templates/**` 不参与 lint / typecheck / knip（见 `biome.json`、`knip.json`、根 `tsconfig.json`）。
- 模板里的占位符统一写成 `{{变量名}}`，变量由模板的 `template.json` 声明并提供默认值。
- 新增模板后，必须实际生成一次并跑通其 `verify`，才算完成。

## 目录约定

```
apps/cli/src/           # index.ts（入口）/ args.ts（参数）/ run.ts（流程编排）
apps/cli/test/          # args / 模板完整性 / 全模板端到端生成
packages/core/src/      # types.ts / variables.ts / templates.ts / generate.ts / index.ts
packages/core/test/     # variables / templates / generate
packages/templates/
  src/index.ts          # 导出 templatesDir
  templates/_shared/    # 共享 AI 环境层
  templates/<id>/       # 技术栈模板
scripts/                # repo-config.test.mjs（配置校验）/ e2e-templates.mjs（重型端到端）
```

## 发布

可发布包：`@excellence-wh/cz`、`@excellence-wh/core`、`@excellence-wh/templates`（其余 `private`）。
用 changesets 管理版本：`pnpm changeset` → `pnpm version-packages` → `pnpm release`。
各包用 `files` 白名单决定发布内容，`publishConfig.access` 为 `public`。

## 改动模板时的注意点

1. 文件内容与**路径**都会做变量替换，所以路径里也可以出现 `{{name}}`。
2. npm 会剔除点文件，因此需要提交的点文件用下划线前缀命名（`_gitignore` → 生成后为 `.gitignore`）。
3. 模板若声明 `_gitignore`，会**整体覆盖** `_shared/_gitignore`（不做行级合并）。
4. Go 模板需在根 `go.mod` / `go.sum` 中锁定依赖，保证生成后无需 `go mod tidy` 即可构建。
5. 前端模板默认开启 vitest `globals: true`，否则 Testing Library 的自动 cleanup 不生效。

## 文档

- `docs/adr/` — 架构决策记录（见 `0001-scaffold-architecture.md`）
- `docs/spec/` — 规格说明
- `config/README.md` / `deploy/README.md` / `.changeset/README.md` — 各自子系统的说明

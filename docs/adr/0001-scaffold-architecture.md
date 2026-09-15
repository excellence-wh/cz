# ADR 0001：脚手架架构与关键取舍

- 状态：已接受
- 日期：2025

## 背景

需要一个「面向 AI 协作优先」的项目脚手架：既能一条命令生成 react / node / go / ts 项目，
又要让生成结果自带一套**对所有 AI Agent 通用**的开发环境，避免每个项目重复搭建。

## 决策

### 1. 本仓库形态：可发布的 CLI 生成器（而非模板仓库）

根包 `@excellence-wh/monorepo` 只做编排（`private: true`），真正的 bin 在 `apps/cli`
（`@excellence-wh/cz`，bin `cz` / `create-cz`）。生成逻辑抽到 `packages/core`，
模板素材独立到 `packages/templates`，三者可分别发布、独立演进。

**理由**：模板是数据、引擎是逻辑、CLI 是交付界面，职责分离后引擎可单测、模板可独立验证。

### 2. 模板引擎：`_shared/` 共享层 + 模板层覆盖

`templates/_shared/` 承载所有项目通用的 AI 开发环境（`AGENTS.md` + 各工具适配层 + `docs/adr`/`docs/spec`）。
生成时先铺共享层，再用具体模板的同名文件覆盖。

**理由**：AI 环境的维护成本集中在共享层，新增技术栈只需写栈特有文件；
`AGENTS.md` 作为单一事实源，其余工具的适配文件都指向它——对所有 Agent 通用，而不是绑定某一家。

### 3. 变量替换 `{{key}}` 同时作用于内容与路径

未知变量原样保留（暴露模板笔误）。`_gitignore` / `_npmignore` 加下划线前缀，
生成时重命名为点文件。

**理由**：npm 发布时会剔除点文件，下划线前缀是保证 dotfile 能进入 tarball 的通用做法。

### 4. 仓库内部用 `catalog:`，模板保持自包含版本号

`apps/*`、`packages/*` 共享的 devDependencies 通过 `pnpm-workspace.yaml` 的 `catalog:` 统一；
模板里的依赖写显式 `^x.y.z`。

**理由**：模板会被发布并在仓库外使用，`catalog:` 在脱离本仓库的环境无法解析；
自包含是「生成的项目能独立 `pnpm install`」的前提。

### 5. 发布用 changesets + `files` 字段（不用 `publishConfig.directory`）

使用 `@changesets/cli` 管理版本，各包用 `files` 白名单决定发布内容
（`core`/`cz` 发 `dist`，`templates` 发 `dist` + `templates`）。

**理由**：`publishConfig.directory` 需要额外把 `package.json` 复制进产物目录并做字段裁剪，
用 `files` 白名单更简单，且与 changesets 的 `workspace:*` → 实际版本替换行为天然契合。

### 6. Go 模板锁定 `go.mod` / `go.sum`

`go-gin` 模板内置完整的 `go.mod`（间接依赖齐全）与 `go.sum`。

**理由**：生成后无需 `go mod tidy` 即可 `go build`，减少 AI Agent 首次构建的失败面。

## 后果

- 新增模板必须通过「生成 → 零残留占位符 → 可选 install+verify」的自动化校验（见 `apps/cli/test`、`scripts/e2e-templates.mjs`）。
- 共享层任何占位符变更都会立即波及所有模板，因此 `apps/cli/test/templates.test.ts`
  强制每个模板声明共享层所需的全部变量。
- 仓库源码内部导入写 `.ts` 扩展名，构建时由 TS 的 `rewriteRelativeImportExtensions` 重写为 `.js`，
  这样 Node 能直接运行 TS 测试（type stripping），无需额外的测试构建步骤。

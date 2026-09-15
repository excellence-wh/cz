# @excellence-wh/cz

> AI-first 的项目脚手架。生成 react / node / go / ts 项目，并内置面向**所有 AI Agent**（Claude Code、Cursor、Copilot、Windsurf、Gemini CLI、Aider、Cline…）的开发环境。

## 这个仓库是什么

它不是业务产品，而是一套「现代化 + AI 协作优先」的工程底座，同时以两种形态交付：

1. **交互式生成器**：`@excellence-wh/cz`（bin：`cz`）—— 一条命令生成新项目。
2. **生成结果自带 AI 开发环境**：
   - 单一事实源 `AGENTS.md` + 各工具的薄适配层
   - 强护栏：`typecheck / lint / test / verify`，让 AI 改代码不容易跑偏
   - `docs/adr`、`docs/spec` 等可被 Agent 读取的上下文
   - MCP server 配置

## 仓库结构

```
apps/
  cli/                # @excellence-wh/cz：交互式生成器入口（bin: cz / create-cz）
packages/
  core/               # @excellence-wh/core：生成引擎（模板解析 / 变量替换 / 文件落盘 / 后置步骤）
  templates/          # @excellence-wh/templates：模板素材（非源码，不参与构建）
    templates/
      _shared/        # 所有模板共享的 AI 开发环境层（AGENTS.md + 各工具适配层）
      ts-cli/         # TypeScript CLI
      node-lib/       # TypeScript 库（rolldown 打包）
      react-vite/     # React SPA（Vite）
      react-next/     # React 全栈（Next.js App Router）
      go-service/     # Go HTTP 服务（标准库 net/http）
      go-gin/         # Go HTTP 服务（Gin）
config/               # 跨项目共享配置（mcp.json 等）
deploy/               # docker / devcontainer 构建素材
docs/                 # 架构与规范文档（Agent 的上下文）
scripts/              # 仓库级脚本（仓库配置校验 / 重型端到端）
.devcontainer/        # 开发容器入口（引用 deploy/devcontainer/Dockerfile）
.changeset/           # 版本与发布管理
```

## 模板矩阵

| id | kind | 技术栈 | 开箱校验 |
| --- | --- | --- | --- |
| `ts-cli` | ts | Node + TypeScript CLI（ESM，零依赖） | lint / typecheck / test / build |
| `node-lib` | node | TypeScript 库，**rolldown** 打包 ESM+CJS + 类型声明 | lint / typecheck / test / build |
| `react-vite` | react | React 19 + Vite 8 + Zustand + Vitest | lint / typecheck / test / build |
| `react-next` | react | Next.js 16 App Router + React 19 + Zustand | lint / typecheck / test / build |
| `go-service` | go | Go 1.27 标准库 `net/http`（零依赖） | gofmt / vet / test / build |
| `go-gin` | go | Go 1.27 + Gin v1.12（依赖已锁定） | gofmt / vet / test / build |

## 使用

```bash
# 交互式
pnpm dlx @excellence-wh/cz

# 直接指定模板
pnpm dlx @excellence-wh/cz my-app -t react-next

# 查看可用模板
pnpm dlx @excellence-wh/cz --list
```

生成的项目会：

1. 铺上 `_shared/` 的 AI 开发环境（`AGENTS.md` + Claude / Cursor / Copilot / Windsurf / Gemini / Aider / Cline 适配层）
2. 覆盖上对应技术栈的源码、`tsconfig` / `biome` / 测试
3. 自动 `git init`（可用 `--no-git` 关闭）并按模板决定是否安装依赖（`--no-install` 关闭）

每个生成的项目都能一条命令自检：

```bash
pnpm verify   # 前端 / Node 项目
go vet ./... && go test ./... && go build ./...   # Go 项目
```


## 测试

分三层，从快到慢：

| 层 | 命令 | 内容 | 是否进 CI |
| --- | --- | --- | --- |
| 单元 / 冒烟 | `pnpm test` | `core` 引擎单测（26）+ `cli` 参数与**全模板端到端生成**（13） | ✅ |
| 仓库配置 | `pnpm test:repo` | workspace 规范、**真实 `pnpm pack` 发布产物**、changesets、npm 发布配置、devcontainer、`config/mcp.json`（28） | ✅ |
| 重型端到端 | `pnpm test:e2e` | 每个模板真正 `生成 → install → verify` | 手动 |

```bash
pnpm build      # 重型 e2e 与 pack 测试依赖构建产物
pnpm test:repo
pnpm test:e2e
```

> `pnpm test` 里的端到端会断言每个模板生成后：AI 适配层齐全（`AGENTS.md` +
> 8 个工具适配文件）、点文件已重命名、**零残留 `{{占位符}}`**、`package.json` / `go.mod` 正确。

## 本地开发

```bash
pnpm install
pnpm build          # turbo 构建全部 workspace
pnpm verify         # lint + typecheck + test + test:repo + build 一把过
pnpm knip           # 死代码 / 未用依赖检查
pnpm cli -- --list  # 本地运行生成器
```

## 发布

可发布包：`@excellence-wh/cz`、`@excellence-wh/core`、`@excellence-wh/templates`。

### 自动发布（推荐）

`.github/workflows/release.yml` 使用 `changesets/action@v2`（对应 changesets v3）：
推送到 `main` 时，若有 changeset 就开一个「版本 PR」（自动生成 CHANGELOG 并 bump 版本）；
合并该 PR 即自动 `build` + `publish`。也可用 `workflow_dispatch` 手动触发一次。

首次启用需要三步：

1. **确认 scope 归属**：npm 用户名恰为 `excellence-wh`，或建一个同名 org 并把自己加进去。
2. **开启版本 PR 权限**：仓库 `Settings → Actions → General` 勾选
   *Allow GitHub Actions to create and approve pull requests*（否则开 PR 会失败）。
3. **写入 token**：在 npm 生成 Access Token（Automation 或 Granular，读写）并保存：

   ```bash
   gh secret set NPM_TOKEN
   ```

> 未配置 `NPM_TOKEN` 时，workflow 仍会正常跑：`publish-script` 会被置空，
> 只维护版本 PR，**不会**尝试把 `0.0.0` 发出去。

### 发布顺序（先配 token，再合并版本 PR）

合并版本 PR 会把 changeset 消费掉、版本变成 `0.1.0`。若此时还没配 token，
就没有东西再触发发布了。因此正确顺序是：

```
gh secret set NPM_TOKEN        # 1. 先配 token
# 2. 再合并版本 PR -> 自动发布 0.1.0
```

顺序搞反了也不要紧：配好 token 后跑一次
`gh workflow run Release`（`workflow_dispatch`）即可补发。

### 实测的摩擦点

- **版本 PR 的 CI 会卡 `action_required`**：PR 由 `github-actions[bot]` 创建，
  在默认 `first_time_contributors` 策略下需点一次 *Approve and run*，
  且分支每次被更新都会重新要批准。想免掉就配 `RELEASE_TOKEN`（fine-grained PAT，
  `contents: write` + `pull-requests: write`）：

  ```bash
  gh secret set RELEASE_TOKEN
  ```

  workflow 会自动优先用它，未配置时回落默认 token。
- **锁文件不会因为 bump 失效**：`pnpm-lock.yaml` 不记录 workspace 包自身版本
  （只记 specifier），所以版本 PR 上 `pnpm install --frozen-lockfile` 依然能跑通。

> 想彻底不用长期 token，可改用 npm **trusted publishing**（OIDC）：
> 首次发布仍需 token，之后在 npmjs 配置 trusted publisher，
> 并把 workflow 换成 `changesets/action/{version,publish}` 子 action 以收紧权限。

### 手动发布

```bash
pnpm changeset          # 记录变更（选包 → semver → 说明）
pnpm version-packages   # 升版本 + 写 CHANGELOG + 回写内部依赖范围
pnpm release            # 构建 + 发布
```

> 开发机全局 registry 若指向镜像，发布会被拦。仓库根 `.npmrc` 已把
> `@excellence-wh` 单独钉到 `registry.npmjs.org`，安装其余依赖仍走镜像。

### 发布产物自检

`pnpm test:repo` 会对每个可发布包真实执行 `pnpm pack` 并解包断言：
files 白名单生效、入口/bin 存在、**无 `workspace:` 协议残留**、
不泄漏源码与测试、`publishConfig.access` 为 public。

详见 [`.changeset/README.md`](./.changeset/README.md)。

## 约定

- 包管理：pnpm workspace；仓库内部共享的 devDependencies 用 `catalog:` 统一版本
  （模板素材保持自包含版本号，保证生成的项目可独立安装）
- 构建编排：turbo；源码内部导入写 `.ts`，构建时由 `rewriteRelativeImportExtensions` 重写为 `.js`
- Lint/Format：biome（JS/TS/JSON），其余文件类型由 `.editorconfig` 兜底
- 版本：Node `>=20.19.0`，ESM only

## AI Agent 接入

见 [`AGENTS.md`](./AGENTS.md)。所有工具都以它为单一事实源。

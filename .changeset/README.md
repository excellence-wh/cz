# Changesets

本目录用于管理 `@excellence-wh/*` 各包的版本与变更日志。

## 发布流程

1. 改动完成后，为受影响的包添加 changeset：

   ```bash
   pnpm changeset
   ```

   选择包 → 选择 semver 级别（patch / minor / major）→ 写一句变更说明。

2. 提交 changeset 文件（`.changeset/*.md`）。

3. 在 `main` 上执行版本与发布：

   ```bash
   pnpm version-packages   # 消费 changeset：升版本、写 CHANGELOG、改内部依赖范围
   pnpm release            # 构建 + 发布到 npm
   ```

## 说明

- 可发布包：`@excellence-wh/cz`、`@excellence-wh/core`、`@excellence-wh/templates`
  （`@excellence-wh/monorepo` 为 private，不发布）。
- 内部依赖使用 `workspace:^`，发布时会被替换为实际版本范围。
- `access` 为 `public`，配合各包 `publishConfig.access` 发布到公共 registry。
- 根 `.npmrc` 把 `@excellence-wh` 钉到 `registry.npmjs.org`；开发机全局 registry 若为镜像也不影响发布。

## CI 自动发布

`.github/workflows/release.yml` 使用 `changesets/action@v2`（v1 只兼容 changesets v2）在推送到 `main` 后：

1. 若存在 changeset → 自动开一个「版本 PR」（跑 `pnpm version-packages`）。
2. 合并该 PR → 自动跑 `pnpm release`（`build` + `changeset publish`）。

首次启用需要：

1. 确认 npm 上拥有 `@excellence-wh` scope（用户名恰为 `excellence-wh`，或建同名 org）。
2. 仓库 `Settings → Actions → General` 勾选 *Allow GitHub Actions to create and approve pull requests*。
3. 生成 npm Access Token（读写权限），写入仓库 secret：

   ```bash
   gh secret set NPM_TOKEN
   ```

### 发布顺序：先配 token，再合并版本 PR

合并版本 PR 会消费 changeset 并把版本改成 `0.1.0`；若此时还没配 token，
就再没有东西触发发布了。正确顺序是先 `gh secret set NPM_TOKEN`，再合并版本 PR。
顺序搞反了也不怕：`gh workflow run Release` 手动补发一次即可。

### 四个容易踩的坑

- **凭证变量名**：`actions/setup-node` 生成的 `.npmrc` 读的是 **`NODE_AUTH_TOKEN`**，
  而 `changesets/action` v2 不会把 `NPM_TOKEN` 映射过去，因此 workflow 里两个都设了。
- **无 token 时的行为**：`publish-script` 带守卫表达式，未配置 `NPM_TOKEN` 时置空，
  action 只维护版本 PR，不会尝试发布 `0.0.0`。
- **不要用旧 input 名**：v2 已把 `publish/version/commit/title` 改名为
  `publish-script/version-script/commit-message/pr-title`，传旧名会直接报错。
- **版本 PR 的 CI 需要批准一次**：版本 PR 由 `github-actions[bot]` 创建，
  在默认的 `first_time_contributors` 审批策略下会卡在 `action_required`，
  需要在 PR 上点一次 *Approve and run*。想完全免掉就给 `github-token` 传一个 PAT。

> 发布时会带 npm provenance（`id-token: write` + `NPM_CONFIG_PROVENANCE=true`），
> 因此**必须**在 GitHub Actions 里发布，本地 `pnpm release` 不带证明。

## 发布产物自检

```bash
pnpm build && pnpm test:repo
```

会对每个可发布包真实执行 `pnpm pack` 并解包断言：files 白名单生效、
入口 / `bin` 存在、无 `workspace:` 残留、不泄漏源码与测试、`access` 为 public。

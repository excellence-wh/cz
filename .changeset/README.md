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
- 内部依赖使用 `workspace:*`，发布时会被替换为实际版本号。
- `access` 为 `public`，配合各包 `publishConfig.access` 发布到公共 registry。

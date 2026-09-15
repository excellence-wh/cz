# deploy

本目录存放与「开发 / 运行环境」相关的构建素材。

```
deploy/
  devcontainer/Dockerfile   # 开发容器镜像：Node 24 + pnpm + Go + git
```

## Dev Container

仓库根目录的 `.devcontainer/devcontainer.json` 会引用本目录的 Dockerfile，
在 VS Code / GitHub Codespaces 中「Reopen in Container」即可获得一套开箱可用的环境：

- Node.js 24（含 corepack，pnpm 版本由 `packageManager` 字段决定）
- Go 1.27（用于验证 `go-service` / `go-gin` 模板）
- git、biome 扩展、`.editorconfig` 支持

容器创建后会自动执行 `pnpm install`。

> Dockerfile 未在本仓库 CI 中构建（CI 只需 Node 即可跑全部 lint / test / build）。
> 如需校验镜像，可在本地执行：
>
> ```bash
> docker build -f deploy/devcontainer/Dockerfile -t cz-dev .
> ```

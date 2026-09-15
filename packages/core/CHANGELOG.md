# @excellence-wh/core

## 0.1.0

### Minor Changes

- 157cbba: 首次发布。
  
  - `@excellence-wh/core`：模板生成引擎 —— 模板发现与清单校验、`{{key}}` 变量渲染（内容与路径）、
    `_shared` 共享层与模板层覆盖、点文件重命名、二进制原样复制。
  - `@excellence-wh/templates`：6 套技术栈模板（`ts-cli` / `node-lib` / `react-vite` /
    `react-next` / `go-service` / `go-gin`）与对所有 AI Agent 通用的开发环境层
    （`AGENTS.md` 单一事实源 + Claude / Cursor / Copilot / Windsurf / Gemini / Aider / Cline 适配层）。
  - `@excellence-wh/cz`：交互式生成器（bin：`cz` / `create-cz`），支持交互与非交互两种模式，
    生成后自动 `git init` 并安装依赖。

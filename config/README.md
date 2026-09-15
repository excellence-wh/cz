# config

跨项目共享的配置（本仓库自身 + 由模板生成的项目都可参考）。

## `mcp.json`

面向 AI Agent 的 MCP（Model Context Protocol）服务器清单。各工具读取方式不同：

| 工具 | 读取位置 |
| --- | --- |
| Claude Code | `.mcp.json` / `claude mcp add` |
| Cursor | `.cursor/mcp.json` |
| VS Code Copilot | `.vscode/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |

由本仓库模板生成的项目会自带一份 `mcp.json`（见 `packages/templates/templates/_shared/mcp.json`），
本文件是脚手架仓库自身使用的版本，两者内容保持同一套服务器集合。

`uvx` 需要本机安装 [uv](https://docs.astral.sh/uv/)；纯 Node 环境可删除 `git` 一项。

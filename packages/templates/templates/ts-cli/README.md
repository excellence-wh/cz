# {{name}}

{{description}}

## 使用

```bash
{{installCommand}}
{{buildCommand}}
node dist/index.js --name cz
```

## 开发

| 目的 | 命令 |
| --- | --- |
| 安装依赖 | `{{installCommand}}` |
| 开发（watch） | `{{devCommand}}` |
| 构建 | `{{buildCommand}}` |
| 类型检查 | `{{typecheckCommand}}` |
| Lint / 格式 | `{{lintCommand}}` |
| 测试 | `{{testCommand}}` |
| 全量校验 | `{{verifyCommand}}` |

## AI 开发环境

本项目内置面向所有 AI Agent 的开发环境：

- [`AGENTS.md`](./AGENTS.md) —— 规则**单一事实源**，所有工具都指向它
- `CLAUDE.md`、`GEMINI.md`、`.cursor/`、`.github/copilot-instructions.md`、`.windsurfrules`、`.clinerules`、`.roo/`、`.aider.conf.yml` —— 各工具薄适配层
- `docs/adr/` —— 架构决策记录
- `docs/spec/` —— 需求 / 设计说明
- `mcp.json` —— MCP server 配置

> 新增规则请只改 `AGENTS.md`，不要改适配层。

## License

MIT

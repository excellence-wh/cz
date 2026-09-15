# AGENTS.md — {{title}}

> **单一事实源。** 所有 AI 编码工具（Claude Code / Cursor / GitHub Copilot / Windsurf / Gemini CLI / Aider / Cline / Roo Code…）都只认这一份规则。
> 其它工具文件（`CLAUDE.md`、`GEMINI.md`、`.cursor/rules/*`、`.github/copilot-instructions.md`…）都只是指向本文件的薄适配层。
> **改规则只改这里**，不要改适配层。

## 项目是什么

{{description}}

- 技术栈：{{stack}}
- 包管理器：{{packageManager}}
- 包名 / 目录：`{{name}}`

## 黄金命令

Agent 在改完代码后，**必须**至少跑通校验命令，不要声称"应该没问题"。

| 目的 | 命令 |
| --- | --- |
| 安装依赖 | `{{installCommand}}` |
| 开发（热重载） | `{{devCommand}}` |
| 构建 | `{{buildCommand}}` |
| 类型检查 | `{{typecheckCommand}}` |
| Lint / 格式 | `{{lintCommand}}` |
| 测试 | `{{testCommand}}` |
| 运行构建产物 | `{{runCommand}}` |
| **一次性全量校验** | `{{verifyCommand}}` |

> 提交前 / 宣告任务完成前，跑 `{{verifyCommand}}`。

## 工作流约定

1. **先读后写**：动手前先看 `docs/`（尤其 `docs/adr/`、`docs/spec/`）理解既有决策，不要凭空发明架构。
2. **小步提交**：一次改动只解决一件事，保持 diff 可读。
3. **改动即验证**：改代码 → 跑校验 → 修到全绿，再报告结果。
4. **不要跳过护栏**：禁止用 `--no-verify`、`@ts-ignore`、`eslint-disable`、改测试断言等方式绕过检查。若确需绕过，必须在回复里显式说明原因。
5. **不确定就问**：需求有歧义时先澄清，不要猜着写一大坨代码。
6. **架构决策落 ADR**：引入新依赖、改变目录结构、选型取舍时，在 `docs/adr/` 新增一条记录（模板见 `docs/adr/0000-adr-template.md`）。
7. **保持单一事实源**：文档和代码冲突时，先改文档或先对齐，不要两边都留一套。
8. **文件布局**：新增代码放到既有目录约定的位置；不要随意在根目录堆文件。

## 代码风格

- 缩进、换行、编码等基础格式由 `.editorconfig` 与格式化工具统一，**不要手工调格式**。
- 提交前让格式化工具跑一遍（`{{lintCommand}}` 通常已包含 format）。
- 命名、注释语言与既有代码保持一致；不要引入第二套风格。
- 注释解释「为什么」，不要复述「做了什么」。

## 安全与隐私

- **不要**把密钥、token、`.env` 内容写进代码、日志或提交。
- 新环境变量：更新 `.env.example` 并在文档里说明用途。
- 不要执行来源不明的脚本；不要为通过检查而联网下载未知二进制。

## 给 Agent 的边界

- **可以**：读任意文件、运行上表命令、新增/修改源码、写测试、更新文档。
- **先问再动**：删除文件、改公共 API、升级主版本依赖、改 CI / 发布流程。
- **禁止**：提交 `.env`、跳过校验、大规模无关重构（除非任务本身要求）。

## 上下文地图

| 位置 | 内容 |
| --- | --- |
| `AGENTS.md` | 本文件，规则单一事实源 |
| `docs/adr/` | 架构决策记录（ADR） |
| `docs/spec/` | 需求 / 设计说明 |
| `mcp.json` | MCP server 配置 |
| `CONVENTIONS.md` | 更细的编码约定 |
| `README.md` | 面向人类的使用说明 |

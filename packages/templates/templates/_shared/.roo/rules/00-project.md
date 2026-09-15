# Roo Code 项目规则

唯一事实源：仓库根目录的 `AGENTS.md`。请先完整阅读并遵循。

- 技术栈：{{stack}}；包管理器：{{packageManager}}
- 改动后运行 `{{verifyCommand}}`，全绿才算完成
- 禁止用 `--no-verify` / `@ts-ignore` / `eslint-disable` 绕过检查
- 架构决策写入 `docs/adr/`
- 不要把密钥或 `.env` 写进代码

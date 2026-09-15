# {{name}}

{{description}}

## 安装

```bash
{{installCommand}}
{{buildCommand}}
```

## 使用

```ts
import { slugify, capitalize, truncate } from "{{name}}";

slugify("Hello, World"); // "hello-world"
```

支持 ESM（`dist/index.js`）与 CJS（`dist/index.cjs`），类型声明见 `dist/index.d.ts`。

## 开发

| 目的 | 命令 |
| --- | --- |
| 安装依赖 | `{{installCommand}}` |
| 构建（rolldown 打包 + tsc 出类型） | `{{buildCommand}}` |
| 开发（watch） | `{{devCommand}}` |
| 类型检查 | `{{typecheckCommand}}` |
| Lint / 格式 | `{{lintCommand}}` |
| 测试 | `{{testCommand}}` |
| 全量校验 | `{{verifyCommand}}` |

## AI 开发环境

见 [`AGENTS.md`](./AGENTS.md)。所有 AI 工具都以它为单一事实源。

## License

MIT

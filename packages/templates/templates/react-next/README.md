# {{name}}

{{description}}

Next.js 16 App Router 全栈应用，React 19 + Zustand 状态管理。

## 开发

```bash
{{installCommand}}
{{devCommand}}      # http://localhost:3000
```

| 目的 | 命令 |
| --- | --- |
| 安装依赖 | `{{installCommand}}` |
| 开发服务器 | `{{devCommand}}` |
| 生产构建 | `{{buildCommand}}` |
| 启动产物 | `{{runCommand}}` |
| 类型检查 | `{{typecheckCommand}}` |
| Lint / 格式 | `{{lintCommand}}` |
| 测试 | `{{testCommand}}` |
| 全量校验 | `{{verifyCommand}}` |

## 结构

```
app/
  layout.tsx     根布局（Server Component）
  page.tsx       首页（Server Component）
  counter.tsx    计数器（Client Component）
  globals.css    全局样式
lib/
  store.ts       Zustand 状态
  store.test.ts  单元测试
```

## AI 开发环境

见 [`AGENTS.md`](./AGENTS.md)。所有 AI 工具都以它为单一事实源。

## License

MIT

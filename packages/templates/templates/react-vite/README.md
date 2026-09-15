# {{name}}

{{description}}

React 19 单页应用，使用 Vite 构建、Zustand 管理状态。

## 开发

```bash
{{installCommand}}
{{devCommand}}      # http://localhost:5173
```

| 目的 | 命令 |
| --- | --- |
| 安装依赖 | `{{installCommand}}` |
| 开发服务器 | `{{devCommand}}` |
| 构建产物 | `{{buildCommand}}` |
| 预览产物 | `{{runCommand}}` |
| 类型检查 | `{{typecheckCommand}}` |
| Lint / 格式 | `{{lintCommand}}` |
| 测试 | `{{testCommand}}` |
| 全量校验 | `{{verifyCommand}}` |

## 结构

```
src/
  main.tsx       应用入口
  App.tsx        根组件
  store.ts       Zustand 状态
  App.test.tsx   组件测试
  test/setup.ts  测试环境初始化
```

## AI 开发环境

见 [`AGENTS.md`](./AGENTS.md)。所有 AI 工具都以它为单一事实源。

## License

MIT

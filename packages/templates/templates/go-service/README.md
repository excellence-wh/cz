# {{name}}

{{description}}

基于 Go 标准库 `net/http` 的 HTTP 服务，零第三方依赖。

## 运行

```bash
{{devCommand}}      # 默认监听 :8080
ADDR=:3000 {{devCommand}}
```

| 路由 | 说明 |
| --- | --- |
| `GET /healthz` | 健康检查 |
| `GET /hello/{name}` | 示例接口 |

## 开发

| 目的 | 命令 |
| --- | --- |
| 下载依赖 | `{{installCommand}}` |
| 运行 | `{{devCommand}}` |
| 构建 | `{{buildCommand}}` |
| 静态检查 | `{{typecheckCommand}}` |
| 格式检查 | `{{lintCommand}}` |
| 测试 | `{{testCommand}}` |
| 全量校验 | `{{verifyCommand}}` |

## AI 开发环境

见 [`AGENTS.md`](./AGENTS.md)。所有 AI 工具都以它为单一事实源。

## License

MIT

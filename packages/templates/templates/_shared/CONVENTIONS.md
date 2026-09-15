# CONVENTIONS.md

更细的编码约定。规则总纲见 [`AGENTS.md`](./AGENTS.md)。

## 通用

- 只写必要的注释，解释「为什么」而非「做了什么」。
- 命名：变量/函数用 camelCase，类型/类用 PascalCase，常量用 UPPER_SNAKE_CASE，文件名与主流约定一致。
- 不要提交被注释掉的死代码，用 git 历史即可。
- 提交信息：`<type>(<scope>): <subject>`，type ∈ feat / fix / docs / refactor / test / chore / perf / build / ci。
- 一次提交一个逻辑改动，避免"顺手清理"混入功能改动。

## 文档

- 面向使用者的说明写进 `README.md`。
- 架构决策写进 `docs/adr/`（一条一个文件，编号递增）。
- 需求/设计写进 `docs/spec/`。
- 改了行为就同步改文档；文档与代码必须一致。

## 依赖

- 新增依赖前先评估：是否必要？能否用标准库/现有依赖替代？维护状态如何？
- 新增依赖必须在 `docs/adr/` 留一条记录。

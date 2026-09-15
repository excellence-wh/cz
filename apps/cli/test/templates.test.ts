import assert from "node:assert/strict";
import { basename } from "node:path";
import { describe, it } from "node:test";
import { loadTemplates } from "@excellence-wh/core";
import { templatesDir } from "@excellence-wh/templates";

/**
 * 共享层 `_shared` 会引用这些变量。任何模板都必须提供，
 * 否则生成结果会残留 `{{...}}` 占位符。
 */
const REQUIRED_VARIABLES = [
  "stack",
  "packageManager",
  "installCommand",
  "devCommand",
  "buildCommand",
  "typecheckCommand",
  "lintCommand",
  "testCommand",
  "runCommand",
  "verifyCommand",
] as const;

const EXPECTED_IDS = ["go-gin", "go-service", "node-lib", "react-next", "react-vite", "ts-cli"];

const VALID_KINDS = new Set(["ts", "node", "react", "go"]);

describe("模板目录", () => {
  it("包含全部预期模板", async () => {
    const ids = (await loadTemplates(templatesDir)).map((t) => t.manifest.id).sort();
    assert.deepEqual(ids, EXPECTED_IDS);
  });

  it("manifest id 与目录名一致、kind 合法、tags 非空", async () => {
    const templates = await loadTemplates(templatesDir);
    assert.ok(templates.length > 0);

    for (const { manifest, dir } of templates) {
      assert.equal(manifest.id, basename(dir), `${manifest.id} 的 id 与目录名不一致`);
      assert.ok(VALID_KINDS.has(manifest.kind), `${manifest.id} 的 kind 非法：${manifest.kind}`);
      assert.ok(manifest.tags.length > 0, `${manifest.id} 未声明 tags`);
      assert.ok(manifest.description.length > 0, `${manifest.id} 缺少 description`);
    }
  });

  it("每个模板都提供共享层所需的全部变量", async () => {
    const templates = await loadTemplates(templatesDir);

    for (const { manifest } of templates) {
      for (const key of REQUIRED_VARIABLES) {
        const value = manifest.variables?.[key];
        assert.ok(
          typeof value === "string" && value.length > 0,
          `${manifest.id} 缺少共享层变量：${key}`,
        );
      }
    }
  });

  it("variables 中不含未渲染的占位符", async () => {
    const templates = await loadTemplates(templatesDir);

    for (const { manifest } of templates) {
      for (const [key, value] of Object.entries(manifest.variables ?? {})) {
        assert.ok(!value.includes("{{"), `${manifest.id} 的变量 ${key} 含占位符：${value}`);
      }
    }
  });
});

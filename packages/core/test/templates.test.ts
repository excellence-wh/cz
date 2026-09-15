import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { loadTemplate, loadTemplates } from "../src/templates.ts";

const validManifest = (id: string, title: string, kind = "ts") => ({
  id,
  title,
  description: `${title} description`,
  kind,
  tags: [id],
});

async function makeTemplatesDir(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "cz-templates-"));
  const base = join(root, "templates");

  await mkdir(join(base, "alpha"), { recursive: true });
  await mkdir(join(base, "beta"), { recursive: true });
  await mkdir(join(base, "not-a-template"), { recursive: true });
  await mkdir(join(base, "invalid"), { recursive: true });

  await writeFile(
    join(base, "alpha", "template.json"),
    JSON.stringify(validManifest("alpha", "Alpha")),
  );
  await writeFile(
    join(base, "beta", "template.json"),
    JSON.stringify(validManifest("beta", "Beta", "go")),
  );
  // 结构不完整：id 不是字符串
  await writeFile(join(base, "invalid", "template.json"), JSON.stringify({ id: 1 }));

  return base;
}

describe("loadTemplates", () => {
  it("只加载合法 manifest 的目录，并按 title 排序", async () => {
    const dir = await makeTemplatesDir();
    const templates = await loadTemplates(dir);

    assert.deepEqual(
      templates.map((t) => t.manifest.id),
      ["alpha", "beta"],
    );
  });

  it("忽略没有 manifest 与 manifest 非法的目录", async () => {
    const dir = await makeTemplatesDir();
    const ids = (await loadTemplates(dir)).map((t) => t.manifest.id);

    assert.ok(!ids.includes("not-a-template"));
    assert.ok(!ids.includes("invalid"));
  });

  it("目录不存在时返回空数组", async () => {
    assert.deepEqual(await loadTemplates(join(tmpdir(), "cz-does-not-exist-xyz")), []);
  });

  it("模板 dir 指向模板目录绝对路径", async () => {
    const dir = await makeTemplatesDir();
    const alpha = (await loadTemplates(dir)).find((t) => t.manifest.id === "alpha");
    assert.ok(alpha);
    assert.ok(alpha.dir.endsWith(join("templates", "alpha")));
  });
});

describe("loadTemplate", () => {
  it("按 id 查找到对应模板", async () => {
    const dir = await makeTemplatesDir();
    const template = await loadTemplate(dir, "beta");
    assert.equal(template?.manifest.title, "Beta");
  });

  it("未知 id 返回 undefined", async () => {
    const dir = await makeTemplatesDir();
    assert.equal(await loadTemplate(dir, "nope"), undefined);
  });
});

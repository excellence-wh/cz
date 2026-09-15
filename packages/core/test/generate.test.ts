import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { generate } from "../src/generate.ts";
import type { Template } from "../src/types.ts";

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

interface Fixture {
  root: string;
  sharedDir: string;
  templateDir: string;
  targetDir: string;
}

async function makeFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), "cz-generate-"));
  const sharedDir = join(root, "shared");
  const templateDir = join(root, "template");

  await mkdir(join(sharedDir, "docs"), { recursive: true });
  await mkdir(join(templateDir, "src", "{{name}}"), { recursive: true });

  // 共享层
  await writeFile(join(sharedDir, "AGENTS.md"), "# {{title}}\n\n{{stack}}\n");
  await writeFile(join(sharedDir, "README.md"), "shared readme for {{name}}\n");
  await writeFile(join(sharedDir, "docs", "adr.md"), "ADR of {{name}}\n");
  await writeFile(join(sharedDir, "_gitignore"), "node_modules/\n");
  await writeFile(
    join(sharedDir, "template.json"),
    JSON.stringify({ id: "shared", title: "Shared", description: "d", kind: "ts", tags: [] }),
  );

  // 模板层（同名的 README.md 覆盖共享层）
  await writeFile(join(templateDir, "README.md"), "template readme for {{name}}\n");
  await writeFile(
    join(templateDir, "src", "{{name}}", "index.ts"),
    "export const name = '{{name}}';\n",
  );
  await writeFile(join(templateDir, "logo.png"), PNG_HEADER);

  return { root, sharedDir, templateDir, targetDir: join(root, "out") };
}

function fixtureTemplate(dir: string): Template {
  return {
    manifest: { id: "fixture", title: "Fixture", description: "d", kind: "ts", tags: [] },
    dir,
  };
}

const VARIABLES = { name: "my-app", title: "My App", stack: "TypeScript" };

describe("generate", () => {
  it("渲染内容与路径、叠加共享层、跳过 manifest、重命名点文件", async () => {
    const { sharedDir, templateDir, targetDir } = await makeFixture();

    const result = await generate({
      template: fixtureTemplate(templateDir),
      sharedDir,
      targetDir,
      variables: VARIABLES,
    });

    // 内容渲染
    assert.equal(await readFile(join(targetDir, "AGENTS.md"), "utf8"), "# My App\n\nTypeScript\n");
    // 路径渲染（目录名里的 {{name}}）
    assert.equal(
      await readFile(join(targetDir, "src", "my-app", "index.ts"), "utf8"),
      "export const name = 'my-app';\n",
    );
    // 模板层覆盖共享层同名文件
    assert.equal(
      await readFile(join(targetDir, "README.md"), "utf8"),
      "template readme for my-app\n",
    );
    // 仅共享层存在的文件
    assert.equal(await readFile(join(targetDir, "docs", "adr.md"), "utf8"), "ADR of my-app\n");
    // 点文件重命名
    assert.equal(await readFile(join(targetDir, ".gitignore"), "utf8"), "node_modules/\n");
    // manifest 被跳过
    await assert.rejects(stat(join(targetDir, "template.json")));
    // 二进制原样复制
    assert.deepEqual(await readFile(join(targetDir, "logo.png")), PNG_HEADER);

    // 结果元数据
    assert.deepEqual(result.renamed, [{ from: "_gitignore", to: ".gitignore" }]);
    assert.ok(result.files.includes(".gitignore"));
    assert.ok(result.files.includes("src/my-app/index.ts"));
    assert.ok(!result.files.includes("template.json"));
  });

  it("目标目录非空且未指定 force 时抛错", async () => {
    const { sharedDir, templateDir, targetDir } = await makeFixture();
    await mkdir(targetDir, { recursive: true });
    await writeFile(join(targetDir, "existing.txt"), "busy\n");

    await assert.rejects(
      generate({
        template: fixtureTemplate(templateDir),
        sharedDir,
        targetDir,
        variables: VARIABLES,
      }),
      /非空/,
    );
  });

  it("指定 force 时覆盖非空目录", async () => {
    const { sharedDir, templateDir, targetDir } = await makeFixture();
    await mkdir(targetDir, { recursive: true });
    await writeFile(join(targetDir, "existing.txt"), "busy\n");

    await generate({
      template: fixtureTemplate(templateDir),
      sharedDir,
      targetDir,
      variables: VARIABLES,
      force: true,
    });

    assert.equal(await readFile(join(targetDir, "AGENTS.md"), "utf8"), "# My App\n\nTypeScript\n");
  });

  it("模板目录不存在时抛错", async () => {
    const { sharedDir, targetDir, root } = await makeFixture();
    await assert.rejects(
      generate({
        template: fixtureTemplate(join(root, "missing")),
        sharedDir,
        targetDir,
        variables: VARIABLES,
      }),
      /模板目录不存在/,
    );
  });

  it("onProgress 会输出每个文件", async () => {
    const { sharedDir, templateDir, targetDir } = await makeFixture();
    const messages: string[] = [];

    await generate({
      template: fixtureTemplate(templateDir),
      sharedDir,
      targetDir,
      variables: VARIABLES,
      onProgress: (m) => messages.push(m),
    });

    assert.ok(messages.some((m) => m.includes("AGENTS.md")));
    assert.ok(messages.some((m) => m.includes(".gitignore")));
  });
});

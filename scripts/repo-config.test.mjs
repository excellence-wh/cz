// @ts-check
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** @param {string} rel */
const abs = (rel) => join(ROOT, rel);

/** @param {string} rel */
async function readJson(rel) {
  return JSON.parse(await readFile(abs(rel), "utf8"));
}

async function exists(rel) {
  try {
    await stat(abs(rel));
    return true;
  } catch {
    return false;
  }
}

/** 收集所有 workspace 的 package.json 相对路径。 */
async function workspaceManifests() {
  const out = [];
  for (const group of ["apps", "packages"]) {
    const entries = await readdir(abs(group), { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const rel = `${group}/${entry.name}/package.json`;
      if (await exists(rel)) out.push(rel);
    }
  }
  return out;
}

/** 所有 workspace 包的包名。 */
async function workspacePackageNames() {
  const names = new Set();
  for (const rel of await workspaceManifests()) {
    const pkg = await readJson(rel);
    names.add(pkg.name);
  }
  return names;
}

describe("workspace 包规范", () => {
  it("每个包的 package.json 合法且符合约定", async () => {
    const manifests = await workspaceManifests();
    assert.ok(manifests.length >= 3, `只发现 ${manifests.length} 个 workspace 包`);

    for (const rel of manifests) {
      const pkg = await readJson(rel);
      assert.match(pkg.name, /^@excellence-wh\//, `${rel} 的 name 未使用 @excellence-wh 作用域`);
      assert.ok(pkg.version, `${rel} 缺少 version`);
      assert.equal(pkg.type, "module", `${rel} 必须是 ESM（type: module）`);
      assert.ok(pkg.engines?.node, `${rel} 缺少 engines.node`);
      assert.ok(pkg.scripts?.build, `${rel} 缺少 build 脚本`);
      assert.ok(pkg.scripts?.typecheck, `${rel} 缺少 typecheck 脚本`);
    }
  });

  it("可发布包必须 public 且带上 files / license", async () => {
    const manifests = await workspaceManifests();
    const publishable = [];

    for (const rel of manifests) {
      const pkg = await readJson(rel);
      if (pkg.private === true) continue;
      publishable.push(pkg.name);
      assert.equal(
        pkg.publishConfig?.access,
        "public",
        `${pkg.name} 的 publishConfig.access 必须为 public`,
      );
      assert.ok(Array.isArray(pkg.files) && pkg.files.length > 0, `${pkg.name} 缺少 files 字段`);
      assert.ok(pkg.license, `${pkg.name} 缺少 license`);
    }

    assert.deepEqual(publishable.sort(), [
      "@excellence-wh/core",
      "@excellence-wh/cz",
      "@excellence-wh/templates",
    ]);
  });

  it("CLI 包暴露 cz / create-cz 两个 bin", async () => {
    const pkg = await readJson("apps/cli/package.json");
    assert.ok(pkg.bin?.cz, "缺少 bin.cz");
    assert.ok(pkg.bin?.["create-cz"], "缺少 bin.create-cz");
    assert.equal(pkg.bin.cz, pkg.bin["create-cz"]);
    assert.match(pkg.bin.cz, /^\.\/dist\//);
  });
});

describe("changesets 配置", () => {
  it(".changeset/config.json 合法且关键字段正确", async () => {
    const config = await readJson(".changeset/config.json");
    assert.equal(config.access, "public");
    assert.equal(config.changelog, "@changesets/cli/changelog");
    assert.ok(config.baseBranch, "缺少 baseBranch");
    assert.ok(config.updateInternalDependencies, "缺少 updateInternalDependencies");
    assert.ok(Array.isArray(config.ignore), "ignore 必须是数组");
  });
});

describe("changeset 文件", () => {
  it("字段合法、引用真实包、且有变更说明", async () => {
    const dir = abs(".changeset");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".md") && f !== "README.md");
    const known = await workspacePackageNames();

    for (const file of files) {
      const content = await readFile(join(dir, file), "utf8");
      const parsed = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      assert.ok(parsed, `${file} 缺少 --- frontmatter ---`);

      const releases = parsed[1]
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const m = line.match(/^"([^"]+)":\s*(patch|minor|major)$/);
          assert.ok(m, `${file} 的 frontmatter 行不合法：${line}`);
          return { name: m[1], bump: m[2] };
        });

      assert.ok(releases.length > 0, `${file} 未声明任何待发布包`);
      for (const { name } of releases) {
        assert.ok(known.has(name), `${file} 引用了不存在的包：${name}`);
      }
      assert.ok(parsed[2].trim().length > 0, `${file} 缺少变更说明`);
    }
  });

  it("私有包不会被写进 changeset", async () => {
    const dir = abs(".changeset");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".md") && f !== "README.md");
    const private_ = new Set();
    for (const rel of await workspaceManifests()) {
      const pkg = await readJson(rel);
      if (pkg.private === true) private_.add(pkg.name);
    }

    for (const file of files) {
      const content = await readFile(join(dir, file), "utf8");
      for (const name of private_) {
        assert.ok(!content.includes(`"${name}"`), `${file} 不应包含私有包：${name}`);
      }
    }
  });
});

describe("npm 发布配置", () => {
  it(".npmrc 把 @excellence-wh scope 钉到官方 registry", async () => {
    const npmrc = await readFile(abs(".npmrc"), "utf8");
    assert.match(
      npmrc,
      /^@excellence-wh:registry=https:\/\/registry\.npmjs\.org\/?$/m,
      "开发机 registry 默认指向镜像，必须在 .npmrc 里为 @excellence-wh 指定官方源，否则发不出去",
    );
  });

  it(".npmrc 不含任何 token", async () => {
    const npmrc = await readFile(abs(".npmrc"), "utf8");
    assert.doesNotMatch(npmrc, /_authToken|_auth\b|:_password/, ".npmrc 不得包含凭证");
  });

  it("release workflow 用与 changesets v3 配套的 action 版本", async () => {
    const workflow = await readFile(abs(".github/workflows/release.yml"), "utf8");
    assert.match(workflow, /branches:\s*\[main\]/);
    // v1 只兼容 changesets v2（会因 validateChangesetsCliVersion 失败）
    assert.match(workflow, /changesets\/action@v2/);
    assert.match(workflow, /id-token:\s*write/, "缺少 provenance 所需的 id-token 权限");
    assert.match(workflow, /contents:\s*write/);
    assert.match(workflow, /pull-requests:\s*write/);
    assert.match(workflow, /pnpm version-packages/);
    assert.match(workflow, /pnpm release/);
    assert.match(workflow, /workflow_dispatch:/, "缺少手动补发入口");
  });

  it("release workflow 不传 v2 已改名的 input", async () => {
    const workflow = await readFile(abs(".github/workflows/release.yml"), "utf8");
    // v2 会 throwOnRenamedInputs：publish/version/commit/title 必须用新名
    for (const old of ["publish", "version", "commit", "title"]) {
      assert.doesNotMatch(
        workflow,
        new RegExp(`^\\s*${old}\\s*:`, "m"),
        `changesets/action v2 不接受旧 input 名：${old}`,
      );
    }
    assert.match(workflow, /publish-script:/);
    assert.match(workflow, /version-script:/);
  });

  it("release workflow 用 NODE_AUTH_TOKEN 提供 npm 凭证", async () => {
    const workflow = await readFile(abs(".github/workflows/release.yml"), "utf8");
    // setup-node 生成的 .npmrc 读的是 NODE_AUTH_TOKEN；
    // changesets/action v2 不会把 NPM_TOKEN 映射过去
    assert.match(workflow, /NODE_AUTH_TOKEN:\s*\$\{\{\s*secrets\.NPM_TOKEN\s*\}\}/);
  });

  it("release workflow 未配置 token 时不会尝试发布", async () => {
    const workflow = await readFile(abs(".github/workflows/release.yml"), "utf8");
    assert.match(
      workflow,
      /publish-script:\s*\$\{\{\s*secrets\.NPM_TOKEN\s*!=\s*''\s*&&\s*'[^']*'\s*\|\|\s*''\s*\}\}/,
      "缺少 token 守卫：否则每次推 main 都会因拿不到凭证而失败",
    );
  });

  it("两个 workflow 都使用当前 Actions 大版本（避免 Node 20 弃用告警）", async () => {
    for (const file of [".github/workflows/ci.yml", ".github/workflows/release.yml"]) {
      const workflow = await readFile(abs(file), "utf8");
      assert.doesNotMatch(workflow, /actions\/checkout@v[1-4]\b/, `${file} 的 checkout 版本过旧`);
      assert.doesNotMatch(
        workflow,
        /actions\/setup-node@v[1-4]\b/,
        `${file} 的 setup-node 版本过旧`,
      );
      assert.doesNotMatch(
        workflow,
        /pnpm\/action-setup@v[1-5]\b/,
        `${file} 的 pnpm/action-setup 版本过旧`,
      );
    }
  });

  it("release 脚本会先构建再发布", async () => {
    const pkg = await readJson("package.json");
    assert.match(pkg.scripts.release, /build/);
    assert.match(pkg.scripts.release, /changeset publish/);
    assert.match(pkg.scripts["version-packages"], /changeset version/);
  });
});

describe("deploy / devcontainer", () => {
  it("devcontainer.json 指向存在的 Dockerfile", async () => {
    const devcontainer = await readJson(".devcontainer/devcontainer.json");
    const dockerfile = devcontainer.build?.dockerfile;
    assert.ok(dockerfile, "devcontainer.json 缺少 build.dockerfile");

    // dockerfile 路径相对于 .devcontainer/ 解析
    assert.ok(await exists(join(".devcontainer", dockerfile)), `Dockerfile 不存在：${dockerfile}`);
  });

  it("Dockerfile 同时安装 Node 与 Go", async () => {
    const dockerfile = await readFile(abs("deploy/devcontainer/Dockerfile"), "utf8");
    assert.match(dockerfile, /nodesource|nodejs/i, "Dockerfile 未安装 Node");
    assert.match(dockerfile, /go\.dev\/dl|golang/i, "Dockerfile 未安装 Go");
  });
});

describe("config/mcp.json", () => {
  it("是合法的 MCP 服务器清单", async () => {
    const mcp = await readJson("config/mcp.json");
    assert.equal(typeof mcp.mcpServers, "object");
    const servers = Object.entries(mcp.mcpServers);
    assert.ok(servers.length > 0, "mcpServers 为空");

    for (const [name, server] of servers) {
      assert.equal(typeof server.command, "string", `${name} 缺少 command`);
      assert.ok(Array.isArray(server.args), `${name} 的 args 必须是数组`);
    }
  });
});

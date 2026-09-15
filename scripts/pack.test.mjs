// @ts-check
/**
 * 发布产物校验：对每个可发布包执行一次真实的 `pnpm pack`，
 * 解包后断言 tarball 内容、依赖协议、入口文件都正确。
 *
 * 这是「发布链路」的回归测试 —— 改 `files` / `exports` / `bin` /
 * `workspace:` 协议时，一旦发不出可用的包就会在这里失败。
 *
 * 前置：先 `pnpm build`（tarball 里的 dist 需要已构建）。
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** @type {string[]} */
const TEMP_DIRS = [];

after(() => {
  for (const dir of TEMP_DIRS) rmSync(dir, { recursive: true, force: true });
});

/** 收集所有非 private 的 workspace 包。 */
function publishablePackages() {
  /** @type {Array<{ dir: string; pkg: any }>} */
  const found = [];
  for (const group of ["apps", "packages"]) {
    const groupDir = join(ROOT, group);
    if (!existsSync(groupDir)) continue;
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = join(groupDir, entry.name);
      const manifest = join(dir, "package.json");
      if (!existsSync(manifest)) continue;
      const pkg = JSON.parse(readFileSync(manifest, "utf8"));
      if (pkg.private === true) continue;
      found.push({ dir, pkg });
    }
  }
  return found;
}

const PACKAGES = publishablePackages();

/**
 * 真实执行 `pnpm pack` 并解包读取。
 * 注意：tar 一律用「cwd + 相对文件名」调用，
 * 否则 GNU tar 会把 `C:\...` 误判为远程主机（host:path）。
 * @param {string} pkgDir
 */
function pack(pkgDir) {
  const outDir = mkdtempSync(join(tmpdir(), "cz-pack-"));
  TEMP_DIRS.push(outDir);

  const result = spawnSync("pnpm", ["pack", "--pack-destination", outDir], {
    cwd: pkgDir,
    shell: true,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `pnpm pack 失败：${result.stderr ?? ""}`);

  const tarballs = readdirSync(outDir).filter((f) => f.endsWith(".tgz"));
  assert.equal(tarballs.length, 1, `期望 1 个 tarball，实际 ${tarballs.length} 个`);
  const tarball = tarballs[0];

  const entries = tar(outDir, ["-tzf", tarball])
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const manifest = JSON.parse(tar(outDir, ["-xzOf", tarball, "package/package.json"]));

  return { outDir, tarball, name: tarball, entries, manifest };
}

/**
 * 在指定目录执行 tar。
 * @param {string} cwd
 * @param {string[]} args
 */
function tar(cwd, args) {
  const result = spawnSync("tar", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `tar ${args.join(" ")} 失败：${result.stderr ?? ""}`);
  return result.stdout;
}

/** 收集对象里所有依赖协议值。 */
function dependencySpecs(pkg) {
  /** @type {string[]} */
  const out = [];
  for (const field of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    out.push(...Object.values(pkg[field] ?? {}));
  }
  return out;
}

describe("发布产物（pnpm pack）", () => {
  it("至少发现 3 个可发布包", () => {
    assert.ok(PACKAGES.length >= 3, `只发现 ${PACKAGES.length} 个可发布包`);
  });

  for (const { dir, pkg } of PACKAGES) {
    describe(pkg.name, () => {
      const packed = () => pack(dir);

      it("tarball 命名与内容符合白名单", () => {
        const { entries } = packed();

        // 所有条目都必须位于 package/ 之下
        for (const entry of entries) {
          assert.ok(entry.startsWith("package/"), `非预期条目：${entry}`);
        }

        // files 白名单里的每一项都要真的被打进去
        for (const allowed of pkg.files ?? []) {
          const prefix = `package/${allowed.replace(/\/$/, "")}`;
          assert.ok(
            entries.some((e) => e === prefix || e.startsWith(`${prefix}/`)),
            `${pkg.name} 的 files 条目未被收录：${allowed}`,
          );
        }
      });

      it("不泄漏源码 / 配置文件 / 测试", () => {
        const { entries } = packed();
        const banned = [
          "package/src/",
          "package/test/",
          "package/tsconfig.json",
          "package/tsconfig.build.json",
          "package/.gitignore",
        ];
        // 模板素材本身就是「数据」：它里面的 src/ 、test/ 、tsconfig.json
        // 都是要原样交付给用户的载荷，不能按本包源码的规则排除。
        const isPayload = (entry) => entry.startsWith("package/templates/");

        for (const entry of entries) {
          const base = entry.split("/").pop() ?? entry;

          if (isPayload(entry)) {
            assert.notEqual(base, ".env", `${pkg.name} 不应发布环境变量文件：${entry}`);
            continue;
          }

          for (const b of banned) {
            assert.ok(!(entry === b || entry.startsWith(b)), `${pkg.name} 不应发布：${entry}`);
          }
          assert.ok(!/\.test\.[cm]?[jt]s$/.test(entry), `${pkg.name} 不应发布测试文件：${entry}`);
          assert.ok(!entry.includes(".env"), `${pkg.name} 不应发布环境变量文件：${entry}`);
        }
      });

      it("入口文件（main / types / exports / bin）都在 tarball 内", () => {
        const { entries } = packed();
        const has = (rel) => entries.includes(`package/${rel.replace(/^\.\//, "")}`);

        const targets = [pkg.main, pkg.types].filter(Boolean);
        for (const value of Object.values(pkg.exports ?? {})) {
          if (typeof value === "string") targets.push(value);
          else if (value && typeof value === "object") targets.push(...Object.values(value));
        }
        for (const binPath of Object.values(pkg.bin ?? {})) targets.push(binPath);

        assert.ok(targets.length > 0, `${pkg.name} 未声明任何入口`);
        for (const target of targets) {
          if (typeof target !== "string") continue;
          assert.ok(has(target), `${pkg.name} 的入口不存在于 tarball：${target}`);
        }
      });

      it("打包后无 workspace: 协议残留，且依赖是可解析的版本范围", () => {
        const { manifest } = packed();

        for (const spec of dependencySpecs(manifest)) {
          assert.ok(
            !spec.startsWith("workspace:"),
            `${pkg.name} 残留未替换的 workspace 协议：${spec}`,
          );
          assert.match(
            spec,
            /^(\^|~|>=)?\d+\.\d+\.\d+|^npm:|^https?:/,
            `${pkg.name} 的依赖版本不可解析：${spec}`,
          );
        }

        // 内部依赖必须指向具体版本，而不是 0.0.0 之外的占位
        for (const [name, spec] of Object.entries(manifest.dependencies ?? {})) {
          if (!name.startsWith("@excellence-wh/")) continue;
          assert.match(spec, /^\^\d+\.\d+\.\d+$/, `${name} 的内部依赖范围异常：${spec}`);
        }
      });

      it("保留 public 访问级别与正确的版本号", () => {
        const { manifest } = packed();
        assert.equal(manifest.publishConfig?.access, "public");
        assert.equal(manifest.version, pkg.version);
        assert.equal(manifest.name, pkg.name);
        assert.equal(manifest.license, "MIT");
      });
    });
  }

  it("CLI 包的 bin 与 templates 包的数据目录一并发布", () => {
    const cli = PACKAGES.find((p) => p.pkg.name === "@excellence-wh/cz");
    const templates = PACKAGES.find((p) => p.pkg.name === "@excellence-wh/templates");
    assert.ok(cli && templates);

    const cliPack = pack(cli.dir);
    for (const binPath of Object.values(cli.pkg.bin ?? {})) {
      const rel = String(binPath).replace(/^\.\//, "");
      assert.ok(cliPack.entries.includes(`package/${rel}`), `CLI 缺少 bin 文件：${rel}`);
      // bin 必须可执行（带 shebang）
      const content = tar(cliPack.outDir, ["-xzOf", cliPack.tarball, `package/${rel}`]);
      assert.match(content, /^#!/, `bin 文件缺少 shebang：${rel}`);
    }

    const tplPack = pack(templates.dir);
    for (const id of [
      "_shared",
      "ts-cli",
      "node-lib",
      "react-vite",
      "react-next",
      "go-service",
      "go-gin",
    ]) {
      assert.ok(
        tplPack.entries.some((e) => e.startsWith(`package/templates/${id}/`)),
        `templates 包未包含模板：${id}`,
      );
    }
    assert.ok(
      tplPack.entries.some((e) => e.endsWith("templates/ts-cli/template.json")),
      "templates 包未包含 template.json 清单",
    );
  });
});

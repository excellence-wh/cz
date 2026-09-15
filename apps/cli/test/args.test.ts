import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCliOptions } from "../src/args.ts";

describe("parseCliOptions", () => {
  it("默认值", () => {
    const o = parseCliOptions([]);
    assert.equal(o.dir, undefined);
    assert.equal(o.template, undefined);
    assert.equal(o.yes, false);
    assert.equal(o.install, true);
    assert.equal(o.git, true);
    assert.equal(o.force, false);
    assert.equal(o.list, false);
    assert.equal(o.help, false);
    assert.equal(o.version, false);
  });

  it("位置参数 + 短选项", () => {
    const o = parseCliOptions(["my-app", "-t", "ts-cli", "-y", "-f"]);
    assert.equal(o.dir, "my-app");
    assert.equal(o.template, "ts-cli");
    assert.equal(o.yes, true);
    assert.equal(o.force, true);
  });

  it("--template 长选项", () => {
    const o = parseCliOptions(["--template", "react-vite"]);
    assert.equal(o.template, "react-vite");
  });

  it("--no-install / --no-git 关闭对应步骤", () => {
    const o = parseCliOptions(["x", "--no-install", "--no-git"]);
    assert.equal(o.install, false);
    assert.equal(o.git, false);
  });

  it("-l / -h / -v", () => {
    assert.equal(parseCliOptions(["-l"]).list, true);
    assert.equal(parseCliOptions(["-h"]).help, true);
    assert.equal(parseCliOptions(["-v"]).version, true);
  });
});

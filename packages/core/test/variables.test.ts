import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultVariables, render, renderPath, toPackageName, toTitle } from "../src/variables.ts";

describe("render", () => {
  it("替换已知变量", () => {
    assert.equal(render("Hello, {{name}}!", { name: "cz" }), "Hello, cz!");
  });

  it("容忍占位符内空格", () => {
    assert.equal(render("{{  name  }}", { name: "cz" }), "cz");
  });

  it("未知变量原样保留（暴露模板笔误）", () => {
    assert.equal(render("{{nope}}", { name: "cz" }), "{{nope}}");
  });

  it("同一变量可多次出现", () => {
    assert.equal(render("{{a}}-{{a}}", { a: "x" }), "x-x");
  });

  it("空输入与无占位符输入", () => {
    assert.equal(render("", { a: "x" }), "");
    assert.equal(render("plain", { a: "x" }), "plain");
  });
});

describe("renderPath", () => {
  it("逐段渲染路径", () => {
    assert.equal(renderPath("src/{{name}}/index.ts", { name: "cz" }), "src/cz/index.ts");
  });

  it("路径中无变量时保持原样", () => {
    assert.equal(renderPath("a/b/c", {}), "a/b/c");
  });
});

describe("toPackageName", () => {
  it("小写化并替换非法字符", () => {
    assert.equal(toPackageName("My App!"), "my-app");
  });

  it("去掉作用域前缀中的 @", () => {
    assert.equal(toPackageName("@scope/pkg"), "scope-pkg");
  });

  it("压缩连续分隔符并去掉首尾", () => {
    assert.equal(toPackageName("__hello--world__"), "hello-world");
  });

  it("空值回退到 my-app", () => {
    assert.equal(toPackageName("   "), "my-app");
  });
});

describe("toTitle", () => {
  it("横线与下划线转空格并首字母大写", () => {
    assert.equal(toTitle("my-app"), "My App");
    assert.equal(toTitle("hello_world"), "Hello World");
  });

  it("压缩多余空格", () => {
    assert.equal(toTitle("a   b"), "A B");
  });
});

describe("defaultVariables", () => {
  it("提供 name/title/description/author/year", () => {
    const vars = defaultVariables("my-app", { description: "desc", author: "me" });
    assert.equal(vars.name, "my-app");
    assert.equal(vars.title, "My App");
    assert.equal(vars.projectName, "my-app");
    assert.equal(vars.description, "desc");
    assert.equal(vars.author, "me");
    assert.equal(vars.year, String(new Date().getFullYear()));
  });

  it("未提供描述时给出默认值", () => {
    const vars = defaultVariables("my-app");
    assert.match(vars.description ?? "", /@excellence-wh\/cz/);
    assert.equal(vars.author, "");
  });
});

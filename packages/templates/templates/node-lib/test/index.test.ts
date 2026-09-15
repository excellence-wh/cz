import assert from "node:assert/strict";
import { test } from "node:test";
import { capitalize, slugify, truncate } from "../src/index.ts";

test("slugify 处理大小写与符号", () => {
  assert.equal(slugify("  Hello, World!  "), "hello-world");
});

test("slugify 压缩连续分隔符", () => {
  assert.equal(slugify("a___b   c"), "a-b-c");
});

test("capitalize 首字母大写", () => {
  assert.equal(capitalize("cz"), "Cz");
  assert.equal(capitalize(""), "");
});

test("truncate 超长时截断并加省略号", () => {
  assert.equal(truncate("hello world", 8), "hello w…");
  assert.equal(truncate("short", 8), "short");
});

test("truncate 拒绝负数长度", () => {
  assert.throws(() => truncate("x", -1), RangeError);
});

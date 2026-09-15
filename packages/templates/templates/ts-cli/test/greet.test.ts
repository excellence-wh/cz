import assert from "node:assert/strict";
import { test } from "node:test";
import { greet } from "../src/greet.ts";

test("greet 默认问候 world", () => {
  assert.equal(greet(), "Hello, world!");
});

test("greet 使用传入的名字", () => {
  assert.equal(greet({ name: "cz" }), "Hello, cz!");
});

test("greet 空白名字回退到 world", () => {
  assert.equal(greet({ name: "   " }), "Hello, world!");
});

test("greet 关闭感叹号", () => {
  assert.equal(greet({ name: "cz", excited: false }), "Hello, cz.");
});

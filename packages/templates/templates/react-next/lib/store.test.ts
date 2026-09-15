import { beforeEach, describe, expect, it } from "vitest";
import { useCounterStore } from "./store";

describe("counter store", () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it("increment 递增", () => {
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(1);
  });

  it("decrement 递减", () => {
    useCounterStore.getState().decrement();
    expect(useCounterStore.getState().count).toBe(-1);
  });

  it("reset 归零", () => {
    useCounterStore.setState({ count: 9 });
    useCounterStore.getState().reset();
    expect(useCounterStore.getState().count).toBe(0);
  });
});

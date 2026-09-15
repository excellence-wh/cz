import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { useCounterStore } from "./store";

describe("App", () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it("渲染应用标题", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("点击 +1 时计数递增", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+1" }));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("点击 reset 时计数归零", () => {
    useCounterStore.setState({ count: 5 });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "reset" }));
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

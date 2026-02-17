import { describe, expect, it } from "vitest";

describe("Sample Test", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should verify string equality", () => {
    expect("Cortex OS").toBe("Cortex OS");
  });
});

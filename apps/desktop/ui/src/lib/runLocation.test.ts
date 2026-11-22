import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { readRunPlace, stopResult, switchNeedsConfirm, writeRunPlace } from "./runLocation.ts";

beforeEach(() => {
  const mem = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) }
  };
});

test("the chosen place is remembered and junk is ignored", () => {
  assert.equal(readRunPlace(), null);
  writeRunPlace("this");
  assert.equal(readRunPlace(), "this");
  writeRunPlace("server");
  assert.equal(readRunPlace(), "server");
  window.localStorage.setItem("praxi.runLocation", "later");
  assert.equal(readRunPlace(), null);
});

test("switching asks only while something runs", () => {
  assert.equal(switchNeedsConfirm(0), false);
  assert.equal(switchNeedsConfirm(2), true);
});

test("the stop result is honest about zero and about a real count", () => {
  assert.deepEqual(stopResult(0), { key: "runLocation.stopNone", tone: "info" });
  assert.deepEqual(stopResult(1), { key: "runLocation.stopped", tone: "success" });
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_EMBEDDING_DIMENSIONS, parsePositiveInt } from "./embeddingInputs.ts";

test("parsePositiveInt accepts whole numbers within bounds", () => {
  assert.equal(parsePositiveInt("1", MAX_EMBEDDING_DIMENSIONS), 1);
  assert.equal(parsePositiveInt("768", MAX_EMBEDDING_DIMENSIONS), 768);
  assert.equal(parsePositiveInt("4096", MAX_EMBEDDING_DIMENSIONS), 4096);
  assert.equal(parsePositiveInt(" 42 "), 42);
  assert.equal(parsePositiveInt("100000"), 100_000);
});

test("parsePositiveInt rejects empty, zero, out-of-range, signed, decimal, and exponent inputs", () => {
  for (const invalid of ["", "   ", "0", "-5", "+5", "1.5", "1e3", "abc"]) {
    assert.equal(parsePositiveInt(invalid, MAX_EMBEDDING_DIMENSIONS), null, `expected null for ${JSON.stringify(invalid)}`);
  }
  assert.equal(parsePositiveInt("4097", MAX_EMBEDDING_DIMENSIONS), null);
});

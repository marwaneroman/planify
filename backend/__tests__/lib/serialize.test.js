/**
 * Unit tests for lib/serialize.js — snake_case key conversion.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { snakeKeys } from "../../lib/serialize.js";

describe("snakeKeys", () => {
  it("returns null for null input", () => {
    assert.strictEqual(snakeKeys(null), null);
  });

  it("returns undefined for undefined input", () => {
    assert.strictEqual(snakeKeys(undefined), undefined);
  });

  it("converts single-level camelCase keys to snake_case", () => {
    const input = { fullName: "Jane", createdAt: "2024-01-01" };
    assert.deepStrictEqual(snakeKeys(input), { full_name: "Jane", created_at: "2024-01-01" });
  });

  it("converts nested object keys", () => {
    const input = { userData: { firstName: "John", lastName: "Doe" } };
    assert.deepStrictEqual(snakeKeys(input), { user_data: { first_name: "John", last_name: "Doe" } });
  });

  it("converts array of objects", () => {
    const input = [{ id: 1, fullName: "A" }, { id: 2, fullName: "B" }];
    assert.deepStrictEqual(snakeKeys(input), [{ id: 1, full_name: "A" }, { id: 2, full_name: "B" }]);
  });

  it("leaves keys that are already snake_case unchanged", () => {
    const input = { full_name: "Jane", created_at: "2024-01-01" };
    assert.deepStrictEqual(snakeKeys(input), { full_name: "Jane", created_at: "2024-01-01" });
  });

  it("handles mixed key styles", () => {
    const input = { organizationId: "org-1", user_id: "u-1" };
    assert.deepStrictEqual(snakeKeys(input), { organization_id: "org-1", user_id: "u-1" });
  });

  it("returns primitives unchanged", () => {
    assert.strictEqual(snakeKeys("hello"), "hello");
    assert.strictEqual(snakeKeys(42), 42);
    assert.strictEqual(snakeKeys(true), true);
  });

  it("handles empty object and empty array", () => {
    assert.deepStrictEqual(snakeKeys({}), {});
    assert.deepStrictEqual(snakeKeys([]), []);
  });
});

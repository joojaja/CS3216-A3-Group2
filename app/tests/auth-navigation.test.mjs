import test from "node:test";
import assert from "node:assert/strict";
import { safeAuthDestination } from "../src/lib/auth-navigation.ts";

test("authentication preserves supported internal destinations", () => {
  for (const path of [
    "/onboarding",
    "/wardrobe",
    "/wardrobe/new",
    "/wardrobe/abc-123",
    "/planner",
    "/profile",
    "/evaluator",
    "/sizing",
    "/profile/measurements",
  ]) {
    assert.equal(safeAuthDestination(path), path);
  }
});

test("authentication rejects script, cross-origin and disguised destinations", () => {
  for (const path of [
    "javascript:alert(1)",
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/login",
    "/auth/callback",
    "/wardrobe?next=https://example.com",
    "/wardrobe\n",
    "/wardrobe-fake",
    "",
    null,
    undefined,
  ]) {
    assert.equal(safeAuthDestination(path), "/onboarding");
  }
});

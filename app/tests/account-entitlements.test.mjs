import test from "node:test";
import assert from "node:assert/strict";
import {
  BEAUTIFY_LIMIT_MESSAGE,
  EXPLORE_REFRESH_LIMIT_MESSAGE,
  FREE_BEAUTIFY_CREDITS,
  OUTFIT_CREDIT_LIMIT_MESSAGE,
  readAccountEntitlement,
} from "../src/lib/account-entitlements.ts";

test("new and missing entitlement rows use the free allowance", () => {
  assert.equal(FREE_BEAUTIFY_CREDITS, 5);
  assert.deepEqual(readAccountEntitlement(null), {
    accountTier: "free",
    beautifyCreditsRemaining: 5,
  });
});

test("stored tier and countdown values are read without changing them", () => {
  assert.deepEqual(
    readAccountEntitlement({
      account_tier: "premium",
      beautify_credits_remaining: 12,
    }),
    { accountTier: "premium", beautifyCreditsRemaining: 12 },
  );
  assert.equal(
    readAccountEntitlement({
      account_tier: "free",
      beautify_credits_remaining: 0,
    }).beautifyCreditsRemaining,
    0,
  );
});

test("free-tier limit messages explain the Wearabouts Plus option", () => {
  assert.match(BEAUTIFY_LIMIT_MESSAGE, /all 5 free Beautify edits/i);
  assert.match(EXPLORE_REFRESH_LIMIT_MESSAGE, /Wearabouts Plus/i);
  assert.match(OUTFIT_CREDIT_LIMIT_MESSAGE, /Wearabouts Plus/i);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_GENDER,
  GENDER_VALUES,
  isMissingGenderColumn,
} from "../src/lib/profile-gender.ts";

test("profile gender accepts only the supported stored values", () => {
  assert.deepEqual(GENDER_VALUES, ["male", "female", "others"]);
  assert.equal(DEFAULT_GENDER, "male");
});

test("missing Supabase gender columns are identified without hiding other errors", () => {
  assert.equal(
    isMissingGenderColumn({
      code: "PGRST204",
      message: "Could not find the 'gender' column of 'user_profiles' in the schema cache",
    }),
    true,
  );
  assert.equal(
    isMissingGenderColumn({ code: "42501", message: "permission denied" }),
    false,
  );
});

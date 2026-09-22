import test from "node:test";
import assert from "node:assert/strict";
import {
  checkMeasurement,
  checkProfile,
  convertTyped,
} from "../src/lib/sizing/validate.ts";
import { parseMeasurementInput, MEASUREMENTS } from "../src/lib/sizing/measurements.ts";

const empty = { height: null, chest: null, waist: null, hips: null, inseam: null, foot_length: null };

test("values inside each plausible range pass, and both edges count as inside", () => {
  for (const { key, plausible } of MEASUREMENTS) {
    assert.equal(checkMeasurement(key, plausible[0], "cm"), null, `${key} min`);
    assert.equal(checkMeasurement(key, plausible[1], "cm"), null, `${key} max`);
    assert.equal(checkMeasurement(key, (plausible[0] + plausible[1]) / 2, "cm"), null, `${key} mid`);
  }
});

test("inches typed with the cm unit suggest switching to inches", () => {
  const warning = checkMeasurement("waist", 32, "cm");
  assert.equal(warning?.kind, "unit");
  assert.equal(warning?.suggestedUnit, "in");
  assert.match(warning.message, /32 inches/);
});

test("cm typed with the inch unit suggest switching to cm", () => {
  const warning = checkMeasurement("chest", 96, "in");
  assert.equal(warning?.kind, "unit");
  assert.equal(warning?.suggestedUnit, "cm");
});

test("a value implausible in both units gets a range warning", () => {
  assert.equal(checkMeasurement("height", 999, "cm")?.kind, "range");
  assert.equal(checkMeasurement("foot_length", 2, "cm")?.kind, "range");
});

test("a correct inch value passes", () => {
  assert.equal(checkMeasurement("waist", 32, "in"), null);
});

test("an ordinary profile has no combination warnings", () => {
  assert.deepEqual(
    checkProfile({ ...empty, height: 170, chest: 92, waist: 76, hips: 98, inseam: 78 }),
    [],
  );
});

test("waist far above hips is flagged", () => {
  const warnings = checkProfile({ ...empty, waist: 130, hips: 95 });
  assert.equal(warnings.length, 1);
  assert.deepEqual(warnings[0].keys, ["waist", "hips"]);
});

test("chest far below waist is flagged", () => {
  const warnings = checkProfile({ ...empty, chest: 70, waist: 110 });
  assert.ok(warnings.some((w) => w.keys.includes("chest")));
});

test("inseam out of proportion to height is flagged both ways", () => {
  assert.equal(checkProfile({ ...empty, height: 170, inseam: 100 }).length, 1);
  assert.equal(checkProfile({ ...empty, height: 170, inseam: 55 }).length, 1);
});

test("checks skip fields that are missing", () => {
  assert.deepEqual(checkProfile({ ...empty, waist: 130 }), []);
});

test("input parsing accepts decimals and commas and rejects junk", () => {
  assert.equal(parseMeasurementInput(""), null);
  assert.equal(parseMeasurementInput("  "), null);
  assert.equal(parseMeasurementInput("76"), 76);
  assert.equal(parseMeasurementInput("76.5"), 76.5);
  assert.equal(parseMeasurementInput("76,5"), 76.5);
  assert.equal(parseMeasurementInput("32.25"), 32.25);
  for (const junk of ["abc", "-5", "0", "76cm", "1e3", "12345"]) {
    assert.ok(Number.isNaN(parseMeasurementInput(junk)), junk);
  }
});

test("unit toggle converts and rounds without drifting", () => {
  assert.equal(convertTyped(76, "cm", "in"), 30);
  assert.equal(convertTyped(30, "in", "cm"), 76);
  assert.equal(convertTyped(80, "cm", "cm"), 80);
});

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";

process.env.NODE_ENV = "development";
const { reportAiError, AI_ERROR_LOG } = await import("../src/lib/ai/gemini.ts");

// Shapes mirror what the AI SDK throws: a retry wrapper around the provider
// error, and a schema failure wrapping the validation error
function apiError(statusCode, message, extra = {}) {
  return Object.assign(new Error(message), { name: "AI_APICallError", statusCode, isRetryable: statusCode >= 500, ...extra });
}
function retryError(lastError) {
  return Object.assign(new Error(`Failed after 3 attempts. Last error: ${lastError.message}`), { name: "AI_RetryError", lastError });
}

function lastLogEntry() {
  const lines = readFileSync(AI_ERROR_LOG, "utf8").trim().split("\n");
  return JSON.parse(lines[lines.length - 1]);
}

test("free-tier capacity failures read as busy, and the log keeps the real cause", () => {
  const error = retryError(apiError(503, "This model is currently experiencing high demand. Spikes in demand are usually temporary.", { responseBody: '{"error":{"code":503,"status":"UNAVAILABLE"}}' }));
  const shown = reportAiError("outfits", error);
  assert.equal(shown, "The AI service is busy right now. Wait a moment and try again.");
  const entry = lastLogEntry();
  assert.equal(entry.where, "outfits");
  assert.equal(entry.status, 503);
  assert.equal(entry.error, "AI_RetryError");
  assert.equal(entry.cause, "AI_APICallError");
  assert.match(entry.message, /high demand/);
  assert.match(entry.response, /UNAVAILABLE/);
});

test("rate limits read as busy too", () => {
  assert.equal(reportAiError("outfits", apiError(429, "Resource has been exhausted")), "The AI service is busy right now. Wait a moment and try again.");
});

test("schema failures show the route's own message and log the raw model output", () => {
  const zod = Object.assign(new Error('[{"path":["outfits",0,"item_ids"],"message":"Invalid UUID"}]'), { name: "ZodError" });
  const validation = Object.assign(new Error("Type validation failed"), { name: "AI_TypeValidationError", cause: zod });
  const error = Object.assign(new Error("No object generated: response did not match schema."), {
    name: "AI_NoObjectGeneratedError",
    cause: validation,
    text: '{"outfits":[{"item_ids":["not-a-uuid"]}]}',
    finishReason: "stop",
  });
  assert.equal(reportAiError("outfits", error), "Could not build outfits this time. Please try again.");
  const entry = lastLogEntry();
  assert.equal(entry.cause, "ZodError");
  assert.match(entry.message, /Invalid UUID/);
  assert.match(entry.modelOutput, /not-a-uuid/);
  assert.equal(entry.finishReason, "stop");
});

test("each route has its own failure wording and bad keys read as unconfigured", () => {
  assert.equal(reportAiError("evaluate", new Error("boom")), "Could not evaluate this item. Please try again.");
  assert.equal(reportAiError("enhance", new Error("boom")), "Could not edit the photo. Please try again.");
  assert.equal(reportAiError("analyze", new Error("boom")), "Analysis failed. Please try again.");
  assert.equal(reportAiError("locate", apiError(400, "API key not valid. Please pass a valid API key.")), "AI is not configured on the server.");
  assert.equal(reportAiError("analyze", apiError(404, "models/x is not found")), "The configured AI model is not available. Check GEMINI_MODEL.");
});

test("the log never leaks into the user-facing message", () => {
  const shown = reportAiError("outfits", apiError(500, "Internal error at https://generativelanguage.googleapis.com/v1beta/models/secret"));
  assert.doesNotMatch(shown, /googleapis|secret|Internal/);
  assert.ok(existsSync(AI_ERROR_LOG));
});

test.after(() => rmSync(AI_ERROR_LOG, { force: true }));

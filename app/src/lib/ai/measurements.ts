import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export const AI_MEASUREMENT_LOG = path.join(
  process.cwd(),
  "logs",
  "ai-measurements.jsonl",
);

type AiMeasurement = {
  workflow: "attribute_extraction" | "outfit_planner";
  promptVersion: string;
  model: string;
  keyTier: "free" | "paid";
  success: boolean;
  modelLatencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  wardrobeItemCount?: number;
  followUp?: boolean;
  imageBytes?: number;
  imageType?: string;
};

// Records only operational measurements. Prompts, images, wardrobe contents,
// user IDs and model responses must not be added to this log.
export function recordAiMeasurement(measurement: AiMeasurement) {
  const entry = {
    at: new Date().toISOString(),
    ...measurement,
  };

  console.info(`[ai:measurement] ${JSON.stringify(entry)}`);

  // The local file is for repeatable development measurements. Production
  // deployments use their platform logs because their filesystem is read-only.
  if (process.env.NODE_ENV !== "development") return;

  try {
    mkdirSync(path.dirname(AI_MEASUREMENT_LOG), { recursive: true });
    appendFileSync(AI_MEASUREMENT_LOG, `${JSON.stringify(entry)}\n`);
  } catch {
    // Measurement must never cause the product request itself to fail.
  }
}

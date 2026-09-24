import fs from "node:fs";
import path from "node:path";

const logPath = path.join(process.cwd(), "logs", "ai-measurements.jsonl");

if (!fs.existsSync(logPath)) {
  console.log(`No measurements found at ${logPath}`);
  console.log("Run the local app and test attribute extraction or the outfit planner first.");
  process.exit(0);
}

const entries = fs
  .readFileSync(logPath, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .flatMap((line, index) => {
    try {
      return [JSON.parse(line)];
    } catch {
      console.warn(`Skipped invalid JSON on line ${index + 1}.`);
      return [];
    }
  });

function percentile(values, proportion) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * proportion) - 1];
}

function average(values) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function display(value, suffix = "") {
  return value == null ? "n/a" : `${value}${suffix}`;
}

const groups = new Map();
for (const entry of entries) {
  const key = `${entry.workflow} | ${entry.promptVersion}`;
  groups.set(key, [...(groups.get(key) ?? []), entry]);
}

for (const [name, measurements] of groups) {
  const successful = measurements.filter((entry) => entry.success);
  const latencies = measurements.map((entry) => entry.modelLatencyMs);
  const inputTokens = successful.flatMap((entry) =>
    typeof entry.inputTokens === "number" ? [entry.inputTokens] : [],
  );
  const outputTokens = successful.flatMap((entry) =>
    typeof entry.outputTokens === "number" ? [entry.outputTokens] : [],
  );
  const totalTokens = successful.flatMap((entry) =>
    typeof entry.totalTokens === "number" ? [entry.totalTokens] : [],
  );

  console.log(`\n${name}`);
  console.table({
    calls: measurements.length,
    successful: successful.length,
    "success rate": `${Math.round((successful.length / measurements.length) * 100)}%`,
    "average input tokens": display(average(inputTokens)),
    "average output tokens": display(average(outputTokens)),
    "average total tokens": display(average(totalTokens)),
    "median model latency": display(percentile(latencies, 0.5), " ms"),
    "p95 model latency": display(percentile(latencies, 0.95), " ms"),
  });
}

console.log(`\nRaw measurements: ${logPath}`);

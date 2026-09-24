// Manual clothing image evaluation.
//
// PAID: each case makes one analysis call and one Beautify call with the paid
// Gemini key. Only a human may run this script. Agents must never run it.
//
//   cd app
//   npm run eval:clothes -- --confirm-paid

import fs from "node:fs";
import path from "node:path";
import { generateObject, generateText } from "ai";
import { clothingAttributesSchema } from "../src/lib/schemas/ai.ts";
import {
  getImageModel,
  getModel,
  IMAGE_MODEL_ID,
  MODEL_ID,
  UNTRUSTED_CONTENT_RULE,
} from "../src/lib/ai/gemini.ts";
import {
  CLOTHING_ANALYSIS_PROMPT,
  CLOTHING_ANALYSIS_PROMPT_VERSION,
} from "../src/lib/ai/clothing-analysis-prompt.ts";
import { BEAUTIFY_PROMPT } from "../src/lib/ai/beautify-prompt.ts";

const CASES_DIR = path.resolve("tests/test-cases-clothes");
const RESULTS_ROOT = path.resolve("../test-results");
const EXPECTED_FIELDS = [
  "name",
  "category",
  "subcategory",
  "primary_colour",
  "secondary_colours",
  "pattern",
  "material_cues",
  "formality",
  "layering_role",
  "weather_tags",
];
const IMAGE_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const EXTENSIONS_BY_TYPE = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!process.argv.includes("--confirm-paid")) {
  fail(
    "Refusing to run: this evaluation spends money on the paid Gemini key. " +
      "Run npm run eval:clothes -- --confirm-paid to confirm that a person started it.",
  );
}
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  fail("GOOGLE_GENERATIVE_AI_API_KEY is not set in app/.env.local or the current shell.");
}

function readManifest() {
  const manifestPath = path.join(CASES_DIR, "expected.json");
  if (!fs.existsSync(manifestPath)) fail(`Missing manifest: ${manifestPath}`);

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`Could not parse ${manifestPath}: ${error instanceof Error ? error.message : error}`);
  }

  if (!Array.isArray(parsed?.cases) || parsed.cases.length === 0) {
    fail("expected.json must contain a non-empty cases array.");
  }

  const ids = new Set();
  const files = new Set();
  for (const testCase of parsed.cases) {
    if (!testCase || typeof testCase !== "object") fail("Each case must be an object.");
    if (typeof testCase.id !== "string" || !/^[a-z0-9-]+$/.test(testCase.id)) {
      fail(`Case ids must use lowercase letters, numbers and hyphens: ${testCase.id ?? "missing id"}`);
    }
    if (ids.has(testCase.id)) fail(`Duplicate case id: ${testCase.id}`);
    ids.add(testCase.id);

    if (typeof testCase.file !== "string" || path.basename(testCase.file) !== testCase.file) {
      fail(`Case ${testCase.id} must name an image directly inside test-cases-clothes.`);
    }
    if (files.has(testCase.file)) fail(`Duplicate source image: ${testCase.file}`);
    files.add(testCase.file);

    const extension = path.extname(testCase.file).toLowerCase();
    if (!IMAGE_TYPES[extension]) fail(`Unsupported source image type: ${testCase.file}`);
    if (!testCase.expected || typeof testCase.expected !== "object") {
      fail(`Case ${testCase.id} is missing expected analysis values.`);
    }
    for (const field of EXPECTED_FIELDS) {
      if (!(field in testCase.expected)) fail(`Case ${testCase.id} is missing expected.${field}.`);
    }
    for (const field of ["secondary_colours", "weather_tags"]) {
      if (!Array.isArray(testCase.expected[field])) {
        fail(`Case ${testCase.id} expected.${field} must be an array.`);
      }
    }
  }

  const rootImages = fs
    .readdirSync(CASES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_TYPES[path.extname(entry.name).toLowerCase()])
    .map((entry) => entry.name);
  for (const file of rootImages) {
    if (!files.has(file)) fail(`Source image has no expected.json entry: ${file}`);
  }
  for (const file of files) {
    if (!rootImages.includes(file)) fail(`Manifest source image is missing: ${file}`);
  }

  return parsed.cases;
}

function canonicalScalar(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalValue(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(canonicalScalar))].sort();
  }
  return canonicalScalar(value);
}

function valuesMatch(expected, actual) {
  return JSON.stringify(canonicalValue(expected)) === JSON.stringify(canonicalValue(actual));
}

function display(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "(none)";
  const text = String(value ?? "").trim();
  return text && text !== "-" ? text : "(none)";
}

function markdown(value) {
  return display(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function compareAnalysis(expected, modelOutput) {
  const actual = {
    name: [modelOutput.primary_colour, modelOutput.subcategory].filter(Boolean).join(" "),
    ...modelOutput,
  };
  const comparisons = EXPECTED_FIELDS.map((field) => ({
    field,
    expected: expected[field],
    actual: actual[field],
    matches: valuesMatch(expected[field], actual[field]),
  }));
  const matched = comparisons.filter((entry) => entry.matches).length;
  return {
    actual,
    comparisons,
    matched,
    total: comparisons.length,
    accuracyPercent: Number(((matched / comparisons.length) * 100).toFixed(1)),
  };
}

function imageContent(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    type: "file",
    data: fs.readFileSync(filePath),
    mediaType: IMAGE_TYPES[extension],
  };
}

function makeRunDirectory() {
  const timestamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");
  const directory = path.join(RESULTS_ROOT, timestamp);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function buildMarkdown(run, results) {
  const successful = results.filter((result) => result.analysis?.comparisons);
  const matched = successful.reduce((sum, result) => sum + result.analysis.matched, 0);
  const total = successful.reduce((sum, result) => sum + result.analysis.total, 0);
  const overall = total ? Number(((matched / total) * 100).toFixed(1)) : null;
  const fieldTotals = Object.fromEntries(
    EXPECTED_FIELDS.map((field) => [field, { matched: 0, total: 0 }]),
  );
  for (const result of successful) {
    for (const comparison of result.analysis.comparisons) {
      fieldTotals[comparison.field].total += 1;
      if (comparison.matches) fieldTotals[comparison.field].matched += 1;
    }
  }

  const lines = [
    "# Clothing evaluation report",
    "",
    `Run: ${run.startedAt}`,
    `Analysis model: ${MODEL_ID}`,
    `Analysis prompt: ${CLOTHING_ANALYSIS_PROMPT_VERSION}`,
    `Beautify model: ${IMAGE_MODEL_ID}`,
    `Cases attempted: ${results.length}`,
    `Overall analysis accuracy: ${overall === null ? "n/a" : `${matched}/${total} (${overall}%)`}`,
    "",
    "Accuracy counts each expected field once. List order does not affect a match. Text comparison ignores case and treats underscores, hyphens and spaces as equivalent.",
    "",
    "## Accuracy by field",
    "",
    "| Field | Correct | Accuracy |",
    "| --- | ---: | ---: |",
  ];

  for (const field of EXPECTED_FIELDS) {
    const summary = fieldTotals[field];
    const percent = summary.total
      ? Number(((summary.matched / summary.total) * 100).toFixed(1))
      : null;
    lines.push(
      `| ${field} | ${summary.matched}/${summary.total} | ${percent === null ? "n/a" : `${percent}%`} |`,
    );
  }

  for (const result of results) {
    lines.push("", `## ${result.id}`, "", `Source: \`${result.sourceFile}\``);
    if (result.beautify?.outputFile) {
      lines.push(`Beautified image: [${result.beautify.outputFile}](./${result.beautify.outputFile})`);
    } else {
      lines.push(`Beautify error: ${result.beautify?.error ?? "No image returned"}`);
    }
    if (result.intendedBeautifiedFile) {
      lines.push(
        `Intended reference: [${result.intendedBeautifiedFile}](./${result.intendedBeautifiedFile})`,
      );
    }
    if (!result.analysis?.comparisons) {
      lines.push("", `Analysis error: ${result.analysis?.error ?? "No analysis returned"}`);
      continue;
    }

    lines.push(
      "",
      `Analysis accuracy: ${result.analysis.matched}/${result.analysis.total} (${result.analysis.accuracyPercent}%)`,
      "",
      "| Result | Field | Expected | Actual |",
      "| --- | --- | --- | --- |",
    );
    for (const comparison of result.analysis.comparisons) {
      lines.push(
        `| ${comparison.matches ? "MATCH" : "DIFF"} | ${comparison.field} | ${markdown(comparison.expected)} | ${markdown(comparison.actual)} |`,
      );
    }
    lines.push(
      "",
      `Confidence notes: ${result.analysis.actual.confidence_notes || "(none)"}`,
      `Uncertain fields: ${display(result.analysis.actual.uncertain_fields)}`,
    );
  }

  return `${lines.join("\n")}\n`;
}

function writeReports(runDirectory, run, results) {
  fs.writeFileSync(
    path.join(runDirectory, "analysis-report.json"),
    `${JSON.stringify({ ...run, results }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(runDirectory, "analysis-report.md"),
    buildMarkdown(run, results),
  );
}

const cases = readManifest();
const runDirectory = makeRunDirectory();
const run = {
  startedAt: new Date().toISOString(),
  sourceDirectory: path.relative(process.cwd(), CASES_DIR),
  analysisModel: MODEL_ID,
  analysisPromptVersion: CLOTHING_ANALYSIS_PROMPT_VERSION,
  beautifyModel: IMAGE_MODEL_ID,
};
const results = [];

console.log(
  `Running ${cases.length} cases with ${cases.length * 2} paid Gemini calls. ` +
    `Results will be saved to ${runDirectory}`,
);

for (const testCase of cases) {
  const sourcePath = path.join(CASES_DIR, testCase.file);
  const result = {
    id: testCase.id,
    sourceFile: testCase.file,
    expected: testCase.expected,
    analysis: null,
    beautify: null,
    intendedBeautifiedFile: null,
  };

  console.log(`\n${testCase.id}: analysing ${testCase.file}`);
  try {
    const started = Date.now();
    const response = await generateObject({
      model: getModel(),
      schema: clothingAttributesSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: CLOTHING_ANALYSIS_PROMPT },
            imageContent(sourcePath),
          ],
        },
      ],
    });
    result.analysis = {
      ...compareAnalysis(testCase.expected, response.object),
      latencyMs: Date.now() - started,
      usage: response.usage,
    };
    console.log(
      `  Analysis accuracy: ${result.analysis.matched}/${result.analysis.total} (${result.analysis.accuracyPercent}%)`,
    );
  } catch (error) {
    result.analysis = { error: errorMessage(error) };
    console.error(`  Analysis failed: ${result.analysis.error}`);
  }

  console.log(`${testCase.id}: beautifying ${testCase.file}`);
  try {
    const started = Date.now();
    const response = await generateText({
      model: getImageModel(),
      providerOptions: { google: { responseModalities: ["IMAGE", "TEXT"] } },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${BEAUTIFY_PROMPT}\n\n${UNTRUSTED_CONTENT_RULE}`,
            },
            imageContent(sourcePath),
          ],
        },
      ],
    });
    const image = response.files.find((file) => file.mediaType.startsWith("image/"));
    if (!image) throw new Error("The Beautify model returned no image.");
    const extension = EXTENSIONS_BY_TYPE[image.mediaType] ?? ".bin";
    const outputFile = `${testCase.id}-beautified${extension}`;
    fs.writeFileSync(path.join(runDirectory, outputFile), new Uint8Array(image.uint8Array));
    result.beautify = {
      outputFile,
      mediaType: image.mediaType,
      latencyMs: Date.now() - started,
      usage: response.usage,
    };
    console.log(`  Saved ${outputFile}`);
  } catch (error) {
    result.beautify = { error: errorMessage(error) };
    console.error(`  Beautify failed: ${result.beautify.error}`);
  }

  if (testCase.intendedBeautified) {
    const intendedPath = path.resolve(CASES_DIR, testCase.intendedBeautified);
    const intendedRoot = path.resolve(CASES_DIR, "intended");
    if (!intendedPath.startsWith(`${intendedRoot}${path.sep}`)) {
      result.intendedBeautifiedError = "intendedBeautified must point inside the intended directory.";
    } else if (!fs.existsSync(intendedPath)) {
      result.intendedBeautifiedError = `Missing intended image: ${testCase.intendedBeautified}`;
    } else {
      const outputFile = `${testCase.id}-intended${path.extname(intendedPath).toLowerCase()}`;
      fs.copyFileSync(intendedPath, path.join(runDirectory, outputFile));
      result.intendedBeautifiedFile = outputFile;
    }
  }

  results.push(result);
  writeReports(runDirectory, run, results);
}

const callFailures = results.filter(
  (result) => result.analysis?.error || result.beautify?.error,
).length;
console.log(`\nFinished. Open ${path.join(runDirectory, "analysis-report.md")}`);
if (callFailures) {
  console.error(`${callFailures} case(s) had an analysis or Beautify call failure.`);
  process.exitCode = 1;
}

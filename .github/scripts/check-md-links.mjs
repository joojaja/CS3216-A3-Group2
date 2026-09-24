// Fails when a Markdown file links to a repository path that does not exist.
// External links (http, mailto) and in-page anchors are skipped.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const roots = ["README.md", "app/README.md", "docs", ".claude/skills"];
const skipDirs = new Set(["node_modules", ".next", ".git"]);

function markdownFiles(path) {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return path.endsWith(".md") ? [path] : [];
  return readdirSync(path)
    .filter((name) => !skipDirs.has(name))
    .flatMap((name) => markdownFiles(join(path, name)));
}

const broken = [];
for (const file of roots.flatMap(markdownFiles)) {
  const text = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = decodeURIComponent(target.split("#")[0]);
    if (!existsSync(resolve(dirname(file), path))) broken.push(`${file}: ${target}`);
  }
}

if (broken.length > 0) {
  console.error(`Broken Markdown links:\n${broken.join("\n")}`);
  process.exit(1);
}
console.log("All relative Markdown links resolve.");

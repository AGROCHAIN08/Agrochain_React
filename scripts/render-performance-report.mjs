import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildPerformanceHtmlReport, writeReportsDashboard } from "./report-utils.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const markdownPath = path.join(repoRoot, "reports", "performance", "optimization-report.md");
const htmlPath = path.join(repoRoot, "reports", "performance", "optimization-report.html");

if (existsSync(markdownPath)) {
  const markdown = readFileSync(markdownPath, "utf8");
  mkdirSync(path.dirname(htmlPath), { recursive: true });
  writeFileSync(htmlPath, buildPerformanceHtmlReport(markdown), "utf8");
}

writeReportsDashboard(repoRoot);

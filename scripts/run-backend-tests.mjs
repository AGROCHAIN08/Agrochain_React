import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildBackendHtmlReport, parseJunitXml, writeReportsDashboard } from "./report-utils.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = path.join(repoRoot, "backend");
const reportDir = path.join(repoRoot, "reports", "backend");
const coverageDir = path.join(reportDir, "coverage");
const junitPath = path.join(reportDir, "junit.xml");
const htmlReportPath = path.join(reportDir, "test-report.html");
const summaryPath = path.join(reportDir, "summary.json");

rmSync(reportDir, { recursive: true, force: true });
mkdirSync(coverageDir, { recursive: true });

const result = spawnSync(
  process.execPath,
  [
    "--experimental-test-coverage",
    "--experimental-test-isolation=none",
    "--test",
    "--test-reporter=spec",
    "--test-reporter-destination=stdout",
    "--test-reporter=junit",
    `--test-reporter-destination=${junitPath}`,
  ],
  {
    cwd: backendDir,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_V8_COVERAGE: path.join(coverageDir, "raw"),
    },
  }
);

if (result.status === 0) {
  const junitXml = readFileSync(junitPath, "utf8");
  const parsed = parseJunitXml(junitXml);
  writeFileSync(htmlReportPath, buildBackendHtmlReport(parsed), "utf8");
  writeFileSync(summaryPath, JSON.stringify(parsed.summary, null, 2), "utf8");
  writeReportsDashboard(repoRoot);
}

process.exit(result.status ?? 1);

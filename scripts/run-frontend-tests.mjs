import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildSummaryCard, escapeHtml, formatDuration, getFrontendSummary, renderPage, writeReportsDashboard } from "./report-utils.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendDir = path.join(repoRoot, "frontend", "agrochain-client");
const reportDir = path.join(repoRoot, "reports", "frontend");
const testResultsJsonPath = path.join(reportDir, "test-results.json");
const testResultsHtmlPath = path.join(reportDir, "test-report.html");
const summaryPath = path.join(reportDir, "summary.json");

rmSync(reportDir, { recursive: true, force: true });
mkdirSync(reportDir, { recursive: true });

const buildSuiteMarkup = (suite) => {
  const ancestor = suite.ancestorTitles?.length ? `${suite.ancestorTitles.join(" > ")} > ` : "";
  const tests = suite.assertionResults
    .map((assertion) => {
      const statusTone = assertion.status === "passed" ? "passed" : "failed";
      const failureDetails = assertion.failureMessages?.length
        ? `<pre>${escapeHtml(assertion.failureMessages.join("\n\n"))}</pre>`
        : "";

      return `
        <li class="test ${statusTone}">
          <div class="test-header">
            <span class="status">${escapeHtml(assertion.status.toUpperCase())}</span>
            <span class="title">${escapeHtml(assertion.title)}</span>
            <span class="duration">${escapeHtml(formatDuration(assertion.duration))}</span>
          </div>
          ${failureDetails}
        </li>
      `;
    })
    .join("");

  return `
    <section class="suite">
      <h2>${escapeHtml(`${ancestor}${suite.name}`)}</h2>
      <div class="suite-meta">
        <span>${escapeHtml(`${suite.numPassingTests} passed`)}</span>
        <span>${escapeHtml(`${suite.numFailingTests} failed`)}</span>
        <span>${escapeHtml(`${suite.numPendingTests} pending`)}</span>
        <span>${escapeHtml(formatDuration(suite.perfStats?.end - suite.perfStats?.start || 0))}</span>
      </div>
      <ul class="tests">${tests}</ul>
    </section>
  `;
};

const buildHtmlReport = (results) => {
  const generatedAt = new Date().toLocaleString("en-IN", { hour12: true });
  const suitesMarkup = results.testResults.map(buildSuiteMarkup).join("");

  return renderPage({
    title: "Frontend Test Report",
    subtitle: `Generated for AgroChain on ${generatedAt}`,
    summaryCards: [
      buildSummaryCard("Suites", results.numTotalTestSuites),
      buildSummaryCard("Tests", results.numTotalTests),
      buildSummaryCard("Passed", results.numPassedTests, "good"),
      buildSummaryCard("Failed", results.numFailedTests, results.numFailedTests ? "bad" : "good"),
      buildSummaryCard("Pending", results.numPendingTests, results.numPendingTests ? "warn" : "neutral"),
      buildSummaryCard("Run Time", formatDuration(results.testResults.reduce((sum, suite) => {
        const duration = (suite.perfStats?.end ?? 0) - (suite.perfStats?.start ?? 0);
        return sum + Math.max(duration, 0);
      }, 0))),
    ].join(""),
    content: suitesMarkup,
  });
};

const reactScriptsPath = path.join(
  frontendDir,
  "node_modules",
  "react-scripts",
  "bin",
  "react-scripts.js"
);

const result = spawnSync(
  process.execPath,
  [
    reactScriptsPath,
    "test",
    "--watchAll=false",
    "--runInBand",
    "--coverage",
    `--coverageDirectory=${path.join(reportDir, "coverage")}`,
    "--json",
    `--outputFile=${testResultsJsonPath}`,
  ],
  {
    cwd: frontendDir,
    stdio: "inherit",
    env: {
      ...process.env,
      CI: "true",
    },
  }
);

if (result.status === 0) {
  const testResults = JSON.parse(readFileSync(testResultsJsonPath, "utf8"));
  writeFileSync(testResultsHtmlPath, buildHtmlReport(testResults), "utf8");
  writeFileSync(summaryPath, JSON.stringify(getFrontendSummary(testResults), null, 2), "utf8");
  unlinkSync(testResultsJsonPath);
  writeReportsDashboard(repoRoot);
}

process.exit(result.status ?? 1);

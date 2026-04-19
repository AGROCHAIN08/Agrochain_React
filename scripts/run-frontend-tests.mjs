import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendDir = path.join(repoRoot, "frontend", "agrochain-client");
const reportDir = path.join(repoRoot, "reports", "frontend");
const testResultsJsonPath = path.join(reportDir, "test-results.json");
const testResultsHtmlPath = path.join(reportDir, "test-report.html");

rmSync(reportDir, { recursive: true, force: true });
mkdirSync(reportDir, { recursive: true });

const formatDuration = (milliseconds = 0) => `${(milliseconds / 1000).toFixed(2)}s`;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildSummaryCard = (label, value, tone = "neutral") => `
    <div class="card ${tone}">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </div>
  `;

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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AgroChain Frontend Test Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f3ea;
      --panel: #fffdf8;
      --ink: #1f2933;
      --muted: #5f6c7b;
      --line: #e7dcc9;
      --accent: #0f766e;
      --good: #1f7a4d;
      --bad: #b42318;
      --warn: #b54708;
      --shadow: 0 18px 40px rgba(68, 52, 21, 0.08);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 32px;
      font-family: Georgia, "Times New Roman", serif;
      background:
        radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 28%),
        linear-gradient(180deg, #fbf8f2 0%, var(--bg) 100%);
      color: var(--ink);
    }

    .page {
      max-width: 1100px;
      margin: 0 auto;
    }

    header {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 28px;
      box-shadow: var(--shadow);
      margin-bottom: 24px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: clamp(2rem, 4vw, 3.2rem);
      line-height: 1.05;
    }

    .subtitle {
      margin: 0;
      color: var(--muted);
      font-size: 1.05rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin: 24px 0 4px;
    }

    .card {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 18px;
    }

    .card.good {
      border-color: rgba(31, 122, 77, 0.25);
    }

    .card.bad {
      border-color: rgba(180, 35, 24, 0.25);
    }

    .card.warn {
      border-color: rgba(181, 71, 8, 0.25);
    }

    .label {
      color: var(--muted);
      font-size: 0.92rem;
      margin-bottom: 8px;
    }

    .value {
      font-size: 2rem;
      font-weight: 700;
    }

    .suite {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 18px;
    }

    .suite h2 {
      margin: 0 0 10px;
      font-size: 1.3rem;
      overflow-wrap: anywhere;
    }

    .suite-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      color: var(--muted);
      margin-bottom: 18px;
      font-size: 0.95rem;
    }

    .tests {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 12px;
    }

    .test {
      border: 1px solid var(--line);
      border-left: 6px solid var(--accent);
      border-radius: 16px;
      padding: 14px 16px;
      background: #fff;
    }

    .test.failed {
      border-left-color: var(--bad);
    }

    .test.passed {
      border-left-color: var(--good);
    }

    .test-header {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: start;
    }

    .status {
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      color: var(--muted);
    }

    .title {
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .duration {
      color: var(--muted);
      white-space: nowrap;
    }

    pre {
      margin: 14px 0 0;
      padding: 14px;
      border-radius: 12px;
      overflow: auto;
      background: #221b16;
      color: #f9f4eb;
      font-size: 0.87rem;
      line-height: 1.45;
    }

    @media (max-width: 640px) {
      body {
        padding: 18px;
      }

      .test-header {
        grid-template-columns: 1fr;
      }

      .duration {
        white-space: normal;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <h1>Frontend Test Report</h1>
      <p class="subtitle">Generated for AgroChain on ${escapeHtml(generatedAt)}</p>
      <div class="grid">
        ${buildSummaryCard("Suites", results.numTotalTestSuites)}
        ${buildSummaryCard("Tests", results.numTotalTests)}
        ${buildSummaryCard("Passed", results.numPassedTests, "good")}
        ${buildSummaryCard("Failed", results.numFailedTests, results.numFailedTests ? "bad" : "good")}
        ${buildSummaryCard("Pending", results.numPendingTests, results.numPendingTests ? "warn" : "neutral")}
        ${buildSummaryCard("Run Time", formatDuration(results.testResults.reduce((sum, suite) => {
          const duration = (suite.perfStats?.end ?? 0) - (suite.perfStats?.start ?? 0);
          return sum + Math.max(duration, 0);
        }, 0)))}
      </div>
    </header>
    ${suitesMarkup}
  </div>
</body>
</html>`;
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
  unlinkSync(testResultsJsonPath);
}

process.exit(result.status ?? 1);

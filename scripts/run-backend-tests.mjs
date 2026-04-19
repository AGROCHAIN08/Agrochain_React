import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = path.join(repoRoot, "backend");
const reportDir = path.join(repoRoot, "reports", "backend");
const coverageDir = path.join(reportDir, "coverage");

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
    `--test-reporter-destination=${path.join(reportDir, "junit.xml")}`,
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

process.exit(result.status ?? 1);

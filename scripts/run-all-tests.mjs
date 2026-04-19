import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const commands = [
  path.join(repoRoot, "scripts", "run-backend-tests.mjs"),
  path.join(repoRoot, "scripts", "run-frontend-tests.mjs"),
];

for (const command of commands) {
  const result = spawnSync(process.execPath, [command], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

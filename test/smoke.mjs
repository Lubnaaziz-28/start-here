import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BIN = path.join(ROOT, "bin", "start-here.mjs");

function run(args, cwd, env = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ok  ${msg}`);
  } else {
    console.error(`  FAIL ${msg}`);
    failed++;
  }
}

const dir = await mkdtemp(path.join(tmpdir(), "start-here-test-"));
try {
  await access(path.join(ROOT, "skills", "start-here", "SKILL.md"));
  assert(true, "SKILL.md present");

  const v = run(["version"], dir);
  assert(v.status === 0 && v.stdout.trim() === "1.0.0", "version prints 1.0.0");

  const bad = run(["init", "--nope"], dir);
  assert(bad.status === 1, "unknown flag exits 1");

  const inst = run(["init"], dir);
  assert(inst.status === 0, "init exits 0");
  await access(path.join(dir, ".claude", "skills", "start-here", "SKILL.md"));
  assert(true, "init installs .claude skill");

  const chk = run(["check"], dir);
  assert(chk.status === 0, "check exits 0 when installed");

  const again = run(["init", "--claude"], dir);
  assert(again.status === 0 && again.stdout.includes("exists"), "re-init reports exists");

  const force = run(["init", "--claude", "--force"], dir);
  assert(force.status === 0 && force.stdout.includes("updated"), "force reports updated");

  const home = await mkdtemp(path.join(tmpdir(), "start-here-home-"));
  const gl = run(["init", "--claude", "--global"], dir, { HOME: home });
  assert(gl.status === 0, "init --claude --global exits 0");
  await access(path.join(home, ".claude", "skills", "start-here", "SKILL.md"));
  assert(true, "global claude skill installed with harness flag");

  const bare = await mkdtemp(path.join(tmpdir(), "start-here-bare-"));
  const bareChk = run(["check"], bare);
  assert(bareChk.status === 1, "check exits 1 when missing");

  const rootChk = run(["check"], ROOT);
  assert(rootChk.status === 0, "check passes in package repo");

  await rm(home, { recursive: true, force: true });
  await rm(bare, { recursive: true, force: true });
} finally {
  await rm(dir, { recursive: true, force: true });
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nall smoke tests passed");

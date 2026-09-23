#!/usr/bin/env node
/**
 * npx start-here init  — install the start-here skill into a project (and optionally global CLI dirs)
 * npx start-here check — verify a project already has the skill
 */
import { cp, mkdir, rm, access, readFile } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILL_SRC = path.join(ROOT, "skills", "start-here");

const HARNESS_FLAGS = ["--claude", "--opencode", "--codex", "--agents", "--cursor"];
const BOOL_FLAGS = ["--force", "-f", "--global", "-g", "--help", "-h"];
const KNOWN_FLAGS = [...HARNESS_FLAGS, ...BOOL_FLAGS, "--version", "-v"];

const TARGETS = [
  { id: "claude-project", dir: ".claude/skills/start-here", harness: "--claude", scope: "project" },
  { id: "opencode-project", dir: ".opencode/skills/start-here", harness: "--opencode", scope: "project" },
  { id: "codex-project", dir: ".codex/skills/start-here", harness: "--codex", scope: "project" },
  { id: "agents-project", dir: ".agents/skills/start-here", harness: "--agents", scope: "project" },
  { id: "cursor-project", dir: ".cursor/skills/start-here", harness: "--cursor", scope: "project" },
];

const GLOBAL = [
  { id: "claude-user", dir: "~/.claude/skills/start-here", harness: "--claude", scope: "global" },
  { id: "opencode-user", dir: "~/.config/opencode/skills/start-here", harness: "--opencode", scope: "global" },
  { id: "codex-user", dir: "~/.codex/skills/start-here", harness: "--codex", scope: "global" },
  { id: "agents-user", dir: "~/.agents/skills/start-here", harness: "--agents", scope: "global" },
  { id: "cursor-user", dir: "~/.cursor/skills/start-here", harness: "--cursor", scope: "global" },
];

function expand(p) {
  if (p.startsWith("~")) return path.join(homedir(), p.slice(1));
  return p;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  let cmd = argv[0] && !argv[0].startsWith("-") ? argv[0] : null;
  let i = cmd ? 1 : 0;
  const flags = [];
  for (; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("-")) {
      if (cmd === null) cmd = a;
      else {
        console.error(`Unexpected argument: ${a}`);
        process.exitCode = 1;
        return null;
      }
      continue;
    }
    if (!KNOWN_FLAGS.includes(a)) {
      console.error(`Unknown flag: ${a} (try: --help)`);
      process.exitCode = 1;
      return null;
    }
    flags.push(a);
  }
  if (cmd === null) cmd = "init";
  if (cmd === "init" && flags.includes("--version")) cmd = "version";
  return { cmd, flags };
}

function help() {
  console.log(`start-here — one-screen onboarding brief for any repo

Usage:
  npx start-here init           Install skill into .claude/.opencode/.codex/.agents/.cursor of cwd
  npx start-here init --global  Also install into user-level skill dirs
  npx start-here check          Report whether skill is present
  npx start-here version        Print version

Flags:
  --force     Overwrite existing skill
  --claude --opencode --codex --agents --cursor   Only these targets
  --global    Include (or report) user-level dirs — combines with harness flags
`);
}

async function copySkill(destAbs, { force }) {
  const destSkill = path.join(destAbs, "SKILL.md");
  const existed = await exists(destSkill);
  if (existed && !force) return "exists";
  if (existed) await rm(destAbs, { recursive: true, force: true });
  await mkdir(destAbs, { recursive: true });
  await cp(SKILL_SRC, destAbs, { recursive: true, force: true });
  return existed ? "updated" : "installed";
}

async function runInit({ flags }) {
  const force = flags.includes("--force") || flags.includes("-f");
  const wantGlobal = flags.includes("--global") || flags.includes("-g");
  const only = flags.filter((f) => HARNESS_FLAGS.includes(f));

  const list = TARGETS.filter((t) => !only.length || only.includes(t.harness)).map((t) => ({
    ...t,
    want: true,
  }));
  const listGlobal = GLOBAL.filter((t) => wantGlobal && (!only.length || only.includes(t.harness))).map(
    (t) => ({ ...t, want: true })
  );

  const all = [...list, ...listGlobal];
  if (!all.length) {
    console.error("No matching install targets.");
    process.exitCode = 1;
    return;
  }

  console.log("start-here install\n");
  let failures = 0;
  for (const t of all) {
    try {
      const abs = path.resolve(expand(t.dir));
      const status = await copySkill(abs, { force });
      const mark = status === "installed" ? "+" : status === "updated" ? "~" : "=";
      console.log(`  ${mark} ${status.padEnd(10)} ${t.dir}`);
    } catch (err) {
      failures++;
      console.error(`  ✗ ${t.dir}: ${err.code || err.message}`);
    }
  }

  if (failures) {
    process.exitCode = 1;
    return;
  }

  console.log(`
Next:
  1. Open your agent CLI in this repo
  2. Run: /start-here
  3. Read START_HERE.md

Docs: https://github.com/minoruthenextkami-afk/start-here`);
}

async function runCheck({ flags }) {
  const wantGlobal = flags.includes("--global") || flags.includes("-g");
  const only = flags.filter((f) => HARNESS_FLAGS.includes(f));
  const filter = (arr) => arr.filter((t) => !only.length || only.includes(t.harness));

  let projectHits = 0;
  let globalHits = 0;
  console.log("project:");
  for (const t of filter(TARGETS)) {
    const abs = path.resolve(t.dir);
    const ok = await exists(path.join(abs, "SKILL.md"));
    if (ok) projectHits++;
    console.log(`  ${ok ? "ok" : "--"}  ${t.id.padEnd(16)} ${t.dir}`);
  }
  if (wantGlobal) {
    console.log("global:");
    for (const t of filter(GLOBAL)) {
      const abs = expand(t.dir);
      const ok = await exists(path.join(abs, "SKILL.md"));
      if (ok) globalHits++;
      console.log(`  ${ok ? "ok" : "--"}  ${t.id.padEnd(16)} ${t.dir}`);
    }
  }

  if (projectHits > 0) {
    console.log(`\n  skill installed in project (${projectHits} harness${projectHits === 1 ? "" : "es"})`);
    return;
  }
  if (wantGlobal && globalHits > 0) {
    console.log(`\n  skill only global (${globalHits}) — project not configured`);
    console.log("  fix: npx start-here init");
    process.exitCode = 1;
    return;
  }
  console.log("\n  skill not installed in project — run: npx start-here init");
  process.exitCode = 1;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) return;
  const { cmd, flags } = parsed;

  if (cmd === "--help" || cmd === "-h" || cmd === "help" || flags.includes("--help") || flags.includes("-h")) {
    help();
    return;
  }
  if (cmd === "version" || cmd === "--version" || cmd === "-v" || flags.includes("--version") || flags.includes("-v")) {
    const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
    console.log(pkg.version);
    return;
  }
  if (cmd === "check") {
    await runCheck({ flags });
    return;
  }
  if (cmd !== "init") {
    console.error(`Unknown command: ${cmd} (try: init | check | version)`);
    process.exitCode = 1;
    return;
  }
  await runInit({ flags });
}

main().catch((err) => {
  console.error(err.code ? `${err.code}: ${err.message}` : err);
  process.exitCode = 1;
});

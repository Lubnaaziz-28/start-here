#!/usr/bin/env node
/**
 * npx start-here init  — install the start-here skill into a project (and optionally global CLI dirs)
 * npx start-here check — verify a project already has the skill
 */
import { cp, mkdir, access, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILL_SRC = path.join(ROOT, "skills", "start-here");

const TARGETS = [
  { id: "claude-project", dir: ".claude/skills/start-here", flag: "--claude" },
  { id: "opencode-project", dir: ".opencode/skills/start-here", flag: "--opencode" },
  { id: "codex-project", dir: ".codex/skills/start-here", flag: "--codex" },
  { id: "agents-project", dir: ".agents/skills/start-here", flag: "--agents" },
  { id: "cursor-project", dir: ".cursor/skills/start-here", flag: "--cursor" },
];

const GLOBAL = [
  { id: "claude-user", dir: "~/.claude/skills/start-here", flag: "--global" },
  { id: "opencode-user", dir: "~/.config/opencode/skills/start-here", flag: "--global" },
  { id: "codex-user", dir: "~/.codex/skills/start-here", flag: "--global" },
  { id: "agents-user", dir: "~/.agents/skills/start-here", flag: "--global" },
];

function expand(p) {
  if (p.startsWith("~")) return path.join(process.env.HOME || "", p.slice(1));
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

async function copySkill(destAbs, { force }) {
  if (await exists(path.join(destAbs, "SKILL.md"))) {
    if (!force) return "exists";
    await cp(SKILL_SRC, destAbs, { recursive: true, force: true });
    return "updated";
  }
  await mkdir(path.dirname(destAbs), { recursive: true });
  await cp(SKILL_SRC, destAbs, { recursive: true });
  return "installed";
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "init";
  const force = args.includes("--force") || args.includes("-f");
  const global = args.includes("--global") || args.includes("-g");
  const only = args.filter((a) => a.startsWith("--") && !["--force", "-f", "--global", "-g", "--help", "-h"].includes(a));

  if (cmd === "--help" || cmd === "-h" || cmd === "help") {
    console.log(`start-here — one-screen onboarding brief for any repo

Usage:
  npx start-here init           Install skill into .claude/.opencode/.codex/.agents/.cursor of cwd
  npx start-here init --global  Also install into user-level skill dirs
  npx start-here check          Report whether skill is present
  npx start-here version        Print version

Flags:
  --force     Overwrite existing skill
  --claude --opencode --codex --agents --cursor   Only these targets
`);
    return;
  }

  if (cmd === "version" || cmd === "--version" || cmd === "-v") {
    const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
    console.log(pkg.version);
    return;
  }

  if (cmd === "check") {
    const all = [...TARGETS, ...GLOBAL];
    let hit = 0;
    for (const t of all) {
      const abs = path.resolve(expand(t.dir));
      const ok = await exists(path.join(abs, "SKILL.md"));
      if (ok) {
        console.log(`  ok  ${t.id.padEnd(16)} ${t.dir}`);
        hit++;
      }
    }
    if (!hit) console.log("  no  skill not installed — run: npx start-here init");
    process.exit(hit ? 0 : 1);
  }

  if (cmd !== "init") {
    console.error(`Unknown command: ${cmd} (try: init | check | version)`);
    process.exit(1);
  }

  const list = global ? [...TARGETS, ...GLOBAL] : TARGETS;
  const results = [];
  for (const t of list) {
    if (only.length && !only.includes(t.flag)) continue;
    const abs = path.resolve(expand(t.dir));
    const status = await copySkill(abs, { force });
    results.push({ id: t.id, dir: t.dir, status });
  }

  console.log("start-here install\n");
  for (const r of results) {
    const mark = r.status === "installed" ? "+" : r.status === "updated" ? "~" : "=";
    console.log(`  ${mark} ${r.status.padEnd(10)} ${r.dir}`);
  }
  console.log(`
Next:
  1. Open your agent CLI in this repo
  2. Run: /start-here
  3. Read START_HERE.md

Docs: https://github.com/start-here-dev/start-here`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

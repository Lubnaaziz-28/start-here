# start-here

<!-- TODO: replace with real GIF — terminal: `/start-here` → START_HERE.md in <60s -->

**One command. One screen. You know the repo.**

```bash
npx start-here init
```

Then in Claude Code / Codex / OpenCode / Cursor:

```
/start-here
```

You get `START_HERE.md` — purpose, how to run it, which file to open for each task, a first PR, gotchas. **No graph. No dashboard. No account.**

---

## Why

Agents are great at *reading* a codebase. Humans still get lost on day one — and `ARCHITECTURE.md` is stale the week after it was written.

`start-here` is the brief you wish every repo shipped with:

| Question | Answer location |
|----------|-----------------|
| What is this? | `START_HERE.md` → What this is |
| How do I run/test/build? | → Run it |
| Where do I change auth? | → Where to change what |
| What's a safe first PR? | → First PR |
| What will bite me? | → Gotchas |

**Not a knowledge graph.** If you want queryable structure, use [Graphify](https://github.com/Graphify-Labs/graphify). This is the 60-second human layer on top.

---

## Install

```bash
# project-local (recommended)
npx start-here init

# also user-global (~/.claude, ~/.codex, …)
npx start-here init --global

# single harness
npx start-here init --claude
npx start-here init --codex
npx start-here init --opencode
npx start-here init --cursor
```

Or copy the skill by hand:

```bash
mkdir -p .claude/skills/start-here
curl -fsSL https://raw.githubusercontent.com/minoruthenextkami-afk/start-here/main/skills/start-here/SKILL.md \
  -o .claude/skills/start-here/SKILL.md
```

### Works in

| Harness | Path |
|---------|------|
| Claude Code | `.claude/skills/start-here/SKILL.md` |
| OpenCode | `.opencode/skills/start-here/SKILL.md` |
| Codex | `.codex/skills/start-here/SKILL.md` |
| Agent Skills standard | `.agents/skills/start-here/SKILL.md` |
| Cursor | `.cursor/skills/start-here/SKILL.md` |

Spec: [agentskills.io](https://agentskills.io/specification) · Node ≥18 · MIT · zero runtime deps

---

## Example output

See [`examples/START_HERE.example.md`](examples/START_HERE.example.md) — that's the whole product.

```markdown
# Start here

## What this is
Minimal Express API that serves job listings…

## Run it
| Install | `npm ci` |
| Dev     | `npm run dev` |

## Where to change what
| I want to… | Open |
| Add route  | `src/routes/listings.js` |
```

---

## Commands

```bash
npx start-here init     # install skill into cwd harnesses
npx start-here check    # verify installed
npx start-here version  # print version
```

Inside the agent: `/start-here` · `/start-here --force` (regenerate)

---

## Design rules (baked into the skill)

1. Prose + tables only — no Mermaid, no node graphs  
2. One screen (~80–120 lines)  
3. Real paths only — `unknown` over guessing  
4. Run commands from real manifests, never invented  
5. Task → file map, max 8 rows  

---

## Related

- [Graphify](https://github.com/Graphify-Labs/graphify) — queryable knowledge graph (different job)
- [diagram-design](https://github.com/cathrynlavery/diagram-design) — editorial diagrams
- [career-ops](https://github.com/santifer/career-ops) — job search command center

## License

MIT

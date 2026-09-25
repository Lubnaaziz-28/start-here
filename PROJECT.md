# start-here

One-screen `START_HERE.md` onboarding brief for any repo — Agent Skill + `npx start-here init`.

## Status: v1.0.0 ready, npm not published

| | |
|--|--|
| Repo | https://github.com/Lubnaaziz-28/start-here (`main`) |
| Release | v1.0.0 |
| Local | `/home/base-user/projects/start-here` |
| Tests | `npm test` (smoke) |
| Skill | agentskills `skills-ref validate` |
| npm | name free; login + `npm publish` pending |

## Layout

- `skills/start-here/SKILL.md` — canonical skill
- `.claude/ .opencode/ .codex/ .agents/ .cursor/skills/start-here/` — vendored copies (must stay in sync)
- `bin/start-here.mjs` — CLI: `init` \| `check` \| `version`
- `test/smoke.mjs` — 12-assert gate
- `docs/demo.gif` — README demo
- `EOD-2026-09-23.md` — end-of-day log
- `examples/START_HERE.example.md` — sample output

## Commands

```bash
npm test
npx skills-ref validate skills/start-here
npx start-here init          # in target repo
npx start-here check
npm publish                  # after npm login
```

## Design rules

1. Prose + tables only (no Mermaid)
2. Target ~80–120 lines, hard cap ~130
3. Real paths or `unknown`
4. Max 8 task rows
5. Zero runtime deps

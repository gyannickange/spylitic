# Senior Engineer Playbook

This playbook is a practical, copyable guide for writing code with senior-level quality.
It focuses on decision-making, design tradeoffs, and building systems that are correct,
maintainable, and easy to evolve.

## Core principles
- Optimize for the next engineer (often you in 6 months).
- Prefer clear, boring solutions over clever ones.
- Make correctness obvious; make wrong usage hard.
- Keep scope tight; eliminate unnecessary surface area.
- Pay down complexity early; it compounds quickly.

## How seniors think before coding
1. Clarify the goal
   - What problem are we solving, and for whom?
   - What is explicitly out of scope?
   - What is the success metric (speed, reliability, usability, cost)?
2. Identify constraints
   - Data shape, latency, availability, deployment, security.
   - Existing patterns or conventions in this codebase.
3. Choose the simplest viable design
   - Smallest change that achieves the goal.
   - Prefer fewer moving pieces.
4. Plan the failure modes
   - What can go wrong?
   - What happens when an upstream dependency fails?
   - How will we detect and recover?

## Code quality checklist
- Readability: A junior can follow it without context.
- Naming: Concepts map 1:1 to domain language.
- Cohesion: Each unit does one thing well.
- Coupling: Dependencies are explicit and minimal.
- Tests: Behavior is covered, not just happy paths.
- Observability: Logs/metrics cover critical paths.

## Architecture habits
- Define clear boundaries (domain, service, UI, data).
- Keep orchestration near the edge; keep logic near the domain.
- Use interfaces where change is likely; avoid premature abstraction.
- Ensure each module can be tested without heavy integration.

## Engineering hygiene
- Add docs for non-obvious decisions.
- Update tests and changelogs with every behavior change.
- Keep PRs small and reviewable.
- Remove dead code; deprecated paths must have an end date.

## Common pitfalls to avoid
- Gold-plating and over-engineering.
- "Temporary" hacks with no owner or cleanup date.
- Implicit side effects or hidden state.
- Combinatorial complexity in options or flags.

## Senior-level defaults
- Prefer explicitness over magic.
- Prefer data-driven design over conditionals.
- Prefer idempotent operations.
- Prefer immutability where reasonable.
- Prefer fast feedback loops (tests, linters, CI).

## When to stop
- You hit the defined success metric.
- The change is small enough to merge safely.
- The system has clear monitoring for regressions.


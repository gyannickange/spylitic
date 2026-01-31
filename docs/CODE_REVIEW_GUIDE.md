# Code Review Guide

This guide helps reviewers and authors align on what "senior quality" looks like.

## Reviewer mindset
- Protect users and the business.
- Protect future maintainers.
- Catch hidden complexity and risk.
- Be kind and specific.

## What to review first
1. Behavior: Is this correct and safe?
2. Design: Is it the simplest viable solution?
3. Tests: Do tests match the behavior?
4. Readability: Will a new engineer understand it?

## Common review findings
- Hidden coupling between modules.
- Edge cases not handled.
- Side effects not documented.
- Tests missing for failure paths.
- Performance regressions in hot paths.
- Security checks bypassed or missing.

## What "good" looks like
- The change is small and focused.
- The main logic is in one place.
- Test names explain expected behavior.
- The diff is easy to reason about.

## Author self-review checklist
- Read the diff as if you didn't write it.
- Remove dead code or unused helpers.
- Verify logs or metrics are useful.
- Ensure the rollback path is clear.

## Review communication
- Ask questions instead of giving orders.
- Explain the "why" behind a suggestion.
- Offer alternatives when possible.


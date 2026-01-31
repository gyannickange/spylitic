# Best Practices Checklist

Use this as a pre-merge checklist. It is intentionally short and enforceable.

## Design
- Requirements and constraints are explicit.
- Scope is minimal; no extra features.
- Design avoids premature abstraction.
- Failure modes are identified.

## Code
- Names match domain concepts.
- Functions are small and single-purpose.
- Side effects are explicit.
- Error handling is deliberate (not accidental).

## Tests
- Critical behavior has tests.
- Edge cases and error paths covered.
- Tests assert behavior, not implementation.
- Tests are deterministic and fast.

## Performance
- No unnecessary work in hot paths.
- N+1 or repeated queries avoided.
- Caching or batching used only with clear need.

## Security
- Input is validated and sanitized.
- Authorization is enforced at the boundary.
- Sensitive data is not logged.

## Observability
- Logs show key decision points.
- Metrics or tracing available for core flows.
- Errors include actionable context.

## Maintainability
- No magic numbers or implicit behavior.
- Comments explain "why" not "what".
- Docs updated for non-obvious changes.


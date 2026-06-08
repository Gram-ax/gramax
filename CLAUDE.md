Behaviour Patterns:
- Prefer to use git worktrees when working independently on a feature. Never check dependencies into the worktree, instead link them from the main worktree
- Use `.spec` directory to put spec files into if you writing them

Logging:
- Never use `console.log` / `console.error` / `console.warn` directly. Emit logs through OpenTelemetry:
  - Wrap units of work in `traced(name, () => …)` (or `@trace()`) from `@ext/loggers/opentelemetry` so they create a span.
  - Inside a span, attach diagnostics with `span()?.addEvent(name, attrs)`. Outside a span the event drops, so make sure the caller is traced.
  - For thrown errors prefer letting `traced` record them (it calls `span.recordException`); use `addEvent` for non-throwing signals.

Helper scripts:
- Use `./scripts/link-worktree-deps.sh` when creating a new worktree to link dependencies from the main worktree

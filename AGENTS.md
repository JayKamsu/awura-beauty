<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project convention: comment every exported function/component

Every exported function, React component, and exported type/interface in this codebase must have a short doc comment (`/** ... */`) directly above it explaining what it does. This applies to all TypeScript/TSX files under `app/`, `features/`, `lib/`, and `components/`.

- One or two sentences is enough — state the purpose, not the implementation.
- Non-exported/internal helpers don't require a comment unless their behavior is non-obvious.
- Keep inline comments for genuinely non-obvious logic (as before) — this rule adds doc comments on exports, it doesn't require line-by-line narration.
- When adding a new exported function/component, add its doc comment in the same change — don't leave it for later.

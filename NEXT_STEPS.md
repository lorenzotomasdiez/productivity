## Next Steps (Post-Blockers)

Short, actionable items to complete before the next phase.

### 4) OpenAPI parity and CI check
- Action:
  - Update `openapi.yaml` to match current routes and auth requirements (most `/api/v1/*` require JWT).
  - Add CI step to lint spec and check drift between code and spec.
- Acceptance:
  - Spec validates (no errors), endpoints and response shapes match.
  - CI fails on drift.

### 5) Real Apple Sign In verification
- Action:
  - Verify Apple identity token against Apple public keys; extract `sub` for stable `appleId`.
  - Keep dev-mode stub for local testing.
- Acceptance:
  - Non-dev requires valid Apple token.
  - Tests cover valid/invalid tokens.

### 6) Rate limiting + CORS hardening
- Action:
  - Implement per-user and per-IP limits; provide sane production defaults via env.
  - Narrow CORS origins in production and audit allowed headers.
- Acceptance:
  - Configurable via env; defaults safe in prod.

### 7) WebSocket authentication
- Action:
  - Enforce JWT at handshake for `/ws/user/:userId?token=...`.
  - Handle token expiry and disconnects.
- Acceptance:
  - Unauthorized connections rejected; expiring tokens handled.

### 8) Logging and traceability
- Action:
  - Include `request_id` in all responses; add `incident_id` for 5xx.
  - Ensure userId (hashed) in server logs where appropriate.
- Acceptance:
  - Responses universally include `request_id`; 5xx include `incident_id`.

### 9) Test coverage focus
- Action:
  - Run `npm run test:coverage`; raise coverage where <80%.
  - Add missing unit/integration tests for edge cases.
- Acceptance:
  - Global coverage >= 80% for branches, functions, lines, statements.

### 10) Migrations and schema hygiene
- Action:
  - Introduce migration tooling or versioned SQL with idempotency.
  - Ensure models, enums, and types match schema.
- Acceptance:
  - Deterministic schema setup for all environments; reproducible.

### 11) Session cleanup job
- Action:
  - Add a scheduled cleanup task to prune expired refresh sessions.
- Acceptance:
  - Session table remains bounded; logs confirm periodic cleanup.

---

Notes
- Blockers are resolved: route auth, refresh O(1), progress SSoT.
- Keep enforcing TDD: write failing tests first for each item above, then implement.


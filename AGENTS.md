# AGENTS.md — CampusHub Backend

Governing context file for all AI agents working in this repository.
These rules are **binding**. If a request conflicts with them, stop and say so
instead of silently deviating.

Project: **CampusHub** — a multi-tenant campus resource management system.
Runtime: Node.js >= 24.21.0, npm >= 11.19.1.

---

## 1. Tech Stack & Libraries

**Authorized runtime dependencies (nothing else without explicit approval):**

- `typescript`
- `express` (v5)
- `mongoose`
- `dotenv`

**Authorized dev dependencies:**

- `ts-node`, `@types/node`, `@types/express`
- `eslint`, `prettier`, `typescript-eslint`
- `jest`, `ts-jest`, `@types/jest` — test runner for the CI pipeline (Lab 8);
  replaces the placeholder `npm test` script

**Forbidden:**

- Any `.js`, `.jsx`, `.cjs`, or `.mjs` source file in `src/`. **TypeScript only.**
- Alternative web frameworks (Fastify, Koa, NestJS, Hapi).
- Alternative ODM/ORMs or the raw `mongodb` driver. Database access goes through
  Mongoose only.
- Redundant middleware packages. Use `express.json()` and
  `express.urlencoded()`, not `body-parser`.
- Utility grab-bags (`lodash`, `underscore`, `moment`). Use native JS/TS,
  `Intl`, and `Date`.
- Adding *any* new package without first stating the package name, why it is
  needed, and what it replaces. Prefer the standard library.

## 2. Architectural Boundaries (strict 3-tier + models)

```
src/
├── app.ts                 # Express app assembly + middleware registration only
├── server.ts              # Process bootstrap: env load, DB connect, listen
├── routes/                # Route definitions and middleware mapping ONLY
├── controllers/           # HTTP request/response handling and status codes
├── services/              # Pure business logic
├── models/                # Mongoose schemas + interface definitions ONLY
├── config/                # Environment/config loading and validation
├── middleware/            # Cross-cutting middleware (errors, auth, tenancy)
└── types/                 # Shared type/interface declarations
```

Dependency direction is one-way: `routes → controllers → services → models`.
Never import in the reverse direction.

| Layer | MUST | MUST NOT |
|---|---|---|
| `routes/` | Declare paths, HTTP verbs, attach middleware, delegate to a controller method | Contain business logic, inline handler bodies, or DB calls |
| `controllers/` | Parse/validate input shape, call exactly one service, map results to status codes | Query the database directly, import from `models/`, hold business rules |
| `services/` | Hold all business logic, orchestrate model access, throw typed errors | Touch `req`, `res`, `next`, or any Express type; set status codes |
| `models/` | Define Mongoose schemas and their TS interfaces | Contain business logic beyond schema-level validators/indexes |

Additional rules:

- API routes are versioned under `/api/v1`.
- `app.ts` must export the configured `Application` and must **not** call
  `app.listen()`. Listening happens in `server.ts` so the app stays testable.
- Every route file is registered in exactly one place (`src/routes/index.ts`).
- Multi-tenancy: every tenant-scoped model carries a `tenantId`, and every
  tenant-scoped query must filter on it. Never write a query that can span
  tenants unless the function name says so explicitly.

## 3. Coding Standards & Safety

- `tsconfig.json` runs in `strict` mode. Do not weaken compiler options to make
  code compile.
- **`any` is forbidden.** No `as any`, no `@ts-ignore`, no `@ts-expect-error`
  to silence real type errors. Use `unknown` plus narrowing when a type is
  genuinely unknown.
- Every exported function has an explicit parameter and return type. No relying
  on inference at module boundaries.
- Every Mongoose schema has a matching exported `interface`.
- Async safety: no unhandled promises. Every `await` lives inside a
  `try/catch`, or the async handler is wrapped so rejections reach the central
  error middleware. Never use floating `.then()` chains.
- All errors surface through a single error-handling middleware registered last
  in `app.ts`. Services throw domain errors; controllers do not build ad-hoc
  error JSON.
- No secrets, connection strings, or tokens in source. Read them from
  `process.env` via `src/config/`, and document every new variable in
  `.env-example`.
- Use `const` by default, named exports over default exports, and
  `camelCase` for values / `PascalCase` for types and classes.
- Unused-by-design parameters (Express middleware signatures) are prefixed with
  `_`. Do not delete them to satisfy the linter.
- File naming: `<name>.routes.ts`, `<name>.controller.ts`, `<name>.service.ts`,
  `<name>.model.ts`.
- No `console.log` in committed code paths other than `server.ts` startup
  messages.

## 4. Git & Commit Formatting

- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`,
  `test:`. Subject line under 72 characters, imperative mood.
- Never commit `.env`, `node_modules/`, or `dist/`.
- After generating or changing code, the agent must report:
  1. **What was built** — files added/changed, in one line each.
  2. **Why** — the requirement it satisfies.
  3. **Which rules in this file applied** — e.g. "logic placed in
     `services/` per §2; explicit interfaces per §3."
  4. **Anything skipped or assumed**, stated plainly rather than guessed at.
- Do not bundle unrelated changes into one diff.
- Do not run `git push`, force-push, rewrite history, or install packages
  without being asked.

## 5. Agent Behavior

- Read this file before generating code in this repo.
- If a requested change would violate any rule above, refuse and propose a
  compliant alternative.
- Do not create files outside the layout in §2.
- Do not refactor unrelated files "while you're in there."
- Keep changes minimal and reviewable; prefer the smallest diff that works.

---

## Appendix A — Boundary Verification Log (Lab 1, Part 3)

Verification prompt issued to the agent:

> Generate a initial Express server file (src/app.ts) and a baseline
> health-check endpoint (GET /api/v1/health).

### Compliance review of generated output

| Lab check | Result | Evidence |
|---|---|---|
| Strict TypeScript typing? | Pass | `tsc --noEmit` clean under `strict`. No `any`, no `@ts-ignore`. All exported functions carry explicit parameter and return types. `HealthReport` interface defined in `types/`. |
| Designated directory layout? | Pass | Route in `routes/health.routes.ts`, HTTP handling in `controllers/health.controller.ts`, logic in `services/health.service.ts`, shared types in `types/`. `app.ts` assembles only; `app.listen()` isolated to `server.ts`. |
| No forbidden deps / no inline logic in routes? | Pass | Only `express` and `dotenv` imported at runtime. No `body-parser` or `cors` — native `express.json()` used instead. `health.routes.ts` declares the verb and delegates; it holds zero logic. |
| Async error handling? | Pass | Controller wraps `await` in `try/catch` and forwards via `next(error)`. Central `errorHandler` registered last in `app.ts`. No floating `.then()` chains. |

Runtime verification: `GET /api/v1/health` returned `200` with a JSON body
containing `service`, `status`, `environment`, `uptimeSeconds`, and
`timestamp`.

### Corrections made after review

1. **Lint config contradicted §3.** ESLint's default `no-unused-vars` flagged
   the intentional `_req` / `_next` parameters that Express middleware
   signatures require, so compliant code failed lint. Added
   `argsIgnorePattern: '^_'` to align ESLint with `tsconfig`'s
   `noUnusedParameters` behavior, and recorded the `_` convention in §3.
2. **`no-console` contradicted §3.** The rule banned all `console.log`, but §3
   explicitly permits startup messages in `server.ts`. Added a file-scoped
   override rather than weakening the global rule.
3. **Added `ban-ts-comment`** so the §3 prohibition on `@ts-ignore` and
   `@ts-expect-error` is machine-enforced rather than honor-system.
4. **Tightened §1** to name `body-parser` as forbidden explicitly, since it is
   the most common unauthorized dependency an agent reaches for when adding
   request parsing.

Lesson recorded: a rule the toolchain cannot enforce is a rule the agent will
eventually drift from. Where a constraint in this file can be expressed as a
compiler or linter setting, it should be.

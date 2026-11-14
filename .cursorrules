# Project Engineering Standards

## Architecture & Stack
- Runtime: Node.js with TypeScript (`strict: true`, ESM `NodeNext` resolution).
- Framework: Express.js with modular route handlers (`src/routes/`) and schema validation (`src/schemas/`).
- Database: SQLite via `better-sqlite3` with WAL mode enabled and parameterized queries only.

## Coding Rules
- Never trust incoming HTTP payloads; validate all `POST` and `PATCH` bodies with Zod before touching the database.
- Always include `.js` extensions on relative TypeScript imports to comply with `NodeNext` module resolution.
- Keep route handlers thin and return proper HTTP status codes (`201` on create, `204` on delete, `400` on validation error, `404` when missing, `409` on duplicate keys).
- Clean up event listeners (`EventEmitter`) on `req.on('close')` in Server-Sent Events (SSE) endpoints to prevent memory leaks.
- Keep the frontend zero-build inside `public/index.html` using React 18 and Tailwind CSS so deployment remains a single-step Node.js build.

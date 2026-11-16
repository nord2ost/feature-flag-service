# Mobile Feature Flag & Remote Config Service

A lightweight, real-time **Feature Flag & Remote Config backend** built with **Node.js, Express, TypeScript, SQLite, and Zod**, paired with an interactive React dashboard and live mobile client preview.

🔗 **Live Interactive Demo:** https://feature-flag-service-9w2g.onrender.com

Expo app to check on the phone. Toggle changes on web, see change in app.
<img width="450" height="450" alt="expo-qr" src="https://github.com/user-attachments/assets/eb16a4c7-13e1-4482-aa59-71a7d6a76be1" />
🔗 https://feature-flag-mobile.expo.app

## Why I Built This
Upon conducting interviews I noticed that many Software Engineers do not know or understand how powerful feature flags are as a tool for modern software engineering. Beyond controlling app on the fly, they also fit perfectly with trunk-based development, as they allow continuous integration, but hide features under construction from users.

So I built this service as a demo of how to solve real mobile release bottlenecks—allowing teams to toggle features, roll out UI changes, enforce minimum app versions, or trigger maintenance screens over-the-air in milliseconds.

## Key Engineering Highlights
* **Real-Time Server-Sent Events (SSE):** Exposes `GET /api/sdk/stream` using Node's native `EventEmitter` so connected clients receive config updates instantaneously without polling overhead.
* **Strict Schema Validation:** Uses **Zod** to validate all incoming flag mutations and prevent malformed JSON payloads from corrupting remote configs.
* **Zero-Config Persistence:** Uses **SQLite (`better-sqlite3`)** with Write-Ahead Logging (WAL) and transactional seeding on startup.
* **Interactive Split-Screen Sandbox:** Serves a React 18 UI directly from Express where toggling flags on the left immediately updates a simulated mobile app on the right.
* **Automated Integration Tests:** Tested with Node's native `node:test` runner and `supertest`.

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check and database connection status |
| `GET` | `/api/flags` | List all flags with metadata for the admin UI |
| `GET` | `/api/sdk/config` | Flat key-value config map optimized for mobile clients |
| `GET` | `/api/sdk/stream` | Real-time Server-Sent Events (SSE) update stream |
| `POST` | `/api/flags` | Create a new feature flag (Zod validated) |
| `PATCH` | `/api/flags/:key` | Toggle `enabled` state or update JSON `payload` |
| `DELETE` | `/api/flags/:key` | Delete a custom feature flag |

## React Native Integration Example
How a React Native client consumes this service on app launch and foreground resume:

```tsx
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useRemoteConfig(apiUrl: string) {
  const [flags, setFlags] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      const res = await fetch(`${apiUrl}/api/sdk/config`);
      const data = await res.json();
      setFlags(data.flags);
    };

    fetchConfig();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchConfig();
    });

    return () => sub.remove();
  }, [apiUrl]);

  return flags;
}
```

## How I Used AI to Build This Project
I used AI coding tools intentionally as an architectural accelerator while maintaining strict control over code quality:
* **System Rules (`.cursorrules`):** Defined explicit rules enforcing TypeScript strictness, Zod validation, proper HTTP status codes, and SSE listener cleanup.
* **Iterative Scaffolding:** Built and verified the Express server, SQLite schema, REST routes, SSE stream, and React preview step-by-step.
* **Test Generation:** Used AI to scaffold integration tests in `tests/flags.test.ts` covering happy paths and validation edge cases.

## Run Locally

```bash
npm install
npm run dev      # Start dev server on http://localhost:3000
npm test         # Run integration tests
npm run build    # Compile TypeScript to dist/
```

# Ship Company Captain Profile Management Website

Full-stack application for managing captain profiles, documents, expiry tracking, and role-based access for a shipping company.

## Tech stack
- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + Express + MySQL
- Auth: JWT bearer token

## Project structure
- `src/` – frontend app
- `server/src/` – backend API, routes, middleware, migrations

## Local development

1. Install dependencies:
   - `npm ci`
   - `cd server && npm ci`
2. Configure backend environment variables (recommended in `server/.env`):
   - `PORT=4000`
   - `DB_HOST=localhost`
   - `DB_USER=root`
   - `DB_PASSWORD=`
   - `DB_NAME=global shipping company`
   - `JWT_SECRET=<strong-random-secret>`
3. Start frontend + backend together:
   - `npm run dev`

## Production security notes

- `JWT_SECRET` is required to start the backend.
- Setup-only routes are disabled by default.
- To temporarily enable setup routes:
  - `ENABLE_SETUP_ROUTES=true`
  - `SETUP_ADMIN_TOKEN=<strong-random-token>`
  - Send the token with `x-setup-token` header to setup endpoints.
- Disable setup routes again after bootstrap.

## Useful scripts

- Root:
  - `npm run dev` – start frontend + backend concurrently
  - `npm run lint` – run frontend lint
  - `npm run build` – frontend production build
- Server (`cd server`):
  - `npm run dev` – start API with nodemon
  - `npm start` – start API
  - `npm run migrate` – run DB migrations

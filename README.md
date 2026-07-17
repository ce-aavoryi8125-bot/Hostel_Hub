# Hostel Hub UMaT

Hostel Hub is a student accommodation discovery and room reservation platform for students of the **University of Mines and Technology (UMaT)** in Tarkwa, Ghana.

This repository combines two complementary stacks:

| Stack | Purpose | Entry point |
|-------|---------|-------------|
| **Next.js frontend** (`src/`) | Premium UI — landing, explore, auth, bookings, manager portal | `npm run dev:web` → http://localhost:3000 |
| **Express API** (`server.js`, `routes/`) | Supabase-backed REST API, JWT auth, uploads, Paystack payments | `npm run dev:api` → http://localhost:3001 |
| **Legacy static UI** (`public/`) | Original HTML/JS admin and student interfaces | http://localhost:3001/index.html |

---

## Features

**Frontend (Bernard — Next.js)**
- Landing page with UMaT branding and glassmorphic design
- Explore hostels, auth flow, bookings, checkout
- Manager portal (properties, bookings)
- Mock booking context (to be wired to Express API)

**Backend (Albert — Express + Supabase)**
- JWT authentication, role-based access (student, manager, admin)
- Hostel CRUD, gallery uploads, location filters
- Paystack payment integration
- PostgreSQL schema via Supabase

---

## Getting Started

```bash
npm install
```

Run both stacks in separate terminals:

```bash
# Terminal 1 — Express API (port 3001)
npm run dev:api

# Terminal 2 — Next.js frontend (port 3000)
npm run dev:web
```

Set up environment variables in `.env` (see `.env.example` if present):

```
PORT=3001
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
PAYSTACK_SECRET_KEY=...
```

---

## Verification

```bash
# Next.js lint & type check
npm run lint
npx tsc --noEmit

# Next.js production build
npm run build
```

---

## Project Structure

```
src/                  Next.js App Router (Bernard's frontend)
server.js             Express API entry point
routes/               API route handlers
public/               Legacy static HTML/JS UI
supabase/             Database schema and migrations
config/               Supabase client bootstrap
```

---

## License

MIT License — see [LICENSE](LICENSE).

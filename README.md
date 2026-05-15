# Payout Management MVP

A full-stack payout management system with role-based access control, status workflows, and audit trails.

## Demo credentials

| Role    | Email               | Password |
|---------|---------------------|----------|
| OPS     | ops@demo.com        | ops123   |
| FINANCE | finance@demo.com    | fin123   |

---

## Tech stack

- **Backend**: Node.js + Express, MongoDB Atlas, JWT auth
- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Hosting**: Render (backend) + Vercel (frontend)

---

## Run locally in under 5 minutes

### Prerequisites
- Node.js 18+
- A [MongoDB Atlas](https://cloud.mongodb.com) free cluster (M0)

### 1. Clone & set up backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run seed      # populates users, vendors, sample payouts
npm run dev       # starts on http://localhost:4000
```

### 2. Set up frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev       # starts on http://localhost:3000
```

Open http://localhost:3000 and log in with the demo credentials above.

---

## Environment variables

### Backend (`backend/.env`)

| Variable       | Description                              |
|----------------|------------------------------------------|
| `MONGODB_URI`  | MongoDB Atlas connection string          |
| `JWT_SECRET`   | Secret for signing JWTs (min 32 chars)   |
| `PORT`         | Server port (default 4000)               |
| `FRONTEND_URL` | CORS allowed origin (e.g. Vercel URL)    |

### Frontend (`frontend/.env.local`)

| Variable               | Description                   |
|------------------------|-------------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend URL                   |

---

## Seed data

Run `npm run seed` from the `backend/` directory. This creates:

- 2 users (OPS + FINANCE)
- 4 vendors (3 active, 1 inactive)
- 4 payouts in all statuses (Draft, Submitted, Approved, Rejected)
- Full audit trail for each payout

**Note:** Seed clears all existing data before inserting.

---

## API endpoints

| Method | Endpoint                  | Role    | Description                     |
|--------|---------------------------|---------|---------------------------------|
| POST   | /auth/login               | Any     | Login, returns JWT              |
| GET    | /vendors                  | Any     | List all vendors                |
| POST   | /vendors                  | Any     | Create vendor                   |
| GET    | /payouts                  | Any     | List payouts (filter by status/vendor) |
| POST   | /payouts                  | OPS     | Create draft payout             |
| GET    | /payouts/:id              | Any     | Get payout + audit trail        |
| POST   | /payouts/:id/submit       | OPS     | Draft → Submitted               |
| POST   | /payouts/:id/approve      | FINANCE | Submitted → Approved            |
| POST   | /payouts/:id/reject       | FINANCE | Submitted → Rejected (reason required) |

---

## Status machine

```
Draft → (OPS submit) → Submitted → (FINANCE approve) → Approved
                                 → (FINANCE reject)  → Rejected
```

No status skips are allowed. All transitions enforced server-side.

---

## Deploy

### Backend on Render

1. Create a new Web Service pointing to `/backend`
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add env vars from above
5. After deploy, run seed once via Render shell: `npm run seed`

### Frontend on Vercel

1. Import the repo, set root directory to `/frontend`
2. Set `NEXT_PUBLIC_API_URL` to your Render backend URL
3. Deploy

---

## Assumptions

- Role is stored server-side in JWT — frontend never trusts its own role claim
- Vendor soft-delete via `is_active` flag (inactive vendors can't receive new payouts)
- Any authenticated user (OPS or FINANCE) can view vendors and all payouts
- Audit trail is append-only; no edits

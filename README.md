# 🏠 Hostel Hub v4

**Premium Student Hostel Management Platform — UMaT Tarkwa**

Three completely independent portals: **Student** | **Hostel Manager** | **Administrator**

---

## Quick Start

```bash
npm install
npm start
# → http://localhost:3000
```

---

## ⚠️ Required: Run Database Migration

Before using the platform, you **must** run the migration SQL in your Supabase dashboard:

1. Go to **Supabase Dashboard → SQL Editor → New Query**
2. Open `supabase/MIGRATION_REQUIRED.sql`
3. Paste the contents and click **Run**

This adds required columns (`status`, `verification_status`, `is_published`, etc.) and creates audit/log tables.

> The app works without the migration but with reduced functionality (manager approval workflow, hostel verification, payment methods, audit logs).

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@hostelhub.dev | admin123 |
| Hostel Manager | manager@hostelhub.dev | manager123 |
| Student | Sign up on the platform | — |

---

## Role-Based Portals

### 🎓 Student Portal
- Browse and search verified hostels
- Book rooms and submit payment proof
- Download official receipts
- Submit maintenance requests
- View announcements and notifications
- Manage profile

### 🏢 Manager Portal
- Dashboard with occupancy and financial summary
- Manage residents (add/remove/view)
- Manage rooms and availability
- Verify student payment submissions → auto-generates receipts
- Log expenses and track finances
- Send announcements to residents
- Handle maintenance requests
- Configure payment methods (bank, MoMo)

### 🛡️ Administrator Portal
- Platform-wide statistics dashboard
- **Hostel management**: create, verify, publish, assign managers
- **Manager applications**: review → approve/reject → assign to hostels
- **User management**: students, managers, admins
- **Verification queue**: approve pending hostels
- **Audit log**: complete trail of all admin actions
- Platform announcements
- Payment overview

---

## Manager Onboarding Workflow

1. Prospective manager **signs up** (fills in hostel application details)
2. Account is set to **Pending** — cannot access manager features
3. Administrator **reviews** the application
4. Administrator **approves** → account becomes Active
5. Administrator **creates** the hostel record
6. Administrator **assigns** the manager to the hostel
7. Manager **logs in** and manages only their assigned hostel

---

## Hostel Verification Workflow

1. Admin creates hostel (status: `pending`)
2. Admin sets to `under_review` (optional)
3. Admin physically inspects hostel
4. Admin **approves** → hostel gets `verified` badge + published to public
5. Verified badge appears on cards, detail pages, receipts

---

## Payment Workflow

1. Student **books** a room → system creates payment + booking records
2. Student **pays** the manager directly (MoMo, bank transfer, etc.)
3. Student **uploads proof** (reference number + optional screenshot)
4. Manager **reviews** the submission
5. Manager **approves** → system auto-generates an official receipt
6. Student **downloads** the receipt as proof of payment

---

## Environment Variables (`.env`)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-min-32-chars
PORT=3000
```

---

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Auth**: Custom JWT (bcryptjs + jsonwebtoken)
- **Frontend**: React 18 (CDN) + Babel Standalone
- **Styles**: Custom CSS Design System (Inter + Plus Jakarta Sans)
- **Uploads**: Multer (local disk)

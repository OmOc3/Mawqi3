# Bedoo — إدارة محطات الطعوم

Bedoo is an Arabic RTL bait station management system for pest control companies. It helps field technicians submit station inspection reports by QR code, while supervisors and managers review operations from role-protected dashboards.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Firebase Auth, Firestore, Storage
- Firebase Admin SDK for all server mutations
- Zod 4.1
- React Hook Form
- Tailwind CSS 3.4
- qrcode

## Roles

- `technician` فني: opens `/scan`, scans station QR links, submits reports for active stations.
- `supervisor` مشرف: opens `/dashboard/supervisor`, reads station/report activity, reviews reports, exports CSV.
- `manager` مدير: opens `/dashboard/manager`, manages stations, reviews reports, manages users, exports CSV.

## Routes

- `/login`: team login.
- `/unauthorized`: access denied.
- `/scan`: QR scan instructions and manual station entry.
- `/station/[stationId]/report`: technician report form.
- `/dashboard/supervisor`: supervisor summary dashboard.
- `/dashboard/supervisor/reports`: supervisor report list and filters.
- `/dashboard/manager`: manager summary dashboard.
- `/dashboard/manager/stations`: station list.
- `/dashboard/manager/stations/new`: create station.
- `/dashboard/manager/stations/[stationId]`: station details and QR code.
- `/dashboard/manager/stations/[stationId]/edit`: edit station.
- `/dashboard/manager/reports`: manager report list and review actions.
- `/dashboard/manager/analytics`: zone, technician, and status analytics.
- `/dashboard/manager/users`: user role and active status management.
- `/offline`: offline fallback for installed PWA usage.
- `/manifest.webmanifest`: PWA manifest.
- `/api/auth/login`: login endpoint.
- `/api/auth/session`: session cookie endpoint.
- `/api/reports/export`: CSV export for managers and supervisors.

## Environment Variables

Copy `.env.example` to `.env.local` and fill the values. Do not commit real secrets.

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_BASE_URL`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `ROLE_COOKIE_SECRET`
- `SESSION_MAX_AGE_SECONDS`

## Run Locally

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

`npm run build` requires valid Firebase and auth environment variables. Missing environment variables should be fixed in local deployment configuration, not with fake values in code.

## Firebase Setup

1. Create a Firebase project.
2. Enable Firebase Auth with email/password.
3. Create Firestore.
4. Create user documents in `users/{uid}` with `uid`, `email`, `displayName`, `role`, `createdAt`, and `isActive`.
5. Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

6. Deploy Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

7. Deploy Storage rules:

```bash
firebase deploy --only storage
```

## MVP Features

- Secure login with session cookies and signed role cookies.
- Role-based middleware protection.
- Manager station CRUD with generated QR links.
- Technician report submission from station QR links.
- Supervisor dashboard and filtered report list.
- Manager dashboard, report review, and user management.
- CSV export for reports.
- Optional before/after report photo upload through Admin SDK and locked Storage rules.
- Optional station GPS coordinates.
- Manager analytics by zone, technician, and status frequency.
- PWA manifest and offline fallback page.
- Audit logs for station, report, and user mutations.
- Firestore client writes locked by default.

## Known Limitations

- Firebase Auth user creation is not implemented in the UI. Use Firebase Console for now.
- GPS coordinates are entered manually. Map picker/display is not implemented yet.
- No push notifications.
- Offline mode is a fallback shell only. Report submission still requires network connectivity.

## Next Recommended Tasks

1. Add map picker and map display for station coordinates.
2. Add Firebase Auth user invite flow when account creation policy is approved.
3. Add push notifications for pending review reports.
4. Add true offline draft queue for technicians.
5. Add richer analytics trends by date range.

# AGENTS.md — Mawqi3 موقعي

> هذا الملف موجه للـ AI coding agents (Codex, Claude Code, إلخ).
> اقرأه كاملاً قبل تعديل أي ملف.

---

## Project Identity

| Key | Value |
|-----|-------|
| Name | Mawqi3 — إدارة محطات الطعوم |
| Purpose | Arabic RTL bait station management system for pest control field teams |
| Language | TypeScript (strict) — Arabic UI strings |
| Direction | RTL throughout (`dir="rtl"`) |
| Status | MVP in progress — auth complete, features pending |

---

## Tech Stack — Exact Versions

```
next                15.5.x   (App Router, Server Components, Server Actions)
react               19.x
typescript          5.9.x    (strict mode — no `any`)
firebase            12.x     (client SDK — browser only)
firebase-admin      13.x     (server SDK — never on client)
zod                 4.1.x    (NOTE: Zod v4 — API differs slightly from v3)
react-hook-form     7.x
@hookform/resolvers latest
qrcode              1.5.x    (@types/qrcode installed)
zustand             5.x
tailwindcss         3.4.x
```

---

## Architecture Rules — Never Violate

### 1. Server vs Client boundary

```
Server Components   → data fetching, auth checks, Admin SDK calls
Client Components   → forms, interactivity, useFormStatus, useRouter
```

- Mark client components explicitly: `"use client"` at top
- Never import `firebase-admin` in a client component
- Never use `adminDb()` / `adminAuth()` / `adminStorage()` on the client

### 2. Firestore writes

**All Firestore mutations go through Server Actions using `adminDb()`.**
The client Firebase SDK (`lib/firebase.ts`) is for Auth signIn only.
`firestore.rules` has `allow write: if false` on all collections — this is intentional.

```ts
// CORRECT — server action
import { adminDb } from "@/lib/firebase-admin";
await adminDb().collection("stations").add(data);

// WRONG — never do this in a Server Action or component
import { db } from "@/lib/firebase";
await addDoc(collection(db, "stations"), data);
```

### 3. Session & auth in Server Actions / pages

```ts
// Always call at the top of every protected Server Action or page
import { requireRole } from "@/lib/auth/server-session";
const session = await requireRole(["manager"]);
// session.uid, session.role, session.user are safe to use
```

Never trust `uid`, `role`, or `createdBy` from form input. Always read from session.

### 4. TypeScript

- `strict: true` in tsconfig — no exceptions
- No `any` types — use `unknown` and narrow
- All async functions have typed return values
- Zod schemas export inferred types: `export type X = z.infer<typeof xSchema>`

### 5. Forms

All forms use `react-hook-form` + `zod` resolver:
```ts
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
});
```
No raw `<form action={...}>` without react-hook-form unless it's a simple single-button action.

---

## Project File Map

### ✅ Complete — Do NOT rewrite

```
app/api/auth/login/route.ts          login endpoint (rate-limited)
app/api/auth/session/route.ts        session cookie endpoint
app/login/page.tsx                   login page (Arabic RTL)
app/unauthorized/page.tsx            access denied page
middleware.ts                        role-based route protection
lib/auth/session.ts                  setAuthCookies(), clearAuthCookies()
lib/auth/user-profile.ts             getAppUser(), getActiveAppUser()
lib/auth/redirects.ts                getRoleRedirect(), ROLE_REDIRECTS
lib/auth/role-cookie.ts              signed role cookie logic
lib/auth/rate-limit.ts               login rate limiting (Firestore-backed)
lib/auth/constants.ts                SESSION_COOKIE_NAME, ROLE_COOKIE_NAME etc.
lib/firebase.ts                      client Firebase SDK init
lib/firebase-admin.ts                adminApp(), adminAuth(), adminDb(), adminStorage()
lib/errors.ts                        AppError class, toAppError()
lib/utils.ts                         cn(), isRecord(), getErrorMessage()
lib/i18n.ts                          statusOptionLabels, roleLabels, i18n object
lib/validation/auth.ts               loginFormSchema, sessionRequestSchema
lib/validation/firestore.ts          firestoreTimestampSchema, appUserSchema
components/auth/login-form.tsx       login form component
components/auth/logout-button.tsx    logout button
components/ui/button.tsx             Button component
components/ui/text-field.tsx         TextField component
types/index.ts                       UserRole, StatusOption, AppUser, Station, Report, etc.
firestore.rules                      all client writes locked
next.config.js                       CSP headers, security headers
```

### 🔧 Needs Extension — Extend, don't replace

```
types/index.ts           add: zone/qrCodeValue/updatedAt/updatedBy to Station
                              reviewStatus/reviewedAt/reviewedBy/reviewNotes to Report
                              new AuditLog interface
middleware.ts            add /station/* route to roleCanAccess()
lib/i18n.ts              add new Arabic strings as needed (never remove existing)
```

### 🚧 Placeholder — Replace with real implementation

```
app/dashboard/manager/page.tsx       shows DashboardPlaceholder only
app/dashboard/supervisor/page.tsx    shows DashboardPlaceholder only
app/scan/page.tsx                    static text only
```

### ❌ Does Not Exist Yet — Create from scratch

```
lib/auth/server-session.ts           getCurrentSession, requireSession, requireRole
lib/collections.ts                   collection name constants
lib/audit.ts                         writeAuditLog()
lib/validation/stations.ts           createStationSchema, updateStationSchema
lib/validation/reports.ts            submitReportSchema
lib/validation/users.ts              updateUserRoleSchema, updateUserActiveSchema
app/actions/stations.ts              Server Actions for station CRUD
app/actions/reports.ts               Server Actions for report submit + review
app/actions/users.ts                 Server Actions for user management
app/dashboard/manager/stations/*     station list, create, detail, edit
app/dashboard/manager/reports/*      manager reports view
app/dashboard/manager/users/*        user management
app/dashboard/supervisor/reports/*   supervisor reports view
app/station/[stationId]/report/*     technician report form
app/api/reports/export/route.ts      CSV export
components/reports/status-pills.tsx  status tag pills
components/ui/empty-state.tsx        reusable empty state
components/ui/submit-button.tsx      form submit with pending state
components/layout/page-header.tsx    page title + actions
components/layout/nav.tsx            navigation sidebar/header
```

---

## Role Model

| Role | Arabic | Default Redirect | Permissions |
|------|--------|-----------------|-------------|
| `technician` | فني | `/scan` | submit reports for active stations |
| `supervisor` | مشرف | `/dashboard/supervisor` | read all stations + reports, mark reviewed |
| `manager` | مدير | `/dashboard/manager` | full CRUD stations, read/edit reports, manage users, export CSV |

### Route protection matrix

```
/scan                        → public (no login required to view)
/station/[id]/report         → technician, manager
/dashboard/supervisor/*      → supervisor, manager
/dashboard/manager/*         → manager only
/api/reports/export          → manager, supervisor
```

---

## Collections Schema

### `users/{uid}`
```ts
{
  uid: string
  email: string
  displayName: string
  role: "technician" | "supervisor" | "manager"
  createdAt: Timestamp
  isActive: boolean
}
```

### `stations/{stationId}`
```ts
{
  stationId: string
  label: string
  location: string
  zone?: string
  coordinates?: { lat: number; lng: number }
  qrCodeValue: string        // = `${BASE_URL}/station/${stationId}/report`
  isActive: boolean
  totalReports: number
  createdAt: Timestamp
  createdBy: string          // uid — always from session, never from client
  updatedAt?: Timestamp
  updatedBy?: string
  lastVisitedAt?: Timestamp
}
```

### `reports/{reportId}`
```ts
{
  reportId: string
  stationId: string
  stationLabel: string
  technicianUid: string      // from session
  technicianName: string     // from session user.displayName
  status: StatusOption[]     // min 1 item
  notes?: string             // max 500 chars
  submittedAt: Timestamp
  reviewStatus: "pending" | "reviewed" | "rejected"
  editedAt?: Timestamp
  editedBy?: string
  reviewedAt?: Timestamp
  reviewedBy?: string
  reviewNotes?: string
}
```

### `auditLogs/{logId}`
```ts
{
  logId: string
  actorUid: string
  actorRole: UserRole
  action: string             // e.g. "station.create", "report.submit"
  entityType: string
  entityId: string
  createdAt: Timestamp
  metadata?: Record<string, unknown>
}
```

### Action name conventions
```
station.create / station.update / station.activate / station.deactivate
report.submit / report.review
user.activate / user.deactivate / user.role_change
```

---

## Status Options

All 6 values and their Arabic labels are in `lib/i18n.ts`:

```ts
import { statusOptionLabels } from "@/lib/i18n";
// statusOptionLabels["station_ok"] → "المحطة سليمة"
```

Never hardcode Arabic status strings — always use `statusOptionLabels`.

---

## Key Patterns

### Server Action pattern
```ts
// app/actions/stations.ts
"use server";
import { requireRole } from "@/lib/auth/server-session";
import { adminDb } from "@/lib/firebase-admin";
import { writeAuditLog } from "@/lib/audit";
import { STATIONS_COL } from "@/lib/collections";
import { createStationSchema } from "@/lib/validation/stations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStationAction(formData: FormData) {
  const session = await requireRole(["manager"]);
  const raw = Object.fromEntries(formData);
  const parsed = createStationSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const ref = adminDb().collection(STATIONS_COL).doc();
  await ref.set({ ...parsed.data, stationId: ref.id, createdBy: session.uid, ... });
  await writeAuditLog({ actorUid: session.uid, actorRole: session.role, action: "station.create", ... });
  revalidatePath("/dashboard/manager/stations");
  redirect("/dashboard/manager/stations");
}
```

### Protected Server Component pattern
```ts
// app/dashboard/manager/stations/page.tsx
import { requireRole } from "@/lib/auth/server-session";
import { adminDb } from "@/lib/firebase-admin";

export default async function StationsPage() {
  await requireRole(["manager"]);
  const snap = await adminDb().collection("stations").orderBy("createdAt", "desc").get();
  const stations = snap.docs.map(d => d.data());
  return <StationsList stations={stations} />;
}
```

### Firestore transaction pattern (report submission)
```ts
await adminDb().runTransaction(async (tx) => {
  const stationRef = adminDb().collection(STATIONS_COL).doc(stationId);
  const reportRef = adminDb().collection(REPORTS_COL).doc();
  tx.set(reportRef, { ...reportData, reportId: reportRef.id });
  tx.update(stationRef, {
    lastVisitedAt: FieldValue.serverTimestamp(),
    totalReports: FieldValue.increment(1),
  });
});
```

---

## UI Conventions

- **RTL**: all new pages/components must have `dir="rtl"` or inherit it from layout
- **Font**: Tajawal for Arabic text (add to globals.css if not present)
- **Tailwind RTL utilities**: use `ps-`, `pe-`, `ms-`, `me-` instead of `pl-`, `pr-`, `ml-`, `mr-`
- **Colors**: no hardcoded hex — use Tailwind classes only
- **Empty states**: use `<EmptyState />` component (create if missing)
- **Loading**: every data-fetching page needs a `loading.tsx` sibling
- **Errors**: every page needs an `error.tsx` sibling
- **Status badges**:
  - `pending` → `bg-yellow-100 text-yellow-800`
  - `reviewed` → `bg-green-100 text-green-800`
  - `rejected` → `bg-red-100 text-red-800`
  - `isActive: true` → `bg-green-100 text-green-800`
  - `isActive: false` → `bg-gray-100 text-gray-600`

---

## Validation Commands

Run after every phase before moving on:

```bash
npm run typecheck    # must pass with 0 errors
npm run lint         # must pass with 0 warnings
npm run build        # run last — may fail on missing env vars (document, don't fix with stubs)
```

If `build` fails only because of missing env vars (`FIREBASE_ADMIN_*`, `NEXT_PUBLIC_*`):
→ Document in README, do not add fake values.

If `build` fails because of TypeScript or import errors:
→ Fix them before proceeding.

---

## Environment Variables

Defined in `.env.example`. Never hardcode values. All Firebase Admin vars are server-only (no `NEXT_PUBLIC_` prefix):

```
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY      ← contains literal \n — handled in firebase-admin.ts already
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_BASE_URL            ← used for qrCodeValue generation
ROLE_COOKIE_SECRET              ← signs the role cookie
SESSION_MAX_AGE_SECONDS
```

---

## Security Checklist

Before any PR or phase sign-off:

- [ ] No `adminDb()` imported in a file without `"use server"` or a server-only module
- [ ] No Firebase client SDK used for Firestore writes
- [ ] No `uid`, `role`, or `createdBy` read from client input
- [ ] `requireRole()` called at the top of every protected action/page
- [ ] `writeAuditLog()` called after every mutation
- [ ] `firestore.rules` still has no `allow write: if true`
- [ ] No `any` types introduced
- [ ] `npm run typecheck` passes

---

## Known Limitations (MVP Scope)

- Firebase Auth user creation is NOT implemented from the UI — create users via Firebase Console
- Photo upload (before/after) not implemented — Storage rules are locked
- GPS coordinates are optional and not displayed on a map yet
- No push notifications
- No offline support

---

## Next Recommended Tasks (Post-MVP)

1. Photo upload on report submission (Firebase Storage)
2. GPS coordinate picker on station create/edit
3. Analytics dashboard (charts by zone, technician performance)
4. PWA / offline support for technicians in the field
5. Firebase Auth user invite flow from manager UI
6. Firestore indexes for compound queries (add to `firestore.indexes.json`)

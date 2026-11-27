# GoldenCares admin console audit

Scope: old Flutter admin (`gc/Golden-Cares-Frontend/admin`), current web admin (`realf/src/routes/_authed/admin.jsx`), and deployed Firebase backend (`Golden-Cares-App/functions/src/admin.js`, plus adjacent modules).

The old admin is a full operations console with 17 routes, ~45 callable wrappers, cursor pagination, deep links, role gates, and a strict 8-hour single-session model. The current `realf` `/admin` page is a three-list read/edit screen and is not a substitute.

## 1. Platform and authorization

Old admin features:

- Flutter Web app with GoRouter, deferred screen loading, dark-gold theme.
- Firebase project `golden-care-d4863`, Firestore database `production-mumbai`, functions region `asia-south1`.
- Email/password login, forced first-login password change, 8-hour sessions, single active session per admin, cross-device session supersede detection, expiry banner.
- Admin roles from `admin_role_users/{email}`: root, primary, secondary. Root is bootstrap and always primary.
- Capability flags from `adminGetAdminAuthz`: `canManageAdmins`, `canDeleteAccounts`, `isPrimary`, `isRoot`, `adminType`, `rootAdminEmail`, `requiresPasswordChange`.
- Every callable carries `sessionId`; backend checks session doc + `adminSessionId` claim + `auth_time` freshness.
- Primary-only areas: Audit Logs, CMS publish/rollback, advanced caregiver stats.
- Root-only: removing another primary admin; nobody can remove root or self.
- Session guard listens to `admin_sessions/{email}` directly and forces logout on supersede/expiry.
- Contextual help dialogs and a full static Help & Docs screen.

Current `realf` status:

- Admin access is only `users/{uid}.role === "admin"` from the shim.
- No admin login flow, session registration, forced password reset, session guard, role tiers, or capability flags.
- Backend admin callables already implement the strict model; the web client simply does not use them yet.

## 2. Navigation map (old admin)

| Route | Screen | Purpose |
|---|---|---|
| `/login` | AdminLoginScreen | Sign in, register admin session, handle expiry/supersede reasons |
| `/change-password` | InitialPasswordResetScreen | Mandatory first-login password change |
| `/dashboard` | DashboardScreen | Counters and quick actions |
| `/issues` | IssuesScreen | Triage incidents |
| `/users` | UsersScreen | Family accounts |
| `/administrators` | AdministratorsScreen | Admin role management |
| `/bookings` | BookingsScreen | Booking operations |
| `/caregivers` | CaregiversScreen | Personnel, approvals, photos, allow list |
| `/whitelist` | WhitelistScreen | Partner/email allow list |
| `/pricing` | PricingScreen | Services, variants, platform fee |
| `/transactions` | TransactionsScreen | Read-only payment ledger |
| `/earnings` | EarningsScreen | Earnings ledger, TDS report, CSV export |
| `/payouts` | PayoutsScreen | Read-only payout ledger |
| `/content` | ContentScreen | CMS draft, preview, publish, rollback |
| `/id-translator` | IdTranslatorScreen | Universal ID resolution and display-ID backfill |
| `/audit-logs` | AuditLogsScreen | Primary-only immutable audit trail |
| `/help` | HelpScreen | Static operating manual |

The shell includes a live unresolved-issue badge, Ctrl/Cmd+K ID Translator dialog, contextual help per route, collapsible sidebar/mobile nav, and sign-out.

## 3. Feature inventory by screen

### Dashboard

- `adminGetStats`: bookings total/today/active/completed; family users; caregivers/active/pending; revenue today/total/platform fees.
- Quick actions to Bookings, Caregivers, Pricing, Users, Transactions.

### Issues & Incidents

- `adminGetIssuesSummary`, `adminListIssues`, `adminUpdateIssue`.
- Tabs: Open, In Review, Closed.
- Filters: category, severity, free-text search, cursor pagination ("Load More").
- Detail dialog: reference, category, severity, status, metadata, reporter, assignment, resolution notes.
- Deep links from issue metadata to bookings and transactions.
- Closing requires resolution notes.
- Live issue badge in the shell reads `counters/issues`.

### Users

- `adminListUsers(role:'family')`, `adminUpdateUser`, `adminDeleteUser`, `getAdminAuthz`.
- Infinite scroll, `?userId=` / `?search=` deep links.
- Edit name, email, phone, city, state, address, active flag.
- Activate/deactivate, delete (permission-gated), view filtered bookings/transactions.
- Destructive actions against hard-coded Google Play test accounts get extra confirmation.

### Administrators

- `adminListAdmins`, `grantAdminRole`, `adminRemoveAdmin`, `getAdminAuthz`.
- Grant primary/secondary role by email or UID; one-time temporary password shown on creation.
- Remove rules: no self-remove, root never removable, primary removable only by root.

### Caregivers

- `adminListServicePersonnel`, `adminListPartners`, `adminUpdateServicePersonnel`, `adminDeleteServicePersonnel`, `adminApproveCaregiver`, `adminCancelCaregiverDeletion`, `adminUploadEntityImage`, partner upsert/delete.
- Personnel/Allow List tabs.
- Reviews dialog, edit stats (primary only), photo upload, availability toggle, deactivate, cancel scheduled deletion.
- KYC approval toggle on `users/{id}.isApproved`.
- Deeplinks to bookings and transactions.

### Whitelist

- `adminListPartners`, `adminUpsertPartner`, `adminBulkUpsertPartners`, `adminDeletePartner`.
- Table: email, status, last updated, updated by, actions.
- Search/filter loaded emails, explicit "Load More".
- Add email with active/disabled switch, enable/disable, delete.
- CSV upload with normalization/dedupe, preview of first 10, skipped count, active flag, chunks of 500 with progress dialog.

### Pricing

- `adminGetPricing`, `adminCreateService`, `adminUpdatePricing`, `adminDeleteService`, `adminUpdatePlatformFee`, `adminUploadEntityImage`.
- Platform fee percentage field.
- Service table: image, name, category, price, duration, variants, included items, order, max quantity, active, description.
- Create service with duration/price variants.
- Edit all service fields, enable/disable, delete, upload service image.

### Bookings

- `adminListBookings`, `adminUpdateBooking`, `adminReassignCaregiver`, `adminCancelBooking`, `adminListUsers(role:'caregiver')`.
- Debounced free-text search; status filter chips; cursor pagination.
- Card shows reference, service, price, status, date/time, customer, caregiver, location.
- Force status, override price, reassign caregiver with reason, cancel with mandatory refund.
- Deeplinks to transactions/users/caregivers.

### Transactions

- `adminListTransactions`.
- Filters by transaction/booking/user/caregiver ID from deeplinks.
- Sortable columns; copy transaction ID and Razorpay provider payment ID.
- Deeplinks to booking/user/caregiver.
- Read-only: backend `adminUpdateTransaction` intentionally always denies.

### Earnings

- `adminListEarnings`, `adminEarningsReport`.
- Summary cards: gross booking value, platform revenue, TDS withheld, net to caregivers, record count.
- TDS-by-caregiver table for 26Q / Form 16A.
- Filters: caregiver ID, booking ID, status, financial year.
- Sortable ledger and CSV download.

### Payouts

- `adminListPayouts`.
- Filters: status, caregiver ID.
- Sortable table: date, caregiver, amount, status, RazorpayX payout ID, failure reason, settled at.
- Read-only; no manual approve/retry callable exists.

### Audit Logs

- `adminListAuditLogs`, primary-only.
- Date range Today / 7 days / 30 days / All applied server-side.
- Sortable table: timestamp, admin, category, target type, target ID.
- "View Diff" shows previous/new JSON state.

### ID Translator

- `adminResolveId`, `adminBackfillDisplayIds`.
- Accepts `GC-` booking reference, `TX-` transaction reference, Firestore UUID, Razorpay `pay_` ID, or phone.
- Results across bookings/transactions/users/service personnel with related IDs and copy buttons.
- Recent lookup history and legacy display-ID backfill in the full screen.
- Ctrl/Cmd+K dialog variant with auto-resolve and copyable records.

### Content / CMS

- `adminGetCmsContent`, `adminSaveCmsDraft`, `adminPublishContent`, `adminRollbackContent`.
- Sections: hero, trust badges, value props, service text, how-it-works, CTA, about, contact, announcement banner, FAQ.
- Add/remove/reorder list items and icon picker from an allowlist.
- Live draft preview and publish history.
- Save Draft, Publish (primary only), Rollback & Publish (primary only), per-version rollback.
- Publish confirmation reports changed-field count and version bump.

### Help & Docs

- Static searchable manual with six categories and status glossary.

## 4. Backend callable inventory

Admin callables already deployed (the web app needs to call them):

- Auth/session: `adminRegisterSession`, `adminGetAdminAuthz`, `adminSetInitialPassword`, `grantAdminRole`, `adminRemoveAdmin`, `adminListAdmins`.
- Dashboard: `adminGetStats`.
- Users: `adminListUsers`, `adminUpdateUser`, `adminUpsertUser`, `adminDeleteUser`.
- Bookings: `adminListBookings`, `adminUpdateBooking`, `adminReassignCaregiver`, `adminCancelBooking`.
- Caregivers: `adminListServicePersonnel`, `adminUpdateServicePersonnel`, `adminDeleteServicePersonnel`, `adminApproveCaregiver`.
- Pricing/media: `adminGetPricing`, `adminUpdatePricing`, `adminCreateService`, `adminDeleteService`, `adminUpdatePlatformFee`, `adminUploadEntityImage`.
- Transactions: `adminListTransactions` (`adminUpdateTransaction` is an intentional deny stub).
- Earnings/payouts: `adminListEarnings`, `adminListPayouts`, `adminEarningsReport`.
- Partners: `adminListPartners`, `adminUpsertPartner`, `adminDeletePartner`, `adminBulkUpsertPartners`.
- Audit: `adminListAuditLogs`.
- Issues: `adminListIssues`, `adminGetIssuesSummary`, `adminUpdateIssue`.
- Notifications: `adminBroadcastNotification`.
- CMS: `adminGetCmsContent`, `adminSaveCmsDraft`, `adminPublishContent`, `adminRollbackContent`.
- ID tools: `adminResolveId`, `adminBackfillDisplayIds`.
- Caregiver deletion override: `adminCancelCaregiverDeletion` (App Check enforced).

Consumer/machine surfaces not part of the admin console but relevant to the full system: `getPublicConfig`, `getLandingStats`, `serveCmsContent`, `createRazorpayOrder`, `verifyRazorpayPayment`, `razorpayWebhook`, RazorpayX payout details/request/webhook, booking OTP/progress/pick/cancel/reschedule, issue reporting, caregiver self-deletion, location tools, and scheduled jobs.

## 5. Gaps in current `realf` `/admin`

Current page only:

- Lists bookings, applications (`servicePersonnel`), and transactions through the shim.
- Filters bookings by a small hard-coded status list with `new/contacted/scheduled/completed/cancelled`.
- Direct Firestore status updates for bookings/applications.
- Cursor-less pagination attempt (the shim currently returns `next_cursor: null`).

Missing:

- Admin login/session/password-reset model, role tiers, capability flags, and secure callable client.
- Dashboard stats and quick actions.
- Issues triage and live badge.
- User management and account deletion.
- Administrator management.
- Caregiver KYC, stats edit, photo upload, deletion override, reviews.
- Whitelist/CSV bulk upload.
- Pricing/variant/fee/image management.
- Booking search, detail view, force status, price override, reassignment, cancellation with refund.
- Transaction ledger filters/sorting/copy actions.
- Earnings report, TDS table, CSV export.
- Payout ledger.
- Audit logs with diff view.
- ID translator and backfill.
- CMS editor, preview, publish, rollback.
- Help/contextual docs.

## 6. Security issues found during audit

These should be fixed in the backend before exposing a full admin console on the web:

1. `partners.js:whitelistPartnerEmail` is an unauthenticated HTTP endpoint that writes the same allow list controlled by primary-admin-only callables.
2. Several `bookings.js` / `payments.js` admin branches use the weaker `isAdminUser` check instead of the full `getAdminContext` pipeline, bypassing the 8-hour and single-session gates.
3. `notifications.js:createNotification` trusts `users/{uid}.role === 'admin'` rather than `admin_role_users`/session state.
4. Dashboard pending-KYC count uses `idVerified`, while `adminApproveCaregiver` writes `isApproved`; the badge and action are not driven by the same field.

## 7. Recommended web implementation order

1. **Admin auth foundation** — dedicated `/admin/login`, session registration, authz context router guard, forced password reset, session supersede/expiry handling, secure callable wrapper.
2. **Shell + dashboard** — responsive navigation, capability-gated items, live issue badge, stats cards, quick actions.
3. **Operations** — bookings (search/filter/detail/reassign/cancel/price), issues triage, users.
4. **Caregiver supply** — caregivers, KYC, whitelist/CSV, deletion override.
5. **Money** — transactions, earnings/TDS/CSV, payouts.
6. **System** — pricing/CMS, administrators, ID translator, audit log diffs, help docs.
7. **Backend hardening** — close the four authorization/consistency gaps above.

Keep the `realf` visual language (cards, pills, existing Tailwind tokens) throughout; do not port the Flutter theme or Flutter UI structure.

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

## 5. Web admin status

Implemented after the audit:

- Dedicated `/admin/login`, forced password reset, 8-hour session expiry/supersede watcher, capability flags and a secure callable wrapper that injects `adminSessionId` into every admin call.
- Responsive shell with dashboard, bookings, issues, users, caregivers, whitelist, pricing, transactions, earnings/TDS CSV, payouts, content/CMS with publish + rollback, ID translator/backfill, audit-log diffs, administrators and help docs.
- Booking search/detail, force status, price override, reassignment and cancellation with refund reason.
- Caregiver KYC approval, primary-only stats edits, photo upload, deletion override, whitelist CSV bulk upload and reviews.
- Cursor-paged ledgers with filters and copy actions, including Razorpay transaction IDs and RazorpayX payout references.
- The old `/admin` link target was replaced with `/admin/dashboard`; stale PayU checkout files/tests were removed in favour of the Razorpay flow.
- Checkout is online-only for now: COD is disabled through a single `COD_ENABLED` switch, and pre-payment copy no longer says the request is with the team or confirmed.
- Web checkout no longer writes `bookings/{id}` before payment: the draft is held privately in the transaction, and the booking is created only after the Razorpay signature (or captured webhook) is verified. Unpaid legacy rows are hidden from the caregiver pick-order feed.
- The public web catalogue now reads Firestore `services` live through `serviceCatalog.js`; admin pricing edits (including editable duration variants) appear on the website and match Razorpay's live-price validation.

Remaining: live verification against a real admin account/session. No Playwright or deployment has been run.

## 6. Backend hardening status

The four audit findings were patched locally in the backend working tree (not deployed or pushed):

1. `partners.js:whitelistPartnerEmail` now requires a Firebase bearer token plus the full `getAdminContext` session pipeline before writing the allow list.
2. Admin overrides in `bookings.js` and `payments.js` now use `getAdminContext` instead of a stale `admin` custom claim or the weaker `isAdminUser` helper.
3. `notifications.js:createNotification` only bypasses booking-participant checks when `getAdminContext` confirms an active admin session.
4. Dashboard pending approvals and the landing-stats certified count now use `users.isApproved`, the field written by `adminApproveCaregiver`, instead of legacy `servicePersonnel.idVerified`.

Local backend checks: `node --check` on all modified files and `npm test` (60/60) passed.

## 7. Recommended web implementation order

1. **Admin auth foundation** — dedicated `/admin/login`, session registration, authz context router guard, forced password reset, session supersede/expiry handling, secure callable wrapper.
2. **Shell + dashboard** — responsive navigation, capability-gated items, live issue badge, stats cards, quick actions.
3. **Operations** — bookings (search/filter/detail/reassign/cancel/price), issues triage, users.
4. **Caregiver supply** — caregivers, KYC, whitelist/CSV, deletion override.
5. **Money** — transactions, earnings/TDS/CSV, payouts.
6. **System** — pricing/CMS, administrators, ID translator, audit log diffs, help docs.
7. **Backend hardening** — closed locally in the four files above; still needs deployment after review.

Keep the `realf` visual language (cards, pills, existing Tailwind tokens) throughout; do not port the Flutter theme or Flutter UI structure.

import { createFileRoute } from "@tanstack/react-router";
import { AdminCard, AdminPage } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/_shell/help")({
  head: () => ({ meta: [{ title: "Help | GoldenCares admin" }] }),
  component: HelpPage,
});

const SECTIONS = [
  {
    title: "Sessions and roles",
    items: [
      "Admin sessions last eight hours and are valid on one device at a time. Signing in elsewhere signs the previous session out.",
      "A newly created administrator must set a personal password before any other screen will open.",
      "Primary admins can publish content, delete accounts, manage administrators, edit advanced caregiver stats and read audit logs. Secondary admins cannot.",
      "The root administrator is fixed in the backend and can never be removed.",
    ],
  },
  {
    title: "Bookings",
    items: [
      "Search accepts booking references, customer names, phone numbers, service names and caregiver names. A full Firestore booking ID opens that record directly.",
      "Use ‘Force status’ for non-terminal changes only. Completing, cancelling and expiring are handled by backend pipelines so refunds and caregiver earnings stay consistent.",
      "Cancellation always issues a refund through the backend. A reason is required and is written to the audit trail.",
      "Reassigning a caregiver changes both the legacy and current caregiver fields and records the reason.",
    ],
  },
  {
    title: "Caregivers",
    items: [
      "KYC approval writes the shared isApproved flag on the user record. The caregiver list shows that same value.",
      "Primary admins may edit visits completed and experience years; secondary admins can edit the remaining profile fields.",
      "Deactivating a caregiver marks the profile inactive and records a deletion audit entry. It does not hard-delete historical bookings.",
    ],
  },
  {
    title: "Payments and earnings",
    items: [
      "Transactions are written by Razorpay webhooks and callables. The admin console is read-only for money records.",
      "Earnings are stored in paise; the console displays rupees. TDS totals can be downloaded as CSV for 26Q and Form 16A filing.",
      "Payouts are initiated by scheduled backend jobs through RazorpayX and cannot be manually approved here.",
    ],
  },
  {
    title: "Content",
    items: [
      "Saving a draft merges only the fields you send with the existing draft, so editing one section does not erase the others.",
      "Publishing creates a numbered snapshot and makes it visible to the app. Only primary admins can publish or roll back.",
      "Use the JSON editor to add, remove or reorder list items such as trust badges, value props, steps and FAQs.",
    ],
  },
  {
    title: "Status glossary",
    items: [
      "Pending payment: request saved, no successful online payment yet. COD requests use the cod payment status.",
      "Confirmed: team has confirmed the companion and the visit details.",
      "In progress: the visit has started; the OTP is valid on the service day only.",
      "Completion requested: companion has marked arrival and requested completion; the family review follows.",
      "Completed, cancelled, expired: terminal states managed by backend workflows.",
    ],
  },
];

function HelpPage() {
  return (
    <AdminPage title="Help & docs" description="Operating notes for the GoldenCares admin console.">
      <div className="grid gap-5 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <AdminCard key={section.title} title={section.title}>
            <ul className="space-y-2 text-[0.86rem] leading-relaxed text-muted-foreground">
              {section.items.map((item) => <li key={item} className="before:mr-2 before:text-primary before:content-['•']">{item}</li>)}
            </ul>
          </AdminCard>
        ))}
      </div>
    </AdminPage>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AdminButton,
  AdminCard,
  AdminError,
  AdminLoading,
  AdminPage,
  StatCard,
  formatINR,
} from "@/components/admin/AdminUI";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";

export const Route = createFileRoute("/admin/_shell/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | GoldenCares admin" }] }),
  component: DashboardPage,
});

const QUICK_ACTIONS = [
  { to: "/admin/bookings", label: "Bookings", hint: "Assign, reassign and cancel visits" },
  { to: "/admin/caregivers", label: "Caregivers", hint: "KYC, availability and profiles" },
  { to: "/admin/issues", label: "Issues", hint: "Triage service incidents" },
  { to: "/admin/pricing", label: "Pricing", hint: "Services, variants and fees" },
  { to: "/admin/transactions", label: "Payments", hint: "Razorpay ledger" },
];

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    adminCall("adminGetStats", {})
      .then((data) => { if (active) setStats(data); })
      .catch((err) => { if (active) setError(adminErrorMessage(err)); });
    return () => { active = false; };
  }, [reload]);

  const bookings = stats?.bookings || {};
  const users = stats?.users || {};
  const revenue = stats?.revenue || {};

  return (
    <AdminPage
      title="Dashboard"
      description="A live view of bookings, caregivers and collections across the GoldenCares operation."
      actions={<AdminButton variant="secondary" onClick={() => setReload((value) => value + 1)}>Refresh</AdminButton>}
    >
      <AdminError message={error} onRetry={() => setReload((value) => value + 1)} />
      {!stats && !error ? <AdminCard><AdminLoading label="Loading dashboard…" /></AdminCard> : null}
      {stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Bookings today" value={bookings.today} hint={`${bookings.active ?? 0} active`} />
            <StatCard label="Total bookings" value={bookings.total} hint={`${bookings.completed ?? 0} completed`} tone="success" />
            <StatCard label="Families" value={users.families} hint={`${users.caregivers ?? 0} caregivers`} tone="info" />
            <StatCard label="Revenue collected" value={formatINR(revenue.total)} hint={`${formatINR(revenue.today)} today`} tone="success" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active caregivers" value={users.activeCaregivers} tone="success" />
            <StatCard label="Pending approval" value={users.pendingApproval} tone="warning" />
            <StatCard label="Platform fees" value={formatINR(revenue.platformFees)} tone="info" />
            <StatCard label="Completed visits" value={bookings.completed} tone="success" />
          </div>
        </>
      ) : null}

      <AdminCard title="Quick actions" description="Jump into the day-to-day tools.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <p className="font-semibold text-foreground">{action.label}</p>
              <p className="mt-1 text-[0.8rem] text-muted-foreground">{action.hint}</p>
            </Link>
          ))}
        </div>
      </AdminCard>
    </AdminPage>
  );
}

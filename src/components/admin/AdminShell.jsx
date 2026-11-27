import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/api/firebaseClient";
import { useAdmin } from "@/lib/AdminAuthContext";
import { AdminBadge, AdminButton } from "@/components/admin/AdminUI";
import AdminIdleOxygen from "@/components/admin/AdminIdleOxygen";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/issues", label: "Issues" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/caregivers", label: "Caregivers" },
  { to: "/admin/whitelist", label: "Whitelist" },
  { to: "/admin/pricing", label: "Pricing" },
  { to: "/admin/transactions", label: "Transactions" },
  { to: "/admin/earnings", label: "Earnings" },
  { to: "/admin/payouts", label: "Payouts" },
  { to: "/admin/content", label: "Content" },
  { to: "/admin/id-translator", label: "ID Translator" },
  { to: "/admin/audit-logs", label: "Audit Logs", primaryOnly: true },
  { to: "/admin/administrators", label: "Administrators" },
  { to: "/admin/help", label: "Help" },
];

export default function AdminShell({ children }) {
  const { user, authz, signOut } = useAdmin();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [issueCount, setIssueCount] = useState(0);
  const isPrimary = authz?.isPrimary === true;

  useEffect(() => {
    const ref = doc(getDb(), "counters", "issues");
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return setIssueCount(0);
        const data = snap.data();
        setIssueCount(Number(data.openCount || 0) + Number(data.inReviewCount || 0));
      },
      () => setIssueCount(0),
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-heading text-[0.9rem] font-bold text-primary-foreground">
              GC
            </span>
            <span>
              <span className="block font-heading text-[1rem] leading-tight text-foreground">GoldenCares Admin</span>
              <span className="block text-[0.68rem] text-muted-foreground">Master control console</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-[0.78rem] font-semibold text-foreground">{user?.email}</span>
              <span className="block text-[0.68rem] capitalize text-muted-foreground">
                {authz?.adminType || "admin"} admin
                {authz?.isRoot ? " · root" : ""}
              </span>
            </span>
            <AdminButton variant="secondary" onClick={signOut}>Sign out</AdminButton>
          </div>
        </div>
        <nav className="mx-auto max-w-[1500px] overflow-x-auto px-5 pb-2 lg:px-8">
          <ul className="flex w-max items-center gap-1.5">
            {NAV_ITEMS.filter((item) => !item.primaryOnly || isPrimary).map((item) => {
              const active = pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    {item.label === "Issues" && issueCount > 0 ? (
                      <AdminBadge tone="danger">{issueCount}</AdminBadge>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main>{children}</main>
      <AdminIdleOxygen />
    </div>
  );
}

import { Loader2, Search, X } from "lucide-react";

const BADGE_STYLES = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-primary/10 text-primary border-primary/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

const STATUS_TONE = {
  paid: "success",
  captured: "success",
  confirmed: "success",
  completed: "success",
  resolved: "success",
  approved: "success",
  available: "success",
  active: "success",
  reopened: "success",
  pending_payment: "warning",
  pending: "warning",
  initiated: "warning",
  open: "warning",
  in_review: "info",
  processing: "info",
  contact_requested: "info",
  in_progress: "info",
  completion_requested: "info",
  cancelled: "danger",
  failed: "danger",
  expired: "danger",
  reversed: "danger",
  dismissed: "neutral",
  new: "info",
};

export function AdminPage({ eyebrow = "Admin console", title, description, actions, children }) {
  return (
    <section className="mx-auto w-full max-w-[1500px] px-5 py-8 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-primary/70">{eyebrow}</p>
          <h1 className="mt-2 font-heading text-[2rem] leading-tight text-foreground sm:text-[2.5rem]">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-[0.92rem] text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-7 space-y-5">{children}</div>
    </section>
  );
}

export function AdminCard({ title, description, actions, children, className = "" }) {
  return (
    <div className={`rounded-[1.5rem] border border-border bg-card ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <h2 className="font-heading text-[1.15rem] text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-[0.82rem] text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-border bg-card text-foreground hover:border-primary/40",
  danger: "border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

export function AdminButton({
  variant = "primary",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[0.85rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function AdminBadge({ status, children, tone }) {
  const resolvedTone = tone || STATUS_TONE[String(status || "").toLowerCase()] || "neutral";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold capitalize ${BADGE_STYLES[resolvedTone]}`}
    >
      {children ?? String(status || "—").replaceAll("_", " ")}
    </span>
  );
}

export function AdminError({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[0.88rem] text-destructive">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-2 font-semibold underline">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function AdminEmpty({ children = "Nothing to show yet." }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background p-10 text-center text-[0.9rem] text-muted-foreground">
      {children}
    </div>
  );
}

export function AdminLoading({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-[0.9rem] text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" /> {label}
    </div>
  );
}

export function AdminSearch({ value, onChange, placeholder = "Search…", onSubmit }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      className="flex w-full max-w-sm items-center gap-2 rounded-full border border-border bg-background px-4"
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full bg-transparent text-[0.85rem] text-foreground outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}

export function AdminSelect({ value, onChange, options, label, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="label-strong">{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-1 h-10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminField({ label, hint, children }) {
  return (
    <label className="block">
      <span className="label-strong">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[0.75rem] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function AdminTable({ columns, rows, rowKey = "id", onRowClick, empty = "No records found." }) {
  if (!rows?.length) return <AdminEmpty>{empty}</AdminEmpty>;
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[720px] border-collapse text-left text-[0.82rem]">
        <thead>
          <tr className="border-b border-border text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap py-2.5 pr-4 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey] ?? row.id ?? row.title}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-border/70 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}`}
            >
              {columns.map((column) => (
                <td key={column.key} className="py-3 pr-4 align-top text-foreground/90">
                  {column.render ? column.render(row) : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminPagination({ hasMore, loading, onLoadMore, label = "Load more" }) {
  if (!hasMore) return null;
  return (
    <div className="mt-4 flex justify-center">
      <AdminButton variant="secondary" loading={loading} onClick={onLoadMore}>
        {loading ? "Loading…" : label}
      </AdminButton>
    </div>
  );
}

export function AdminModal({ open, onClose, title, description, children, footer, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`my-auto w-full rounded-[1.5rem] border border-border bg-card p-6 shadow-2xl ${wide ? "max-w-4xl" : "max-w-xl"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-[1.35rem] text-foreground">{title}</h2>
            {description ? <p className="mt-1 text-[0.85rem] text-muted-foreground">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 max-h-[65vh] space-y-4 overflow-y-auto pr-1">{children}</div>
        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "info" }) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-card p-5">
      <p className="text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-[1.8rem] leading-none text-foreground">{value ?? "—"}</p>
      {hint ? <p className={`mt-2 text-[0.75rem] ${BADGE_STYLES[tone]?.split(" ")[1] || "text-muted-foreground"}`}>{hint}</p> : null}
    </div>
  );
}

export function formatINR(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
}

function toDate(value) {
  if (!value) return null;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value.toDate) return value.toDate();
  if (value.seconds !== undefined) return new Date(Number(value.seconds) * 1000);
  if (value._seconds !== undefined) return new Date(Number(value._seconds) * 1000);
  return null;
}

export function formatDate(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

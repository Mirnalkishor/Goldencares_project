import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminField,
  AdminLoading,
  AdminModal,
  AdminPage,
  AdminPagination,
  AdminSearch,
  AdminSelect,
  AdminTable,
  formatDateTime,
  formatINR,
} from "@/components/admin/AdminUI";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";
import { useAdminPagedList } from "@/lib/useAdminPagedList";

export const Route = createFileRoute("/admin/_shell/bookings")({
  head: () => ({ meta: [{ title: "Bookings | GoldenCares admin" }] }),
  component: BookingsPage,
});

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completion_requested", label: "Completion requested" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

const EDITABLE_STATUSES = [
  { value: "pending_payment", label: "Pending payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completion_requested", label: "Completion requested" },
];

function BookingsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [caregivers, setCaregivers] = useState([]);
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const list = useAdminPagedList(
    "adminListBookings",
    { search: query, status },
    "bookings",
  );

  useEffect(() => {
    adminCall("adminListUsers", { role: "caregiver", limit: 100 })
      .then((data) => setCaregivers(data?.users || []))
      .catch(() => setCaregivers([]));
  }, []);

  function openBooking(booking) {
    setSelected(booking);
    setAction("");
    setMessage("");
  }

  async function runAction() {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      if (action === "reassign") {
        const newCaregiverId = document.getElementById("admin-reassign-id")?.value?.trim();
        const reason = document.getElementById("admin-reassign-reason")?.value?.trim();
        if (!newCaregiverId) throw new Error("Choose a caregiver to reassign to.");
        await adminCall("adminReassignCaregiver", {
          bookingId: selected.id,
          newCaregiverId,
          reason,
        });
      } else if (action === "cancel") {
        const reason = document.getElementById("admin-cancel-reason")?.value?.trim();
        if (!reason) throw new Error("A cancellation reason is required.");
        await adminCall("adminCancelBooking", {
          bookingId: selected.id,
          reason,
          issueRefund: true,
        });
      } else {
        await adminCall("adminUpdateBooking", {
          bookingId: selected.id,
          updates: {
            status: document.getElementById("admin-booking-status")?.value,
            price: Number(document.getElementById("admin-booking-price")?.value || 0),
            adminNote: document.getElementById("admin-booking-note")?.value?.trim() || "",
          },
        });
      }
      setMessage("Updated successfully.");
      list.reload();
      setAction("");
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    {
      key: "reference",
      label: "Booking",
      render: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.displayId || row.supportCode || row.id}</p>
          <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
            {row.preferred_date
              ? `${row.preferred_date}${row.preferred_time ? ` · ${row.preferred_time}` : ""}`
              : formatDateTime(row.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (row) => (
        <div>
          <p className="text-foreground">{row.userName || row.full_name || "—"}</p>
          <p className="mt-0.5 text-[0.72rem] text-muted-foreground">{row.userPhone || row.phone || ""}</p>
        </div>
      ),
    },
    {
      key: "service",
      label: "Service",
      render: (row) => (
        <div>
          <p className="text-foreground">{row.serviceName || row.serviceTitle || "—"}</p>
          <p className="mt-0.5 text-[0.72rem] text-muted-foreground">{row.city || ""}</p>
        </div>
      ),
    },
    {
      key: "caregiver",
      label: "Caregiver",
      render: (row) => row.servicePersonnelName || row.caregiverName || "Unassigned",
    },
    { key: "price", label: "Price", render: (row) => formatINR(row.price ?? row.totalAmount) },
    { key: "status", label: "Status", render: (row) => <AdminBadge status={row.status} /> },
    {
      key: "payment",
      label: "Payment",
      render: (row) => (
        <div>
          <AdminBadge status={row.paymentStatus || "pending"} />
          <p className="mt-1 text-[0.72rem] capitalize text-muted-foreground">{row.payment_method || "—"}</p>
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      title="Bookings"
      description="Search, inspect and manage every visit request. Terminal changes go through the refund and earnings pipelines."
    >
      <AdminCard
        title={`${list.rows.length}${list.hasMore ? "+" : ""} bookings`}
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminSearch
              value={search}
              onChange={setSearch}
              onSubmit={() => list.reload()}
              placeholder="ID, name, phone, service…"
            />
            <AdminButton variant="secondary" onClick={() => list.reload()}>
              Search
            </AdminButton>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <AdminSelect
            label="Status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setQuery(search.trim());
            }}
            options={STATUSES}
            className="w-full sm:w-56"
          />
          <AdminButton
            variant="secondary"
            onClick={() => {
              setQuery(search.trim());
              list.reload();
            }}
          >
            Apply
          </AdminButton>
        </div>
        <AdminError message={list.error} onRetry={list.reload} />
        {list.loading && list.rows.length === 0 ? <AdminLoading label="Loading bookings…" /> : null}
        <AdminTable columns={columns} rows={list.rows} onRowClick={openBooking} empty="No bookings found." />
        <AdminPagination hasMore={list.hasMore} loading={list.loading} onLoadMore={list.loadMore} />
      </AdminCard>

      <AdminModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        wide
        title={`Booking ${selected?.displayId || selected?.supportCode || selected?.id || ""}`}
        description={selected ? `${selected.serviceName || selected.serviceTitle || "Visit"} · ${selected.city || "Location not set"}` : ""}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setSelected(null)}>
              Close
            </AdminButton>
            <AdminButton loading={busy} onClick={runAction}>
              Apply change
            </AdminButton>
          </>
        }
      >
        {selected ? (
          <>
            {message ? <AdminError message={message} /> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Status">
                <select id="admin-booking-status" className="field mt-1" defaultValue={selected.status}>
                  {EDITABLE_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Price (₹)">
                <input id="admin-booking-price" className="field mt-1" type="number" min="0" defaultValue={selected.price ?? selected.totalAmount ?? 0} />
              </AdminField>
            </div>
            <AdminField label="Admin note">
              <textarea id="admin-booking-note" className="field-area mt-1" rows={2} defaultValue={selected.adminNote || ""} />
            </AdminField>

            <div className="rounded-xl border border-border bg-background p-4 text-[0.82rem]">
              <p><span className="text-muted-foreground">Customer:</span> {selected.userName || selected.full_name || "—"} · {selected.userPhone || selected.phone || "—"}</p>
              <p className="mt-1"><span className="text-muted-foreground">Senior:</span> {selected.elderName || "—"} {selected.elderAge ? `· ${selected.elderAge} yrs` : ""}</p>
              <p className="mt-1"><span className="text-muted-foreground">When:</span> {selected.preferred_date || selected.date || "—"} {selected.preferred_time || selected.startTime || ""}</p>
              <p className="mt-1"><span className="text-muted-foreground">Payment:</span> {selected.payment_method || "—"} · {selected.paymentStatus || "—"} · {selected.transactionId || "—"}</p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="label-strong">Advanced actions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <AdminButton variant={action === "edit" ? "primary" : "secondary"} onClick={() => setAction("edit")}>Edit details</AdminButton>
                <AdminButton variant={action === "reassign" ? "primary" : "secondary"} onClick={() => setAction("reassign")}>Reassign caregiver</AdminButton>
                <AdminButton variant={action === "cancel" ? "danger" : "secondary"} onClick={() => setAction("cancel")}>Cancel with refund</AdminButton>
              </div>
              {action === "reassign" ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <AdminField label="New caregiver">
                    <select id="admin-reassign-id" className="field mt-1" defaultValue="">
                      <option value="">Choose a caregiver…</option>
                      {caregivers.map((caregiver) => (
                        <option key={caregiver.id} value={caregiver.id}>
                          {caregiver.name || caregiver.email || caregiver.id}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Reason">
                    <input id="admin-reassign-reason" className="field mt-1" placeholder="Why reassign?" />
                  </AdminField>
                </div>
              ) : null}
              {action === "cancel" ? (
                <AdminField label="Cancellation reason">
                  <input id="admin-cancel-reason" className="field mt-1" placeholder="Required — recorded in the audit trail" />
                </AdminField>
              ) : null}
              {action === "edit" ? (
                <p className="mt-2 text-[0.8rem] text-muted-foreground">Save the status, price and note using “Apply change” above.</p>
              ) : null}
            </div>
          </>
        ) : null}
      </AdminModal>
    </AdminPage>
  );
}

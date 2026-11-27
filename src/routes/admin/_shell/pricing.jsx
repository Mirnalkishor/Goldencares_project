import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminError,
  AdminField,
  AdminLoading,
  AdminModal,
  AdminPage,
  AdminTable,
  formatINR,
} from "@/components/admin/AdminUI";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";

export const Route = createFileRoute("/admin/_shell/pricing")({
  head: () => ({ meta: [{ title: "Pricing | GoldenCares admin" }] }),
  component: PricingPage,
});

function PricingPage() {
  const [services, setServices] = useState([]);
  const [feePercent, setFeePercent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await adminCall("adminGetPricing", {});
      setServices(data?.services || []);
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveService() {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminUpdatePricing", {
        serviceId: selected.id,
        updates: {
          name: document.getElementById("price-name")?.value?.trim(),
          category: document.getElementById("price-category")?.value?.trim(),
          description: document.getElementById("price-description")?.value?.trim(),
          price: Number(document.getElementById("price-amount")?.value || 0),
          order: Number(document.getElementById("price-order")?.value || 0),
          isActive: document.getElementById("price-active")?.value === "true",
        },
      });
      setMessage("Service updated.");
      setSelected(null);
      load();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function createService() {
    setBusy(true);
    setMessage("");
    try {
      const name = document.getElementById("new-service-name")?.value?.trim();
      const price = Number(document.getElementById("new-service-price")?.value || 0);
      const hours = Number(document.getElementById("new-service-hours")?.value || 0);
      if (!name || price <= 0 || hours <= 0) throw new Error("Name, price and duration are required.");
      await adminCall("adminCreateService", {
        service: {
          name,
          category: document.getElementById("new-service-category")?.value?.trim() || "General",
          description: document.getElementById("new-service-description")?.value?.trim() || "",
          price,
          durationHours: hours,
          options: [{ duration: `${hours} hours`, durationHours: hours, price }],
        },
      });
      setShowCreate(false);
      load();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveFee() {
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminUpdatePlatformFee", { feePercent: Number(feePercent) });
      setMessage("Platform fee updated.");
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(service) {
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminUpdatePricing", {
        serviceId: service.id,
        updates: { isActive: !service.isActive },
      });
      load();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    { key: "name", label: "Service", render: (row) => <div><p className="font-semibold text-foreground">{row.name}</p><p className="mt-0.5 text-[0.72rem] text-muted-foreground">{row.category}</p></div> },
    { key: "price", label: "Price", render: (row) => formatINR(row.price) },
    { key: "duration", label: "Duration", render: (row) => row.durationHours ? `${row.durationHours} hr${row.durationHours === 1 ? "" : "s"}` : "—" },
    { key: "options", label: "Variants", render: (row) => Array.isArray(row.options) ? row.options.length : 0 },
    { key: "order", label: "Order", render: (row) => row.order },
    { key: "active", label: "Status", render: (row) => <AdminBadge status={row.isActive ? "active" : "dismissed"} /> },
    { key: "actions", label: "Actions", render: (row) => <div className="flex gap-2"><AdminButton variant="secondary" onClick={() => setSelected(row)}>Edit</AdminButton><AdminButton variant="secondary" onClick={() => toggle(row)}>{row.isActive ? "Disable" : "Enable"}</AdminButton></div> },
  ];

  return (
    <AdminPage title="Pricing" description="Service catalogue, duration variants and the platform fee used for earnings.">
      {message ? <AdminError message={message} /> : null}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <AdminCard title="Services" actions={<AdminButton onClick={() => setShowCreate(true)}>New service</AdminButton>}>
          <AdminError message={error} onRetry={load} />
          {loading ? <AdminLoading label="Loading services…" /> : <AdminTable columns={columns} rows={services} empty="No services found." />}
        </AdminCard>
        <AdminCard title="Platform fee" description="Percentage retained by GoldenCares on each completed visit.">
          <AdminField label="Fee percentage">
            <input className="field mt-1" type="number" min="0" max="50" step="0.5" value={feePercent} onChange={(event) => setFeePercent(event.target.value)} placeholder="e.g. 10" />
          </AdminField>
          <AdminButton className="mt-4" loading={busy} onClick={saveFee}>Save fee</AdminButton>
        </AdminCard>
      </div>

      <AdminModal open={Boolean(selected)} onClose={() => setSelected(null)} wide title={`Edit ${selected?.name || "service"}`} description={`Service ID ${selected?.id || ""}`} footer={<><AdminButton variant="secondary" onClick={() => setSelected(null)}>Cancel</AdminButton><AdminButton loading={busy} onClick={saveService}>Save service</AdminButton></>}>
        {selected ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Name"><input id="price-name" className="field mt-1" defaultValue={selected.name} /></AdminField>
              <AdminField label="Category"><input id="price-category" className="field mt-1" defaultValue={selected.category} /></AdminField>
              <AdminField label="Base price (₹)"><input id="price-amount" type="number" className="field mt-1" defaultValue={selected.price} /></AdminField>
              <AdminField label="Display order"><input id="price-order" type="number" className="field mt-1" defaultValue={selected.order} /></AdminField>
            </div>
            <AdminField label="Description"><textarea id="price-description" className="field-area mt-1" rows={3} defaultValue={selected.description} /></AdminField>
            <AdminField label="Status">
              <select id="price-active" className="field mt-1" defaultValue={String(selected.isActive)}><option value="true">Active</option><option value="false">Disabled</option></select>
            </AdminField>
            {Array.isArray(selected.options) && selected.options.length ? (
              <div className="rounded-xl border border-border bg-background p-4 text-[0.82rem]">
                <p className="label-strong">Duration variants</p>
                <pre className="mt-2 max-h-40 overflow-auto text-[0.72rem] text-muted-foreground">{JSON.stringify(selected.options, null, 2)}</pre>
              </div>
            ) : null}
          </>
        ) : null}
      </AdminModal>

      <AdminModal open={showCreate} onClose={() => setShowCreate(false)} title="Create service" footer={<><AdminButton variant="secondary" onClick={() => setShowCreate(false)}>Cancel</AdminButton><AdminButton loading={busy} onClick={createService}>Create service</AdminButton></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Name"><input id="new-service-name" className="field mt-1" /></AdminField>
          <AdminField label="Category"><input id="new-service-category" className="field mt-1" /></AdminField>
          <AdminField label="Price (₹)"><input id="new-service-price" type="number" className="field mt-1" /></AdminField>
          <AdminField label="Duration (hours)"><input id="new-service-hours" type="number" className="field mt-1" /></AdminField>
        </div>
        <AdminField label="Description"><textarea id="new-service-description" className="field-area mt-1" rows={3} /></AdminField>
      </AdminModal>
    </AdminPage>
  );
}

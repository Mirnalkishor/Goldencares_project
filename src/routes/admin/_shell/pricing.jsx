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

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function hoursFromLabel(label) {
  const match = String(label || "").trim().toLowerCase().match(/^(\d+(?:\.\d+)?)/);
  const number = match ? Number(match[1]) : NaN;
  return Number.isFinite(number) && number > 0 ? number : 1;
}

function draftFromService(service) {
  const options = Array.isArray(service?.options) ? service.options : [];
  return {
    name: service?.name || "",
    category: service?.category || "",
    description: service?.description || "",
    price: String(service?.price ?? ""),
    order: String(service?.order ?? 0),
    isActive: String(service?.isActive !== false),
    options: options.length
      ? options.map((option) => ({
          duration: option?.duration || "",
          durationHours: String(option?.durationHours ?? hoursFromLabel(option?.duration)),
          price: String(option?.price ?? ""),
        }))
      : [],
  };
}

function normalizeOptionRows(rows) {
  const options = [];
  const seenHours = new Set();
  for (const row of rows) {
    const hours = asNumber(row.durationHours);
    const price = asNumber(row.price);
    const duration = String(row.duration || "").trim() || `${hours} hours`;
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new Error("Every duration variant needs a valid number of hours.");
    }
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Enter a price greater than zero for “${duration}”.`);
    }
    if (seenHours.has(hours)) {
      throw new Error(`Duration ${hours} hours is listed more than once.`);
    }
    seenHours.add(hours);
    options.push({ duration, durationHours: hours, price });
  }
  return options;
}

function PricingPage() {
  const [services, setServices] = useState([]);
  const [feePercent, setFeePercent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null);
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

  function openEditor(service) {
    setSelected(service);
    setDraft(draftFromService(service));
    setMessage("");
  }

  function closeEditor() {
    setSelected(null);
    setDraft(null);
  }

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateOption(index, key, value) {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, position) =>
        position === index ? { ...option, [key]: value } : option
      ),
    }));
  }

  function addOption() {
    setDraft((current) => {
      const hours = current.options.length
        ? Math.max(...current.options.map((option) => asNumber(option.durationHours))) + 1
        : 1;
      return {
        ...current,
        options: [...current.options, { duration: `${hours} hours`, durationHours: String(hours), price: "" }],
      };
    });
  }

  function removeOption(index) {
    setDraft((current) => ({
      ...current,
      options: current.options.filter((_, position) => position !== index),
    }));
  }

  const optionPrices = draft?.options.map((option) => asNumber(option.price, NaN)).filter((price) => price > 0) || [];
  const derivedBasePrice = optionPrices.length ? Math.min(...optionPrices) : null;
  const basePriceValue = derivedBasePrice != null ? String(derivedBasePrice) : draft?.price ?? "";

  async function saveService() {
    if (!selected || !draft) return;
    setBusy(true);
    setMessage("");
    try {
      if (!draft.name.trim()) throw new Error("Service name is required.");
      const options = normalizeOptionRows(draft.options);
      const price = options.length ? Math.min(...options.map((option) => option.price)) : asNumber(draft.price);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Enter a price greater than zero.");
      }
      const updates = {
        name: draft.name.trim(),
        category: draft.category.trim(),
        description: draft.description.trim(),
        price,
        order: asNumber(draft.order),
        isActive: draft.isActive === "true",
        options,
      };
      const firstHours = options[0]?.durationHours || asNumber(draft.durationHours, 0);
      if (firstHours > 0) updates.durationHours = firstHours;
      await adminCall("adminUpdatePricing", { serviceId: selected.id, updates });
      setMessage(`“${draft.name.trim()}” updated. Prices are live now.`);
      closeEditor();
      load();
    } catch (err) {
      setMessage(err?.message && !err?.code ? err.message : adminErrorMessage(err));
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
      setMessage(`“${name}” created. It is live now.`);
      load();
    } catch (err) {
      setMessage(err?.message && !err?.code ? err.message : adminErrorMessage(err));
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
      setMessage(`${service.name} ${service.isActive ? "disabled" : "enabled"}.`);
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
    { key: "actions", label: "Actions", render: (row) => <div className="flex gap-2"><AdminButton variant="secondary" onClick={() => openEditor(row)}>Edit</AdminButton><AdminButton variant="secondary" onClick={() => toggle(row)}>{row.isActive ? "Disable" : "Enable"}</AdminButton></div> },
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

      <AdminModal open={Boolean(selected && draft)} onClose={closeEditor} wide title={`Edit ${draft?.name || selected?.name || "service"}`} description={`Service ID ${selected?.id || ""}`} footer={<><AdminButton variant="secondary" onClick={closeEditor}>Cancel</AdminButton><AdminButton loading={busy} onClick={saveService}>Save service</AdminButton></>}>
        {draft ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Name"><input id="price-name" className="field mt-1" value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} /></AdminField>
              <AdminField label="Category"><input id="price-category" className="field mt-1" value={draft.category} onChange={(event) => updateDraft("category", event.target.value)} /></AdminField>
              <AdminField label={draft.options.length ? "Base price (lowest variant)" : "Base price (₹)"}>
                <input
                  id="price-amount"
                  type="number"
                  min="0"
                  className="field mt-1"
                  value={basePriceValue}
                  readOnly={draft.options.length > 0}
                  onChange={(event) => updateDraft("price", event.target.value)}
                />
              </AdminField>
              <AdminField label="Display order"><input id="price-order" type="number" className="field mt-1" value={draft.order} onChange={(event) => updateDraft("order", event.target.value)} /></AdminField>
            </div>
            <AdminField label="Description"><textarea id="price-description" className="field-area mt-1" rows={3} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></AdminField>
            <AdminField label="Status">
              <select id="price-active" className="field mt-1" value={draft.isActive} onChange={(event) => updateDraft("isActive", event.target.value)}>
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </select>
            </AdminField>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="label-strong">Duration variants</p>
                  <p className="mt-1 text-[0.78rem] text-muted-foreground">
                    These are the prices families see and pay. The duration label must match the app exactly.
                  </p>
                </div>
                <AdminButton variant="secondary" onClick={addOption}>Add variant</AdminButton>
              </div>

              {draft.options.length ? (
                <div className="mt-4 space-y-2">
                  {draft.options.map((option, index) => (
                    <div key={index} className="grid items-end gap-2 sm:grid-cols-[1.4fr_0.7fr_0.8fr_auto]">
                      <AdminField label="Label">
                        <input className="field mt-1" value={option.duration} onChange={(event) => updateOption(index, "duration", event.target.value)} placeholder="2 hours" />
                      </AdminField>
                      <AdminField label="Hours">
                        <input className="field mt-1" type="number" min="1" step="1" value={option.durationHours} onChange={(event) => updateOption(index, "durationHours", event.target.value)} />
                      </AdminField>
                      <AdminField label="Price (₹)">
                        <input className="field mt-1" type="number" min="1" value={option.price} onChange={(event) => updateOption(index, "price", event.target.value)} />
                      </AdminField>
                      <AdminButton variant="secondary" onClick={() => removeOption(index)}>Remove</AdminButton>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[0.82rem] text-muted-foreground">
                  No variants yet. This service will use the base price for every duration.
                </p>
              )}
            </div>
          </div>
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

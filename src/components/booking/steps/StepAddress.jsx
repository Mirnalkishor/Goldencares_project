import { useState } from "react";
import { Check, MapPin, Plus, Trash2 } from "lucide-react";
import ChoiceCard from "../ChoiceCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CITIES } from "@/lib/site";
import { isValidEmail, isValidPhoneNumber } from "@/lib/validation";

const CITY_NOTES = {
  Chandigarh: "Sectors across the city, including southern sectors.",
  Mohali: "Phases, sectors and nearby localities.",
  Panchkula: "Sectors and adjoining areas.",
};

const RELATIONSHIPS = ["Daughter", "Son", "Spouse", "I'm the senior", "Another relative or friend"];
const LANGUAGES = ["Hindi", "Punjabi", "English"];
const GENDERS = ["Female", "Male", "Other"];
const CONTACT_METHODS = [
  { value: "Phone call", title: "Phone call", description: "We call you to confirm the details." },
  { value: "WhatsApp", title: "WhatsApp", description: "A message first, then a call if needed." },
  { value: "Email", title: "Email", description: "We write, and call only if you ask us to." },
];

function normalizeAddress(address) {
  if (!address) return {};
  return { ...address, address_label: address.address_label || address.label || "" };
}

function blankAddress(defaults = {}) {
  return {
    address_label: "",
    city: "",
    address: "",
    full_name: defaults.name || "",
    phone: "",
    email: defaults.email || "",
    relationship: "",
    language_preference: "",
    preferred_contact: "Phone call",
    notes: "",
    elderName: "",
    elderAge: "",
    elderGender: "",
  };
}

export function validateAddressDraft(draft) {
  if (!CITIES.includes(draft.city)) return "Please choose a city so we can match someone nearby.";
  if (!draft.full_name?.trim()) return "Please add your name so we know who to speak with.";
  if (!isValidPhoneNumber(draft.phone || "")) return "Please enter a valid phone number.";
  if (!isValidEmail(draft.email || "")) return "Please enter a valid email address for your payment receipt.";
  if (!draft.elderName?.trim()) return "Please add the senior's name.";
  if (!GENDERS.includes(draft.elderGender)) return "Please select the senior's gender.";
  if (!String(draft.elderAge || "").trim()) return "Please enter the senior's age.";
  const age = Number(draft.elderAge);
  if (!Number.isInteger(age) || age < 1 || age > 120) return "Please enter a valid senior age (1–120).";
  if (age < 50) return "Senior must be 50 years or older to book this service.";
  return "";
}

export default function StepAddress({
  form,
  savedAddresses,
  activeAddressId,
  onSelectAddress,
  onDeleteAddress,
  onSaveAddress,
  defaultName,
  defaultEmail,
  isAuthenticated,
}) {
  const defaults = { name: defaultName, email: defaultEmail };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(() => blankAddress(defaults));
  const [dialogError, setDialogError] = useState("");
  const [saving, setSaving] = useState(false);

  const activeAddress = normalizeAddress(
    savedAddresses.find((address) => address.id === activeAddressId) ||
      (activeAddressId ? { id: activeAddressId, ...form } : null),
  );
  const hasPreview = Boolean(form.city || form.address || activeAddress);

  function openNew() {
    setEditingId(null);
    setDraft(blankAddress(defaults));
    setDialogError("");
    setDialogOpen(true);
  }

  function openEdit(address) {
    setEditingId(address?.id || null);
    const merged = { ...blankAddress(defaults), ...normalizeAddress(address || form) };
    setDraft({
      ...merged,
      full_name: merged.full_name || defaults.name,
      email: merged.email || defaults.email,
    });
    setDialogError("");
    setDialogOpen(true);
  }

  function setDraftField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDialogError("");
  }

  async function saveAddress() {
    const message = validateAddressDraft(draft);
    if (message) {
      setDialogError(message);
      return;
    }
    setSaving(true);
    setDialogError("");
    try {
      const saved = await onSaveAddress(draft, editingId);
      onSelectAddress(saved);
      setDialogOpen(false);
    } catch (error) {
      setDialogError(error?.message || "Could not save this address. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-heading text-[1.6rem] leading-tight text-foreground sm:text-[1.9rem]">
        Where should we come, and how do we reach you?
      </h2>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Save an address once and it will be ready for your next booking.
      </p>

      {isAuthenticated && savedAddresses.length > 0 ? (
        <div className="mt-6">
          <span className="label-strong">Saved addresses</span>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {savedAddresses.map((address) => {
              const selected = address.id === activeAddressId;
              return (
                <div
                  key={address.id}
                  className={`rounded-2xl border p-4 transition ${
                    selected ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectAddress(address)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {selected ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-foreground">
                        {address.address_label || address.label || "Home"} · {address.city}
                      </span>
                      <span className="mt-1 block truncate text-[0.86rem] text-muted-foreground">
                        {address.address || "No area details"}
                      </span>
                      <span className="mt-1 block truncate text-[0.82rem] text-muted-foreground">
                        {address.full_name || "—"} · {address.phone || "—"}
                      </span>
                    </span>
                  </button>
                  <div className="mt-3 flex items-center justify-end gap-3 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      className="text-[0.82rem] font-semibold text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAddress(address.id)}
                      className="inline-flex items-center gap-1 text-[0.82rem] font-medium text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={openNew}
              className="flex min-h-[7rem] items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-4 text-[0.9rem] font-semibold text-primary transition hover:border-primary/50"
            >
              <Plus className="h-4 w-4" /> Add a new address
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-[1.5rem] border border-border bg-secondary/30 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-primary/70">Selected address</p>
            <h3 className="mt-1 font-heading text-[1.25rem] text-foreground">
              {hasPreview
                ? form.address_label || activeAddress?.address_label || "Visit address"
                : "No address selected yet"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => (hasPreview ? openEdit(activeAddress || form) : openNew())}
            className="rounded-full border border-border bg-card px-4 py-2 text-[0.85rem] font-semibold text-primary hover:border-primary/40"
          >
            {hasPreview ? "Edit" : "Add address"}
          </button>
        </div>

        {hasPreview ? (
          <div className="mt-4 grid gap-4 text-[0.9rem] sm:grid-cols-2">
            <PreviewItem label="City" value={form.city || "—"} />
            <PreviewItem label="Area / address" value={form.address || "Not provided"} />
            <PreviewItem label="Your name" value={form.full_name || "—"} />
            <PreviewItem label="Phone" value={form.phone || "—"} />
            <PreviewItem label="Email" value={form.email || "—"} />
            <PreviewItem label="Senior's name" value={form.elderName || "—"} />
            <PreviewItem label="Senior's gender" value={form.elderGender || "—"} />
            <PreviewItem label="Senior's age" value={form.elderAge ? `${form.elderAge} years` : "—"} />
            <PreviewItem label="Relationship" value={form.relationship || "Prefer not to say"} />
            <PreviewItem label="Language" value={form.language_preference || "No preference"} />
            <PreviewItem label="Best way to reach you" value={form.preferred_contact || "—"} />
            {form.notes ? <PreviewItem label="Notes" value={form.notes} className="sm:col-span-2" /> : null}
          </div>
        ) : (
          <p className="mt-3 text-[0.9rem] text-muted-foreground">
            Add the visit address and contact details. They will appear here before you continue.
          </p>
        )}

        <p className="mt-4 flex items-center gap-2 text-[0.8rem] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          We share the exact address with the companion only after you confirm the visit.
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl p-4 sm:rounded-2xl sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit address" : "Add a new address"}</DialogTitle>
            <DialogDescription>
              Save as Home, Work, Parents' home, Dad, or anything you will recognize later. Add who
              needs care so we can brief your companion properly.
            </DialogDescription>
          </DialogHeader>

          <AddressForm draft={draft} setField={setDraftField} isAuthenticated={isAuthenticated} />

          {dialogError ? (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[0.88rem] text-destructive">
              {dialogError}
            </p>
          ) : null}

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="rounded-full border border-border px-5 py-2.5 text-[0.88rem] font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveAddress}
              disabled={saving}
              className="rounded-full bg-primary px-5 py-2.5 text-[0.88rem] font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save address"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewItem({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-[0.75rem] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium text-foreground">{value}</p>
    </div>
  );
}

function AddressForm({ draft, setField, isAuthenticated }) {
  return (
    <div className="space-y-6 py-2">
      <div>
        <label htmlFor="address_label" className="label-strong">Save as</label>
        <input
          id="address_label"
          value={draft.address_label || ""}
          onChange={(event) => setField("address_label", event.target.value)}
          className="field mt-2"
          placeholder="Home, Work, Parents' home…"
        />
        <p className="mt-2 text-[0.8rem] text-muted-foreground">
          Name it anything: Home, Work, Dad's place, and so on.
        </p>
      </div>

      <div>
        <span className="label-strong">City</span>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {CITIES.map((city) => (
            <ChoiceCard
              key={city}
              selected={draft.city === city}
              onClick={() => setField("city", city)}
              title={city}
              description={CITY_NOTES[city]}
            />
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="address" className="label-strong">
          Area or full address <span className="font-normal text-muted-foreground">(optional, but helpful)</span>
        </label>
        <input
          id="address"
          value={draft.address || ""}
          onChange={(event) => setField("address", event.target.value)}
          placeholder="Sector 21, near the market — or the full address"
          className="field mt-2"
          autoComplete="street-address"
        />
        <p className="mt-2 text-[0.8rem] text-muted-foreground">
          We share the exact address with the companion only after you confirm the visit.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="label-strong">Your name</label>
          <input
            id="full_name"
            value={draft.full_name || ""}
            onChange={(event) => setField("full_name", event.target.value)}
            className="field mt-2"
            autoComplete="name"
            placeholder="Full name"
          />
          {isAuthenticated ? (
            <p className="mt-2 text-[0.8rem] text-muted-foreground">Prefilled from your account.</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="phone" className="label-strong">Phone number</label>
          <input
            id="phone"
            type="tel"
            value={draft.phone || ""}
            onChange={(event) => setField("phone", event.target.value)}
            className="field mt-2"
            autoComplete="tel"
            placeholder="We will call this number"
          />
        </div>
        <div>
          <label htmlFor="email" className="label-strong">Email</label>
          <input
            id="email"
            type="email"
            value={draft.email || ""}
            onChange={(event) => setField("email", event.target.value)}
            className="field mt-2"
            autoComplete="email"
            placeholder="you@example.com"
          />
          {isAuthenticated ? (
            <p className="mt-2 text-[0.8rem] text-muted-foreground">Prefilled from your account.</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="relationship" className="label-strong">You are the senior's…</label>
          <select
            id="relationship"
            value={draft.relationship || ""}
            onChange={(event) => setField("relationship", event.target.value)}
            className="field mt-2"
          >
            <option value="">Prefer not to say</option>
            {RELATIONSHIPS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="elderName" className="label-strong">Senior's name</label>
          <input
            id="elderName"
            value={draft.elderName || ""}
            onChange={(event) => setField("elderName", event.target.value)}
            className="field mt-2"
            autoComplete="off"
            placeholder="Name of the person receiving care"
          />
        </div>
        <div>
          <label htmlFor="elderGender" className="label-strong">Senior's gender</label>
          <select
            id="elderGender"
            value={draft.elderGender || ""}
            onChange={(event) => setField("elderGender", event.target.value)}
            className="field mt-2"
          >
            <option value="">Select gender</option>
            {GENDERS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="elderAge" className="label-strong">Senior's age</label>
          <input
            id="elderAge"
            type="number"
            inputMode="numeric"
            min="1"
            max="120"
            value={draft.elderAge || ""}
            onChange={(event) => setField("elderAge", event.target.value)}
            className="field mt-2"
            placeholder="e.g. 72"
          />
          <p className="mt-2 text-[0.8rem] text-muted-foreground">
            Companionship visits are for seniors aged 50 or above.
          </p>
        </div>
      </div>

      <div>
        <span className="label-strong">Language your parent prefers</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => setField("language_preference", draft.language_preference === language ? "" : language)}
              aria-pressed={draft.language_preference === language}
              className={`rounded-full border px-4 py-2 text-[0.85rem] font-medium transition-colors ${
                draft.language_preference === language
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground/75 hover:border-primary/40"
              }`}
            >
              {language}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label-strong">Best way to reach you</span>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {CONTACT_METHODS.map((method) => (
            <ChoiceCard
              key={method.value}
              selected={draft.preferred_contact === method.value}
              onClick={() => setField("preferred_contact", method.value)}
              title={method.title}
              description={method.description}
            />
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="label-strong">
          Anything we should know? <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={draft.notes || ""}
          onChange={(event) => setField("notes", event.target.value)}
          className="field-area mt-2"
          placeholder="Mobility, hearing, what they enjoy, gate details, anything that helps."
        />
      </div>
    </div>
  );
}

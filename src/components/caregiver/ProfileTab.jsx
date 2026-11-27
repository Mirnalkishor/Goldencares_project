import { useEffect, useState } from "react";
import { doc, writeBatch } from "firebase/firestore";
import { CircleCheck, Loader2, MailWarning, ShieldAlert, UserRound } from "lucide-react";
import { getDb } from "@/api/firebaseClient";
import { CITIES } from "@/lib/site";
import { commaList, toArray } from "./utils";

function initialForm(personnel, profile) {
  return {
    name: personnel?.name || profile?.name || "",
    email: personnel?.email || profile?.email || "",
    phone: personnel?.phone || profile?.phone || "",
    age: personnel?.age ?? profile?.age ?? "",
    gender: personnel?.gender || "",
    street: personnel?.street || "",
    city: personnel?.city || profile?.city || "",
    state: personnel?.state || profile?.state || "",
    pincode: personnel?.pincode || profile?.pincode || "",
    experienceYears: personnel?.experienceYears ?? "",
    specialties: commaList(personnel?.specialties),
    languages: commaList(personnel?.languages),
    keySkills: commaList(personnel?.keySkills),
    bio: personnel?.bio || "",
  };
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProfileTab({ uid, personnel, profile, onSaved }) {
  const [form, setForm] = useState(() => initialForm(personnel, profile));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setForm(initialForm(personnel, profile));
  }, [personnel, profile]);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setError("");
    setNotice("");
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    setSaving(true);
    try {
      const personnelData = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        age: Number(form.age) || 0,
        gender: form.gender,
        specialties: splitList(form.specialties),
        languages: splitList(form.languages),
        keySkills: splitList(form.keySkills),
        street: form.street.trim(),
        city: form.city,
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: "India",
        experienceYears: Number(form.experienceYears) || 0,
        bio: form.bio.trim(),
      };
      const address = [
        form.street.trim(),
        form.city,
        form.state.trim(),
        form.pincode.trim(),
        "India",
      ]
        .filter(Boolean)
        .join(", ");
      const userData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address,
        street: form.street.trim(),
        city: form.city,
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: "India",
      };
      const db = getDb();
      const batch = writeBatch(db);
      batch.set(doc(db, "servicePersonnel", uid), personnelData, { merge: true });
      batch.set(doc(db, "users", uid), userData, { merge: true });
      await batch.commit();
      setEditing(false);
      setNotice("Profile updated.");
      onSaved?.();
    } catch (saveError) {
      setError(saveError?.message || "We could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const approved = Boolean(personnel?.isApproved ?? profile?.isApproved);
  const idVerified = Boolean(personnel?.idVerified);
  const verificationStatus = profile?.verificationStatus || "pending";
  const deletionStatus = personnel?.deletionStatus || "none";

  return (
    <div className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-[1.5rem] border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-heading text-[1.3rem] text-foreground">{form.name || "Your profile"}</h2>
              <p className="text-[0.82rem] text-muted-foreground">Caregiver profile</p>
            </div>
          </div>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-border px-4 py-2 text-[0.84rem] font-semibold text-foreground"
            >
              Edit profile
            </button>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-6 space-y-4">
            <TextField label="Full name" value={form.name} onChange={(value) => setField("name", value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Email" value={form.email} onChange={(value) => setField("email", value)} />
              <TextField label="Phone" value={form.phone} onChange={(value) => setField("phone", value)} />
              <TextField label="Age" value={form.age} onChange={(value) => setField("age", value)} type="number" />
              <label className="block">
                <span className="label-strong">Gender</span>
                <select value={form.gender} onChange={(event) => setField("gender", event.target.value)} className="field mt-2">
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <TextField label="Street address" value={form.street} onChange={(value) => setField("street", value)} />
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="label-strong">City</span>
                <select value={form.city} onChange={(event) => setField("city", event.target.value)} className="field mt-2">
                  <option value="">Choose city</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>
              <TextField label="State" value={form.state} onChange={(value) => setField("state", value)} />
              <TextField label="Pincode" value={form.pincode} onChange={(value) => setField("pincode", value)} />
            </div>
            <TextField
              label="Experience (years)"
              value={form.experienceYears}
              onChange={(value) => setField("experienceYears", value)}
              type="number"
            />
            <TextField label="Specialties" value={form.specialties} onChange={(value) => setField("specialties", value)} hint="Comma separated" />
            <TextField label="Languages" value={form.languages} onChange={(value) => setField("languages", value)} hint="Comma separated" />
            <TextField label="Key skills" value={form.keySkills} onChange={(value) => setField("keySkills", value)} hint="Comma separated" />
            <label className="block">
              <span className="label-strong">Bio</span>
              <textarea value={form.bio} onChange={(event) => setField("bio", event.target.value)} rows={3} className="field mt-2" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.85rem] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save profile
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setForm(initialForm(personnel, profile));
                  setEditing(false);
                  setError("");
                }}
                className="rounded-full border border-border px-5 py-2.5 text-[0.85rem] font-semibold text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <dl className="mt-6 space-y-3 text-[0.88rem]">
            <ProfileRow label="Email" value={form.email} />
            <ProfileRow label="Phone" value={form.phone} />
            <ProfileRow label="City" value={form.city || "—"} />
            <ProfileRow label="Experience" value={form.experienceYears ? `${form.experienceYears} years` : "—"} />
            <ProfileRow label="Specialties" value={form.specialties || "—"} />
            <ProfileRow label="Languages" value={form.languages || "—"} />
            <ProfileRow label="Skills" value={form.keySkills || "—"} />
          </dl>
        )}

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-[0.85rem] text-destructive">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[0.85rem] text-emerald-800">
            {notice}
          </p>
        ) : null}
      </section>

      <div className="space-y-4">
        <section className="rounded-[1.5rem] border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-[1.3rem] text-foreground">Verification</h2>
          </div>
          <div className="mt-4 space-y-3 text-[0.88rem]">
            <StatusRow label="Approval" ok={approved} text={approved ? "Approved for assignments" : "Waiting for approval"} />
            <StatusRow label="Identity" ok={idVerified} text={idVerified ? "Identity verified" : "Identity not verified"} />
            <ProfileRow label="Account status" value={verificationStatus} />
            {deletionStatus !== "none" ? <ProfileRow label="Deletion" value={deletionStatus} /> : null}
          </div>
          {!idVerified ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[0.82rem] leading-relaxed text-amber-900">
              <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
              Email your identity proof to support@goldencares.in to complete KYC.
            </p>
          ) : null}
        </section>

        <section className="rounded-[1.5rem] border border-border bg-secondary/40 p-6">
          <h2 className="font-heading text-[1.2rem] text-foreground">Account access</h2>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-muted-foreground">
            Use this same email and password to sign in on the web. Phone verification and photo uploads are
            managed in the mobile app.
          </p>
          <ul className="mt-3 space-y-2 text-[0.84rem] text-muted-foreground">
            {toArray(personnel?.reviews).length ? (
              <li>{toArray(personnel.reviews).length} reviews received</li>
            ) : null}
            <li>{personnel?.visitsCompleted || 0} visits completed</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, type = "text", hint }) {
  return (
    <label className="block">
      <span className="label-strong">{label}</span>
      <input
        aria-label={label}
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-2"
      />
      {hint ? <span className="mt-1 block text-[0.75rem] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

function StatusRow({ label, ok, text }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`inline-flex items-center gap-1.5 font-medium ${ok ? "text-emerald-700" : "text-amber-700"}`}>
        <CircleCheck className="h-4 w-4" />
        {text}
      </dd>
    </div>
  );
}

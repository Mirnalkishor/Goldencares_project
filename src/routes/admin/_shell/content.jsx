import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AdminButton,
  AdminCard,
  AdminError,
  AdminField,
  AdminLoading,
  AdminPage,
  formatDateTime,
} from "@/components/admin/AdminUI";
import { useAdmin } from "@/lib/AdminAuthContext";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";

export const Route = createFileRoute("/admin/_shell/content")({
  head: () => ({ meta: [{ title: "Content | GoldenCares admin" }] }),
  component: ContentPage,
});

const SIMPLE_FIELDS = {
  hero: [["title", "Hero title"], ["subtitle", "Hero subtitle"], ["ctaLabel", "Hero button"]],
  cta: [["title", "CTA title"], ["subtitle", "CTA subtitle"], ["buttonLabel", "CTA button"]],
  about: [["title", "About title"], ["description", "About description"]],
  services: [["sectionTitle", "Services title"], ["sectionSubtitle", "Services subtitle"]],
  valueProps: [["sectionTitle", "Value props title"], ["sectionSubtitle", "Value props subtitle"]],
  howItWorks: [["sectionTitle", "How it works title"], ["sectionSubtitle", "How it works subtitle"]],
  contact: [["email", "Email"], ["phone", "Phone"], ["address", "Address"], ["cities", "Cities"]],
  announcement: [["message", "Announcement message"], ["linkLabel", "Link label"], ["link", "Link URL"], ["activeUntil", "Active until (ISO)"]],
};

function ContentPage() {
  const { authz } = useAdmin();
  const [draft, setDraft] = useState(null);
  const [json, setJson] = useState("");
  const [versions, setVersions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [section, setSection] = useState("hero");
  const [mode, setMode] = useState("sections");

  async function load() {
    setBusy(true);
    setMessage("");
    try {
      const data = await adminCall("adminGetCmsContent", {});
      setDraft(data?.draft || {});
      setJson(JSON.stringify(data?.draft || {}, null, 2));
      setVersions(data?.versions || []);
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  function readDraft() {
    if (mode === "json") {
      try {
        const parsed = JSON.parse(json);
        setDraft(parsed);
        return parsed;
      } catch {
        throw new Error("The JSON editor contains invalid JSON.");
      }
    }
    return draft;
  }

  async function saveDraft() {
    setBusy(true);
    setMessage("");
    try {
      const content = readDraft();
      await adminCall("adminSaveCmsDraft", { content });
      setMessage("Draft saved. Publish it to make it live.");
      load();
    } catch (err) {
      setMessage(err?.message && !err?.code ? err.message : adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setMessage("");
    try {
      const result = await adminCall("adminPublishContent", {});
      setMessage(`Published version ${result?.version ?? "updated"}.`);
      load();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function rollback(version) {
    if (!window.confirm(`Publish version ${version} in place of the current content?`)) return;
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminRollbackContent", { version });
      setMessage(`Rolled back to version ${version} and published it.`);
      load();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function setField(group, key, value) {
    setDraft((current) => ({ ...current, [group]: { ...(current?.[group] || {}), [key]: value } }));
  }

  return (
    <AdminPage
      title="Content"
      description="Edit the site copy that the Flutter app and website serve. Save a draft first, then publish when it is ready."
      actions={<><AdminButton variant="secondary" onClick={() => setMode(mode === "json" ? "sections" : "json")}>{mode === "json" ? "Section editor" : "JSON editor"}</AdminButton><AdminButton variant="secondary" loading={busy} onClick={load}>Reload</AdminButton><AdminButton variant="secondary" loading={busy} onClick={saveDraft}>Save draft</AdminButton><AdminButton loading={busy} disabled={!authz?.isPrimary} onClick={publish}>Publish</AdminButton></>}
    >
      {message ? <AdminError message={message} /> : null}
      {!draft ? <AdminCard><AdminLoading label="Loading content…" /></AdminCard> : null}
      {draft ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <AdminCard title={mode === "json" ? "Full content JSON" : `Section: ${section}`}>
            {mode === "json" ? (
              <textarea className="field-area font-mono text-[0.78rem]" rows={28} value={json} onChange={(event) => setJson(event.target.value)} />
            ) : (
              <>
                <div className="mb-5 flex flex-wrap gap-2">
                  {Object.keys(SIMPLE_FIELDS).map((key) => (
                    <AdminButton key={key} variant={section === key ? "primary" : "secondary"} onClick={() => setSection(key)}>{key}</AdminButton>
                  ))}
                </div>
                <div className="space-y-4">
                  {SIMPLE_FIELDS[section].map(([key, label]) => (
                    <AdminField key={key} label={label}>
                      {String(draft[section]?.[key] || "").length > 90 ? (
                        <textarea className="field-area mt-1" rows={3} value={draft[section]?.[key] || ""} onChange={(event) => setField(section, key, event.target.value)} />
                      ) : (
                        <input className="field mt-1" value={draft[section]?.[key] || ""} onChange={(event) => setField(section, key, event.target.value)} />
                      )}
                    </AdminField>
                  ))}
                  {section === "announcement" ? (
                    <AdminField label="Announcement enabled">
                      <select className="field mt-1" value={String(draft.announcement?.enabled === true)} onChange={(event) => setField("announcement", "enabled", event.target.value === "true")}>
                        <option value="false">Disabled</option><option value="true">Enabled</option>
                      </select>
                    </AdminField>
                  ) : null}
                </div>
                <div className="mt-6 border-t border-border pt-5">
                  <p className="label-strong">List sections</p>
                  <p className="mt-1 text-[0.82rem] text-muted-foreground">Trust badges, value props, how-it-works steps and FAQs contain structured lists. Use the JSON editor to add, remove or reorder their items and icons.</p>
                </div>
              </>
            )}
          </AdminCard>

          <div className="space-y-5">
            <AdminCard title="Current version">
              <p className="font-heading text-2xl text-foreground">v{draft.currentVersion ?? draft.version ?? 0}</p>
              <p className="mt-1 text-[0.8rem] text-muted-foreground">Published {formatDateTime(draft.lastPublishedAt) || "never"}</p>
              {draft.lastPublishedBy ? <p className="text-[0.8rem] text-muted-foreground">by {draft.lastPublishedBy}</p> : null}
            </AdminCard>
            <AdminCard title="Publish history" description="Only primary admins can publish or roll back.">
              <div className="space-y-2">
                {versions.length ? versions.map((version) => (
                  <div key={version.version} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                    <div>
                      <p className="text-[0.85rem] font-semibold text-foreground">v{version.version}</p>
                      <p className="text-[0.72rem] text-muted-foreground">{formatDateTime(version.publishedAt)} · {version.publishedBy || "unknown"}</p>
                    </div>
                    <AdminButton variant="secondary" disabled={!authz?.isPrimary || busy} onClick={() => rollback(version.version)}>Rollback</AdminButton>
                  </div>
                )) : <p className="text-[0.85rem] text-muted-foreground">No published versions yet.</p>}
              </div>
            </AdminCard>
          </div>
        </div>
      ) : null}
    </AdminPage>
  );
}

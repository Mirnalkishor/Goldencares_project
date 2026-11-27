import { useEffect, useState } from "react";
import { ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONSENT_VERSION = "kyc-masked-aadhaar-v1";

function fileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function formatWhen(value) {
  if (!value) return "—";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export function CaregiverKycGate({ user, personnel, onVerified }) {
  const [fullName, setFullName] = useState(String(personnel?.name || user?.name || user?.full_name || ""));
  const [dob, setDob] = useState(String(personnel?.dob || user?.dob || ""));
  const [gender, setGender] = useState(String(personnel?.gender || user?.gender || ""));
  const [shareCode, setShareCode] = useState("");
  const [pdf, setPdf] = useState(null);
  const [xml, setXml] = useState(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let active = true;
    base44.functions.invoke("getCaregiverKyc", {})
      .then((data) => {
        if (!active) return;
        setResult(data || null);
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!pdf || !xml) {
      setError("Upload both the masked Aadhaar PDF and the Offline e-KYC XML.");
      return;
    }
    if (!consent) {
      setError("Accept the consent before uploading identity documents.");
      return;
    }
    setBusy(true);
    try {
      const [maskedAadhaarBase64, ekycXmlBase64] = await Promise.all([fileAsBase64(pdf), fileAsBase64(xml)]);
      const response = await base44.functions.invoke("submitCaregiverKyc", {
        fullName,
        dob,
        gender,
        shareCode,
        maskedAadhaarBase64,
        ekycXmlBase64,
        consent: true,
        consentVersion: CONSENT_VERSION,
      });
      setResult(response);
      toast.success(response.autoApproved ? "KYC verified" : "Documents submitted for review", {
        description: response.autoApproved
          ? "Your caregiver panel is unlocked."
          : `Review reason: ${response.reviewReason || "admin review required"}`,
      });
      if (response.autoApproved) {
        await onVerified?.();
      } else {
        const data = await base44.functions.invoke("getCaregiverKyc", {});
        setResult(data);
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
      }
    } catch (err) {
      setError(err.message || "Could not verify these documents.");
    } finally {
      setBusy(false);
    }
  }

  const status = result?.status || personnel?.kyc?.status || user?.kyc?.status || "not_started";

  return (
    <div className="mt-8 rounded-[1.75rem] border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow text-primary/70">Caregiver verification</p>
          <h2 className="mt-2 font-heading text-[1.55rem] text-foreground">Complete your KYC to start picking orders</h2>
          <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-muted-foreground">
            Upload your <strong>masked Aadhaar PDF</strong> for our records and the <strong>Paperless Offline e-KYC XML</strong>
            for automatic verification. We validate UIDAI&apos;s digital signature and the email/mobile hashes before unlocking your panel.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          Status: {status.replaceAll("_", " ")}
        </span>
      </div>

      {result?.reviewReason ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Verification needs review: {result.reviewReason}
        </p>
      ) : null}
      {error ? <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

      {result?.extracted ? (
        <div className="mt-5 grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-4">
          <p><span className="text-muted-foreground">Name</span><br /><strong>{result.extracted.name || "—"}</strong></p>
          <p><span className="text-muted-foreground">DOB</span><br /><strong>{result.extracted.dob || "—"}</strong></p>
          <p><span className="text-muted-foreground">Gender</span><br /><strong>{result.extracted.gender || "—"}</strong></p>
          <p><span className="text-muted-foreground">Aadhaar last 4</span><br /><strong>{result.extracted.aadhaarLast4 || "—"}</strong></p>
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-name">Full name as on Aadhaar</Label>
          <Input id="kyc-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kyc-dob">Date of birth</Label>
          <Input id="kyc-dob" type="date" value={dob} onChange={(event) => setDob(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kyc-gender">Gender</Label>
          <select id="kyc-gender" className="field" value={gender} onChange={(event) => setGender(event.target.value)} required>
            <option value="">Select</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="T">Transgender</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="kyc-share">Share code used for the XML</Label>
          <Input id="kyc-share" type="password" value={shareCode} onChange={(event) => setShareCode(event.target.value)} placeholder="Share code" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kyc-pdf">Masked Aadhaar PDF</Label>
          <Input id="kyc-pdf" type="file" accept="application/pdf,.pdf" onChange={(event) => setPdf(event.target.files?.[0] || null)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kyc-xml">Offline e-KYC XML</Label>
          <Input id="kyc-xml" type="file" accept=".xml,text/xml,application/xml" onChange={(event) => setXml(event.target.files?.[0] || null)} required />
        </div>
        <label className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-[0.85rem] leading-relaxed text-muted-foreground">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" required />
          <span>
            I consent to GoldenCares verifying this UIDAI Offline e-KYC data and securely storing my masked Aadhaar PDF,
            tagged to my account, for compliance and audit. The original XML and share code are used in memory only and are
            not retained. I can request deletion by contacting support@goldencares.in.
          </span>
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.86rem] font-semibold text-primary-foreground disabled:opacity-60">
            <FileCheck2 className="h-4 w-4" />
            {busy ? "Verifying…" : status === "verified" ? "Re-verify documents" : "Submit for verification"}
          </button>
          <a
            href="https://www.youtube.com/watch?v=GJWNvEnqpAA"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[0.84rem] font-semibold text-primary hover:underline"
          >
            UIDAI: how to download masked Aadhaar <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </form>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="label-strong">How to get the XML</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.84rem] leading-relaxed text-muted-foreground">
            <li>Visit UIDAI&apos;s Paperless Offline e-KYC page and download the ZIP.</li>
            <li>Choose a share code you will remember; you will enter it above.</li>
            <li>Extract the ZIP and upload the <code>.xml</code> file it contains.</li>
            <li>Download your masked Aadhaar PDF from myAadhaar and upload it too.</li>
          </ol>
          <iframe
            className="mt-3 aspect-video w-full rounded-xl border border-border"
            src="https://www.youtube-nocookie.com/embed/GJWNvEnqpAA"
            title="How to download masked Aadhaar"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div>
          <p className="label-strong">Verification log</p>
          {logs.length ? (
            <ul className="mt-2 space-y-2">
              {logs.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-border bg-background p-3 text-[0.8rem]">
                  <p className="font-semibold text-foreground">{String(entry.event || "").replaceAll("_", " ")}</p>
                  <p className="text-muted-foreground">{formatWhen(entry.at)}</p>
                  {entry.detail?.failures?.length ? <p className="mt-1 text-destructive">{entry.detail.failures.join(", ")}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[0.84rem] text-muted-foreground">No verification activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

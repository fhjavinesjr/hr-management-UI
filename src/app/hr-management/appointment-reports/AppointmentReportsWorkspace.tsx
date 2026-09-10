"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { localStorageUtil, type FeaturePermission } from "@/lib/utils/localStorageUtil";
import { onboardingJson, OnboardingApiError, openHrmPdf, type AppointmentDocument,
  type AppointmentDocumentKind } from "@/lib/services/onboarding";
import styles from "@/styles/Onboarding.module.scss";

type Permissions = { appointment: FeaturePermission; onboarding: FeaturePermission; documents: FeaturePermission };
const denied: FeaturePermission = { canAccess: false, canAdd: false, canEdit: false, canPublish: false,
  canSubmit: false, canApprove: false, canFinalize: false, dataScope: "NONE" };
const initial: Permissions = { appointment: denied, onboarding: denied, documents: denied };
const agencyWide = (permission: FeaturePermission) => permission.canAccess && permission.dataScope === "AGENCY_WIDE";
const errorMessage = (error: unknown) => error instanceof OnboardingApiError && error.status === 409
  ? `The authoritative source or document version changed. Reload the source values before retrying. ${error.message}`
  : error instanceof Error ? error.message : "Unable to complete the report request.";
const numberOrNull = (value: string): number | null => value.trim() ? Number(value) : null;

export default function AppointmentReportsWorkspace() {
  const today = new Date().toISOString().slice(0, 10);
  const [permissions, setPermissions] = useState(initial); const [ready, setReady] = useState(false);
  const [reportIds, setReportIds] = useState({ appointmentId: "", intakeId: "" });
  const [document, setDocument] = useState<AppointmentDocument | null>(null); const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ appointmentId: "", documentId: "", recordVersion: "0",
    kind: "OATH_OF_OFFICE" as AppointmentDocumentKind, issueDate: today, oathDate: "", assumptionDate: "", venue: "",
    administeringEmployeeId: "", certifyingEmployeeId: "", attestingEmployeeId: "", supersedesDocumentId: "" });
  useEffect(() => { const timer = window.setTimeout(() => { setPermissions({
    appointment: localStorageUtil.getFeaturePermission("hrm.appointment-report"),
    onboarding: localStorageUtil.getFeaturePermission("hrm.onboarding-report"),
    documents: localStorageUtil.getFeaturePermission("hrm.appointment-documents"),
  }); setReady(true); }, 0); return () => clearTimeout(timer); }, []);
  const anyAccess = Object.values(permissions).some(agencyWide);
  async function openPdf(path: string, fallback: string) { setBusy(true); setNotice(""); try { await openHrmPdf(path, fallback); }
    catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); } }
  function payload() { return { issueDate: form.issueDate, oathDate: form.kind === "OATH_OF_OFFICE" ? form.oathDate || null : null,
    assumptionDate: form.kind === "ASSUMPTION_TO_DUTY" ? form.assumptionDate || null : null, venue: form.venue,
    administeringEmployeeId: numberOrNull(form.administeringEmployeeId), certifyingEmployeeId: numberOrNull(form.certifyingEmployeeId),
    attestingEmployeeId: numberOrNull(form.attestingEmployeeId) }; }
  function capture(value: AppointmentDocument) { setDocument(value); setForm(current => ({ ...current,
    appointmentId: String(value.appointmentId), documentId: value.id, recordVersion: String(value.recordVersion), kind: value.kind,
    issueDate: value.issueDate, oathDate: value.oathDate ?? "", assumptionDate: value.assumptionDate ?? "", venue: value.venue,
    administeringEmployeeId: value.administeringEmployeeId?.toString() ?? "", certifyingEmployeeId: value.certifyingEmployeeId?.toString() ?? "",
    attestingEmployeeId: value.attestingEmployeeId?.toString() ?? "", supersedesDocumentId: value.supersedesDocumentId ?? "" })); }
  async function mutate(mode: "create" | "update" | "finalize") { setBusy(true); setNotice(""); try {
    const appointmentId = Number(form.appointmentId); let value: AppointmentDocument;
    if (mode === "create") value = await onboardingJson(`/api/hrm/v1/appointments/${appointmentId}/documents`, { method: "POST",
      body: JSON.stringify({ kind: form.kind, ...payload(), supersedesDocumentId: form.supersedesDocumentId || null,
        reason: form.supersedesDocumentId ? "Authorized correction successor" : null }) });
    else if (mode === "update") value = await onboardingJson(`/api/hrm/v1/appointments/${appointmentId}/documents/${encodeURIComponent(form.documentId)}`, { method: "PUT",
      body: JSON.stringify({ ...payload(), recordVersion: Number(form.recordVersion) }) });
    else { const answer = await Swal.fire({ title: "Finalize immutable legal document", input: "textarea", inputLabel: "Required finalization reason",
      showCancelButton: true, inputValidator: value => value.trim() ? undefined : "A reason is required." });
      if (!answer.isConfirmed) return; value = await onboardingJson(`/api/hrm/v1/appointments/${appointmentId}/documents/${encodeURIComponent(form.documentId)}/finalize`, { method: "POST",
        body: JSON.stringify({ recordVersion: Number(form.recordVersion), reason: answer.value }) }); }
    capture(value); setNotice(mode === "finalize" ? "The immutable document snapshot was finalized." : `Document ${mode}d successfully.`);
  } catch (error) { await Swal.fire("Appointment document action failed", errorMessage(error), "error"); } finally { setBusy(false); } }
  if (!ready) return <div className={styles.notice}>Checking Administrative permissions…</div>;
  if (!anyAccess) return <section className={styles.card}><h1>Access denied</h1><p>Your Administrative ruleset does not grant agency-wide appointment reporting access.</p></section>;
  return <div className={styles.page} data-testid="phase5f-appointment-reports">
    <section className={styles.card}><h1>Appointment and onboarding reports</h1><p>Reports are generated from authoritative HR records. Official Oath and Assumption forms render only from finalized immutable document metadata and approved packaged templates.</p>{notice && <div className={styles.notice} role="alert">{notice}</div>}</section>
    {(agencyWide(permissions.appointment) || agencyWide(permissions.onboarding)) && <section className={styles.card}><h2>Existing HR records</h2><div className={styles.grid}>
      {agencyWide(permissions.appointment) && <div className={styles.field}><label htmlFor="reportAppointmentId">Employee appointment ID</label><input id="reportAppointmentId" value={reportIds.appointmentId} onChange={e => setReportIds({ ...reportIds, appointmentId: e.target.value })} /><div className={styles.actions}><button disabled={busy || !reportIds.appointmentId} onClick={() => void openPdf(`/api/employeeAppointment/report/${encodeURIComponent(reportIds.appointmentId)}`, "PersonnelAction.pdf")}>Open Personnel Action</button></div></div>}
      {agencyWide(permissions.onboarding) && <div className={styles.field}><label htmlFor="reportIntakeId">Completed onboarding intake ID</label><input id="reportIntakeId" value={reportIds.intakeId} onChange={e => setReportIds({ ...reportIds, intakeId: e.target.value.trim() })} /><div className={styles.actions}><button disabled={busy || !reportIds.intakeId} onClick={() => void openPdf(`/api/hrm/v1/appointment-intakes/${encodeURIComponent(reportIds.intakeId)}/onboarding-completion.pdf`, "OnboardingCompletion.pdf")}>Open completion record</button></div></div>}
    </div></section>}
    {agencyWide(permissions.documents) && <section className={styles.card}><h2>Oath of Office / Assumption to Duty</h2><p>Employee signatory IDs resolve authoritative names and active positions on the server. A finalized record cannot be edited; corrections must create a linked successor.</p><div className={styles.grid}>
      <div className={styles.field}><label htmlFor="documentAppointmentId">Appointment ID</label><input id="documentAppointmentId" value={form.appointmentId} onChange={e => setForm({ ...form, appointmentId: e.target.value })} /></div>
      <div className={styles.field}><label htmlFor="kind">Document kind</label><select id="kind" disabled={document?.status === "FINALIZED"} value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as AppointmentDocumentKind })}><option value="OATH_OF_OFFICE">Oath of Office</option><option value="ASSUMPTION_TO_DUTY">Certificate of Assumption to Duty</option></select></div>
      <div className={styles.field}><label htmlFor="issueDate">Issue date</label><input id="issueDate" type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} /></div>
      {form.kind === "OATH_OF_OFFICE" ? <div className={styles.field}><label htmlFor="oathDate">Oath date</label><input id="oathDate" type="date" value={form.oathDate} onChange={e => setForm({ ...form, oathDate: e.target.value })} /></div> : <div className={styles.field}><label htmlFor="assumptionDate">Assumption date</label><input id="assumptionDate" type="date" value={form.assumptionDate} onChange={e => setForm({ ...form, assumptionDate: e.target.value })} /></div>}
      <div className={styles.field}><label htmlFor="venue">Venue</label><input id="venue" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></div>
      <div className={styles.field}><label htmlFor="administering">Administering employee ID</label><input id="administering" value={form.administeringEmployeeId} onChange={e => setForm({ ...form, administeringEmployeeId: e.target.value })} /></div>
      <div className={styles.field}><label htmlFor="certifying">Certifying employee ID</label><input id="certifying" value={form.certifyingEmployeeId} onChange={e => setForm({ ...form, certifyingEmployeeId: e.target.value })} /></div>
      <div className={styles.field}><label htmlFor="attesting">Attesting employee ID</label><input id="attesting" value={form.attestingEmployeeId} onChange={e => setForm({ ...form, attestingEmployeeId: e.target.value })} /></div>
      <div className={styles.field}><label htmlFor="documentId">Document ID</label><input id="documentId" value={form.documentId} onChange={e => setForm({ ...form, documentId: e.target.value.trim() })} /></div>
      <div className={styles.field}><label htmlFor="recordVersion">Record version</label><input id="recordVersion" type="number" min="0" value={form.recordVersion} onChange={e => setForm({ ...form, recordVersion: e.target.value })} /></div>
      <div className={styles.field}><label htmlFor="supersedes">Superseded document ID (corrections only)</label><input id="supersedes" value={form.supersedesDocumentId} onChange={e => setForm({ ...form, supersedesDocumentId: e.target.value.trim() })} /></div>
    </div><div className={styles.actions}>
      {permissions.documents.canAdd && <button disabled={busy || !form.appointmentId || !form.issueDate || !form.venue} onClick={() => void mutate("create")}>Create draft</button>}
      {permissions.documents.canEdit && <button disabled={busy || !form.appointmentId || !form.documentId || document?.status === "FINALIZED"} onClick={() => void mutate("update")}>Update draft</button>}
      {permissions.documents.canFinalize && <button disabled={busy || !form.appointmentId || !form.documentId || document?.status === "FINALIZED"} onClick={() => void mutate("finalize")}>Finalize immutable snapshot</button>}
      <button disabled={busy || !form.appointmentId || !form.documentId || (document !== null && document.status !== "FINALIZED")} onClick={() => void openPdf(`/api/hrm/v1/appointments/${encodeURIComponent(form.appointmentId)}/documents/${encodeURIComponent(form.documentId)}.pdf`, "AppointmentDocument.pdf")}>Open finalized form</button>
    </div>{document && <div className={styles.success}>Document {document.id} · {document.kind} · {document.status} · version {document.recordVersion}{document.finalizedAt && <> · finalized {new Date(document.finalizedAt).toLocaleString()}</>}</div>}</section>}
  </div>;
}

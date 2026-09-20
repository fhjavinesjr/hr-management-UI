"use client";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { localStorageUtil, type FeaturePermission } from "@/lib/utils/localStorageUtil";
import { onboardingJson, type OnboardingTemplate } from "@/lib/services/onboarding";
import styles from "@/styles/Onboarding.module.scss";

const denied: FeaturePermission = { canAccess: false, canAdd: false, canEdit: false, canDelete: false, canPublish: false, canSubmit: false, canApprove: false, canFinalize: false, dataScope: "NONE" };
export default function OnboardingConfiguration() {
  const [permission, setPermission] = useState(denied); const [ready, setReady] = useState(false); const [draft, setDraft] = useState<OnboardingTemplate | null>(null);
  const [form, setForm] = useState({ code: "DEFAULT", effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: "",
    items: '[{"code":"IDENTITY","label":"Verify identity and originals","instructions":"Review authoritative originals","required":true,"evidenceRequired":true,"evidenceClassification":"CONFIDENTIAL","retentionTag":"EMPLOYMENT","responsibleRole":"HR","displayOrder":1,"completionRule":"INDEPENDENT_VERIFICATION"}]' });
  useEffect(() => { const timer = window.setTimeout(() => { setPermission(localStorageUtil.getFeaturePermission("hrm.onboarding-configuration")); setReady(true); }, 0); return () => clearTimeout(timer); }, []);
  async function create() { try { const items = JSON.parse(form.items) as unknown[]; setDraft(await onboardingJson<OnboardingTemplate>("/api/hrm/v1/onboarding-templates", { method: "POST", body: JSON.stringify({ code: form.code, effectiveFrom: form.effectiveFrom || null, effectiveTo: form.effectiveTo || null, items }) })); }
    catch (error) { await Swal.fire("Template creation failed", error instanceof Error ? error.message : "Invalid template definition.", "error"); } }
  async function publish() { if (!draft) return; try { setDraft(await onboardingJson<OnboardingTemplate>(`/api/hrm/v1/onboarding-templates/${draft.id}/publish`, { method: "POST" })); }
    catch (error) { await Swal.fire("Template publication failed", error instanceof Error ? error.message : "Unable to publish.", "error"); } }
  if (!ready) return <div className={styles.notice}>Checking Administrative permissions…</div>;
  if (!permission.canAccess) return <section className={styles.card}><h1>Access denied</h1><p>Your ruleset does not grant onboarding configuration access.</p></section>;
  return <div className={styles.page}><section className={styles.card}><h1>Versioned onboarding configuration</h1><p>Published templates are immutable snapshots. Changes require a new effective version and do not rewrite active cases.</p>{draft && <div className={draft.status === "PUBLISHED" ? styles.success : styles.notice}>{draft.code} v{draft.definitionVersion} · {draft.status}</div>}</section>
    <section className={styles.card}><div className={styles.grid}><div className={styles.field}><label htmlFor="templateCode">Template code</label><input id="templateCode" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div><div className={styles.field}><label htmlFor="effectiveFrom">Effective from</label><input id="effectiveFrom" type="date" value={form.effectiveFrom} onChange={e => setForm({ ...form, effectiveFrom: e.target.value })} /></div><div className={styles.field}><label htmlFor="effectiveTo">Effective to (optional)</label><input id="effectiveTo" type="date" value={form.effectiveTo} onChange={e => setForm({ ...form, effectiveTo: e.target.value })} /></div><div className={styles.field}><label htmlFor="templateItems">Checklist item JSON</label><textarea id="templateItems" value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} /></div></div><div className={styles.actions}>{permission.canAdd && <button onClick={() => void create()}>Create draft version</button>}{permission.canPublish && draft?.status === "DRAFT" && <button onClick={() => void publish()}>Publish effective version</button>}</div></section></div>;
}

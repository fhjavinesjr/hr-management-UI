"use client";

import { useEffect, useState } from "react";
import AppointmentReportsWorkspace from "../appointment-reports/AppointmentReportsWorkspace";
import ApprovedLeaveSummaryWorkspace from "./ApprovedLeaveSummaryWorkspace";
import HrmReportsShell, { type HrmReportId, type HrmReportOption } from "@/components/reports/HrmReportsShell";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import styles from "@/styles/HrmReports.module.scss";

const reportOptions: Array<HrmReportOption & { permissions: string[] }> = [
  { id: "personnel-action", label: "Personnel Action", permissions: ["hrm.appointment-report"] },
  { id: "onboarding-completion", label: "Onboarding Completion", permissions: ["hrm.onboarding-report"] },
  { id: "appointment-document", label: "Oath / Assumption", permissions: ["hrm.appointment-documents"] },
  { id: "leave", label: "Approved Leave Summary", permissions: ["hrm.reports.leaveSummary"] },
];

export default function HrmReportsWorkspace() {
  const [ready, setReady] = useState(false);
  const [allowedReports, setAllowedReports] = useState<HrmReportOption[]>([]);
  const [selected, setSelected] = useState<HrmReportId>("personnel-action");

  useEffect(() => {
    const available = reportOptions.filter((report) => report.permissions.some((key) => {
      const permission = localStorageUtil.getFeaturePermission(key);
      return permission.canAccess && permission.dataScope === "AGENCY_WIDE";
    }));
    const requested = new URLSearchParams(window.location.search).get("report");
    setAllowedReports(available);
    setSelected(available.find((report) => report.id === requested)?.id ?? available[0]?.id ?? "personnel-action");
    setReady(true);
  }, []);

  function selectReport(report: HrmReportId) {
    setSelected(report);
    const url = new URL(window.location.href);
    url.searchParams.set("report", report);
    window.history.replaceState(window.history.state, "", url);
  }

  if (!ready) return <div className={styles.page}><section className={styles.panel}>Checking report permissions…</section></div>;
  if (allowedReports.length === 0) return <div className={styles.page}><section className={styles.panel}><h1>HRM Reports</h1><p>You do not have access to HRM reports.</p></section></div>;

  return <HrmReportsShell reports={allowedReports} selected={selected} onSelect={selectReport}>
    {selected === "leave" ? <ApprovedLeaveSummaryWorkspace /> : <AppointmentReportsWorkspace key={selected} report={selected} />}
  </HrmReportsShell>;
}

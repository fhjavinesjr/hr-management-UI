"use client";

import type { ReactNode } from "react";
import styles from "@/styles/HrmReports.module.scss";

export type HrmReportId = "personnel-action" | "onboarding-completion" | "appointment-document" | "leave";
export type HrmReportOption = { id: HrmReportId; label: string };

export default function HrmReportsShell({ children, reports, selected, onSelect }: {
  children: ReactNode;
  reports: HrmReportOption[];
  selected: HrmReportId;
  onSelect: (report: HrmReportId) => void;
}) {
  return <div className={styles.page}>
    <div className={styles.layout}>
      <nav className={styles.reportList} aria-label="HRM reports">
        <h2>Reports</h2>
        {reports.map((report) => <button key={report.id} type="button"
          className={report.id === selected ? styles.selectedReport : styles.reportChoice}
          aria-current={report.id === selected ? "page" : undefined}
          onClick={() => onSelect(report.id)}>{report.label}</button>)}
      </nav>
      <main className={styles.panel}>{children}</main>
    </div>
  </div>;
}

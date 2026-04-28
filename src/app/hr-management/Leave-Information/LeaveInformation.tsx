"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";

const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;
const API_BASE_URL_ADMINISTRATIVE = process.env.NEXT_PUBLIC_API_BASE_URL_ADMINISTRATIVE ?? "";

interface SalaryPeriodSettingDTO {
  salaryPeriodSettingId: number;
  salaryType: string;
  nthOrder: number;
  periodContext: string;
  cutoffStartDay: number;
  cutoffStartMonthOffset: number;
  cutoffEndDay: number;
  cutoffEndMonthOffset: number;
  isActive: boolean;
}

interface LeaveInfoDTO {
  leaveInformationId: number;
  employeeId: number;
  employeeName?: string;
  employeeNo?: string;
  salaryPeriodSettingId: number;
  cutoffStartDate: string;
  cutoffEndDate: string;
  processDate?: string;
  earnedSl: number;
  earnedVl: number;
  sickLeaveUsed: number;
  vacationLeaveUsed: number;
  leaveWithoutPaySl: number;
  leaveWithoutPayVl: number;
  previousSickLeaveBalance: number;
  previousVacationLeaveBalance: number;
  sickLeaveBalance: number;
  vacationLeaveBalance: number;
  lateUndertimeMinutes: number;
  lateUndertimeEquivalent: number;
  lateCount: number;
  undertimeCount: number;
  absentCount: number;
  leaveParticulars?: string;
  isBegBalance: boolean;
  isLocked: boolean;
}

interface ProcessResultDTO {
  totalProcessed: number;
  totalSkipped: number;
  skippedReasons: string[];
  processed: LeaveInfoDTO[];
}

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

function clampDay(day: number, year: number, month: number): number {
  const maxDay = new Date(year, month + 1, 0).getDate();
  return Math.min(day, maxDay);
}

function resolveISODate(day: number, monthOffset: number, year: number, month: number): string {
  const targetMonth = month + monthOffset;
  const targetDate = new Date(year, targetMonth, 1);
  const clamped = clampDay(day, targetDate.getFullYear(), targetDate.getMonth());
  const resolved = new Date(targetDate.getFullYear(), targetDate.getMonth(), clamped);
  const mm = String(resolved.getMonth() + 1).padStart(2, "0");
  const dd = String(resolved.getDate()).padStart(2, "0");
  return `${resolved.getFullYear()}-${mm}-${dd}`;
}

export default function LeaveInformationModule() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryPeriodSettings, setSalaryPeriodSettings] = useState<SalaryPeriodSettingDTO[]>([]);
  const [selectedSettingId, setSelectedSettingId] = useState<number | "">("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [scope, setScope] = useState<"ALL" | "EMPLOYEE">("ALL");
  const [empSearch, setEmpSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<LeaveInfoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ledgerEmployee, setLedgerEmployee] = useState<{ emp: Employee | null; name: string; id: number } | null>(null);
  const [ledgerRecords, setLedgerRecords] = useState<LeaveInfoDTO[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Load employees and salary period settings
  useEffect(() => {
    const stored = localStorageUtil.getEmployees();
    if (stored && stored.length > 0) setEmployees(stored);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetchWithAuth(
          `${API_BASE_URL_ADMINISTRATIVE}/api/salary-period-setting/get-by-context?context=LEAVE`
        );
        if (!res.ok) return;
        const data: SalaryPeriodSettingDTO[] = await res.json();
        setSalaryPeriodSettings(data);
        if (data.length > 0) setSelectedSettingId(data[0].salaryPeriodSettingId);
      } catch {
        // no-op: admin API may be down
      }
    };
    fetch();
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (!empSearch.trim()) return [];
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(empSearch.toLowerCase()) ||
        e.employeeNo.toLowerCase().includes(empSearch.toLowerCase())
    );
  }, [empSearch, employees]);

  // Resolve dates from selected setting + month + year
  const resolvedDates = useMemo<{ start: string; end: string } | null>(() => {
    if (selectedSettingId === "") return null;
    const setting = salaryPeriodSettings.find((s) => s.salaryPeriodSettingId === selectedSettingId);
    if (!setting) return null;
    const start = resolveISODate(setting.cutoffStartDay, setting.cutoffStartMonthOffset, selectedYear, selectedMonth);
    const end = resolveISODate(setting.cutoffEndDay, setting.cutoffEndMonthOffset, selectedYear, selectedMonth);
    return { start, end };
  }, [selectedSettingId, selectedYear, selectedMonth, salaryPeriodSettings]);

  const fetchPeriodRecords = useCallback(async () => {
    if (!resolvedDates) return;
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/leave-information/get-by-period?start=${resolvedDates.start}&end=${resolvedDates.end}`
      );
      if (!res.ok) throw new Error("Failed to fetch leave information");
      const data: LeaveInfoDTO[] = await res.json();
      setRecords(data);
    } catch {
      Toast.fire({ icon: "error", title: "Could not load leave information" });
    } finally {
      setIsLoading(false);
    }
  }, [resolvedDates]);

  const handleProcess = async () => {
    if (!resolvedDates) {
      Swal.fire({ icon: "warning", title: "Select a salary period setting, month, and year first" });
      return;
    }
    if (scope === "EMPLOYEE" && !selectedEmployee) {
      Swal.fire({ icon: "warning", title: "Select an employee for employee-scope processing" });
      return;
    }
    const confirm = await Swal.fire({
      title: "Process Leave Information",
      html: `<b>Period:</b> ${resolvedDates.start} → ${resolvedDates.end}<br/><b>Scope:</b> ${scope === "ALL" ? "All Employees" : selectedEmployee!.fullName}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Process",
      confirmButtonColor: "#2563eb",
    });
    if (!confirm.isConfirmed) return;

    setIsProcessing(true);
    try {
      const payload = {
        salaryPeriodSettingId: selectedSettingId,
        cutoffStartDate: resolvedDates.start,
        cutoffEndDate: resolvedDates.end,
        scope,
        employeeId: scope === "EMPLOYEE" ? Number(selectedEmployee!.employeeId) : null,
        processedById: localStorageUtil.getEmployeeId(),
      };
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-information/process`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const result: ProcessResultDTO = await res.json();

      let html = `<b>Processed:</b> ${result.totalProcessed}<br/><b>Skipped:</b> ${result.totalSkipped}`;
      if (result.skippedReasons && result.skippedReasons.length > 0) {
        html += `<br/><br/><b>Skip reasons:</b><br/><ul style="text-align:left;max-height:200px;overflow-y:auto">${result.skippedReasons
          .slice(0, 50)
          .map((r) => `<li style="font-size:0.8rem">${r}</li>`)
          .join("")}</ul>`;
      }
      await Swal.fire({ title: "Processing Complete", html, icon: "success", width: 600 });
      fetchPeriodRecords();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Processing failed", text: String(err) });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLock = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Lock this record?",
      text: "Locked records cannot be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Lock",
      confirmButtonColor: "#ca8a04",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-information/lock/${id}`, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "Record locked" });
      fetchPeriodRecords();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lock failed", text: String(err) });
    }
  };

  const handleUnlock = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Unlock this record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Unlock",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-information/unlock/${id}`, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "Record unlocked" });
      fetchPeriodRecords();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Unlock failed", text: String(err) });
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Delete this record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-information/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "Record deleted" });
      fetchPeriodRecords();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: String(err) });
    }
  };

  const openLedger = async (row: LeaveInfoDTO) => {
    setLedgerLoading(true);
    setLedgerEmployee({ emp: null, name: row.employeeName ?? `Employee #${row.employeeId}`, id: row.employeeId });
    setLedgerRecords([]);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-information/get-all/${row.employeeId}`);
      if (!res.ok) throw new Error();
      const data: LeaveInfoDTO[] = await res.json();
      setLedgerRecords(data);
    } catch {
      Toast.fire({ icon: "error", title: "Could not load employee ledger" });
    } finally {
      setLedgerLoading(false);
    }
  };

  const closeLedger = () => {
    setLedgerEmployee(null);
    setLedgerRecords([]);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className={modalStyles.Modal}>
      <div className={modalStyles.modalContent} style={{ maxWidth: "100%" }}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.mainTitle}>Leave Information</h2>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={styles.EmploymentRecord}>
            {/* Controls */}
            <div className={styles.stickyHeader}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
                {/* Period Setting */}
                <div className={styles.formGroup}>
                  <label>Salary Period Setting</label>
                  <select
                    value={selectedSettingId}
                    onChange={(e) => setSelectedSettingId(Number(e.target.value))}
                    className={styles.inputField}
                    style={{ minWidth: 180 }}
                  >
                    <option value="">— Select —</option>
                    {salaryPeriodSettings.map((s) => (
                      <option key={s.salaryPeriodSettingId} value={s.salaryPeriodSettingId}>
                        {s.salaryType} ({s.nthOrder})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div className={styles.formGroup}>
                  <label>Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className={styles.inputField}
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div className={styles.formGroup}>
                  <label>Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className={styles.inputField}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Resolved dates preview */}
                {resolvedDates && (
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", paddingBottom: "0.3rem" }}>
                    Period: <strong>{resolvedDates.start}</strong> → <strong>{resolvedDates.end}</strong>
                  </div>
                )}
              </div>

              {/* Scope */}
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginTop: "0.75rem", flexWrap: "wrap" }}>
                <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>Scope:</label>
                <label style={{ display: "flex", gap: "0.3rem", alignItems: "center", cursor: "pointer" }}>
                  <input type="radio" checked={scope === "ALL"} onChange={() => { setScope("ALL"); setSelectedEmployee(null); setEmpSearch(""); }} />
                  All Employees
                </label>
                <label style={{ display: "flex", gap: "0.3rem", alignItems: "center", cursor: "pointer" }}>
                  <input type="radio" checked={scope === "EMPLOYEE"} onChange={() => setScope("EMPLOYEE")} />
                  Specific Employee
                </label>

                {scope === "EMPLOYEE" && (
                  <div style={{ position: "relative", minWidth: 260 }}>
                    <input
                      type="text"
                      placeholder="Employee No / Full Name"
                      value={empSearch}
                      onChange={(e) => { setEmpSearch(e.target.value); setShowSuggestions(true); setSelectedEmployee(null); }}
                      onFocus={() => setShowSuggestions(true)}
                      className={styles.searchInput}
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <ul className={styles.suggestionList}>
                        {filteredSuggestions.map((emp) => (
                          <li
                            key={emp.employeeId}
                            className={styles.suggestionItem}
                            onMouseDown={() => {
                              setEmpSearch(emp.fullName);
                              setSelectedEmployee(emp);
                              setShowSuggestions(false);
                            }}
                          >
                            {emp.employeeNo} — {emp.fullName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <button
                  onClick={fetchPeriodRecords}
                  disabled={!resolvedDates || isLoading}
                  className={styles.clearButton}
                  style={{ background: "#2563eb", color: "#fff", border: "none" }}
                >
                  {isLoading ? "Loading..." : "View Period"}
                </button>

                <button
                  onClick={handleProcess}
                  disabled={!resolvedDates || isProcessing}
                  className={styles.submitButton}
                  style={{ margin: 0 }}
                >
                  {isProcessing ? "Processing..." : "Process Leave"}
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className={styles.tabContent}>
              {isLoading && <p>Loading...</p>}
              {!isLoading && records.length === 0 && (
                <p style={{ color: "#6b7280", marginTop: "1rem" }}>
                  Select a period and click &quot;View Period&quot; to load records.
                </p>
              )}
              {!isLoading && records.length > 0 && (
                <>
                  <h3 style={{ marginBottom: "0.5rem" }}>
                    Leave Information — {records.length} record{records.length !== 1 ? "s" : ""}
                    {resolvedDates && ` (${resolvedDates.start} → ${resolvedDates.end})`}
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                      <thead>
                        <tr style={{ background: "#e2e8f0", position: "sticky", top: 0, zIndex: 1 }}>
                          <th style={th}>Employee</th>
                          <th style={th}>Prev SL</th>
                          <th style={th}>Prev VL</th>
                          <th style={th}>+SL</th>
                          <th style={th}>+VL</th>
                          <th style={th}>SL Used</th>
                          <th style={th}>VL Used</th>
                          <th style={th}>LWOP-SL</th>
                          <th style={th}>LWOP-VL</th>
                          <th style={th}>Late/UT (min)</th>
                          <th style={th}>Day Equiv</th>
                          <th style={th}>Absent</th>
                          <th style={th}>New SL</th>
                          <th style={th}>New VL</th>
                          <th style={th}>Locked</th>
                          <th style={th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((r) => (
                          <tr key={r.leaveInformationId} style={{ borderBottom: "1px solid #e2e8f0", background: r.isLocked ? "#fef9c3" : undefined }}>
                            <td style={td}>
                              <button
                                onClick={() => openLedger(r)}
                                style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", textDecoration: "underline", fontWeight: 600, padding: 0 }}
                              >
                                {r.employeeName ?? `#${r.employeeId}`}
                              </button>
                              {r.employeeNo && <div style={{ color: "#6b7280", fontSize: "0.72rem" }}>{r.employeeNo}</div>}
                            </td>
                            <td style={tdNum}>{r.previousSickLeaveBalance?.toFixed(3)}</td>
                            <td style={tdNum}>{r.previousVacationLeaveBalance?.toFixed(3)}</td>
                            <td style={tdNum}>{r.earnedSl?.toFixed(3)}</td>
                            <td style={tdNum}>{r.earnedVl?.toFixed(3)}</td>
                            <td style={tdNum}>{r.sickLeaveUsed?.toFixed(3)}</td>
                            <td style={tdNum}>{r.vacationLeaveUsed?.toFixed(3)}</td>
                            <td style={tdNum}>{r.leaveWithoutPaySl?.toFixed(3)}</td>
                            <td style={tdNum}>{r.leaveWithoutPayVl?.toFixed(3)}</td>
                            <td style={tdNum}>{r.lateUndertimeMinutes}</td>
                            <td style={tdNum}>{r.lateUndertimeEquivalent?.toFixed(3)}</td>
                            <td style={tdNum}>{r.absentCount?.toFixed(3)}</td>
                            <td style={{ ...tdNum, fontWeight: 700, color: "#15803d" }}>{r.sickLeaveBalance?.toFixed(3)}</td>
                            <td style={{ ...tdNum, fontWeight: 700, color: "#1d4ed8" }}>{r.vacationLeaveBalance?.toFixed(3)}</td>
                            <td style={td}>
                              {r.isLocked
                                ? <span style={{ color: "#ca8a04", fontWeight: 700, fontSize: "0.75rem" }}>🔒 Locked</span>
                                : <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>Open</span>}
                            </td>
                            <td style={td}>
                              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "nowrap" }}>
                                {!r.isLocked && (
                                  <button onClick={() => handleLock(r.leaveInformationId)} style={btnLock}>Lock</button>
                                )}
                                {r.isLocked && (
                                  <button onClick={() => handleUnlock(r.leaveInformationId)} style={btnUnlock}>Unlock</button>
                                )}
                                {!r.isLocked && (
                                  <button onClick={() => handleDelete(r.leaveInformationId)} style={btnDelete}>Del</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Modal */}
      {ledgerEmployee && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeLedger(); }}
        >
          <div style={{ background: "#fff", borderRadius: 8, padding: "1.5rem", maxWidth: 960, width: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>Leave Ledger — {ledgerEmployee.name}</h3>
              <button onClick={closeLedger} style={{ background: "#6b7280", color: "#fff", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}>Close</button>
            </div>
            {ledgerLoading && <p>Loading ledger...</p>}
            {!ledgerLoading && ledgerRecords.length === 0 && <p>No historical records found.</p>}
            {!ledgerLoading && ledgerRecords.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      <th style={th}>Period Start</th>
                      <th style={th}>Period End</th>
                      <th style={th}>Prev SL</th>
                      <th style={th}>Prev VL</th>
                      <th style={th}>+SL</th>
                      <th style={th}>+VL</th>
                      <th style={th}>SL Used</th>
                      <th style={th}>VL Used</th>
                      <th style={th}>LWOP-SL</th>
                      <th style={th}>LWOP-VL</th>
                      <th style={th}>Absent</th>
                      <th style={th}>New SL</th>
                      <th style={th}>New VL</th>
                      <th style={th}>🔒</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRecords.map((r) => (
                      <tr key={r.leaveInformationId} style={{ borderBottom: "1px solid #e2e8f0", background: r.isLocked ? "#fef9c3" : undefined }}>
                        <td style={td}>{r.cutoffStartDate}</td>
                        <td style={td}>{r.cutoffEndDate}</td>
                        <td style={tdNum}>{r.previousSickLeaveBalance?.toFixed(3)}</td>
                        <td style={tdNum}>{r.previousVacationLeaveBalance?.toFixed(3)}</td>
                        <td style={tdNum}>{r.earnedSl?.toFixed(3)}</td>
                        <td style={tdNum}>{r.earnedVl?.toFixed(3)}</td>
                        <td style={tdNum}>{r.sickLeaveUsed?.toFixed(3)}</td>
                        <td style={tdNum}>{r.vacationLeaveUsed?.toFixed(3)}</td>
                        <td style={tdNum}>{r.leaveWithoutPaySl?.toFixed(3)}</td>
                        <td style={tdNum}>{r.leaveWithoutPayVl?.toFixed(3)}</td>
                        <td style={tdNum}>{r.absentCount?.toFixed(3)}</td>
                        <td style={{ ...tdNum, fontWeight: 700, color: "#15803d" }}>{r.sickLeaveBalance?.toFixed(3)}</td>
                        <td style={{ ...tdNum, fontWeight: 700, color: "#1d4ed8" }}>{r.vacationLeaveBalance?.toFixed(3)}</td>
                        <td style={td}>{r.isLocked ? "🔒" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 10px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "2px solid #cbd5e1" };
const td: React.CSSProperties = { padding: "5px 10px", verticalAlign: "middle" };
const tdNum: React.CSSProperties = { ...td, textAlign: "right" };
const btnLock: React.CSSProperties = { padding: "2px 7px", background: "#ca8a04", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.72rem" };
const btnUnlock: React.CSSProperties = { ...btnLock, background: "#6b7280" };
const btnDelete: React.CSSProperties = { ...btnLock, background: "#dc2626" };

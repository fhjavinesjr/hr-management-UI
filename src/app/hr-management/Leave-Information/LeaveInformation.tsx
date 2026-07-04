"use client";

import { runtimeConfig } from "@/lib/utils/runtimeConfig";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";

const API_BASE_URL_HRM = runtimeConfig.getApiUrl("hrm");
const API_BASE_URL_ADMINISTRATIVE = runtimeConfig.getApiUrl("administrative");

interface SalaryPeriodSettingDTO {
  salaryPeriodSettingId: number;
  salaryType: string;
  nthOrder: number;
  periodContext: string;
  cutoffStartDay: number;
  cutoffStartMonthOffset: number;
  cutoffEndDay: number;
  cutoffEndMonthOffset: number;
  salaryReleaseMonthOffset?: number | null;
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

interface LeaveProcessBatchStartResponseDTO {
  jobId: string | null;
  message: string;
}

interface LeaveProcessQueueItemDTO {
  seqNo: number;
  employeeId: number;
  employeeNo: string;
  employeeName: string;
  status: "OK" | "SKIPPED" | "FAILED";
  message: string;
}

interface EmployeeBasicInfoDTO {
  employeeId: number | string;
  employeeNo: string;
  firstname?: string;
  lastname?: string;
  suffix?: string;
  fullName?: string;
  role?: string;
}

interface LeaveProcessJobStatusDTO {
  jobId: string;
  status: "PENDING" | "FETCHING_DATA" | "PROCESSING" | "DONE" | "FAILED";
  progressPct: number;
  totalEmployees: number;
  processedEmployees: number;
  skippedEmployees: number;
  summary?: string;
  errorDetail?: string;
}

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeIdentity = (value?: string | null): string => {
  if (!value) return "";
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
};

const isSystemPrivilegedEmployee = (employee: {
  role?: string | null;
  employeeNo?: string | null;
  firstname?: string | null;
  lastname?: string | null;
}): boolean => {
  const role = (employee.role ?? "").trim().toLowerCase();
  if (role.includes("admin") || role.includes("super")) return true;

  const employeeNo = normalizeIdentity(employee.employeeNo);
  const firstname = normalizeIdentity(employee.firstname);
  const lastname = normalizeIdentity(employee.lastname);
  const firstLast = `${firstname}${lastname}`;
  const lastFirst = `${lastname}${firstname}`;
  const markers = new Set(["admin", "super", "superadmin", "adminsuper"]);

  return (
    markers.has(employeeNo) ||
    markers.has(firstname) ||
    markers.has(lastname) ||
    markers.has(firstLast) ||
    markers.has(lastFirst)
  );
};

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
  const [employeeSetupSearch, setEmployeeSetupSearch] = useState("");
  const [employeeSetupPage, setEmployeeSetupPage] = useState(1);
  const [employeeSetupItemsPerPage, setEmployeeSetupItemsPerPage] = useState(10);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set());
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
  const [viewAllYear, setViewAllYear] = useState(false);
  const [ledgerEmployee, setLedgerEmployee] = useState<{ emp: Employee | null; name: string; id: number } | null>(null);
  const [ledgerRecords, setLedgerRecords] = useState<LeaveInfoDTO[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [queueItems, setQueueItems] = useState<LeaveProcessQueueItemDTO[]>([]);
  const [queueOffset, setQueueOffset] = useState(0);
  const queueFeedRef = useRef<HTMLDivElement>(null);
  const queuePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load employees for setup and specific-employee search (exclude admin/super roles).
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/employees/basicInfo`);
        if (!res.ok) throw new Error("Failed to load employees");

        const data: EmployeeBasicInfoDTO[] = await res.json();
        const normalized: Employee[] = data
          .filter((e) => !isSystemPrivilegedEmployee(e))
          .map((e) => {
            const fullName = (e.fullName && e.fullName.trim().length > 0)
              ? e.fullName.trim()
              : [e.lastname, e.firstname, e.suffix].filter(Boolean).join(", ");

            return {
              employeeId: String(e.employeeId),
              employeeNo: e.employeeNo ?? "",
              fullName: fullName || `Employee #${e.employeeId}`,
              role: e.role ?? "",
              biometricNo: "",
              isSearched: false,
              isCleared: false,
            };
          })
          .sort((a, b) => a.fullName.localeCompare(b.fullName));

        setEmployees(normalized);
        setSelectedEmployeeIds(new Set(normalized.map((e) => Number(e.employeeId))));
      } catch {
        // Fallback to local storage if API is temporarily unavailable.
        const stored = localStorageUtil
          .getEmployees()
          .filter((e) => !isSystemPrivilegedEmployee(e));
        setEmployees(stored);
        setSelectedEmployeeIds(new Set(stored.map((e) => Number(e.employeeId))));
      }
    };

    loadEmployees();
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

  const filteredEmployeeSetup = useMemo(() => {
    const q = employeeSetupSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.employeeNo.toLowerCase().includes(q)
    );
  }, [employees, employeeSetupSearch]);

  const employeeSetupTotalPages = Math.max(1, Math.ceil(filteredEmployeeSetup.length / employeeSetupItemsPerPage));
  const employeeSetupStartIndex = (employeeSetupPage - 1) * employeeSetupItemsPerPage;
  const employeeSetupRows = filteredEmployeeSetup.slice(
    employeeSetupStartIndex,
    employeeSetupStartIndex + employeeSetupItemsPerPage
  );

  useEffect(() => {
    setEmployeeSetupPage(1);
  }, [employeeSetupSearch, employeeSetupItemsPerPage]);

  const stopQueuePolling = useCallback(() => {
    if (queuePollRef.current != null) {
      clearInterval(queuePollRef.current);
      queuePollRef.current = null;
    }
  }, []);

  const startQueuePolling = useCallback((jobId: string) => {
    stopQueuePolling();
    let offset = 0;
    queuePollRef.current = setInterval(async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-information/process-queue/${jobId}?from=${offset}`);
        if (!res.ok) return;
        const items: LeaveProcessQueueItemDTO[] = await res.json();
        if (!items.length) return;

        setQueueItems((prev) => [...prev, ...items]);
        offset = items[items.length - 1].seqNo + 1;
        setQueueOffset(offset);

        setTimeout(() => {
          if (queueFeedRef.current) {
            queueFeedRef.current.scrollTop = queueFeedRef.current.scrollHeight;
          }
        }, 40);
      } catch {
        // Ignore transient queue polling errors.
      }
    }, 1200);
  }, [stopQueuePolling]);

  useEffect(() => {
    return () => {
      stopQueuePolling();
    };
  }, [stopQueuePolling]);

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
    setIsLoading(true);
    try {
      let url: string;
      if (viewAllYear) {
        url = `${API_BASE_URL_HRM}/api/leave-information/get-by-year?year=${selectedYear}`;
      } else {
        if (!resolvedDates) { setIsLoading(false); return; }
        url = `${API_BASE_URL_HRM}/api/leave-information/get-by-period?start=${resolvedDates.start}&end=${resolvedDates.end}`;
      }
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error("Failed to fetch leave information");
      const data: LeaveInfoDTO[] = await res.json();
      const allowedIds = new Set(employees.map((e) => Number(e.employeeId)));
      const filtered = employees.length > 0
        ? data.filter((r) => allowedIds.has(Number(r.employeeId)))
        : data;
      setRecords(filtered);
    } catch {
      Toast.fire({ icon: "error", title: "Could not load leave information" });
    } finally {
      setIsLoading(false);
    }
  }, [resolvedDates, viewAllYear, selectedYear, employees]);

  const handleProcess = async () => {
    if (!resolvedDates) {
      Swal.fire({ icon: "warning", title: "Select a salary period setting, month, and year first" });
      return;
    }
    if (scope === "ALL" && selectedEmployeeIds.size === 0) {
      Swal.fire({ icon: "warning", title: "Select at least one employee in Employee Setup" });
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
      setQueueItems([]);
      setQueueOffset(0);

      const payload = {
        salaryPeriodSettingId: selectedSettingId,
        cutoffStartDate: resolvedDates.start,
        cutoffEndDate: resolvedDates.end,
        scope,
        employeeId: scope === "EMPLOYEE" ? Number(selectedEmployee!.employeeId) : null,
        selectedEmployeeIds:
          scope === "ALL" && selectedEmployeeIds.size < employees.length
            ? Array.from(selectedEmployeeIds)
            : null,
        processedById: localStorageUtil.getEmployeeId(),
      };
      const startRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-information/process-batch`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!startRes.ok) throw new Error(await startRes.text());
      const started: LeaveProcessBatchStartResponseDTO = await startRes.json();
      if (!started.jobId) {
        throw new Error(started.message || "Failed to start leave processing job");
      }

      startQueuePolling(started.jobId);

      Swal.fire({
        title: "Processing Leave Information",
        html: "Initializing batch job...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      let latestStatus: LeaveProcessJobStatusDTO | null = null;
      while (true) {
        await sleep(1200);
        const statusRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-information/process-status/${started.jobId}`);
        if (!statusRes.ok) throw new Error(await statusRes.text());
        const status: LeaveProcessJobStatusDTO = await statusRes.json();
        latestStatus = status;

        Swal.update({
          html: `
            <div style="text-align:left;font-size:0.9rem;line-height:1.45;min-width:320px">
              <div><b>Status:</b> ${status.status}</div>
              <div><b>Progress:</b> ${status.progressPct ?? 0}%</div>
              <div><b>Total Employees:</b> ${status.totalEmployees ?? 0}</div>
              <div><b>Processed:</b> ${status.processedEmployees ?? 0}</div>
              <div><b>Skipped:</b> ${status.skippedEmployees ?? 0}</div>
            </div>
          `,
        });

        if (status.status === "DONE" || status.status === "FAILED") {
          break;
        }
      }

      stopQueuePolling();

      Swal.close();

      if (!latestStatus) {
        throw new Error("No status received from leave processing job");
      }

      const resultRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-information/process-result/${started.jobId}`);
      if (!resultRes.ok) {
        throw new Error(await resultRes.text());
      }
      const result: ProcessResultDTO = await resultRes.json();

      if (latestStatus.status === "FAILED") {
        const failReason = latestStatus.errorDetail || "Leave processing job failed";
        throw new Error(failReason);
      }

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
      stopQueuePolling();
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

  const handlePrintLeaveCard = async (employeeId: number, employeeName?: string) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/leave-information/report/${employeeId}?year=${selectedYear}`,
        { method: "GET" }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to generate leave card report.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `LeaveCard_${employeeId}_${selectedYear}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Print Failed",
        text: err instanceof Error
          ? err.message
          : `Unable to generate leave card for ${employeeName ?? `employee #${employeeId}`}.`,
      });
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
                <div className={styles.formGroup} style={{ opacity: viewAllYear ? 0.4 : 1 }}>
                  <label>Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className={styles.inputField}
                    disabled={viewAllYear}
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

                {/* Resolved dates preview — hidden when viewing all year */}
                {resolvedDates && !viewAllYear && (
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", paddingBottom: "0.3rem" }}>
                    Period: <strong>{resolvedDates.start}</strong> → <strong>{resolvedDates.end}</strong>
                  </div>
                )}

                {/* All Year toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", paddingBottom: "0.2rem" }}>
                  <input
                    id="viewAllYear"
                    type="checkbox"
                    checked={viewAllYear}
                    onChange={(e) => { setViewAllYear(e.target.checked); setRecords([]); }}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#2563eb" }}
                  />
                  <label htmlFor="viewAllYear" style={{ fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", userSelect: "none" }}>
                    View All Year ({selectedYear})
                  </label>
                </div>
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

                {scope === "ALL" && (
                  <span style={{ fontSize: "0.82rem", color: "#475569" }}>
                    Selected: <strong>{selectedEmployeeIds.size}</strong> / <strong>{employees.length}</strong>
                  </span>
                )}

                {/* Action buttons */}
                <button
                  onClick={fetchPeriodRecords}
                  disabled={(!resolvedDates && !viewAllYear) || isLoading}
                  className={styles.clearButton}
                  style={{ background: "#2563eb", color: "#fff", border: "none" }}
                >
                  {isLoading ? "Loading..." : viewAllYear ? `View ${selectedYear}` : "View Period"}
                </button>

                <button
                  onClick={handleProcess}
                  disabled={!resolvedDates || isProcessing || (scope === "ALL" && selectedEmployeeIds.size === 0)}
                  className={styles.submitButton}
                  style={{ margin: 0 }}
                >
                  {isProcessing ? "Processing..." : "Process Leave"}
                </button>
              </div>

              {/* Employee Setup (ALL scope) */}
              {scope === "ALL" && (
                <div style={{ marginTop: "1rem", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.7rem", marginBottom: "0.6rem" }}>
                    <h4 style={{ margin: 0, fontSize: "0.92rem" }}>Employee Setup (exclude admin/super)</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <input
                        type="text"
                        placeholder="Search employee..."
                        value={employeeSetupSearch}
                        onChange={(e) => setEmployeeSetupSearch(e.target.value)}
                        className={styles.searchInput}
                        style={{ minWidth: 220, margin: 0 }}
                      />
                      <button
                        type="button"
                        className={styles.clearButton}
                        style={{ margin: 0, background: "#334155", color: "#fff", border: "none" }}
                        onClick={() => setSelectedEmployeeIds(new Set(employees.map((e) => Number(e.employeeId))))}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className={styles.clearButton}
                        style={{ margin: 0, background: "#64748b", color: "#fff", border: "none" }}
                        onClick={() => setSelectedEmployeeIds(new Set())}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto", maxHeight: 220, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", position: "sticky", top: 0 }}>
                          <th style={{ ...th, textAlign: "center", width: 40 }}>
                            <input
                              type="checkbox"
                              checked={employees.length > 0 && selectedEmployeeIds.size === employees.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedEmployeeIds(new Set(employees.map((emp) => Number(emp.employeeId))));
                                else setSelectedEmployeeIds(new Set());
                              }}
                            />
                          </th>
                          <th style={th}>Employee No</th>
                          <th style={th}>Employee Name</th>
                          <th style={th}>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeSetupRows.map((emp) => {
                          const id = Number(emp.employeeId);
                          const checked = selectedEmployeeIds.has(id);
                          return (
                            <tr key={emp.employeeId} style={{ borderBottom: "1px solid #e2e8f0", background: checked ? undefined : "#f8fafc" }}>
                              <td style={{ ...td, textAlign: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setSelectedEmployeeIds((prev) => {
                                      const next = new Set(prev);
                                      if (e.target.checked) next.add(id);
                                      else next.delete(id);
                                      return next;
                                    });
                                  }}
                                />
                              </td>
                              <td style={td}>{emp.employeeNo}</td>
                              <td style={td}>{emp.fullName}</td>
                              <td style={td}>{emp.role || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.55rem", fontSize: "0.78rem", color: "#64748b" }}>
                    <span>
                      Showing {filteredEmployeeSetup.length === 0 ? 0 : employeeSetupStartIndex + 1}
                      -{Math.min(employeeSetupStartIndex + employeeSetupItemsPerPage, filteredEmployeeSetup.length)} of {filteredEmployeeSetup.length}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <label>Rows</label>
                      <select value={employeeSetupItemsPerPage} onChange={(e) => setEmployeeSetupItemsPerPage(Number(e.target.value))} className={styles.inputField} style={{ width: 70, padding: "0.2rem" }}>
                        {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <button type="button" className={styles.clearButton} style={{ margin: 0, padding: "0.2rem 0.5rem" }} disabled={employeeSetupPage === 1} onClick={() => setEmployeeSetupPage((p) => Math.max(1, p - 1))}>Prev</button>
                      <span>Page {employeeSetupPage} of {employeeSetupTotalPages}</span>
                      <button type="button" className={styles.clearButton} style={{ margin: 0, padding: "0.2rem 0.5rem" }} disabled={employeeSetupPage >= employeeSetupTotalPages} onClick={() => setEmployeeSetupPage((p) => Math.min(employeeSetupTotalPages, p + 1))}>Next</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Async Queue Feed (payroll-like) */}
              {(isProcessing || queueItems.length > 0) && (
                <div style={{ marginTop: "0.9rem", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.65rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
                    <h4 style={{ margin: 0, fontSize: "0.9rem" }}>Async Processing Queue</h4>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Offset: {queueOffset}</span>
                  </div>
                  <div ref={queueFeedRef} style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                          <th style={th}>#</th>
                          <th style={th}>Employee</th>
                          <th style={th}>Status</th>
                          <th style={th}>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queueItems.map((q) => (
                          <tr key={q.seqNo} style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={td}>{q.seqNo}</td>
                            <td style={td}>{q.employeeNo} - {q.employeeName}</td>
                            <td style={{ ...td, fontWeight: 700, color: q.status === "OK" ? "#15803d" : q.status === "SKIPPED" ? "#ca8a04" : "#dc2626" }}>
                              {q.status}
                            </td>
                            <td style={td}>{q.message}</td>
                          </tr>
                        ))}
                        {queueItems.length === 0 && (
                          <tr>
                            <td style={{ ...td, color: "#6b7280" }} colSpan={4}>Waiting for queue items...</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                    {viewAllYear
                      ? ` — All periods in ${selectedYear}`
                      : resolvedDates && ` (${resolvedDates.start} → ${resolvedDates.end})`}
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
                          <tr key={r.leaveInformationId} style={{ borderBottom: "1px solid #e2e8f0", background: r.isBegBalance ? "#e0f2fe" : r.isLocked ? "#fef9c3" : undefined }}>
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
                              {r.isBegBalance
                                ? <span style={{ color: "#0284c7", fontWeight: 700, fontSize: "0.75rem" }}>📌 Beg Bal</span>
                                : r.isLocked
                                  ? <span style={{ color: "#ca8a04", fontWeight: 700, fontSize: "0.75rem" }}>🔒 Locked</span>
                                  : <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>Open</span>}
                            </td>
                            <td style={td}>
                              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "nowrap" }}>
                                <button onClick={() => handlePrintLeaveCard(r.employeeId, r.employeeName)} style={btnCard}>Card</button>
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
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => handlePrintLeaveCard(ledgerEmployee.id, ledgerEmployee.name)} style={btnCard}>Leave Card</button>
                <button onClick={closeLedger} style={{ background: "#6b7280", color: "#fff", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}>Close</button>
              </div>
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
                      <tr key={r.leaveInformationId} style={{ borderBottom: "1px solid #e2e8f0", background: r.isBegBalance ? "#e0f2fe" : r.isLocked ? "#fef9c3" : undefined }}>
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
                        <td style={td}>{r.isBegBalance ? "📌" : r.isLocked ? "🔒" : ""}</td>
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
const btnCard: React.CSSProperties = { padding: "2px 7px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.72rem" };
const btnLock: React.CSSProperties = { padding: "2px 7px", background: "#ca8a04", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.72rem" };
const btnUnlock: React.CSSProperties = { ...btnLock, background: "#6b7280" };
const btnDelete: React.CSSProperties = { ...btnLock, background: "#dc2626" };

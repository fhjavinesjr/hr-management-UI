"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import ApprovalSection, { ApprovalSectionData } from "@/lib/approvalSection/approvalSection";

const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;

interface CocDTO {
  cocId?: number;
  employeeId: number;
  dateFiled: string;
  dateWorked: string;
  hoursWorked: number;
  reason: string;
  workType: string;
  overtimeRequestId?: number | null;
  status: string;
  approvedById?: number | null;
  approvedAt?: string | null;
  approvalRemarks?: string | null;
  recommendationStatus?: string | null;
  recommendedById?: number | null;
  recommendationRemarks?: string | null;
  currentBalance?: number;
}

interface OvertimeRequestDTO {
  overtimeRequestId: number;
  dateTimeFrom: string;
  dateTimeTo: string;
  totalHours: number;
  purpose: string;
}

interface FormState {
  dateFiled: string;
  dateWorked: string;
  hoursWorked: string;
  reason: string;
  workType: string;
  overtimeRequestId: string; // "" when not selected
}

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function HRCompensatoryOvertimeCreditModule() {
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<CocDTO[]>([]);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [approvalData, setApprovalData] = useState<ApprovalSectionData>({
    recommendationStatus: "Pending",
    recommendationMessage: "",
    recommendingApprovalById: null,
    authorizedOfficialId: null,
    approvedById: null,
    approvedStatus: "Pending",
    approvalMessage: "",
    dueExigencyService: false,
  });
  const [approvalInitialValues, setApprovalInitialValues] = useState<Partial<ApprovalSectionData> | undefined>(undefined);
  const [approvedOTRequests, setApprovedOTRequests] = useState<OvertimeRequestDTO[]>([]);
  const [isFetchingOT, setIsFetchingOT] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<FormState>({
    dateFiled: today,
    dateWorked: today,
    hoursWorked: "8",
    reason: "",
    workType: "HOLIDAY_DUTY",
    overtimeRequestId: "",
  });

  // Load employees from localStorage
  useEffect(() => {
    const stored = localStorageUtil.getEmployees();
    if (stored && stored.length > 0) setEmployees(stored);
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeNo.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, employees]);

  const fetchBalance = useCallback(async (empId: string | number) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/coc/balance/${empId}`);
      if (!res.ok) return;
      const data = await res.json();
      setAvailableBalance(data.availableHours ?? 0);
    } catch {
      setAvailableBalance(null);
    }
  }, []);

  const fetchRecords = useCallback(async (emp: Employee) => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/coc/get-all/${emp.employeeId}`);
      if (!res.ok) throw new Error("Failed to fetch COC records");
      const data: CocDTO[] = await res.json();
      setRecords(data);
    } catch {
      Toast.fire({ icon: "error", title: "Could not load COC records" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchRecords(selectedEmployee);
      fetchBalance(selectedEmployee.employeeId);
    } else {
      setRecords([]);
      setAvailableBalance(null);
      setApprovedOTRequests([]);
    }
  }, [selectedEmployee, fetchRecords, fetchBalance]);

  // When employee selects OVERTIME work type, load their approved OT requests
  const handleWorkTypeChange = useCallback(async (workType: string) => {
    setForm((prev) => ({ ...prev, workType, overtimeRequestId: "" }));
    if (workType === "OVERTIME" && selectedEmployee) {
      setIsFetchingOT(true);
      try {
        const res = await fetchWithAuth(
          `${API_BASE_URL_HRM}/api/overtime-request/get-approved/${selectedEmployee.employeeId}`
        );
        if (res.ok) {
          const data: OvertimeRequestDTO[] = await res.json();
          setApprovedOTRequests(data);
          if (data.length === 0) {
            Swal.fire({
              icon: "info",
              title: "No Approved Overtime Requests",
              text: "This employee has no approved overtime orders to reference. Please file and get an Overtime Request approved first (Step 1).",
            });
          }
        }
      } catch {
        Toast.fire({ icon: "error", title: "Could not load overtime requests" });
      } finally {
        setIsFetchingOT(false);
      }
    } else {
      setApprovedOTRequests([]);
    }
  }, [selectedEmployee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      Swal.fire({ icon: "warning", title: "No employee selected" });
      return;
    }
    const hrs = parseFloat(form.hoursWorked);
    if (isNaN(hrs) || hrs <= 0) {
      Swal.fire({ icon: "warning", title: "Enter valid hours worked" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: CocDTO = {
        employeeId: Number(selectedEmployee.employeeId),
        dateFiled: form.dateFiled,
        dateWorked: form.dateWorked,
        hoursWorked: hrs,
        reason: form.reason,
        workType: form.workType,
        overtimeRequestId: form.overtimeRequestId ? Number(form.overtimeRequestId) : null,
        status: approvalData.approvedStatus || "Pending",
        approvedById: approvalData.approvedById,
        approvalRemarks: approvalData.approvalMessage,
        recommendationStatus: approvalData.recommendationStatus || "Pending",
        recommendedById: approvalData.recommendingApprovalById,
        recommendationRemarks: approvalData.recommendationMessage,
      };
      const isUpdate = editingId !== null;
      const url = isUpdate
        ? `${API_BASE_URL_HRM}/api/coc/update/${editingId}`
        : `${API_BASE_URL_HRM}/api/coc/create`;
      const method = isUpdate ? "PUT" : "POST";
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: isUpdate ? "COC record updated" : "COC application filed successfully" });
      setForm({ dateFiled: today, dateWorked: today, hoursWorked: "8", reason: "", workType: "HOLIDAY_DUTY", overtimeRequestId: "" });
      setApprovedOTRequests([]);
      setEditingId(null);
      setApprovalInitialValues(undefined);
      setApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false });
      setActiveTab("table");
      fetchRecords(selectedEmployee);
      fetchBalance(selectedEmployee.employeeId);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to file COC application", text: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (r: CocDTO) => {
    setForm({
      dateFiled: r.dateFiled ?? today,
      dateWorked: r.dateWorked ?? today,
      hoursWorked: String(r.hoursWorked),
      reason: r.reason ?? "",
      workType: r.workType ?? "HOLIDAY_DUTY",
      overtimeRequestId: r.overtimeRequestId ? String(r.overtimeRequestId) : "",
    });
    const initVals: Partial<ApprovalSectionData> = {
      approvedStatus: r.status ?? "Pending",
      approvalMessage: r.approvalRemarks ?? "",
      approvedById: r.approvedById ?? null,
      recommendationStatus: r.recommendationStatus ?? "Pending",
      recommendationMessage: r.recommendationRemarks ?? "",
      recommendingApprovalById: r.recommendedById ?? null,
      authorizedOfficialId: null,
      dueExigencyService: false,
    };
    setApprovalInitialValues(initVals);
    setApprovalData(prev => ({ ...prev, ...initVals }));
    setEditingId(r.cocId!);
    setActiveTab("apply");
  };

  const handleDelete = async (cocId: number) => {
    const confirm = await Swal.fire({
      title: "Delete this COC record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/coc/delete/${cocId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "Record deleted" });
      if (selectedEmployee) { fetchRecords(selectedEmployee); fetchBalance(selectedEmployee.employeeId); }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: String(err) });
    }
  };

  const handleClear = () => {
    setSearch("");
    setSelectedEmployee(null);
    setRecords([]);
    setAvailableBalance(null);
    setShowSuggestions(false);
    setEditingId(null);
    setApprovalInitialValues(undefined);
    setApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false });
    setActiveTab("table");
  };

  const statusBadge = (status: string) => {
    const color =
      status === "Approved" ? "#16a34a" :
      status === "Disapproved" ? "#dc2626" : "#ca8a04";
    return <span style={{ color, fontWeight: 600, fontSize: "0.8rem" }}>{status}</span>;
  };

  return (
    <div className={modalStyles.Modal}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.mainTitle}>Compensatory Overtime Credit (COC)</h2>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={styles.EmploymentRecord}>
            <div className={styles.stickyHeader}>
              {/* Employee search */}
              <div className={styles.formGroup} style={{ position: "relative" }}>
                <label>Search Employee</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Employee No / Full Name"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
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
                              setSearch(emp.fullName);
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
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button onClick={handleClear} className={styles.clearButton}>Clear</button>
                    {availableBalance !== null && (
                      <span style={{ fontWeight: 700, color: "#2563eb", fontSize: "0.9rem" }}>
                        Available COC Balance: {availableBalance.toFixed(2)} hrs
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className={styles.tabsHeader}>
                <button className={activeTab === "table" ? styles.active : ""} onClick={() => setActiveTab("table")}>Records</button>
                <button className={activeTab === "apply" ? styles.active : ""} onClick={() => { setEditingId(null); setApprovalInitialValues(undefined); setApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false }); setActiveTab("apply"); }}>File COC</button>
              </div>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === "table" && (
                <>
                  <h3>{selectedEmployee ? `COC Records — ${selectedEmployee.fullName}` : "Search and select an employee"}</h3>
                  {isLoading && <p>Loading...</p>}
                  {!isLoading && selectedEmployee && records.length === 0 && <p>No COC records found.</p>}
                  {!isLoading && records.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9" }}>
                            <th style={th}>Date Filed</th>
                            <th style={th}>Date Worked</th>
                            <th style={th}>Hours</th>
                            <th style={th}>Type</th>
                            <th style={th}>Reason</th>
                            <th style={th}>Status</th>
                            <th style={th}>Remarks</th>
                            <th style={th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r) => (
                            <tr key={r.cocId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={td}>{r.dateFiled}</td>
                              <td style={td}>{r.dateWorked}</td>
                              <td style={td}>{r.hoursWorked}</td>
                              <td style={td}>{r.workType === "HOLIDAY_DUTY" ? "Holiday Duty" : "Overtime"}</td>
                              <td style={td}>{r.reason}</td>
                              <td style={td}>{statusBadge(r.status)}</td>
                              <td style={td}>{r.approvalRemarks ?? "—"}</td>
                              <td style={td}>
                                <button onClick={() => handleEdit(r)} style={btnEdit}>Edit</button>
                                <button onClick={() => handleDelete(r.cocId!)} style={btnDelete}>Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === "apply" && (
                <>
                  <h3>File COC Application{selectedEmployee ? ` — ${selectedEmployee.fullName}` : ""}{editingId ? " (Editing)" : ""}</h3>
                  {!selectedEmployee && <p style={{ color: "#dc2626" }}>Please search and select an employee first.</p>}
                  {selectedEmployee && (
                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}>
                      <div className={styles.formGroup}>
                        <label>Date Filed</label>
                        <input type="date" value={form.dateFiled} onChange={(e) => setForm({ ...form, dateFiled: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Date Worked (Holiday / Overtime Date)</label>
                        <input type="date" value={form.dateWorked} onChange={(e) => setForm({ ...form, dateWorked: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Hours Worked</label>
                        <input type="number" step="0.5" min="0.5" max="24" value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Work Type</label>
                        <select
                          value={form.workType}
                          onChange={(e) => handleWorkTypeChange(e.target.value)}
                          className={styles.inputField}
                        >
                          <option value="HOLIDAY_DUTY">Holiday Duty</option>
                          <option value="OVERTIME">Overtime</option>
                        </select>
                      </div>
                      {form.workType === "OVERTIME" && (
                        <div className={styles.formGroup}>
                          <label>Reference Approved Overtime Order (Step 1)</label>
                          {isFetchingOT && <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Loading approved overtime requests...</p>}
                          {!isFetchingOT && approvedOTRequests.length === 0 && (
                            <p style={{ fontSize: "0.8rem", color: "#dc2626" }}>
                              No approved overtime orders found. File an Overtime Request first.
                            </p>
                          )}
                          {!isFetchingOT && approvedOTRequests.length > 0 && (
                            <select
                              value={form.overtimeRequestId}
                              onChange={(e) => {
                                const selected = approvedOTRequests.find(
                                  (ot) => ot.overtimeRequestId === Number(e.target.value)
                                );
                                setForm((prev) => ({
                                  ...prev,
                                  overtimeRequestId: e.target.value,
                                  dateWorked: selected ? selected.dateTimeFrom.substring(0, 10) : prev.dateWorked,
                                  hoursWorked: selected ? String(selected.totalHours) : prev.hoursWorked,
                                }));
                              }}
                              className={styles.inputField}
                              required
                            >
                              <option value="">— Select Overtime Order —</option>
                              {approvedOTRequests.map((ot) => (
                                <option key={ot.overtimeRequestId} value={ot.overtimeRequestId}>
                                  {ot.dateTimeFrom.substring(0, 16)} → {ot.dateTimeTo.substring(0, 16)} ({ot.totalHours.toFixed(2)} hrs)
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                      <div className={styles.formGroup}>
                        <label>Reason / Justification</label>
                        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={styles.inputField} rows={3} required />
                      </div>
                      <ApprovalSection key={editingId ?? 0} initialValues={approvalInitialValues} onDataChange={setApprovalData} showAuthorizedOfficial={false} showDueExigency={false} />
                      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                        {isSubmitting ? "Submitting..." : editingId ? "Update COC Application" : "File COC Application"}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 12px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "6px 12px", verticalAlign: "middle" };
const btnEdit: React.CSSProperties = { padding: "3px 8px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem", marginRight: "4px" };
const btnDelete: React.CSSProperties = { padding: "3px 8px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem" };

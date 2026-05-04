"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import ApprovalSection, { ApprovalSectionData } from "@/lib/approvalSection/approvalSection";
import to12HourFormat from "@/lib/utils/convert24To12HrFormat";
import Tstyle from "@/styles/TimeCorrection.module.scss";

const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;

interface TimeCorrectionDTO {
  timeCorrectionId?: number;
  employeeId: number;
  dateFiled: string;
  workDate: string;
  correctedTimeIn: string;
  correctedBreakOut?: string | null;
  correctedBreakIn?: string | null;
  correctedTimeOut: string;
  reason: string;
  status: string;
  approvedById?: number | null;
  approvedAt?: string | null;
  approvalRemarks?: string | null;
  recommendationStatus?: string | null;
  recommendedById?: number | null;
  recommendationRemarks?: string | null;
}

type TimeField = { hour: string; minute: string };

interface FormState {
  dateFiled: string;
  workDate: string;
  correctedTimeIn: TimeField;
  correctedBreakOut: TimeField;
  correctedBreakIn: TimeField;
  correctedTimeOut: TimeField;
  reason: string;
}

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function HRTimeCorrectionModule() {
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<TimeCorrectionDTO[]>([]);
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
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<FormState>({
    dateFiled: today,
    workDate: today,
    correctedTimeIn: { hour: "08", minute: "00" },
    correctedBreakOut: { hour: "", minute: "" },
    correctedBreakIn: { hour: "", minute: "" },
    correctedTimeOut: { hour: "17", minute: "00" },
    reason: "",
  });

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
  const toTimeString = (t: TimeField) =>
    t.hour && t.minute ? `${t.hour}:${t.minute}:00` : null;
  const to12 = (t: TimeField) =>
    t.hour && t.minute ? to12HourFormat(`${t.hour}:${t.minute}`) : "";

  const renderTimeSelect = (
    field: "correctedTimeIn" | "correctedBreakOut" | "correctedBreakIn" | "correctedTimeOut"
  ) => {
    const val = form[field] as TimeField;
    return (
      <div>
        <div className={Tstyle.timeGroup}>
          <select
            className={Tstyle.timeSelect}
            value={val.hour}
            onChange={(e) => setForm({ ...form, [field]: { ...val, hour: e.target.value } })}
          >
            <option value="">--</option>
            {hours.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className={Tstyle.timeColon}>:</span>
          <select
            className={Tstyle.timeSelect}
            value={val.minute}
            onChange={(e) => setForm({ ...form, [field]: { ...val, minute: e.target.value } })}
          >
            <option value="">--</option>
            {minutes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {val.hour && val.minute && (
          <span className={Tstyle.time12Label}>{to12(val)}</span>
        )}
      </div>
    );
  };

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

  const fetchRecords = useCallback(async (emp: Employee) => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/time-correction/get-all/${emp.employeeId}`
      );
      if (!res.ok) throw new Error("Failed to fetch records");
      const data: TimeCorrectionDTO[] = await res.json();
      setRecords(data);
    } catch {
      Toast.fire({ icon: "error", title: "Could not load time correction records" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEmployee) fetchRecords(selectedEmployee);
    else setRecords([]);
  }, [selectedEmployee, fetchRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      Swal.fire({ icon: "warning", title: "No employee selected" });
      return;
    }
    if (!form.reason.trim()) {
      Swal.fire({ icon: "warning", title: "Please provide a reason for the correction" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: TimeCorrectionDTO = {
        employeeId: Number(selectedEmployee.employeeId),
        dateFiled: form.dateFiled,
        workDate: form.workDate,
        correctedTimeIn: toTimeString(form.correctedTimeIn)!,
        correctedBreakOut: toTimeString(form.correctedBreakOut) ?? null,
        correctedBreakIn: toTimeString(form.correctedBreakIn) ?? null,
        correctedTimeOut: toTimeString(form.correctedTimeOut)!,
        reason: form.reason,
        status: approvalData.approvedStatus || "Pending",
        approvedById: approvalData.approvedById,
        approvalRemarks: approvalData.approvalMessage,
        recommendationStatus: approvalData.recommendationStatus || "Pending",
        recommendedById: approvalData.recommendingApprovalById,
        recommendationRemarks: approvalData.recommendationMessage,
      };
      const isUpdate = editingId !== null;
      const url = isUpdate
        ? `${API_BASE_URL_HRM}/api/time-correction/update/${editingId}`
        : `${API_BASE_URL_HRM}/api/time-correction/create`;
      const method = isUpdate ? "PUT" : "POST";
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: isUpdate ? "Time correction updated" : "Time correction filed successfully" });
      setForm({ dateFiled: today, workDate: today, correctedTimeIn: { hour: "08", minute: "00" }, correctedBreakOut: { hour: "", minute: "" }, correctedBreakIn: { hour: "", minute: "" }, correctedTimeOut: { hour: "17", minute: "00" }, reason: "" });
      setEditingId(null);
      setApprovalInitialValues(undefined);
      setApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false });
      setActiveTab("table");
      fetchRecords(selectedEmployee);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to file time correction", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseTime = (t: string | null | undefined): TimeField => {
    if (!t) return { hour: "", minute: "" };
    const parts = t.split(":");
    return { hour: parts[0] ?? "", minute: parts[1] ?? "" };
  };

  const handleEdit = (r: TimeCorrectionDTO) => {
    setForm({
      dateFiled: r.dateFiled ?? today,
      workDate: r.workDate ?? today,
      correctedTimeIn: parseTime(r.correctedTimeIn as unknown as string),
      correctedBreakOut: parseTime(r.correctedBreakOut as unknown as string),
      correctedBreakIn: parseTime(r.correctedBreakIn as unknown as string),
      correctedTimeOut: parseTime(r.correctedTimeOut as unknown as string),
      reason: r.reason ?? "",
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
    setEditingId(r.timeCorrectionId!);
    setActiveTab("apply");
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
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/time-correction/delete/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "Record deleted" });
      if (selectedEmployee) fetchRecords(selectedEmployee);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: String(err) });
    }
  };

  const handleClear = () => {
    setSearch("");
    setSelectedEmployee(null);
    setRecords([]);
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
          <h2 className={modalStyles.mainTitle}>Time Correction</h2>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={styles.EmploymentRecord}>
            <div className={styles.stickyHeader}>
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
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <button onClick={handleClear} className={styles.clearButton}>Clear</button>
                  </div>
                </div>
              </div>

              <div className={styles.tabsHeader}>
                <button className={activeTab === "table" ? styles.active : ""} onClick={() => setActiveTab("table")}>List</button>
                <button className={activeTab === "apply" ? styles.active : ""} onClick={() => { setEditingId(null); setApprovalInitialValues(undefined); setApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false }); setActiveTab("apply"); }}>File TC</button>
              </div>
            </div>

            <div className={styles.tabContent}>
              {activeTab === "table" && (
                <>
                  <h3>{selectedEmployee ? `Time Corrections — ${selectedEmployee.fullName}` : "Search and select an employee"}</h3>
                  {isLoading && <p>Loading...</p>}
                  {!isLoading && selectedEmployee && records.length === 0 && <p>No records found.</p>}
                  {!isLoading && records.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9" }}>
                            <th style={th}>Date Filed</th>
                            <th style={th}>Work Date</th>
                            <th style={th}>Corrected Time In</th>
                            <th style={th}>Break Out</th>
                            <th style={th}>Break In</th>
                            <th style={th}>Corrected Time Out</th>
                            <th style={th}>Reason</th>
                            <th style={th}>Status</th>
                            <th style={th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r) => (
                            <tr key={r.timeCorrectionId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={td}>{r.dateFiled}</td>
                              <td style={td}>{r.workDate}</td>
                              <td style={td}>{r.correctedTimeIn}</td>
                              <td style={td}>{r.correctedBreakOut ?? "—"}</td>
                              <td style={td}>{r.correctedBreakIn ?? "—"}</td>
                              <td style={td}>{r.correctedTimeOut}</td>
                              <td style={td}>{r.reason}</td>
                              <td style={td}>{statusBadge(r.status)}</td>
                              <td style={td}>                                  <button onClick={() => handleEdit(r)} style={btnEdit}>Edit</button>                                <button onClick={() => handleDelete(r.timeCorrectionId!)} style={btnDelete}>Delete</button>
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
                  <h3>File Time Correction{selectedEmployee ? ` — ${selectedEmployee.fullName}` : ""}{editingId ? " (Editing)" : ""}</h3>
                  {!selectedEmployee && <p style={{ color: "#dc2626" }}>Please search and select an employee first.</p>}
                  {selectedEmployee && (
                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}>
                      <div className={styles.formGroup}>
                        <label>Date Filed</label>
                        <input type="date" value={form.dateFiled} readOnly className={styles.inputField} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Work Date (Date to Correct)</label>
                        <input type="date" value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Corrected Time In</label>
                        {renderTimeSelect("correctedTimeIn")}
                      </div>
                      <div className={styles.formGroup}>
                        <label>Break Out <span style={{ fontWeight: 400, fontSize: "0.82rem", color: "#6b7280" }}>(optional)</span></label>
                        {renderTimeSelect("correctedBreakOut")}
                      </div>
                      <div className={styles.formGroup}>
                        <label>Break In <span style={{ fontWeight: 400, fontSize: "0.82rem", color: "#6b7280" }}>(optional)</span></label>
                        {renderTimeSelect("correctedBreakIn")}
                      </div>
                      <div className={styles.formGroup}>
                        <label>Corrected Time Out</label>
                        {renderTimeSelect("correctedTimeOut")}
                      </div>
                      <div className={styles.formGroup}>
                        <label>Reason for Correction</label>
                        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={styles.inputField} rows={3} required />
                      </div>
                      <ApprovalSection key={editingId ?? 0} initialValues={approvalInitialValues} onDataChange={setApprovalData} showAuthorizedOfficial={false} showDueExigency={false} />
                      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                        {isSubmitting ? "Submitting..." : editingId ? "Update Time Correction" : "Submit Time Correction"}
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

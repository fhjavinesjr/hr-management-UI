"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";

const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;

interface CocDTO {
  cocId?: number;
  employeeId: number;
  dateFiled: string;
  dateWorked: string;
  hoursWorked: number;
  reason: string;
  workType: string;
  status: string;
  approvedById?: number | null;
  approvedAt?: string | null;
  approvalRemarks?: string | null;
  currentBalance?: number;
}

interface FormState {
  dateFiled: string;
  dateWorked: string;
  hoursWorked: string;
  reason: string;
  workType: string;
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
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<FormState>({
    dateFiled: today,
    dateWorked: today,
    hoursWorked: "8",
    reason: "",
    workType: "HOLIDAY_DUTY",
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
    }
  }, [selectedEmployee, fetchRecords, fetchBalance]);

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
        status: "Pending",
      };
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/coc/create`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "COC application filed successfully" });
      setForm({ dateFiled: today, dateWorked: today, hoursWorked: "8", reason: "", workType: "HOLIDAY_DUTY" });
      setActiveTab("table");
      fetchRecords(selectedEmployee);
      fetchBalance(selectedEmployee.employeeId);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to file COC application", text: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (cocId: number) => {
    const approvedById = localStorageUtil.getEmployeeId();
    const { value: remarks } = await Swal.fire({
      title: "Approve COC Application",
      input: "text",
      inputLabel: "Remarks (optional)",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#16a34a",
    });
    if (remarks === undefined) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/coc/approve/${cocId}`, {
        method: "PUT",
        body: JSON.stringify({ approvedById, remarks: remarks ?? "" }),
      });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "COC approved — balance updated" });
      if (selectedEmployee) { fetchRecords(selectedEmployee); fetchBalance(selectedEmployee.employeeId); }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Approval failed", text: String(err) });
    }
  };

  const handleDisapprove = async (cocId: number) => {
    const approvedById = localStorageUtil.getEmployeeId();
    const { value: remarks } = await Swal.fire({
      title: "Disapprove COC Application",
      input: "text",
      inputLabel: "Reason for disapproval",
      inputValidator: (v) => (!v ? "Please provide a reason" : null),
      showCancelButton: true,
      confirmButtonText: "Disapprove",
      confirmButtonColor: "#d33",
    });
    if (remarks === undefined) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/coc/disapprove/${cocId}`, {
        method: "PUT",
        body: JSON.stringify({ approvedById, remarks }),
      });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "COC disapproved" });
      if (selectedEmployee) { fetchRecords(selectedEmployee); fetchBalance(selectedEmployee.employeeId); }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: String(err) });
    }
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
                <button className={activeTab === "apply" ? styles.active : ""} onClick={() => setActiveTab("apply")}>File COC</button>
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
                                {r.status === "Pending" && (
                                  <div style={{ display: "flex", gap: "0.4rem" }}>
                                    <button onClick={() => handleApprove(r.cocId!)} style={btnApprove}>Approve</button>
                                    <button onClick={() => handleDisapprove(r.cocId!)} style={btnDisapprove}>Disapprove</button>
                                    <button onClick={() => handleDelete(r.cocId!)} style={btnDelete}>Delete</button>
                                  </div>
                                )}
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
                  <h3>File COC Application{selectedEmployee ? ` — ${selectedEmployee.fullName}` : ""}</h3>
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
                        <select value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })} className={styles.inputField}>
                          <option value="HOLIDAY_DUTY">Holiday Duty</option>
                          <option value="OVERTIME">Overtime</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Reason / Justification</label>
                        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={styles.inputField} rows={3} required />
                      </div>
                      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                        {isSubmitting ? "Submitting..." : "File COC Application"}
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
const btnApprove: React.CSSProperties = { padding: "3px 8px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem" };
const btnDisapprove: React.CSSProperties = { ...btnApprove, background: "#dc2626" };
const btnDelete: React.CSSProperties = { ...btnApprove, background: "#6b7280" };

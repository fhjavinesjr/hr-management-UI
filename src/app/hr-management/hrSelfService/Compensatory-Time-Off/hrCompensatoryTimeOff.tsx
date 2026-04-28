"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";

const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;

interface CtoDTO {
  ctoId?: number;
  employeeId: number;
  dateFiled: string;
  dateOfOffset: string;
  hoursUsed: number;
  cocBalanceAtFiling?: number;
  reason: string;
  status: string;
  approvedById?: number | null;
  approvedAt?: string | null;
  approvalRemarks?: string | null;
}

interface FormState {
  dateFiled: string;
  dateOfOffset: string;
  hoursUsed: string;
  reason: string;
}

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function HRCompensatoryTimeOffModule() {
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<CtoDTO[]>([]);
  const [cocBalance, setCocBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<FormState>({
    dateFiled: today,
    dateOfOffset: today,
    hoursUsed: "8",
    reason: "",
  });

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
      setCocBalance(data.availableHours ?? 0);
    } catch {
      setCocBalance(null);
    }
  }, []);

  const fetchRecords = useCallback(async (emp: Employee) => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/cto/get-all/${emp.employeeId}`);
      if (!res.ok) throw new Error("Failed to fetch CTO records");
      const data: CtoDTO[] = await res.json();
      setRecords(data);
    } catch {
      Toast.fire({ icon: "error", title: "Could not load CTO records" });
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
      setCocBalance(null);
    }
  }, [selectedEmployee, fetchRecords, fetchBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      Swal.fire({ icon: "warning", title: "No employee selected" });
      return;
    }
    const hrs = parseFloat(form.hoursUsed);
    if (isNaN(hrs) || hrs <= 0) {
      Swal.fire({ icon: "warning", title: "Enter valid hours to offset" });
      return;
    }
    if (cocBalance !== null && hrs > cocBalance) {
      Swal.fire({
        icon: "error",
        title: "Insufficient COC Balance",
        text: `Requested ${hrs} hrs but only ${cocBalance.toFixed(2)} hrs available.`,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: CtoDTO = {
        employeeId: Number(selectedEmployee.employeeId),
        dateFiled: form.dateFiled,
        dateOfOffset: form.dateOfOffset,
        hoursUsed: hrs,
        reason: form.reason,
        status: "Pending",
      };
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/cto/create`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "CTO application filed successfully" });
      setForm({ dateFiled: today, dateOfOffset: today, hoursUsed: "8", reason: "" });
      setActiveTab("table");
      fetchRecords(selectedEmployee);
      fetchBalance(selectedEmployee.employeeId);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to file CTO application", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (ctoId: number) => {
    const approvedById = localStorageUtil.getEmployeeId();
    const { value: remarks } = await Swal.fire({
      title: "Approve CTO Application",
      input: "text",
      inputLabel: "Remarks (optional)",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#16a34a",
    });
    if (remarks === undefined) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/cto/approve/${ctoId}`, {
        method: "PUT",
        body: JSON.stringify({ approvedById, remarks: remarks ?? "" }),
      });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "CTO approved" });
      if (selectedEmployee) { fetchRecords(selectedEmployee); fetchBalance(selectedEmployee.employeeId); }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Approval failed", text: String(err) });
    }
  };

  const handleDisapprove = async (ctoId: number) => {
    const approvedById = localStorageUtil.getEmployeeId();
    const { value: remarks } = await Swal.fire({
      title: "Disapprove CTO Application",
      input: "text",
      inputLabel: "Reason for disapproval",
      inputValidator: (v) => (!v ? "Please provide a reason" : null),
      showCancelButton: true,
      confirmButtonText: "Disapprove",
      confirmButtonColor: "#d33",
    });
    if (remarks === undefined) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/cto/disapprove/${ctoId}`, {
        method: "PUT",
        body: JSON.stringify({ approvedById, remarks }),
      });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "CTO disapproved" });
      if (selectedEmployee) { fetchRecords(selectedEmployee); fetchBalance(selectedEmployee.employeeId); }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: String(err) });
    }
  };

  const handleDelete = async (ctoId: number) => {
    const confirm = await Swal.fire({
      title: "Delete this CTO record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/cto/delete/${ctoId}`, { method: "DELETE" });
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
    setCocBalance(null);
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
          <h2 className={modalStyles.mainTitle}>Compensatory Time Off (CTO)</h2>
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
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button onClick={handleClear} className={styles.clearButton}>Clear</button>
                    {cocBalance !== null && (
                      <span style={{ fontWeight: 700, color: cocBalance <= 0 ? "#dc2626" : "#2563eb", fontSize: "0.9rem" }}>
                        Available COC Balance: {cocBalance.toFixed(2)} hrs
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.tabsHeader}>
                <button className={activeTab === "table" ? styles.active : ""} onClick={() => setActiveTab("table")}>Records</button>
                <button className={activeTab === "apply" ? styles.active : ""} onClick={() => setActiveTab("apply")}>File CTO</button>
              </div>
            </div>

            <div className={styles.tabContent}>
              {activeTab === "table" && (
                <>
                  <h3>{selectedEmployee ? `CTO Records — ${selectedEmployee.fullName}` : "Search and select an employee"}</h3>
                  {isLoading && <p>Loading...</p>}
                  {!isLoading && selectedEmployee && records.length === 0 && <p>No CTO records found.</p>}
                  {!isLoading && records.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9" }}>
                            <th style={th}>Date Filed</th>
                            <th style={th}>Date of Offset</th>
                            <th style={th}>Hours Used</th>
                            <th style={th}>COC Balance at Filing</th>
                            <th style={th}>Reason</th>
                            <th style={th}>Status</th>
                            <th style={th}>Remarks</th>
                            <th style={th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r) => (
                            <tr key={r.ctoId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={td}>{r.dateFiled}</td>
                              <td style={td}>{r.dateOfOffset}</td>
                              <td style={td}>{r.hoursUsed}</td>
                              <td style={td}>{r.cocBalanceAtFiling?.toFixed(2) ?? "—"}</td>
                              <td style={td}>{r.reason}</td>
                              <td style={td}>{statusBadge(r.status)}</td>
                              <td style={td}>{r.approvalRemarks ?? "—"}</td>
                              <td style={td}>
                                {r.status === "Pending" && (
                                  <div style={{ display: "flex", gap: "0.4rem" }}>
                                    <button onClick={() => handleApprove(r.ctoId!)} style={btnApprove}>Approve</button>
                                    <button onClick={() => handleDisapprove(r.ctoId!)} style={btnDisapprove}>Disapprove</button>
                                    <button onClick={() => handleDelete(r.ctoId!)} style={btnDelete}>Delete</button>
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
                  <h3>File CTO Application{selectedEmployee ? ` — ${selectedEmployee.fullName}` : ""}</h3>
                  {cocBalance !== null && (
                    <p style={{ color: cocBalance <= 0 ? "#dc2626" : "#15803d", fontWeight: 600, marginBottom: "0.5rem" }}>
                      Available COC Balance: {cocBalance.toFixed(2)} hrs
                    </p>
                  )}
                  {!selectedEmployee && <p style={{ color: "#dc2626" }}>Please search and select an employee first.</p>}
                  {selectedEmployee && (
                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}>
                      <div className={styles.formGroup}>
                        <label>Date Filed</label>
                        <input type="date" value={form.dateFiled} onChange={(e) => setForm({ ...form, dateFiled: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Date of Offset (Day to take off)</label>
                        <input type="date" value={form.dateOfOffset} onChange={(e) => setForm({ ...form, dateOfOffset: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Hours to Use</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max={cocBalance ?? 24}
                          value={form.hoursUsed}
                          onChange={(e) => setForm({ ...form, hoursUsed: e.target.value })}
                          className={styles.inputField}
                          required
                        />
                        {cocBalance !== null && (
                          <small style={{ color: "#6b7280" }}>Maximum: {cocBalance.toFixed(2)} hrs</small>
                        )}
                      </div>
                      <div className={styles.formGroup}>
                        <label>Reason</label>
                        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={styles.inputField} rows={3} required />
                      </div>
                      <button type="submit" disabled={isSubmitting || (cocBalance !== null && cocBalance <= 0)} className={styles.submitButton}>
                        {isSubmitting ? "Submitting..." : "File CTO Application"}
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


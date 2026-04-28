"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";

const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;

interface OfficialEngagementApplicationDTO {
  officialEngagementApplicationId?: number;
  employeeId: number;
  dateFiled: string;
  officialType: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  details: string;
  status: string;
  approvedById?: number | null;
  approvedAt?: string | null;
  approvalRemarks?: string | null;
}

interface FormState {
  dateFiled: string;
  officialType: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  details: string;
}

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function HROfficialEngagementModule() {
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<OfficialEngagementApplicationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<FormState>({
    dateFiled: today,
    officialType: "Official Business",
    startDate: today,
    startTime: "08:00",
    endDate: today,
    endTime: "17:00",
    details: "",
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

  const fetchRecords = useCallback(async (emp: Employee) => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/official-engagement/get-all/${emp.employeeId}`
      );
      if (!res.ok) throw new Error("Failed to fetch records");
      const data: OfficialEngagementApplicationDTO[] = await res.json();
      setRecords(data);
    } catch {
      Toast.fire({ icon: "error", title: "Could not load official engagement records" });
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
    if (form.endDate < form.startDate) {
      Swal.fire({ icon: "warning", title: "End date cannot be before start date" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: OfficialEngagementApplicationDTO = {
        employeeId: Number(selectedEmployee.employeeId),
        dateFiled: form.dateFiled,
        officialType: form.officialType,
        startDate: form.startDate,
        startTime: form.startTime,
        endDate: form.endDate,
        endTime: form.endTime,
        details: form.details,
        status: "Pending",
      };
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/official-engagement/create`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "Official engagement filed successfully" });
      setForm({
        dateFiled: today,
        officialType: "Official Business",
        startDate: today,
        startTime: "08:00",
        endDate: today,
        endTime: "17:00",
        details: "",
      });
      setActiveTab("table");
      fetchRecords(selectedEmployee);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to file official engagement", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    const approvedById = localStorageUtil.getEmployeeId();
    const { value: remarks } = await Swal.fire({
      title: "Approve Official Engagement",
      input: "text",
      inputLabel: "Remarks (optional)",
      showCancelButton: true,
      confirmButtonText: "Approve",
    });
    if (remarks === undefined) return;
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/official-engagement/approve/${id}`,
        { method: "PUT", body: JSON.stringify({ approvedById, remarks: remarks ?? "" }) }
      );
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "Official engagement approved" });
      if (selectedEmployee) fetchRecords(selectedEmployee);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Approval failed", text: String(err) });
    }
  };

  const handleDisapprove = async (id: number) => {
    const approvedById = localStorageUtil.getEmployeeId();
    const { value: remarks } = await Swal.fire({
      title: "Disapprove Official Engagement",
      input: "text",
      inputLabel: "Reason for disapproval",
      inputValidator: (v) => (!v ? "Please provide a reason" : null),
      showCancelButton: true,
      confirmButtonText: "Disapprove",
      confirmButtonColor: "#d33",
    });
    if (remarks === undefined) return;
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/official-engagement/disapprove/${id}`,
        { method: "PUT", body: JSON.stringify({ approvedById, remarks }) }
      );
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "Official engagement disapproved" });
      if (selectedEmployee) fetchRecords(selectedEmployee);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: String(err) });
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
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/official-engagement/delete/${id}`,
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
          <h2 className={modalStyles.mainTitle}>Official Engagement</h2>
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
                <button className={activeTab === "apply" ? styles.active : ""} onClick={() => setActiveTab("apply")}>File OE</button>
              </div>
            </div>

            <div className={styles.tabContent}>
              {activeTab === "table" && (
                <>
                  <h3>{selectedEmployee ? `Official Engagements — ${selectedEmployee.fullName}` : "Search and select an employee"}</h3>
                  {isLoading && <p>Loading...</p>}
                  {!isLoading && selectedEmployee && records.length === 0 && <p>No records found.</p>}
                  {!isLoading && records.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9" }}>
                            <th style={th}>Date Filed</th>
                            <th style={th}>Type</th>
                            <th style={th}>Start Date</th>
                            <th style={th}>Start Time</th>
                            <th style={th}>End Date</th>
                            <th style={th}>End Time</th>
                            <th style={th}>Details</th>
                            <th style={th}>Status</th>
                            <th style={th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r) => (
                            <tr key={r.officialEngagementApplicationId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={td}>{r.dateFiled}</td>
                              <td style={td}>{r.officialType}</td>
                              <td style={td}>{r.startDate}</td>
                              <td style={td}>{r.startTime}</td>
                              <td style={td}>{r.endDate}</td>
                              <td style={td}>{r.endTime}</td>
                              <td style={td}>{r.details}</td>
                              <td style={td}>{statusBadge(r.status)}</td>
                              <td style={td}>
                                {r.status === "Pending" && (
                                  <div style={{ display: "flex", gap: "0.4rem" }}>
                                    <button onClick={() => handleApprove(r.officialEngagementApplicationId!)} style={btnApprove}>Approve</button>
                                    <button onClick={() => handleDisapprove(r.officialEngagementApplicationId!)} style={btnDisapprove}>Disapprove</button>
                                    <button onClick={() => handleDelete(r.officialEngagementApplicationId!)} style={btnDelete}>Delete</button>
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
                  <h3>File Official Engagement{selectedEmployee ? ` — ${selectedEmployee.fullName}` : ""}</h3>
                  {!selectedEmployee && <p style={{ color: "#dc2626" }}>Please search and select an employee first.</p>}
                  {selectedEmployee && (
                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}>
                      <div className={styles.formGroup}>
                        <label>Date Filed</label>
                        <input type="date" value={form.dateFiled} readOnly className={styles.inputField} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Official Type</label>
                        <select value={form.officialType} onChange={(e) => setForm({ ...form, officialType: e.target.value })} className={styles.inputField}>
                          <option value="Official Business">Official Business</option>
                          <option value="Official Time">Official Time</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Start Date</label>
                        <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Start Time</label>
                        <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>End Date</label>
                        <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>End Time</label>
                        <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Details / Purpose</label>
                        <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} className={styles.inputField} rows={3} />
                      </div>
                      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                        {isSubmitting ? "Submitting..." : "Submit Official Engagement"}
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

"use client";

import { runtimeConfig } from "@/lib/utils/runtimeConfig";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import tableStyles from "@/styles/tables.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import ApprovalSection, { ApprovalSectionData } from "@/lib/approvalSection/approvalSection";

const API_BASE_URL_HRM = runtimeConfig.getApiUrl("hrm");

interface OvertimeRequestDTO {
  overtimeRequestId?: number;
  employeeId: number;
  dateFiled: string;
  dateTimeFrom: string;
  dateTimeTo: string;
  totalHours?: number;
  purpose: string;
  status: string;
  approvedById?: number | null;
  approvedAt?: string | null;
  approvalRemarks?: string | null;
  recommendationStatus?: string | null;
  recommendedById?: number | null;
  recommendationRemarks?: string | null;
}

interface FormState {
  dateFiled: string;
  dateTimeFrom: string;
  dateTimeTo: string;
  purpose: string;
}

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function HROvertimeRequestModule() {
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [records, setRecords] = useState<OvertimeRequestDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
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
  const nowLocal = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState<FormState>({
    dateFiled: today,
    dateTimeFrom: nowLocal(),
    dateTimeTo: nowLocal(),
    purpose: "",
  });

  useEffect(() => {
    const stored = localStorageUtil.getEmployees();
    if (stored && stored.length > 0) setEmployees(stored);
    const role = localStorageUtil.getEmployeeRole();
    const fullname = localStorageUtil.getEmployeeFullname();
    const empNo = localStorageUtil.getEmployeeNo();
    const employeeId = localStorageUtil.getEmployeeId();
    setUserRole(role);
    if (role !== "1" && empNo) {
      const empFromList = stored?.find(e => e.employeeNo === empNo) ?? null;
      if (empFromList) {
        setSelectedEmployee(empFromList);
        setSearch(`[${empFromList.employeeNo}] ${empFromList.fullName}`);
      } else if (fullname) {
        const own: Employee = { employeeId: String(employeeId ?? ""), employeeNo: empNo, fullName: fullname, role: role ?? "", biometricNo: "", isSearched: false, isCleared: false };
        setSelectedEmployee(own);
        setSearch(`[${empNo}] ${fullname}`);
      }
    }
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeNo.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, employees]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (dateFrom && r.dateFiled && r.dateFiled < dateFrom) return false;
      if (dateTo && r.dateFiled && r.dateFiled > dateTo) return false;
      return true;
    });
  }, [records, dateFrom, dateTo]);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const duration = useMemo(() => {
    if (!form.dateTimeFrom || !form.dateTimeTo) return null;
    const start = new Date(form.dateTimeFrom);
    const end = new Date(form.dateTimeTo);
    if (end <= start) return null;
    const totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  }, [form.dateTimeFrom, form.dateTimeTo]);

  const fetchRecords = useCallback(async (emp: Employee) => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/overtime-request/get-all/${emp.employeeId}`);
      if (!res.ok) throw new Error("Failed to fetch overtime requests");
      const data: OvertimeRequestDTO[] = await res.json();
      setRecords(data);
    } catch {
      Toast.fire({ icon: "error", title: "Could not load overtime records" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchRecords(selectedEmployee);
    } else {
      setRecords([]);
    }
  }, [selectedEmployee, fetchRecords]);

  useEffect(() => { setCurrentPage(1); }, [dateFrom, dateTo, selectedEmployee, itemsPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      Swal.fire({ icon: "warning", title: "No employee selected" });
      return;
    }
    if (!duration || duration.hours <= 0 && duration.minutes <= 0) {
      Swal.fire({ icon: "warning", title: "End time must be after start time" });
      return;
    }
    if (!form.purpose.trim()) {
      Swal.fire({ icon: "warning", title: "Purpose / justification is required" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: OvertimeRequestDTO = {
        employeeId: Number(selectedEmployee.employeeId),
        dateFiled: form.dateFiled,
        dateTimeFrom: form.dateTimeFrom.replace("T", " ") + ":00",
        dateTimeTo: form.dateTimeTo.replace("T", " ") + ":00",
        purpose: form.purpose,
        status: approvalData.approvedStatus || "Pending",
        approvedById: approvalData.approvedById,
        approvalRemarks: approvalData.approvalMessage,
        recommendationStatus: approvalData.recommendationStatus || "Pending",
        recommendedById: approvalData.recommendingApprovalById,
        recommendationRemarks: approvalData.recommendationMessage,
      };
      const isUpdate = editingId !== null;
      const url = isUpdate
        ? `${API_BASE_URL_HRM}/api/overtime-request/update/${editingId}`
        : `${API_BASE_URL_HRM}/api/overtime-request/create`;
      const method = isUpdate ? "PUT" : "POST";
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: isUpdate ? "Overtime request updated" : "Overtime request filed successfully" });
      setForm({ dateFiled: today, dateTimeFrom: nowLocal(), dateTimeTo: nowLocal(), purpose: "" });
      setEditingId(null);
      setApprovalInitialValues(undefined);
      setApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false });
      setActiveTab("table");
      fetchRecords(selectedEmployee);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to file overtime request", text: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (r: OvertimeRequestDTO) => {
    const toLocal = (dt: string | null | undefined) => {
      if (!dt) return nowLocal();
      return dt.replace(" ", "T").substring(0, 16);
    };
    setForm({
      dateFiled: r.dateFiled ?? today,
      dateTimeFrom: toLocal(r.dateTimeFrom as unknown as string),
      dateTimeTo: toLocal(r.dateTimeTo as unknown as string),
      purpose: r.purpose,
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
    setEditingId(r.overtimeRequestId!);
    setActiveTab("apply");
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Delete this overtime request?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/overtime-request/delete/${id}`, { method: "DELETE" });
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
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    setActiveTab("table");
  };

  const statusBadge = (status: string) => {
    const color =
      status === "Approved" ? "#16a34a" :
      status === "Disapproved" ? "#dc2626" : "#ca8a04";
    return <span style={{ color, fontWeight: 600, fontSize: "0.8rem" }}>{status}</span>;
  };

  const fmtDateTime = (dt: string | null | undefined) => {
    if (!dt) return "—";
    return dt.replace("T", " ").substring(0, 16);
  };

  return (
    <div className={modalStyles.Modal}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.mainTitle}>Overtime Request</h2>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={styles.EmploymentRecord}>
            <div className={styles.stickyHeader}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label>Date From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={styles.searchInput} />
                </div>
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label>Date To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={styles.searchInput} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1, minWidth: "220px", position: "relative" }}>
                  <label>Search Employee</label>
                  {userRole === "1" ? (
                    <>
                      <input
                        type="text"
                        placeholder="Employee No / Full Name"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        className={styles.searchInput}
                        style={{ width: "100%" }}
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
                    </>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      className={styles.searchInput}
                      style={{ width: "100%" }}
                      value={selectedEmployee ? `[${selectedEmployee.employeeNo}] ${selectedEmployee.fullName}` : ""}
                    />
                  )}
                </div>
                <div style={{ alignSelf: "flex-end", marginBottom: "20px", marginLeft: "1rem" }}>
                  <button onClick={handleClear} className={styles.clearButton}>Clear</button>
                </div>
              </div>

              <div className={styles.tabsHeader}>
                <button className={activeTab === "table" ? styles.active : ""} onClick={() => setActiveTab("table")}>Records</button>
                <button className={activeTab === "apply" ? styles.active : ""} onClick={() => { setEditingId(null); setApprovalInitialValues(undefined); setApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false }); setActiveTab("apply"); }}>File Request</button>
              </div>
            </div>

            <div className={styles.tabContent}>
              {activeTab === "table" && (
                <>
                  <h3>{selectedEmployee ? `Overtime Requests — ${selectedEmployee.fullName}` : "Search and select an employee"}</h3>
                  {isLoading && <p>Loading...</p>}
                  {!isLoading && selectedEmployee && records.length === 0 && <p>No overtime request records found.</p>}
                  <div className={tableStyles.paginationContainer}>
                    <div className={tableStyles.paginationLeft}>
                      <label>Rows per page: </label>
                      <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                        {[25, 50, 100, 300, 500].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span className={tableStyles.recordInfo}>Showing {filteredRecords.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRecords.length)} of {filteredRecords.length}</span>
                    </div>
                    <div className={tableStyles.paginationRight}>
                      <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={tableStyles.paginationBtn}>First</button>
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={tableStyles.paginationBtn}>Previous</button>
                      <span className={tableStyles.pageIndicator}>Page {currentPage} of {totalPages}</span>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={tableStyles.paginationBtn}>Next</button>
                      <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={tableStyles.paginationBtn}>Last</button>
                    </div>
                  </div>
                  {!isLoading && filteredRecords.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9" }}>
                            <th style={th}>Date Filed</th>
                            <th style={th}>From</th>
                            <th style={th}>To</th>
                            <th style={th}>Total Hours</th>
                            <th style={th}>Purpose</th>
                            <th style={th}>Status</th>
                            <th style={th}>Remarks</th>
                            <th style={th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRecords.map((r) => (
                            <tr key={r.overtimeRequestId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={td}>{r.dateFiled}</td>
                              <td style={td}>{fmtDateTime(r.dateTimeFrom)}</td>
                              <td style={td}>{fmtDateTime(r.dateTimeTo)}</td>
                              <td style={td}>{r.totalHours?.toFixed(2)} hrs</td>
                              <td style={td}>{r.purpose}</td>
                              <td style={td}>{statusBadge(r.status)}</td>
                              <td style={td}>{r.approvalRemarks ?? "—"}</td>
                              <td style={td}>
                                <button onClick={() => handleEdit(r)} style={btnEdit}>Edit</button>
                                <button onClick={() => handleDelete(r.overtimeRequestId!)} style={btnDelete}>Delete</button>
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
                  <h3>File Overtime Request{selectedEmployee ? ` — ${selectedEmployee.fullName}` : ""}{editingId ? " (Editing)" : ""}</h3>
                  {!selectedEmployee && <p style={{ color: "#dc2626" }}>Please search and select an employee first.</p>}
                  {selectedEmployee && (
                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}>
                      <div className={styles.formGroup}>
                        <label>Date Filed</label>
                        <input type="date" value={form.dateFiled} onChange={(e) => setForm({ ...form, dateFiled: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Inclusive Date &amp; Time — From</label>
                        <input type="datetime-local" value={form.dateTimeFrom} onChange={(e) => setForm({ ...form, dateTimeFrom: e.target.value })} className={styles.inputField} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Inclusive Date &amp; Time — To</label>
                        <input type="datetime-local" value={form.dateTimeTo} min={form.dateTimeFrom} onChange={(e) => setForm({ ...form, dateTimeTo: e.target.value })} className={styles.inputField} required />
                      </div>
                      {duration && (
                        <div className={styles.formGroup}>
                          <label>Total Overtime (auto-computed)</label>
                          <div style={{ padding: "0.4rem 0.6rem", background: "#f1f5f9", borderRadius: 4, fontSize: "0.9rem" }}>
                            {duration.hours} hr(s) {duration.minutes} min(s)
                          </div>
                        </div>
                      )}
                      <div className={styles.formGroup}>
                        <label>Purpose / Justification</label>
                        <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={styles.inputField} rows={3} required />
                      </div>
                      <ApprovalSection key={editingId ?? 0} initialValues={approvalInitialValues} onDataChange={setApprovalData} showAuthorizedOfficial={false} showDueExigency={false} />
                      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                        {isSubmitting ? "Submitting..." : editingId ? "Update Overtime Request" : "File Overtime Request"}
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
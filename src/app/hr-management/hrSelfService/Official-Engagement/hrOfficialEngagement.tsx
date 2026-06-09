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
  recommendationStatus?: string | null;
  recommendedById?: number | null;
  recommendationRemarks?: string | null;
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
  const canAdd = localStorageUtil.canAdd("hrm.ss.officialEngag");
  const canEdit = localStorageUtil.canEdit("hrm.ss.officialEngag");
  const canDelete = localStorageUtil.canDelete("hrm.ss.officialEngag");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [records, setRecords] = useState<OfficialEngagementApplicationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Official Business" | "Official Time">("All");
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
      if (typeFilter !== "All" && r.officialType !== typeFilter) return false;
      return true;
    });
  }, [records, dateFrom, dateTo, typeFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

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

  useEffect(() => { setCurrentPage(1); }, [dateFrom, dateTo, selectedEmployee, itemsPerPage, typeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUpdate = editingId !== null;
    if ((isUpdate && !canEdit) || (!isUpdate && !canAdd)) {
      Swal.fire({ icon: "warning", title: "Access denied", text: "You do not have permission to perform this action." });
      return;
    }
    if (!selectedEmployee) {
      Swal.fire({ icon: "warning", title: "No employee selected" });
      return;
    }
    if (form.endDate < form.startDate || (form.endDate === form.startDate && form.endTime <= form.startTime)) {
      Swal.fire({ icon: "warning", title: "End date/time must be after start date/time" });
      return;
    }
    // Client-side datetime overlap check against existing records
    const newStart = new Date(`${form.startDate}T${form.startTime}`);
    const newEnd = new Date(`${form.endDate}T${form.endTime}`);
    const conflict = records.find((r) => {
      if (editingId !== null && r.officialEngagementApplicationId === editingId) return false;
      if (r.status !== "Pending" && r.status !== "Approved") return false;
      if (!r.startDate || !r.startTime || !r.endDate || !r.endTime) return false;
      const exStart = new Date(`${r.startDate}T${r.startTime.substring(0, 5)}`);
      const exEnd = new Date(`${r.endDate}T${r.endTime.substring(0, 5)}`);
      return newStart < exEnd && newEnd > exStart;
    });
    if (conflict) {
      Swal.fire({
        icon: "error",
        title: "Time Conflict",
        text: `An Official Engagement (${conflict.officialType}) already exists from ${conflict.startDate} ${conflict.startTime?.substring(0, 5)} to ${conflict.endDate} ${conflict.endTime?.substring(0, 5)}. Please choose a different date/time range.`,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: OfficialEngagementApplicationDTO = {
        employeeId: Number(selectedEmployee.employeeId),
        dateFiled: form.dateFiled,
        officialType: form.officialType,
        startDate: form.startDate,
        startTime: form.startTime.length === 5 ? form.startTime + ":00" : form.startTime,
        endDate: form.endDate,
        endTime: form.endTime.length === 5 ? form.endTime + ":00" : form.endTime,
        details: form.details,
        status: approvalData.approvedStatus || "Pending",
        approvedById: approvalData.approvedById,
        approvalRemarks: approvalData.approvalMessage,
        recommendationStatus: approvalData.recommendationStatus || "Pending",
        recommendedById: approvalData.recommendingApprovalById,
        recommendationRemarks: approvalData.recommendationMessage,
      };
      const url = isUpdate
        ? `${API_BASE_URL_HRM}/api/official-engagement/update/${editingId}`
        : `${API_BASE_URL_HRM}/api/official-engagement/create`;
      const method = isUpdate ? "PUT" : "POST";
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: isUpdate ? "Official engagement updated" : "Official engagement filed successfully" });
      setForm({ dateFiled: today, officialType: "Official Business", startDate: today, startTime: "08:00", endDate: today, endTime: "17:00", details: "" });
      setEditingId(null);
      setApprovalInitialValues(undefined);
      setApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false });
      setActiveTab("table");
      fetchRecords(selectedEmployee);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to file official engagement", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (r: OfficialEngagementApplicationDTO) => {
    if (!canEdit) {
      Swal.fire({ icon: "warning", title: "Access denied", text: "You do not have permission to edit records." });
      return;
    }
    setForm({
      dateFiled: r.dateFiled ?? today,
      officialType: r.officialType ?? "Official Business",
      startDate: r.startDate ?? today,
      startTime: r.startTime?.substring(0, 5) ?? "08:00",
      endDate: r.endDate ?? today,
      endTime: r.endTime?.substring(0, 5) ?? "17:00",
      details: r.details ?? "",
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
    setEditingId(r.officialEngagementApplicationId!);
    setActiveTab("apply");
  };

  const handleDelete = async (id: number) => {
    if (!canDelete) {
      Swal.fire({ icon: "warning", title: "Access denied", text: "You do not have permission to delete records." });
      return;
    }
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
    setEditingId(null);
    setApprovalInitialValues(undefined);
    setApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false });
    setDateFrom("");
    setDateTo("");
    setTypeFilter("All");
    setCurrentPage(1);
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
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label>Date From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={styles.searchInput} />
                </div>
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label>Date To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={styles.searchInput} />
                </div>
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label>Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as "All" | "Official Business" | "Official Time")}
                    className={styles.searchInput}
                  >
                    <option value="All">All</option>
                    <option value="Official Business">Official Business</option>
                    <option value="Official Time">Official Time</option>
                  </select>
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
                <button className={activeTab === "table" ? styles.active : ""} onClick={() => setActiveTab("table")}>List</button>
                {(canAdd || canEdit) && <button className={activeTab === "apply" ? styles.active : ""} onClick={() => { setEditingId(null); setApprovalInitialValues(undefined); setApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false }); setActiveTab("apply"); }}>File OE</button>}
              </div>
            </div>

            <div className={styles.tabContent}>
              {activeTab === "table" && (
                <>
                  <h3>{selectedEmployee ? `Official Engagements — ${selectedEmployee.fullName}` : "Search and select an employee"}</h3>
                  {isLoading && <p>Loading...</p>}
                  {!isLoading && selectedEmployee && records.length === 0 && <p>No records found.</p>}
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
                          {paginatedRecords.map((r) => (
                            <tr key={r.officialEngagementApplicationId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={td}>{r.dateFiled}</td>
                              <td style={td}>{r.officialType}</td>
                              <td style={td}>{r.startDate}</td>
                              <td style={td}>{r.startTime}</td>
                              <td style={td}>{r.endDate}</td>
                              <td style={td}>{r.endTime}</td>
                              <td style={td}>{r.details}</td>
                              <td style={td}>{statusBadge(r.status)}</td>
                              <td style={td}>{canEdit && <button onClick={() => handleEdit(r)} style={btnEdit}>Edit</button>}{canDelete && <button onClick={() => handleDelete(r.officialEngagementApplicationId!)} style={btnDelete}>Delete</button>}{!canEdit && !canDelete && "-"}
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
                  <h3>File Official Engagement{selectedEmployee ? ` — ${selectedEmployee.fullName}` : ""}{editingId ? " (Editing)" : ""}</h3>
                  {!selectedEmployee && <p style={{ color: "#dc2626" }}>Please search and select an employee first.</p>}
                  {selectedEmployee && (editingId ? canEdit : canAdd) && (
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
                      <ApprovalSection key={editingId ?? 0} initialValues={approvalInitialValues} onDataChange={setApprovalData} showAuthorizedOfficial={false} showDueExigency={false} />
                      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                        {isSubmitting ? "Submitting..." : editingId ? "Update Official Engagement" : "Submit Official Engagement"}
                      </button>
                    </form>
                  )}
                  {selectedEmployee && !(editingId ? canEdit : canAdd) && (
                    <p style={{ color: "#dc2626" }}>You do not have permission to {editingId ? "edit" : "create"} official engagements.</p>
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

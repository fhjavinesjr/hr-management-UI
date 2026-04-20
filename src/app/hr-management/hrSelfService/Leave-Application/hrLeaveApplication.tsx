"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import LeaveApplication from "@/components/selfservices/LeaveApplication";
import LeaveApplicationTable from "@/components/tables/LeaveApplicationTable";
import LeaveMonetizationTable from "@/components/tables/LeaveMonetizationTable";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";

const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;

interface LeaveRecord {
  id: number;
  employee: string;
  dateFiled: string;
  from: string;
  to: string;
  leaveType: string;
  status: string;
  commutation?: string;
  details?: string;
}

interface LeaveMonetizationRecord {
  id: number;
  employee: string;
  dateFiled: string;
  noOfDays: number;
  leaveType: string;
  status: string;
  details?: string;
}

interface EditRecord {
  id?: number;
  dateFiled: string;
  leaveType: string;
  from: string;
  to: string;
  noOfDays: string;
  commutation: string;
  details: string;
  status: string;
  recommendingApprovalById?: number | null;
  authorizedOfficialId?: number | null;
  approvedById?: number | null;
  recommendationStatus?: string;
  recommendationMessage?: string;
  approvedStatus?: string;
  approvalMessage?: string;
  dueExigencyService?: boolean;
}

interface ApiLeaveDTO {
  leaveApplicationId: number;
  employeeId: number;
  dateFiled: string | null;
  leaveType: string;
  startDate: string | null;
  endDate: string | null;
  noOfDays: number | null;
  commutation: string | null;
  details: string | null;
  status: string;
  recommendingApprovalById: number | null;
  authorizedOfficialId: number | null;
  approvedById: number | null;
  recommendationStatus: string | null;
  recommendationMessage: string | null;
  approvedStatus: string | null;
  approvalMessage: string | null;
  dueExigencyService: boolean | null;
}

export default function HRLeaveApplicationModule() {
  const [activeTab, setActiveTab] = useState<"regularLeaves" | "leaveMonetization" | "apply">("regularLeaves");
  const [inputValue, setInputValue] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingRecord, setEditingRecord] = useState<EditRecord | null>(null);
  const [rawDtos, setRawDtos] = useState<ApiLeaveDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [allLeaves, setAllLeaves] = useState<LeaveRecord[]>([]);
  const [allMonetizations, setAllMonetizations] = useState<LeaveMonetizationRecord[]>([]);

  // Load employees from localStorage on mount
  useEffect(() => {
    const stored = localStorageUtil.getEmployees();
    if (stored && stored.length > 0) {
      setEmployees(stored);
    }
  }, []);

  // Map API DTO → frontend record shapes
  const dtoToLeaveRecord = useCallback((dto: ApiLeaveDTO, empName: string): LeaveRecord => ({
    id: dto.leaveApplicationId,
    employee: empName,
    dateFiled: dto.dateFiled ?? "",
    from: dto.startDate ?? "",
    to: dto.endDate ?? "",
    leaveType: dto.leaveType,
    status: dto.status,
    commutation: dto.commutation ?? undefined,
    details: dto.details ?? undefined,
  }), []);

  const dtoToMonetizationRecord = useCallback((dto: ApiLeaveDTO, empName: string): LeaveMonetizationRecord => ({
    id: dto.leaveApplicationId,
    employee: empName,
    dateFiled: dto.dateFiled ?? "",
    noOfDays: dto.noOfDays ?? 0,
    leaveType: dto.leaveType,
    status: dto.status,
    details: dto.details ?? undefined,
  }), []);

  // Fetch all leave records (no employee selected)
  const fetchAllLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-application/get-all`);
      if (!res.ok) throw new Error("Failed to fetch all leave records");
      const data: ApiLeaveDTO[] = await res.json();
      setRawDtos(data);
      const empName = (id: number) =>
        employees.find((e) => Number(e.employeeId) === id)?.fullName ?? `Employee #${id}`;
      setAllLeaves(data.filter((d) => d.leaveType !== "Leave Monetization").map((d) => dtoToLeaveRecord(d, empName(d.employeeId))));
      setAllMonetizations(data.filter((d) => d.leaveType === "Leave Monetization").map((d) => dtoToMonetizationRecord(d, empName(d.employeeId))));
    } catch (err) {
      console.error("Error fetching all leave records:", err);
    } finally {
      setIsLoading(false);
    }
  }, [employees, dtoToLeaveRecord, dtoToMonetizationRecord]);

  // Fetch leave records for a specific employee
  const fetchLeaveRecords = useCallback(async (employee: Employee) => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-application/get-all/${employee.employeeId}`);
      if (!res.ok) throw new Error("Failed to fetch leave records");
      const data: ApiLeaveDTO[] = await res.json();
      setRawDtos(data);
      setAllLeaves(data.filter((d) => d.leaveType !== "Leave Monetization").map((d) => dtoToLeaveRecord(d, employee.fullName)));
      setAllMonetizations(data.filter((d) => d.leaveType === "Leave Monetization").map((d) => dtoToMonetizationRecord(d, employee.fullName)));
    } catch (err) {
      console.error("Error fetching leave records:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dtoToLeaveRecord, dtoToMonetizationRecord]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchLeaveRecords(selectedEmployee);
    } else {
      fetchAllLeaves();
    }
  }, [selectedEmployee, fetchLeaveRecords, fetchAllLeaves]);

  // Table data — show records only when an employee is selected; filter by inclusive date range
  const filteredLeaves = useMemo(() => {
    if (!selectedEmployee) return [];
    return allLeaves.filter((item) => {
      if (item.employee.toLowerCase() !== selectedEmployee.fullName.toLowerCase()) return false;
      if (dateFrom && item.from && item.from < dateFrom) return false;
      if (dateTo && item.to && item.to > dateTo) return false;
      return true;
    });
  }, [selectedEmployee, allLeaves, dateFrom, dateTo]);

  const filteredMonetizations = useMemo(() => {
    if (!selectedEmployee) return [];
    return allMonetizations.filter((item) => {
      if (item.employee.toLowerCase() !== selectedEmployee.fullName.toLowerCase()) return false;
      if (dateFrom && item.dateFiled && item.dateFiled < dateFrom) return false;
      if (dateTo && item.dateFiled && item.dateFiled > dateTo) return false;
      return true;
    });
  }, [selectedEmployee, allMonetizations, dateFrom, dateTo]);

  // Toast mixin for small bottom-end toasts
  const Toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  const handleClear = () => {
    if (selectedEmployee) {
      Toast.fire({
        icon: "success",
        title: `Cleared records for ${selectedEmployee.fullName}`,
      });
      setActiveTab("regularLeaves");
    }

    setInputValue("");
    setSelectedEmployee(null);
    setEditingRecord(null);
    setDateFrom("");
    setDateTo("");
  };

  // --- CRUD Handlers ---

  const handleSubmitLeave = async (leave: {
    id?: number;
    employee: string;
    dateFiled: string;
    from: string;
    to: string;
    leaveType: string;
    status: string;
    noOfDays?: string;
    details?: string;
    commutation?: string;
    recommendingApprovalById?: number | null;
    authorizedOfficialId?: number | null;
    approvedById?: number | null;
    recommendationStatus?: string;
    recommendationMessage?: string;
    approvedStatus?: string;
    approvalMessage?: string;
    dueExigencyService?: boolean;
  }) => {
    if (!selectedEmployee) {
      Swal.fire("Error", "Please select an employee first.", "error");
      return;
    }

    const isMonetization = leave.leaveType === "Leave Monetization";
    const isUpdate = leave.id && leave.id > 0;

    const payload = {
      employeeId: Number(selectedEmployee.employeeId),
      dateFiled: leave.dateFiled,
      leaveType: leave.leaveType,
      startDate: isMonetization ? null : leave.from || null,
      endDate: isMonetization ? null : leave.to || null,
      noOfDays: isMonetization ? (Number(leave.noOfDays) || null) : null,
      commutation: leave.commutation || null,
      details: leave.details || null,
      status: leave.status || "Pending",
      recommendingApprovalById: leave.recommendingApprovalById ?? null,
      authorizedOfficialId: leave.authorizedOfficialId ?? null,
      approvedById: leave.approvedById ?? null,
      recommendationStatus: leave.recommendationStatus ?? null,
      recommendationMessage: leave.recommendationMessage ?? null,
      approvedStatus: leave.approvedStatus ?? null,
      approvalMessage: leave.approvalMessage ?? null,
      dueExigencyService: leave.dueExigencyService ?? null,
    };

    try {
      const url = isUpdate
        ? `${API_BASE_URL_HRM}/api/leave-application/update/${leave.id}`
        : `${API_BASE_URL_HRM}/api/leave-application/create`;
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetchWithAuth(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("API request failed");

      Toast.fire({ icon: "success", title: isUpdate ? "Record updated!" : "Record saved!" });
      setEditingRecord(null);
      setActiveTab(isMonetization ? "leaveMonetization" : "regularLeaves");
      await fetchLeaveRecords(selectedEmployee);
    } catch (err) {
      console.error("Error saving leave application:", err);
      Swal.fire("Error", "Failed to save leave application. Please try again.", "error");
    }
  };

  const handleEditLeave = (record: LeaveRecord) => {
    const raw = rawDtos.find((d) => d.leaveApplicationId === record.id);
    setEditingRecord({
      id: record.id,
      dateFiled: record.dateFiled,
      leaveType: record.leaveType,
      from: record.from,
      to: record.to,
      noOfDays: "",
      commutation: record.commutation || "requested",
      details: record.details || "",
      status: record.status,
      recommendingApprovalById: raw?.recommendingApprovalById ?? null,
      authorizedOfficialId: raw?.authorizedOfficialId ?? null,
      approvedById: raw?.approvedById ?? null,
      recommendationStatus: raw?.recommendationStatus ?? "",
      recommendationMessage: raw?.recommendationMessage ?? "",
      approvedStatus: raw?.approvedStatus ?? "",
      approvalMessage: raw?.approvalMessage ?? "",
      dueExigencyService: raw?.dueExigencyService ?? false,
    });
    setActiveTab("apply");
  };

  const handleDeleteLeave = (record: LeaveRecord) => {
    Swal.fire({
      title: "Delete Leave Record?",
      text: `Remove "${record.leaveType}" for ${record.employee}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-application/delete/${record.id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete failed");
          setAllLeaves((prev) => prev.filter((l) => l.id !== record.id));
          Toast.fire({ icon: "success", title: "Leave record deleted!" });
        } catch (err) {
          console.error("Error deleting leave record:", err);
          Swal.fire("Error", "Failed to delete leave record.", "error");
        }
      }
    });
  };

  const handleEditMonetization = (record: LeaveMonetizationRecord) => {
    const raw = rawDtos.find((d) => d.leaveApplicationId === record.id);
    setEditingRecord({
      id: record.id,
      dateFiled: record.dateFiled,
      leaveType: record.leaveType,
      from: "",
      to: "",
      noOfDays: String(record.noOfDays),
      commutation: "requested",
      details: record.details || "",
      status: record.status,
      recommendingApprovalById: raw?.recommendingApprovalById ?? null,
      authorizedOfficialId: raw?.authorizedOfficialId ?? null,
      approvedById: raw?.approvedById ?? null,
      recommendationStatus: raw?.recommendationStatus ?? "",
      recommendationMessage: raw?.recommendationMessage ?? "",
      approvedStatus: raw?.approvedStatus ?? "",
      approvalMessage: raw?.approvalMessage ?? "",
      dueExigencyService: raw?.dueExigencyService ?? false,
    });
    setActiveTab("apply");
  };

  const handleDeleteMonetization = (record: LeaveMonetizationRecord) => {
    Swal.fire({
      title: "Delete Monetization Record?",
      text: `Remove monetization for ${record.employee} (${record.noOfDays} day(s))?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-application/delete/${record.id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete failed");
          setAllMonetizations((prev) => prev.filter((m) => m.id !== record.id));
          Toast.fire({ icon: "success", title: "Monetization record deleted!" });
        } catch (err) {
          console.error("Error deleting monetization record:", err);
          Swal.fire("Error", "Failed to delete monetization record.", "error");
        }
      }
    });
  };

  const handleClearForm = () => setEditingRecord(null);

  return (
    <div className={modalStyles.Modal}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.mainTitle}>HR Leave Application</h2>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={styles.EmploymentRecord}>
            {/* Sticky Header */}
            <div className={styles.stickyHeader}>
              {/* Search + Date Range — all on one row */}
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                {/* Inclusive Date From */}
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label htmlFor="leave-date-from">Inclusive Date From</label>
                  <input
                    id="leave-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                {/* Inclusive Date To */}
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label htmlFor="leave-date-to">Inclusive Date To</label>
                  <input
                    id="leave-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                {/* Employee Search */}
                <div className={styles.formGroup} style={{ flex: 1, minWidth: "220px", marginRight: "0.5rem" }}>
                  <label htmlFor="leave-employee">Employee Name</label>
                  <input
                    id="leave-employee"
                    type="text"
                    list="leave-employee-list"
                    placeholder="Employee No / Last Name"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      const match = employees.find(
                        (emp) =>
                          `[${emp.employeeNo}] ${emp.fullName}`.toLowerCase() ===
                          e.target.value.toLowerCase()
                      );
                      if (match) {
                        setSelectedEmployee(match);
                      } else {
                        setSelectedEmployee(null);
                      }
                    }}
                    className={styles.searchInput}
                    style={{ width: "100%" }}
                  />
                  <datalist id="leave-employee-list">
                    {employees.map((emp) => (
                      <option
                        key={emp.employeeNo}
                        value={`[${emp.employeeNo}] ${emp.fullName}`}
                      />
                    ))}
                  </datalist>
                </div>

                {/* Clear button */}
                <div style={{ alignSelf: "flex-end", marginBottom: "20px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {isLoading && <span style={{ fontSize: "0.8rem", color: "#666" }}>Loading...</span>}
                  <button onClick={handleClear} className={styles.clearButton}>
                    Clear
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className={styles.tabsHeader}>
                <button
                  className={activeTab === "regularLeaves" ? styles.active : ""}
                  onClick={() => setActiveTab("regularLeaves")}
                >
                  Regular Leaves
                </button>
                <button
                  className={activeTab === "leaveMonetization" ? styles.active : ""}
                  onClick={() => setActiveTab("leaveMonetization")}
                >
                  Leave Monetization
                </button>
                <button
                  className={activeTab === "apply" ? styles.active : ""}
                  onClick={() => {
                    setEditingRecord(null);
                    setActiveTab("apply");
                  }}
                >
                  Application
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === "regularLeaves" && (
                <>
                  <h3>
                    {selectedEmployee
                      ? `Regular Leaves for "[${selectedEmployee.employeeNo}] ${selectedEmployee.fullName}"`
                      : "Select an employee to view Regular Leaves"}
                  </h3>

                  {!selectedEmployee ? (
                    <p>Please select an employee to view leave records.</p>
                  ) : filteredLeaves.length > 0 ? (
                    <LeaveApplicationTable
                      data={filteredLeaves}
                      onEdit={handleEditLeave}
                      onDelete={handleDeleteLeave}
                    />
                  ) : (
                    <p>No regular leave records found.</p>
                  )}
                </>
              )}

              {activeTab === "leaveMonetization" && (
                <>
                  <h3>
                    {selectedEmployee
                      ? `Leave Monetization for "[${selectedEmployee.employeeNo}] ${selectedEmployee.fullName}"`
                      : "Select an employee to view Leave Monetization"}
                  </h3>

                  {!selectedEmployee ? (
                    <p>Please select an employee to view monetization records.</p>
                  ) : filteredMonetizations.length > 0 ? (
                    <LeaveMonetizationTable
                      data={filteredMonetizations}
                      onEdit={handleEditMonetization}
                      onDelete={handleDeleteMonetization}
                    />
                  ) : (
                    <p>No leave monetization records found.</p>
                  )}
                </>
              )}

              {activeTab === "apply" && (
                <>
                  <h3>
                    {editingRecord?.id
                      ? `Edit Leave Record${selectedEmployee ? ` for "[${selectedEmployee.employeeNo}] ${selectedEmployee.fullName}"` : ""}`
                      : `Apply Leave${selectedEmployee ? ` for "[${selectedEmployee.employeeNo}] ${selectedEmployee.fullName}"` : ""}`}
                  </h3>
                  <LeaveApplication
                    employeeName={selectedEmployee?.fullName ?? ""}
                    editRecord={editingRecord}
                    employees={employees}
                    onSubmitLeave={handleSubmitLeave}
                    onClear={handleClearForm}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
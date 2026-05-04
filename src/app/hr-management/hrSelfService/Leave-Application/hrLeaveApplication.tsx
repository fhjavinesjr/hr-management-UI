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
import ApprovalSection, { ApprovalSectionData } from "@/lib/approvalSection/approvalSection";
import useSalaryPeriodRange from "@/lib/utils/useSalaryPeriodRange";

const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;
const API_BASE_URL_ADMINISTRATIVE = process.env.NEXT_PUBLIC_API_BASE_URL_ADMINISTRATIVE ?? "";

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

interface MonetizationRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  dateFiled: string;
  noOfDaysSL: number;
  noOfDaysVL: number;
  totalDays: number;
  slBalanceBefore: number | null;
  vlBalanceBefore: number | null;
  slBalanceAfter: number | null;
  vlBalanceAfter: number | null;
  reason: string | null;
  recommendationStatus: string;
  recommendedById: number | null;
  recommendationRemarks: string | null;
  approvalStatus: string;
  approvedById: number | null;
  approvalRemarks: string | null;
  payrollIncluded: boolean;
}

interface ApiMonetizationDTO {
  leaveMonetizationId: number;
  employeeId: number;
  employeeNo: string | null;
  employeeName: string | null;
  dateFiled: string | null;
  noOfDaysSL: number | null;
  noOfDaysVL: number | null;
  totalDays: number | null;
  slBalanceBefore: number | null;
  vlBalanceBefore: number | null;
  slBalanceAfter: number | null;
  vlBalanceAfter: number | null;
  reason: string | null;
  recommendationStatus: string | null;
  recommendedById: number | null;
  recommendationRemarks: string | null;
  approvalStatus: string | null;
  approvedById: number | null;
  approvalRemarks: string | null;
  payrollIncluded: boolean | null;
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
  const { fromDate: periodFrom, toDate: periodTo } =
    useSalaryPeriodRange(API_BASE_URL_ADMINISTRATIVE, "LEAVE");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sync salary period dates into the date filter once resolved
  useEffect(() => {
    if (periodFrom) setDateFrom(periodFrom);
    if (periodTo) setDateTo(periodTo);
  }, [periodFrom, periodTo]);

  const [allLeaves, setAllLeaves] = useState<LeaveRecord[]>([]);
  const [allMonetizations, setAllMonetizations] = useState<MonetizationRecord[]>([]);
  const [showMonetizationForm, setShowMonetizationForm] = useState(false);
  const [editingMonetizationId, setEditingMonetizationId] = useState<number | null>(null);
  const [isLoadingMonetization, setIsLoadingMonetization] = useState(false);
  const [monetizationForm, setMonetizationForm] = useState({ dateFiled: new Date().toISOString().split("T")[0], noOfDaysSL: "", noOfDaysVL: "", reason: "" });
  const [monetizationApprovalData, setMonetizationApprovalData] = useState<ApprovalSectionData>({
    recommendationStatus: "Pending",
    recommendationMessage: "",
    recommendingApprovalById: null,
    authorizedOfficialId: null,
    approvedById: null,
    approvedStatus: "Pending",
    approvalMessage: "",
    dueExigencyService: false,
  });
  const [monetizationApprovalInitialValues, setMonetizationApprovalInitialValues] = useState<Partial<ApprovalSectionData> | undefined>(undefined);

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

  const dtoToMonetizationRecord = useCallback((dto: ApiMonetizationDTO): MonetizationRecord => ({
    id: dto.leaveMonetizationId,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName ?? `Employee #${dto.employeeId}`,
    dateFiled: dto.dateFiled ?? "",
    noOfDaysSL: dto.noOfDaysSL ?? 0,
    noOfDaysVL: dto.noOfDaysVL ?? 0,
    totalDays: dto.totalDays ?? 0,
    slBalanceBefore: dto.slBalanceBefore,
    vlBalanceBefore: dto.vlBalanceBefore,
    slBalanceAfter: dto.slBalanceAfter,
    vlBalanceAfter: dto.vlBalanceAfter,
    reason: dto.reason,
    recommendationStatus: dto.recommendationStatus ?? "Pending",
    recommendedById: dto.recommendedById ?? null,
    recommendationRemarks: dto.recommendationRemarks ?? null,
    approvalStatus: dto.approvalStatus ?? "Pending",
    approvedById: dto.approvedById ?? null,
    approvalRemarks: dto.approvalRemarks ?? null,
    payrollIncluded: dto.payrollIncluded ?? false,
  }), []);

  // Fetch all regular leave records (no employee selected)
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
    } catch (err) {
      console.error("Error fetching all leave records:", err);
    } finally {
      setIsLoading(false);
    }
  }, [employees, dtoToLeaveRecord]);

  // Fetch regular leave records for a specific employee
  const fetchLeaveRecords = useCallback(async (employee: Employee) => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-application/get-all/${employee.employeeId}`);
      if (!res.ok) throw new Error("Failed to fetch leave records");
      const data: ApiLeaveDTO[] = await res.json();
      setRawDtos(data);
      setAllLeaves(data.filter((d) => d.leaveType !== "Leave Monetization").map((d) => dtoToLeaveRecord(d, employee.fullName)));
    } catch (err) {
      console.error("Error fetching leave records:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dtoToLeaveRecord]);

  // Fetch all monetization records from the dedicated endpoint
  const fetchAllMonetizations = useCallback(async () => {
    setIsLoadingMonetization(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-monetization/get-all`);
      if (!res.ok) throw new Error("Failed to fetch monetization records");
      const data: ApiMonetizationDTO[] = await res.json();
      setAllMonetizations(data.map(dtoToMonetizationRecord));
    } catch (err) {
      console.error("Error fetching monetization records:", err);
    } finally {
      setIsLoadingMonetization(false);
    }
  }, [dtoToMonetizationRecord]);

  // Fetch monetization records for a specific employee
  const fetchMonetizationsByEmployee = useCallback(async (employee: Employee) => {
    setIsLoadingMonetization(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-monetization/get-all/${employee.employeeId}`);
      if (!res.ok) throw new Error("Failed to fetch monetization records");
      const data: ApiMonetizationDTO[] = await res.json();
      setAllMonetizations(data.map(dtoToMonetizationRecord));
    } catch (err) {
      console.error("Error fetching monetization records:", err);
    } finally {
      setIsLoadingMonetization(false);
    }
  }, [dtoToMonetizationRecord]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchLeaveRecords(selectedEmployee);
      fetchMonetizationsByEmployee(selectedEmployee);
    } else {
      fetchAllLeaves();
      fetchAllMonetizations();
    }
  }, [selectedEmployee, fetchLeaveRecords, fetchAllLeaves, fetchMonetizationsByEmployee, fetchAllMonetizations]);

  // Table data — filter by inclusive date range when employee is selected
  const filteredLeaves = useMemo(() => {
    if (!selectedEmployee) return [];
    return allLeaves.filter((item) => {
      if (dateFrom && item.from && item.from < dateFrom) return false;
      if (dateTo && item.to && item.to > dateTo) return false;
      return true;
    });
  }, [selectedEmployee, allLeaves, dateFrom, dateTo]);

  const filteredMonetizations = useMemo(() => {
    return allMonetizations.filter((item) => {
      if (dateFrom && item.dateFiled && item.dateFiled < dateFrom) return false;
      if (dateTo && item.dateFiled && item.dateFiled > dateTo) return false;
      return true;
    });
  }, [allMonetizations, dateFrom, dateTo]);

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
    setEditingMonetizationId(null);
    setMonetizationApprovalInitialValues(undefined);
    setMonetizationApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false });
    setDateFrom("");
    setDateTo("");
    setShowMonetizationForm(false);
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

    // Overlapping inclusive dates check — skip the current record when editing
    if (leave.from && leave.to) {
      const overlap = allLeaves.some(
        (existing) =>
          existing.id !== leave.id &&
          existing.from && existing.to &&
          leave.from <= existing.to &&
          leave.to >= existing.from
      );
      if (overlap) {
        Swal.fire("Duplicate", "The inclusive dates overlap with an existing leave application for this employee.", "warning");
        return;
      }
    }

    const isUpdate = leave.id && leave.id > 0;

    const payload = {
      employeeId: Number(selectedEmployee.employeeId),
      dateFiled: leave.dateFiled,
      leaveType: leave.leaveType,
      startDate: leave.from || null,
      endDate: leave.to || null,
      noOfDays: null,
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
      if (!res.ok) throw new Error(await res.text());

      Toast.fire({ icon: "success", title: isUpdate ? "Record updated!" : "Record saved!" });
      setEditingRecord(null);
      setActiveTab("regularLeaves");
      await fetchLeaveRecords(selectedEmployee);
    } catch (err) {
      console.error("Error saving leave application:", err);
      Swal.fire("Error", err instanceof Error ? err.message : "Failed to save leave application. Please try again.", "error");
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

  const handleDeleteMonetization = (record: MonetizationRecord) => {
    Swal.fire({
      title: "Delete Monetization Record?",
      text: `Remove monetization for ${record.employeeName} (${record.totalDays} day(s))?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-monetization/delete/${record.id}`, { method: "DELETE" });
          if (!res.ok) throw new Error(await res.text());
          setAllMonetizations((prev) => prev.filter((m) => m.id !== record.id));
          Toast.fire({ icon: "success", title: "Monetization record deleted!" });
        } catch (err) {
          Swal.fire("Error", err instanceof Error ? err.message : "Failed to delete.", "error");
        }
      }
    });
  };

  const handleCreateMonetization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      Swal.fire("Error", "Please select an employee first.", "error");
      return;
    }
    const noOfDaysSL = parseFloat(monetizationForm.noOfDaysSL) || 0;
    const noOfDaysVL = parseFloat(monetizationForm.noOfDaysVL) || 0;
    if (noOfDaysSL + noOfDaysVL <= 0) {
      Swal.fire("Validation", "Please enter at least some days to monetize.", "warning");
      return;
    }
    const payload = {
      employeeId: Number(selectedEmployee.employeeId),
      dateFiled: monetizationForm.dateFiled || new Date().toISOString().split("T")[0],
      noOfDaysSL,
      noOfDaysVL,
      reason: monetizationForm.reason,
      recommendationStatus: monetizationApprovalData.recommendationStatus,
      recommendationRemarks: monetizationApprovalData.recommendationMessage,
      recommendedById: monetizationApprovalData.recommendingApprovalById,
      approvalStatus: monetizationApprovalData.approvedStatus,
      approvalRemarks: monetizationApprovalData.approvalMessage,
      approvedById: monetizationApprovalData.approvedById,
    };
    try {
      const isUpdate = editingMonetizationId !== null;
      const url = isUpdate
        ? `${API_BASE_URL_HRM}/api/leave-monetization/update/${editingMonetizationId}`
        : `${API_BASE_URL_HRM}/api/leave-monetization/create`;
      const method = isUpdate ? "PUT" : "POST";
      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: isUpdate ? "Monetization updated!" : "Monetization filed!" });
      setMonetizationForm({ dateFiled: new Date().toISOString().split("T")[0], noOfDaysSL: "", noOfDaysVL: "", reason: "" });
      setEditingMonetizationId(null);
      setMonetizationApprovalInitialValues(undefined);
      setMonetizationApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false });
      setShowMonetizationForm(false);
      fetchMonetizationsByEmployee(selectedEmployee);
    } catch (err) {
      Swal.fire("Error", err instanceof Error ? err.message : "Failed to save monetization.", "error");
    }
  };

  const handleEditMonetization = (record: MonetizationRecord) => {
    setMonetizationForm({
      dateFiled: record.dateFiled,
      noOfDaysSL: String(record.noOfDaysSL),
      noOfDaysVL: String(record.noOfDaysVL),
      reason: record.reason ?? "",
    });
    const initVals: Partial<ApprovalSectionData> = {
      approvedStatus: record.approvalStatus ?? "Pending",
      recommendationStatus: record.recommendationStatus ?? "Pending",
      approvalMessage: record.approvalRemarks ?? "",
      recommendationMessage: record.recommendationRemarks ?? "",
      approvedById: record.approvedById ?? null,
      recommendingApprovalById: record.recommendedById ?? null,
      authorizedOfficialId: null,
      dueExigencyService: false,
    };
    setMonetizationApprovalInitialValues(initVals);
    setMonetizationApprovalData(prev => ({ ...prev, ...initVals }));
    setEditingMonetizationId(record.id);
    setShowMonetizationForm(true);
  };

  const handleClearForm = () => {
    setEditingRecord(null);
    setActiveTab("regularLeaves");
  };

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
                      setShowMonetizationForm(false);
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h3 style={{ margin: 0 }}>
                      {selectedEmployee
                        ? `Leave Monetization for "[${selectedEmployee.employeeNo}] ${selectedEmployee.fullName}"`
                        : "Select an employee to view Leave Monetization"}
                    </h3>
                    {selectedEmployee && !showMonetizationForm && (
                      <button
                        className={styles.clearButton}
                        style={{ background: "#28a745", color: "#fff", border: "none" }}
                        onClick={() => { setEditingMonetizationId(null); setMonetizationApprovalInitialValues(undefined); setMonetizationApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false }); setMonetizationForm({ dateFiled: new Date().toISOString().split("T")[0], noOfDaysSL: "", noOfDaysVL: "", reason: "" }); setShowMonetizationForm(true); }}
                      >
                        + File Monetization
                      </button>
                    )}
                  </div>

                  {!selectedEmployee ? (
                    <p>Please select an employee to view monetization records.</p>
                  ) : showMonetizationForm ? (
                    <form onSubmit={handleCreateMonetization} style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <h4 style={{ margin: 0 }}>{editingMonetizationId ? "Edit Leave Monetization" : "File Leave Monetization"}</h4>
                      <div className={styles.formGroup}>
                        <label>Date Filed</label>
                        <input type="date" className={styles.searchInput}
                          value={monetizationForm.dateFiled} required
                          onChange={(e) => setMonetizationForm((f) => ({ ...f, dateFiled: e.target.value }))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>VL Days to Monetize <small>(deducted first per CSC rules)</small></label>
                        <input type="number" min={0} step={0.5} className={styles.searchInput}
                          placeholder="0" value={monetizationForm.noOfDaysVL}
                          onChange={(e) => setMonetizationForm((f) => ({ ...f, noOfDaysVL: e.target.value }))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>SL Days to Monetize</label>
                        <input type="number" min={0} step={0.5} className={styles.searchInput}
                          placeholder="0" value={monetizationForm.noOfDaysSL}
                          onChange={(e) => setMonetizationForm((f) => ({ ...f, noOfDaysSL: e.target.value }))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Total Days (min. 10 required)</label>
                        <input type="text" readOnly className={styles.searchInput}
                          value={((parseFloat(monetizationForm.noOfDaysSL) || 0) + (parseFloat(monetizationForm.noOfDaysVL) || 0)).toFixed(1)} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Reason</label>
                        <textarea className={styles.searchInput} rows={3} required
                          placeholder="State reason for monetization..."
                          value={monetizationForm.reason}
                          onChange={(e) => setMonetizationForm((f) => ({ ...f, reason: e.target.value }))} />
                      </div>
                      <ApprovalSection key={editingMonetizationId ?? 0} initialValues={monetizationApprovalInitialValues} onDataChange={setMonetizationApprovalData} showAuthorizedOfficial={false} showDueExigency={false} />
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button type="submit" className={styles.clearButton} style={{ background: "#28a745", color: "#fff", border: "none" }}>{editingMonetizationId ? "Update" : "Submit"}</button>
                        <button type="button" className={styles.clearButton} onClick={() => { setShowMonetizationForm(false); setEditingMonetizationId(null); setMonetizationApprovalInitialValues(undefined); setMonetizationApprovalData({ recommendationStatus: "Pending", recommendationMessage: "", recommendingApprovalById: null, authorizedOfficialId: null, approvedById: null, approvedStatus: "Pending", approvalMessage: "", dueExigencyService: false }); }}>Cancel</button>
                      </div>
                    </form>
                  ) : isLoadingMonetization ? (
                    <p>Loading...</p>
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
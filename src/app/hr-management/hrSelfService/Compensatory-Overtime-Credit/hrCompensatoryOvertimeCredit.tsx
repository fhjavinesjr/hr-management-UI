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
import ApprovalSection, {
  ApprovalSectionData,
} from "@/lib/approvalSection/approvalSection";

const API_BASE_URL_HRM = runtimeConfig.getApiUrl("hrm");

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
  actualHoursWorked?: number | null;
  cocMultiplier?: number | null;
}

interface OvertimeRequestDTO {
  overtimeRequestId: number;
  dateTimeFrom: string;
  dateTimeTo: string;
  totalHours: number;
  purpose: string;
  workType?: string;
  authorityReference?: string;
  netAuthorizedHours?: number;
}

interface FormState {
  dateFiled: string;
  dateWorked: string;
  hoursWorked: string;
  reason: string;
  workType: string;
  overtimeRequestId: string; // "" when not selected
  actualHoursWorked: string;
  cocMultiplier: string;
}

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function HRCompensatoryOvertimeCreditModule() {
  const canAdd = localStorageUtil.canAdd("hrm.ss.coc");
  const canEdit = localStorageUtil.canEdit("hrm.ss.coc");
  const canDelete = localStorageUtil.canDelete("hrm.ss.coc");
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [userRole, setUserRole] = useState<string | null>(null);
  const [records, setRecords] = useState<CocDTO[]>([]);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
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
  const [approvalInitialValues, setApprovalInitialValues] = useState<
    Partial<ApprovalSectionData> | undefined
  >(undefined);
  const [approvedOTRequests, setApprovedOTRequests] = useState<
    OvertimeRequestDTO[]
  >([]);
  const [isFetchingOT, setIsFetchingOT] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<FormState>({
    dateFiled: today,
    dateWorked: today,
    hoursWorked: "0",
    reason: "",
    workType: "",
    overtimeRequestId: "",
    actualHoursWorked: "",
    cocMultiplier: "",
  });

  const workTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...approvedOTRequests.map((request) => request.workType ?? ""),
            form.workType,
          ].filter(Boolean),
        ),
      ),
    [approvedOTRequests, form.workType],
  );

  // Load employees from localStorage
  useEffect(() => {
    const stored = localStorageUtil.getEmployees();
    if (stored && stored.length > 0) setEmployees(stored);
    const role = localStorageUtil.getEmployeeRole();
    const fullname = localStorageUtil.getEmployeeFullname();
    const empNo = localStorageUtil.getEmployeeNo();
    const employeeId = localStorageUtil.getEmployeeId();
    setUserRole(role);
    if (
      empNo &&
      ((!canAdd && !canEdit) || (canAdd && !canEdit) || (!canAdd && canEdit))
    ) {
      const empFromList = stored?.find((e) => e.employeeNo === empNo) ?? null;
      if (empFromList) {
        setSelectedEmployee(empFromList);
        setSearch(`[${empFromList.employeeNo}] ${empFromList.fullName}`);
      } else if (fullname) {
        const own: Employee = {
          employeeId: String(employeeId ?? ""),
          employeeNo: empNo,
          fullName: fullname,
          role: role ?? "",
          biometricNo: "",
          isSearched: false,
          isCleared: false,
        };
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
        e.employeeNo.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, employees]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (dateFrom && r.dateFiled && r.dateFiled < dateFrom) return false;
      if (dateTo && r.dateFiled && r.dateFiled > dateTo) return false;
      return true;
    });
  }, [records, dateFrom, dateTo]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const fetchBalance = useCallback(async (empId: string | number) => {
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/coc/balance/${empId}`,
      );
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
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/coc/get-all/${emp.employeeId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch COC records");
      const data: CocDTO[] = await res.json();
      setRecords(data);
    } catch {
      Toast.fire({ icon: "error", title: "Could not load COC records" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all approved OT/Holiday Duty authorities for the selected employee.
  // Work type is derived from the selected authority and is never manually selected in COC.
  const fetchApprovedAuthorities = useCallback(
    async (employeeId: string | number) => {
      setIsFetchingOT(true);
      try {
        const res = await fetchWithAuth(
          `${API_BASE_URL_HRM}/api/overtime-request/get-approved/${employeeId}`,
        );
        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data: OvertimeRequestDTO[] = await res.json();
        setApprovedOTRequests(data);

        if (data.length === 0) {
          Swal.fire({
            icon: "info",
            title: "No Approved Overtime/Duty Orders",
            text: "This employee has no approved overtime, holiday-duty, rest-day, or scheduled-day-off authority available for COC validation.",
          });
        }
      } catch {
        setApprovedOTRequests([]);
        Toast.fire({
          icon: "error",
          title: "Could not load approved overtime/duty orders",
        });
      } finally {
        setIsFetchingOT(false);
      }
    },
    [],
  );


  useEffect(() => {
    if (selectedEmployee) {
      fetchRecords(selectedEmployee);
      fetchBalance(selectedEmployee.employeeId);
      fetchApprovedAuthorities(selectedEmployee.employeeId);
    } else {
      setRecords([]);
      setAvailableBalance(null);
      setApprovedOTRequests([]);
    }
  }, [
    selectedEmployee,
    fetchRecords,
    fetchBalance,
    fetchApprovedAuthorities,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, selectedEmployee, itemsPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      Swal.fire({ icon: "warning", title: "No employee selected" });
      return;
    }
    if (!form.overtimeRequestId) {
      Swal.fire({
        icon: "warning",
        title: "Approved authority is required",
        text: "Select an approved Overtime / Duty Order before filing COC.",
      });
      return;
    }
    const hrs = parseFloat(form.hoursWorked);
    if (isNaN(hrs) || hrs <= 0) {
      Swal.fire({ icon: "warning", title: "Enter valid hours worked" });
      return;
    }

    const desiredRecommendation = (
      approvalData.recommendationStatus || "Pending"
    ).toLowerCase();
    const desiredFinalStatus = (
      approvalData.approvedStatus || "Pending"
    ).toLowerCase();
    const wantsRecommendation =
      desiredRecommendation === "approved" ||
      desiredRecommendation === "recommended";
    const wantsFinalDecision =
      desiredFinalStatus === "approved" ||
      desiredFinalStatus === "disapproved";

    if (wantsRecommendation && !approvalData.recommendingApprovalById) {
      Swal.fire({ icon: "warning", title: "Select the IS recommending officer" });
      return;
    }
    if (wantsFinalDecision && !approvalData.approvedById) {
      Swal.fire({ icon: "warning", title: "Select the final approving officer" });
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
        overtimeRequestId: form.overtimeRequestId
          ? Number(form.overtimeRequestId)
          : null,
        actualHoursWorked: form.actualHoursWorked
          ? Number(form.actualHoursWorked)
          : undefined,
        cocMultiplier: form.cocMultiplier
          ? Number(form.cocMultiplier)
          : undefined,
        status: approvalData.approvedStatus || "Pending",
        approvedById: approvalData.approvedById,
        approvalRemarks: approvalData.approvalMessage,
        recommendationStatus: approvalData.recommendationStatus || "Pending",
        recommendedById: approvalData.recommendingApprovalById,
        recommendationRemarks: approvalData.recommendationMessage,
      };
      const send = async (
        url: string,
        method: "POST" | "PUT",
        body: unknown,
      ) => {
        const response = await fetchWithAuth(url, {
          method,
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Request failed with HTTP ${response.status}`);
        }
        return response;
      };

      let savedId = editingId;

      if (editingId === null) {
        const response = await send(
          `${API_BASE_URL_HRM}/api/coc/create`,
          "POST",
          {
            ...payload,
            status: "Pending",
            approvedById: null,
            approvalRemarks: null,
            recommendationStatus: "Pending",
            recommendedById: null,
            recommendationRemarks: null,
          },
        );
        const metadata = (await response.json()) as { metaId?: number };
        savedId = metadata.metaId ?? null;
      } else {
        // HRM maintenance is independent of record status and applies the
        // exact recommendation/final status selected by the administrator.
        await send(
          `${API_BASE_URL_HRM}/api/coc/hrm-update/${editingId}`,
          "PUT",
          payload,
        );
      }

      if (!savedId) throw new Error("COC record ID is missing.");

      if (editingId === null) {
        // Creation first uses the employee-safe Pending state, then this HRM
        // endpoint applies the administrator's selected workflow values.
        await send(
          `${API_BASE_URL_HRM}/api/coc/hrm-update/${savedId}`,
          "PUT",
          payload,
        );
      }

      Toast.fire({
        icon: "success",
        title: editingId !== null
          ? "COC record updated"
          : "COC application filed successfully",
      });
      setForm({
        dateFiled: today,
        dateWorked: today,
        hoursWorked: "0",
        reason: "",
        workType: "",
        overtimeRequestId: "",
        actualHoursWorked: "",
        cocMultiplier: "",
      });
      await fetchApprovedAuthorities(selectedEmployee.employeeId);
      setEditingId(null);
      setApprovalInitialValues(undefined);
      setApprovalData({
        recommendationStatus: "Pending",
        recommendationMessage: "",
        recommendingApprovalById: null,
        authorizedOfficialId: null,
        approvedById: null,
        approvedStatus: "Pending",
        approvalMessage: "",
        dueExigencyService: false,
      });
      setActiveTab("table");
      fetchRecords(selectedEmployee);
      fetchBalance(selectedEmployee.employeeId);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to save COC record",
        text: String(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (r: CocDTO) => {
    const currentOvertimeRequestId = r.overtimeRequestId
      ? String(r.overtimeRequestId)
      : "";

    setForm({
      dateFiled: r.dateFiled ?? today,
      dateWorked: r.dateWorked ?? today,
      hoursWorked: String(r.hoursWorked),
      reason: r.reason ?? "",
      workType: r.workType ?? "",
      overtimeRequestId: currentOvertimeRequestId,
      actualHoursWorked:
        r.actualHoursWorked != null
          ? String(r.actualHoursWorked)
          : "",
      cocMultiplier:
        r.cocMultiplier != null ? String(r.cocMultiplier) : "",
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
    setApprovalData((prev) => ({ ...prev, ...initVals }));
    setEditingId(r.cocId!);
    setActiveTab("apply");

    if (selectedEmployee) {
      await fetchApprovedAuthorities(selectedEmployee.employeeId);
      setForm((prev) => ({
        ...prev,
        overtimeRequestId: currentOvertimeRequestId,
      }));
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
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/coc/hrm-delete/${cocId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "Record deleted" });
      if (selectedEmployee) {
        fetchRecords(selectedEmployee);
        fetchBalance(selectedEmployee.employeeId);
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: String(err) });
    }
  };

  const handlePrint = async (id?: number, status?: string) => {
    if (!id) return;
    const normalizedStatus = (status ?? "").toLowerCase();
    if (normalizedStatus !== "approved" && normalizedStatus !== "disapproved") {
      Toast.fire({
        icon: "warning",
        title: "Only approved/disapproved COC can be printed",
      });
      return;
    }

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/coc/report/${id}`,
      );
      if (!response.ok) throw new Error("Failed to generate COC certificate");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CertificateCOC_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Print failed", text: String(error) });
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
    setApprovalData({
      recommendationStatus: "Pending",
      recommendationMessage: "",
      recommendingApprovalById: null,
      authorizedOfficialId: null,
      approvedById: null,
      approvedStatus: "Pending",
      approvalMessage: "",
      dueExigencyService: false,
    });
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    setActiveTab("table");
  };

  const statusBadge = (status: string) => {
    const color =
      status === "Approved"
        ? "#16a34a"
        : status === "Disapproved"
          ? "#dc2626"
          : status === "Cancelled"
            ? "#6b7280"
          : "#ca8a04";
    return (
      <span style={{ color, fontWeight: 600, fontSize: "0.8rem" }}>
        {status}
      </span>
    );
  };

  return (
    <div className={modalStyles.Modal}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.mainTitle}>
            Compensatory Overtime Credit (COC)
          </h2>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={styles.EmploymentRecord}>
            <div className={styles.stickyHeader}>
              {/* Employee search */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label>Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label>Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div
                  className={styles.formGroup}
                  style={{ flex: 1, minWidth: "220px", position: "relative" }}
                >
                  <label>Search Employee</label>
                  <input
                    id="coc-employee"
                    type="text"
                    list={"coc-employee-list"}
                    placeholder="Employee No / Last Name"
                    value={search}
                    readOnly={
                      (!canAdd && !canEdit) ||
                      (canAdd && !canEdit) ||
                      (!canAdd && canEdit)
                    }
                    onChange={(e) => {
                      if (
                        (!canAdd && !canEdit) ||
                        (canAdd && !canEdit) ||
                        (!canAdd && canEdit)
                      )
                        return;
                      setSearch(e.target.value);
                      const match = employees.find(
                        (emp) =>
                          `[${emp.employeeNo}] ${emp.fullName}`.toLowerCase() ===
                          e.target.value.toLowerCase(),
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
                  {
                    <datalist id="coc-employee-list">
                      {employees.map((emp) => (
                        <option
                          key={emp.employeeNo}
                          value={`[${emp.employeeNo}] ${emp.fullName}`}
                        />
                      ))}
                    </datalist>
                  }
                </div>
                <div
                  style={{
                    alignSelf: "flex-end",
                    marginBottom: "20px",
                    marginLeft: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <button onClick={handleClear} className={styles.clearButton}>
                    Clear
                  </button>
                  {availableBalance !== null && (
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#2563eb",
                        fontSize: "0.9rem",
                      }}
                    >
                      Available COC Balance: {availableBalance.toFixed(2)} hrs
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className={styles.tabsHeader}>
                <button
                  className={activeTab === "table" ? styles.active : ""}
                  onClick={() => setActiveTab("table")}
                >
                  Records
                </button>
                {canAdd && (
                  <button
                    className={activeTab === "apply" ? styles.active : ""}
                    onClick={() => {
                      setEditingId(null);
                      setForm({
                        dateFiled: today,
                        dateWorked: today,
                        hoursWorked: "0",
                        reason: "",
                        workType: "",
                        overtimeRequestId: "",
                        actualHoursWorked: "",
                        cocMultiplier: "",
                      });
                      setApprovalInitialValues(undefined);
                      setApprovalData({
                        recommendationStatus: "Pending",
                        recommendationMessage: "",
                        recommendingApprovalById: null,
                        authorizedOfficialId: null,
                        approvedById: null,
                        approvedStatus: "Pending",
                        approvalMessage: "",
                        dueExigencyService: false,
                      });
                      setActiveTab("apply");
                    }}
                  >
                    File COC
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === "table" && (
                <>
                  <h3>
                    {selectedEmployee
                      ? `COC Records — ${selectedEmployee.fullName}`
                      : "Search and select an employee"}
                  </h3>
                  {isLoading && <p>Loading...</p>}
                  {!isLoading && selectedEmployee && records.length === 0 && (
                    <p>No COC records found.</p>
                  )}
                  <div className={tableStyles.paginationContainer}>
                    <div className={tableStyles.paginationLeft}>
                      <label>Rows per page: </label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        {[25, 50, 100, 300, 500].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <span className={tableStyles.recordInfo}>
                        Showing{" "}
                        {filteredRecords.length === 0 ? 0 : startIndex + 1} to{" "}
                        {Math.min(
                          startIndex + itemsPerPage,
                          filteredRecords.length,
                        )}{" "}
                        of {filteredRecords.length}
                      </span>
                    </div>
                    <div className={tableStyles.paginationRight}>
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={tableStyles.paginationBtn}
                      >
                        First
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className={tableStyles.paginationBtn}
                      >
                        Previous
                      </button>
                      <span className={tableStyles.pageIndicator}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className={tableStyles.paginationBtn}
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={tableStyles.paginationBtn}
                      >
                        Last
                      </button>
                    </div>
                  </div>
                  {!isLoading && filteredRecords.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "0.85rem",
                        }}
                      >
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
                          {paginatedRecords.map((r) => (
                            <tr
                              key={r.cocId}
                              style={{ borderBottom: "1px solid #e2e8f0" }}
                            >
                              <td style={td}>{r.dateFiled}</td>
                              <td style={td}>{r.dateWorked}</td>
                              <td style={td}>{r.hoursWorked}</td>
                              <td style={td}>
                                {(r.workType || "OVERTIME")
                                  .replaceAll("_", " ")
                                  .replace(/\b\w/g, (letter) =>
                                    letter.toUpperCase(),
                                  )}
                              </td>
                              <td style={td}>{r.reason}</td>
                              <td style={td}>{statusBadge(r.status)}</td>
                              <td style={td}>{r.approvalRemarks ?? "—"}</td>
                              <td style={td}>
                                {/* HRM Edit/Delete intentionally have no status condition. */}
                                {(r.status === "Approved" ||
                                  r.status === "Disapproved") && (
                                  <button
                                    onClick={() =>
                                      handlePrint(r.cocId, r.status)
                                    }
                                    style={btnPrint}
                                  >
                                    Print
                                  </button>
                                )}
                                {canEdit && (
                                  <button
                                    onClick={() => handleEdit(r)}
                                    style={btnEdit}
                                  >
                                    Edit
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDelete(r.cocId!)}
                                    style={btnDelete}
                                  >
                                    Delete
                                  </button>
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
                  <h3>
                    {editingId ? "Edit COC Record" : "File COC Application"}
                    {selectedEmployee ? ` — ${selectedEmployee.fullName}` : ""}
                  </h3>
                  {!selectedEmployee && (
                    <p style={{ color: "#dc2626" }}>
                      Please search and select an employee first.
                    </p>
                  )}
                  {selectedEmployee && (
                    <form
                      onSubmit={handleSubmit}
                      style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}
                    >
                      {editingId && (
                        <div
                          style={{
                            padding: "0.65rem 0.75rem",
                            border: "1px solid #bfdbfe",
                            borderRadius: 6,
                            background: "#eff6ff",
                            color: "#1e3a8a",
                            fontSize: "0.8rem",
                          }}
                        >
                          HRM administrative edit is available for every COC
                          status. Saving applies the recommendation and final
                          status currently selected below.
                        </div>
                      )}
                      <div className={styles.formGroup}>
                        <label>Date Filed</label>
                        <input
                          type="date"
                          value={form.dateFiled}
                          onChange={(e) =>
                            setForm({ ...form, dateFiled: e.target.value })
                          }
                          className={styles.inputField}
                          required
                        />
                      </div>
                      {
                        <div className={styles.formGroup}>
                          <label>
                            Reference Approved Overtime / Duty Order
                          </label>
                          {isFetchingOT && (
                            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                              Loading approved overtime requests...
                            </p>
                          )}
                          {!isFetchingOT &&
                            approvedOTRequests.length === 0 &&
                            !form.overtimeRequestId && (
                              <p style={{ fontSize: "0.8rem", color: "#dc2626" }}>
                                No approved overtime/duty orders found. File and approve an
                                Overtime or Duty Order first.
                              </p>
                            )}
                          {!isFetchingOT &&
                            approvedOTRequests.length === 0 &&
                            form.overtimeRequestId && (
                              <input
                                type="text"
                                value={`Saved approved authority #${form.overtimeRequestId}`}
                                className={styles.inputField}
                                readOnly
                              />
                            )}
                          {!isFetchingOT && approvedOTRequests.length > 0 && (
                            <select
                              value={form.overtimeRequestId}
                              onChange={async (e) => {
                                const value = e.target.value;
                                setForm((prev) => ({
                                  ...prev,
                                  overtimeRequestId: value,
                                  ...(value
                                    ? {}
                                    : {
                                        dateWorked: today,
                                        hoursWorked: "0",
                                        workType: "",
                                        reason: "",
                                        actualHoursWorked: "",
                                        cocMultiplier: "",
                                      }),
                                }));
                                if (!value || !selectedEmployee) return;
                                try {
                                  const res = await fetchWithAuth(
                                    `${API_BASE_URL_HRM}/api/coc/preview/${value}/${selectedEmployee.employeeId}`,
                                  );
                                  if (!res.ok)
                                    throw new Error(await res.text());
                                  const preview: {
                                    dateWorked: string;
                                    actualHoursWorked: number;
                                    cocMultiplier: number;
                                    creditedHours: number;
                                    workType: string;
                                  } = await res.json();

                                  const selectedAuthority =
                                    approvedOTRequests.find(
                                      (ot) =>
                                        String(ot.overtimeRequestId) === value,
                                    );

                                  setForm((prev) => ({
                                    ...prev,
                                    dateWorked: preview.dateWorked,
                                    hoursWorked: String(preview.creditedHours),
                                    workType: preview.workType,
                                    reason: selectedAuthority?.purpose ?? "",
                                    actualHoursWorked: String(
                                      preview.actualHoursWorked,
                                    ),
                                    cocMultiplier: String(
                                      preview.cocMultiplier,
                                    ),
                                  }));
                                  Toast.fire({
                                    icon: "success",
                                    title: `DTR validated: ${preview.actualHoursWorked.toFixed(2)} actual hrs × ${preview.cocMultiplier} = ${preview.creditedHours.toFixed(2)} COC hrs`,
                                  });
                                } catch (error) {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Unable to validate DTR",
                                    text:
                                      error instanceof Error
                                        ? error.message
                                        : String(error),
                                  });
                                  setForm((prev) => ({
                                    ...prev,
                                    overtimeRequestId: "",
                                    dateWorked: today,
                                    hoursWorked: "0",
                                    workType: "",
                                    reason: "",
                                    actualHoursWorked: "",
                                    cocMultiplier: "",
                                  }));
                                }
                              }}
                              className={styles.inputField}
                              required
                            >
                              <option value="">
                                — Select Approved Authority —
                              </option>
                              {form.overtimeRequestId &&
                                !approvedOTRequests.some(
                                  (ot) =>
                                    String(ot.overtimeRequestId) ===
                                    form.overtimeRequestId,
                                ) && (
                                  <option value={form.overtimeRequestId}>
                                    Saved approved authority #{form.overtimeRequestId}
                                  </option>
                                )}
                              {approvedOTRequests.map((ot) => (
                                <option
                                  key={ot.overtimeRequestId}
                                  value={ot.overtimeRequestId}
                                >
                                  {ot.authorityReference
                                    ? `${ot.authorityReference} — `
                                    : ""}
                                  {(ot.workType ?? "OVERTIME").replaceAll("_", " ")} —{" "}
                                  {ot.dateTimeFrom.substring(0, 16)} →{" "}
                                  {ot.dateTimeTo.substring(0, 16)} (
                                  {(ot.netAuthorizedHours ?? ot.totalHours).toFixed(2)} authorized hrs)
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      }
                      <div className={styles.formGroup}>
                        <label>
                          Work Type {editingId
                            ? "(HRM editable)"
                            : "(from approved authority)"}
                        </label>
                        {editingId ? (
                          <select
                            value={form.workType}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                workType: e.target.value,
                              }))
                            }
                            className={styles.inputField}
                            required
                          >
                            <option value="" disabled>
                              Select work type
                            </option>
                            {workTypeOptions.map((workType) => (
                              <option key={workType} value={workType}>
                                {workType.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={
                              form.workType
                                ? form.workType.replaceAll("_", " ")
                                : ""
                            }
                            placeholder="Select an approved authority first"
                            className={styles.inputField}
                            readOnly
                            required
                          />
                        )}
                      </div>
                      <div className={styles.formGroup}>
                        <label>
                          Date Worked {editingId
                            ? "(HRM editable)"
                            : "(from approved authority)"}
                        </label>
                        <input
                          type="date"
                          value={form.dateWorked}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              dateWorked: e.target.value,
                            }))
                          }
                          className={styles.inputField}
                          readOnly={!editingId}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>
                          COC Hours to Credit {editingId
                            ? "(HRM editable)"
                            : "(auto-computed)"}
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={form.hoursWorked}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              hoursWorked: e.target.value,
                            }))
                          }
                          className={styles.inputField}
                          readOnly={!editingId}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>
                          Purpose / Justification {editingId
                            ? "(HRM editable)"
                            : "(from approved authority)"}
                        </label>
                        <textarea
                          value={form.reason}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              reason: e.target.value,
                            }))
                          }
                          placeholder="Select an approved authority first"
                          className={styles.inputField}
                          rows={3}
                          readOnly={!editingId}
                          required
                        />
                      </div>
                      <ApprovalSection
                        key={editingId ?? 0}
                        initialValues={approvalInitialValues}
                        onDataChange={setApprovalData}
                        showAuthorizedOfficial={false}
                        showDueExigency={false}
                      />
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={styles.submitButton}
                        >
                          {isSubmitting ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className={styles.clearButton}
                          onClick={() => {
                            setEditingId(null);
                            setApprovalInitialValues(undefined);
                            setApprovalData({
                              recommendationStatus: "Pending",
                              recommendationMessage: "",
                              recommendingApprovalById: null,
                              authorizedOfficialId: null,
                              approvedById: null,
                              approvedStatus: "Pending",
                              approvalMessage: "",
                              dueExigencyService: false,
                            });
                            setActiveTab("table");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
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

const th: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 600,
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "6px 12px",
  verticalAlign: "middle",
};
const btnPrint: React.CSSProperties = {
  padding: "3px 8px",
  background: "#065f46",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.75rem",
  marginRight: "4px",
};
const btnEdit: React.CSSProperties = {
  padding: "3px 8px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.75rem",
  marginRight: "4px",
};
const btnDelete: React.CSSProperties = {
  padding: "3px 8px",
  background: "#6b7280",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.75rem",
};

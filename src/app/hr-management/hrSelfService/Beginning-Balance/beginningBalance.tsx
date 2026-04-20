"use client";

import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";

const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;
const API_BASE_URL_ADMINISTRATIVE = process.env.NEXT_PUBLIC_API_BASE_URL_ADMINISTRATIVE;

interface LeaveRow {
  leaveBeginningBalanceId?: number;
  leaveTypesId?: number;
  leaveType: string;
  balance: string;
  savedAsOfDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface CocState {
  cocBeginningBalanceId?: number;
  asOfDate: string;
  accumulatedHours: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export default function BeginningBalanceModule() {
  const [inputValue, setInputValue] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState("");
  const [leaveRows, setLeaveRows] = useState<LeaveRow[]>([]);
  const [coc, setCoc] = useState<CocState>({ asOfDate: "", accumulatedHours: "0" });

  const Toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  // Load employees from localStorage on mount
  useEffect(() => {
    const stored = localStorageUtil.getEmployees();
    if (stored && stored.length > 0) {
      setEmployees(stored);
    }
  }, []);

  const loadData = useCallback(async (employee: Employee) => {
    setIsLoading(true);
    try {
      // Fetch leave types from Administrative module
      const typesRes = await fetchWithAuth(
        `${API_BASE_URL_ADMINISTRATIVE}/api/leaveTypes/get-all`
      );
      if (!typesRes.ok) throw new Error("Failed to fetch leave types");
      const types: { leaveTypesId: number; code: string; name: string }[] =
        await typesRes.json();
      const filteredTypes = types.filter((t) => t.name !== "Leave Monetization");

      // Fetch existing leave beginning balances for this employee
      const balRes = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/leave-beginning-balance/get-all/${employee.employeeId}`
      );
      const existingBalances: {
        leaveBeginningBalanceId: number;
        leaveType: string;
        balance: number;
        asOfDate: string;
        createdAt: string | null;
        updatedAt: string | null;
      }[] = balRes.ok ? await balRes.json() : [];

      // Use the as-of date from the first existing record if available
      if (existingBalances.length > 0 && existingBalances[0].asOfDate) {
        setAsOfDate(existingBalances[0].asOfDate);
      }

      // Merge: one row per leave type, pre-filled from existing records
      const rows: LeaveRow[] = filteredTypes.map((lt) => {
        const existing = existingBalances.find((b) => b.leaveType === lt.name);
        return {
          leaveBeginningBalanceId: existing?.leaveBeginningBalanceId,
          leaveTypesId: lt.leaveTypesId,
          leaveType: lt.name,
          balance: existing ? String(existing.balance ?? 0) : "0",
          savedAsOfDate: existing?.asOfDate ?? null,
          createdAt: existing?.createdAt ?? null,
          updatedAt: existing?.updatedAt ?? null,
        };
      });
      setLeaveRows(rows);

      // Fetch COC beginning balance
      const cocRes = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/coc-beginning-balance/get/${employee.employeeId}`
      );
      if (cocRes.ok) {
        const cocData: {
          cocBeginningBalanceId: number;
          asOfDate: string;
          accumulatedHours: number;
          createdAt: string | null;
          updatedAt: string | null;
        } = await cocRes.json();
        setCoc({
          cocBeginningBalanceId: cocData.cocBeginningBalanceId,
          asOfDate: cocData.asOfDate ?? "",
          accumulatedHours: String(cocData.accumulatedHours ?? 0),
          createdAt: cocData.createdAt ?? null,
          updatedAt: cocData.updatedAt ?? null,
        });
      } else {
        setCoc({ asOfDate: "", accumulatedHours: "0" });
      }
    } catch (err) {
      console.error("Error loading beginning balance data:", err);
      Swal.fire("Error", "Failed to load data. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadData(selectedEmployee);
    } else {
      setLeaveRows([]);
      setCoc({ asOfDate: "", accumulatedHours: "0" });
      setAsOfDate("");
    }
  }, [selectedEmployee, loadData]);

  const handleClear = () => {
    setInputValue("");
    setSelectedEmployee(null);
    setAsOfDate("");
    setLeaveRows([]);
    setCoc({ asOfDate: "", accumulatedHours: "0" });
  };

  const handleBalanceChange = (index: number, value: string) => {
    setLeaveRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], balance: value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedEmployee) {
      Swal.fire("Error", "Please select an employee first.", "error");
      return;
    }
    if (!asOfDate) {
      Swal.fire("Error", "Please set an As Of Date.", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Save leave beginning balances (upsert all rows at once)
      const leavePayload = leaveRows.map((row) => ({
        leaveBeginningBalanceId: row.leaveBeginningBalanceId ?? null,
        employeeId: Number(selectedEmployee.employeeId),
        leaveTypesId: row.leaveTypesId ?? null,
        leaveType: row.leaveType,
        asOfDate: asOfDate,
        balance: parseFloat(row.balance) || 0,
      }));

      const leaveRes = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/leave-beginning-balance/save-all/${selectedEmployee.employeeId}`,
        { method: "POST", body: JSON.stringify(leavePayload) }
      );
      if (!leaveRes.ok) throw new Error("Failed to save leave beginning balances");

      // Save COC beginning balance (upsert)
      const cocPayload = {
        cocBeginningBalanceId: coc.cocBeginningBalanceId ?? null,
        employeeId: Number(selectedEmployee.employeeId),
        asOfDate: coc.asOfDate || null,
        accumulatedHours: parseFloat(coc.accumulatedHours) || 0,
      };

      const cocRes = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/coc-beginning-balance/save/${selectedEmployee.employeeId}`,
        { method: "POST", body: JSON.stringify(cocPayload) }
      );
      if (!cocRes.ok) throw new Error("Failed to save COC beginning balance");

      Toast.fire({ icon: "success", title: "Beginning balances saved!" });
      // Reload to refresh IDs after save
      await loadData(selectedEmployee);
    } catch (err) {
      console.error("Error saving beginning balances:", err);
      Swal.fire("Error", "Failed to save beginning balances. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={modalStyles.Modal}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.mainTitle}>Beginning Balance</h2>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={styles.EmploymentRecord}>

            {/* Sticky Header */}
            <div className={styles.stickyHeader}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>

                {/* Employee Search */}
                <div className={styles.formGroup} style={{ flex: 1, minWidth: "220px" }}>
                  <label htmlFor="bb-employee">Employee Name</label>
                  <input
                    id="bb-employee"
                    type="text"
                    list="bb-employee-list"
                    placeholder="Employee No / Last Name"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      const match = employees.find(
                        (emp) =>
                          `[${emp.employeeNo}] ${emp.fullName}`.toLowerCase() ===
                          e.target.value.toLowerCase()
                      );
                      setSelectedEmployee(match ?? null);
                    }}
                    className={styles.searchInput}
                    style={{ width: "100%" }}
                  />
                  <datalist id="bb-employee-list">
                    {employees.map((emp) => (
                      <option
                        key={emp.employeeNo}
                        value={`[${emp.employeeNo}] ${emp.fullName}`}
                      />
                    ))}
                  </datalist>
                </div>

                {/* Shared As Of Date */}
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label htmlFor="bb-as-of-date">As Of Date</label>
                  <input
                    id="bb-as-of-date"
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className={styles.searchInput}
                    disabled={!selectedEmployee}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ alignSelf: "flex-end", marginBottom: "20px", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {isLoading && (
                    <span style={{ fontSize: "0.8rem", color: "#666" }}>Loading...</span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!selectedEmployee || isLoading}
                    style={{
                      padding: "0.6rem 1.4rem",
                      backgroundColor: selectedEmployee && !isLoading ? "#28a745" : "#aaa",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: selectedEmployee && !isLoading ? "pointer" : "not-allowed",
                    }}
                  >
                    Save
                  </button>
                  <button onClick={handleClear} className={styles.clearButton}>
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {!selectedEmployee ? (
                <p>Please select an employee to enter beginning balances.</p>
              ) : (
                <>
                  <p style={{ fontWeight: 600, marginBottom: "1.5rem" }}>
                    Employee: [{selectedEmployee.employeeNo}] {selectedEmployee.fullName}
                  </p>

                  {/* Leave Balances Table */}
                  <h3 style={{ marginBottom: "0.5rem", color: "#5a67ba" }}>Leave Beginning Balances</h3>
                  <table className={styles.excelTable} style={{ maxWidth: "560px", marginBottom: "2rem" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", paddingLeft: "1rem", width: "70%" }}>
                          Leave Type
                        </th>
                        <th style={{ width: "30%" }}>Balance (Days)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRows.map((row, index) => (
                        <tr key={row.leaveType}>
                          <td style={{ textAlign: "left", paddingLeft: "1rem" }}>
                            {row.leaveType}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              value={row.balance}
                              onChange={(e) => handleBalanceChange(index, e.target.value)}
                              min={0}
                              step={0.001}
                              style={{
                                width: "110px",
                                textAlign: "right",
                                padding: "4px 6px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "0.9rem",
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* COC Beginning Balance */}
                  <h3 style={{ marginBottom: "0.5rem", color: "#5a67ba" }}>
                    Compensatory Overtime Credits (COC)
                  </h3>
                  <table className={styles.excelTable} style={{ maxWidth: "560px" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", paddingLeft: "1rem", width: "50%" }}>
                          As Of Date
                        </th>
                        <th style={{ width: "50%" }}>Accumulated Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: "left", paddingLeft: "1rem" }}>
                          <input
                            type="date"
                            value={coc.asOfDate}
                            onChange={(e) =>
                              setCoc((prev) => ({ ...prev, asOfDate: e.target.value }))
                            }
                            style={{
                              padding: "4px 6px",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              fontSize: "0.9rem",
                            }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            value={coc.accumulatedHours}
                            onChange={(e) =>
                              setCoc((prev) => ({ ...prev, accumulatedHours: e.target.value }))
                            }
                            min={0}
                            step={0.001}
                            style={{
                              width: "110px",
                              textAlign: "right",
                              padding: "4px 6px",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              fontSize: "0.9rem",
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* ── Audit Trail ─────────────────────────────────────── */}
                  {leaveRows.some((r) => r.createdAt) && (
                    <>
                      <h3 style={{ marginTop: "2.5rem", marginBottom: "0.5rem", color: "#5a67ba" }}>
                        Leave Balance — Audit Trail
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.5rem" }}>
                        Read-only. Shows the saved state per leave type with timestamps.
                      </p>
                      <table className={styles.excelTable} style={{ maxWidth: "860px", marginBottom: "2rem" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", paddingLeft: "1rem" }}>Leave Type</th>
                            <th>Balance (Days)</th>
                            <th>As Of Date</th>
                            <th>Date Created</th>
                            <th>Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveRows
                            .filter((r) => r.createdAt)
                            .map((row) => (
                              <tr key={row.leaveType}>
                                <td style={{ textAlign: "left", paddingLeft: "1rem" }}>{row.leaveType}</td>
                                <td style={{ textAlign: "right", paddingRight: "1rem" }}>
                                  {Number(row.balance).toFixed(3)}
                                </td>
                                <td>{row.savedAsOfDate ?? ""}</td>
                                <td style={{ color: "#555" }}>{row.createdAt ?? ""}</td>
                                <td style={{ color: "#555" }}>{row.updatedAt ?? ""}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {coc.createdAt && (
                    <>
                      <h3 style={{ marginBottom: "0.5rem", color: "#5a67ba" }}>
                        COC — Audit Trail
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.5rem" }}>
                        Read-only. Shows the saved COC state with timestamps.
                      </p>
                      <table className={styles.excelTable} style={{ maxWidth: "560px", marginBottom: "2rem" }}>
                        <thead>
                          <tr>
                            <th>Accumulated Hours</th>
                            <th>As Of Date</th>
                            <th>Date Created</th>
                            <th>Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: "right", paddingRight: "1rem" }}>
                              {Number(coc.accumulatedHours).toFixed(3)}
                            </td>
                            <td>{coc.asOfDate}</td>
                            <td style={{ color: "#555" }}>{coc.createdAt ?? ""}</td>
                            <td style={{ color: "#555" }}>{coc.updatedAt ?? ""}</td>
                          </tr>
                        </tbody>
                      </table>
                    </>
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

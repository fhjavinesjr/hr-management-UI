"use client";

import { runtimeConfig } from "@/lib/utils/runtimeConfig";
import React, { useState, useEffect, useMemo } from "react";
import styles from "@/styles/LeaveApplication.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import ApprovalSection, { ApprovalSectionData } from "@/lib/approvalSection/approvalSection";
import { Employee } from "@/lib/types/Employee";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";

const API_BASE_URL_ADMINISTRATIVE = runtimeConfig.getApiUrl("administrative");
const API_BASE_URL_HRM = runtimeConfig.getApiUrl("hrm");

interface LeaveBalanceDTO {
  employeeId: number;
  vacationLeaveBalance: number | null;
  sickLeaveBalance: number | null;
  splBalance: number | null;
  forcedLeaveBalance: number | null;
  lastProcessedPeriodEnd: string | null;
}

const fmt = (v: number | null | undefined): string =>
  v == null ? "\u2014" : v.toFixed(3);

function balanceLabelFor(leaveType: string): { label: string; key: keyof LeaveBalanceDTO } | null {
  switch (leaveType) {
    case "Vacation Leave": return { label: "VL Available", key: "vacationLeaveBalance" };
    case "Forced Leave":   return { label: "Forced Leave Remaining (this year)", key: "forcedLeaveBalance" };
    case "Sick Leave":     return { label: "SL Available", key: "sickLeaveBalance" };
    case "Special Privilege Leave": return { label: "SPL Available", key: "splBalance" };
    default: return null;
  }
}

interface EditRecord {
  id?: number;
  dateFiled?: string;
  leaveType?: string;
  from?: string;
  to?: string;
  noOfDays?: string | number;
  commutation?: string;
  details?: string;
  status?: string;
  recommendingApprovalById?: number | null;
  authorizedOfficialId?: number | null;
  approvedById?: number | null;
  recommendationStatus?: string;
  recommendationMessage?: string;
  approvedStatus?: string;
  approvalMessage?: string;
  dueExigencyService?: boolean;
}

interface LeaveApplicationProps {
  employeeName: string;
  employeeId?: string | null;
  editRecord?: EditRecord | null;
  onSubmitLeave: (leave: {
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
  }) => void;
  onClear?: () => void;
  employees?: Employee[];
}

const initialFormState = {
  dateFiled: "",
  leaveType: "",
  from: "",
  to: "",
  commutation: "notRequested",
  details: "",
  noOfDays: "",
};

export default function LeaveApplication({
  employeeName,
  employeeId,
  editRecord,
  onSubmitLeave,
  onClear,
  employees,
}: LeaveApplicationProps) {

  const [form, setForm] = useState(initialFormState);
  const [balance, setBalance] = useState<LeaveBalanceDTO | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [approvalData, setApprovalData] = useState<ApprovalSectionData>({
    recommendingApprovalById: null,
    authorizedOfficialId: null,
    approvedById: null,
    recommendationStatus: "Pending",
    recommendationMessage: "",
    approvedStatus: "Pending",
    approvalMessage: "",
    dueExigencyService: false,
  });

  // Stable reference — only changes when editRecord changes, preventing spurious effect re-fires
  const approvalInitialValues = useMemo(() => ({
    recommendingApprovalById: editRecord?.recommendingApprovalById,
    authorizedOfficialId: editRecord?.authorizedOfficialId,
    approvedById: editRecord?.approvedById,
    recommendationStatus: editRecord?.recommendationStatus ?? "Pending",
    recommendationMessage: editRecord?.recommendationMessage,
    approvedStatus: editRecord?.approvedStatus ?? "Pending",
    approvalMessage: editRecord?.approvalMessage,
    dueExigencyService: editRecord?.dueExigencyService,
  }), [editRecord]);

  // Populate form from editRecord when editing, or reset with today's date otherwise
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (editRecord) {
      setForm({
        dateFiled: editRecord.dateFiled || today,
        leaveType: editRecord.leaveType || "",
        from: editRecord.from || "",
        to: editRecord.to || "",
        commutation: editRecord.commutation || "notRequested",
        details: editRecord.details || "",
        noOfDays: editRecord.noOfDays != null ? String(editRecord.noOfDays) : "",
      });
    } else {
      setForm({ ...initialFormState, dateFiled: today });
    }
  }, [editRecord]);

  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const res = await fetchWithAuth(
          `${API_BASE_URL_ADMINISTRATIVE}/api/leaveTypes/get-all`
        );
        if (!res.ok) throw new Error("Failed to fetch leave types");
        const data: { leaveTypesId: number; code: string; name: string }[] =
          await res.json();
        // Leave Monetization is handled via its own dedicated form — exclude it here
        setLeaveTypes(data.map((lt) => lt.name).filter((name) => name !== "Leave Monetization"));
      } catch (err) {
        console.error("Error fetching leave types:", err);
      }
    };
    fetchLeaveTypes();
  }, []);

  const isMonetization = form.leaveType === "Leave Monetization";

  // Fetch balance whenever the selected employee changes
  useEffect(() => {
    if (!employeeId) { setBalance(null); return; }
    setIsBalanceLoading(true);
    fetchWithAuth(`${API_BASE_URL_HRM}/api/leave-balance/current/${employeeId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setBalance(data ?? null))
      .catch(() => setBalance(null))
      .finally(() => setIsBalanceLoading(false));
  }, [employeeId]);

  const balInfo = balanceLabelFor(form.leaveType);
  const displayBalance = balInfo && balance ? (balance[balInfo.key] as number | null) : null;
  const vlForForcedDisplay = form.leaveType === "Forced Leave" && balance ? balance.vacationLeaveBalance : null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeName) {
      alert("Please select an employee first.");
      return;
    }

    // Call the parent component callback with form values
    onSubmitLeave({
      id: editRecord?.id,
      employee: employeeName,
      dateFiled: form.dateFiled,
      from: isMonetization ? "" : form.from,
      to: isMonetization ? "" : form.to,
      leaveType: form.leaveType,
      status: approvalData.approvedStatus || editRecord?.status || "Pending",
      noOfDays: isMonetization ? form.noOfDays : "",
      details: form.details,
      commutation: form.commutation,
      recommendingApprovalById: approvalData.recommendingApprovalById,
      authorizedOfficialId: approvalData.authorizedOfficialId,
      approvedById: approvalData.approvedById,
      recommendationStatus: approvalData.recommendationStatus,
      recommendationMessage: approvalData.recommendationMessage,
      approvedStatus: approvalData.approvedStatus,
      approvalMessage: approvalData.approvalMessage,
      dueExigencyService: approvalData.dueExigencyService,
    });

    const today = new Date().toISOString().split("T")[0];
    setForm({ ...initialFormState, dateFiled: today });
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    setForm({ ...initialFormState, dateFiled: today });
    onClear?.();
  };

  return (
    <div id="leaveapplicationModal" className={modalStyles.Modal}>
      <form className={modalStyles.modalBody} onSubmit={handleSubmit}>
        {/* Date Filed */}
        <div className={styles.formGroup}>
          <label>Date Filed</label>
          <input
            type="date"
            name="dateFiled"
            value={form.dateFiled}
            onChange={handleChange}
            className={styles.inputBase}
            required
          />
        </div>

        {/* Leave Type */}
        <div className={styles.formGroup}>
          <label>Leave Type</label>
          <select
            name="leaveType"
            value={form.leaveType}
            onChange={handleChange}
            className={styles.selectBase}
            required
          >
            <option value="" disabled>
              Select
            </option>
            {leaveTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Balance indicator — shown after a leave type with a balance is selected */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: balInfo ? "1rem" : 0 }}>
          {balInfo && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: displayBalance !== null && displayBalance <= 0 ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${displayBalance !== null && displayBalance <= 0 ? "#fca5a5" : "#86efac"}`,
              borderRadius: "8px", padding: "0.5rem 1rem",
              fontSize: "0.9rem", fontWeight: 600,
              color: displayBalance !== null && displayBalance <= 0 ? "#dc2626" : "#15803d",
            }}>
              <span>{balInfo.label}:</span>
              <span>{isBalanceLoading ? "Loading…" : displayBalance !== null ? `${fmt(displayBalance)} day(s)` : "\u2014"}</span>
              {balance?.lastProcessedPeriodEnd && (
                <span style={{ fontWeight: 400, fontSize: "0.78rem", color: "#6b7280", marginLeft: "0.5rem" }}>
                  (as of {balance.lastProcessedPeriodEnd})
                </span>
              )}
            </div>
          )}
          {vlForForcedDisplay !== null && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: vlForForcedDisplay <= 0 ? "#fef2f2" : "#fefce8",
              border: `1px solid ${vlForForcedDisplay <= 0 ? "#fca5a5" : "#fde047"}`,
              borderRadius: "8px", padding: "0.5rem 1rem",
              fontSize: "0.9rem", fontWeight: 600,
              color: vlForForcedDisplay <= 0 ? "#dc2626" : "#854d0e",
            }}>
              <span>VL Available (charged concurrently):</span>
              <span>{isBalanceLoading ? "Loading…" : `${fmt(vlForForcedDisplay)} day(s)`}</span>
            </div>
          )}
        </div>

        {/* Inclusive Dates for normal leaves */}
        {!isMonetization && (
          <div className={styles.formGroup}>
            <label className={styles.labelInclusiveDate}>Inclusive Date</label>

            {/* From */}
            <div className={styles.dateItem}>
              <label>From:</label>
              <input
                type="date"
                name="from"
                value={form.from}
                onChange={handleChange}
                className={styles.inputBase}
                required
              />
            </div>

            {/* To */}
            <div className={styles.dateItem}>
              <label>To:</label>
              <input
                type="date"
                name="to"
                value={form.to}
                onChange={handleChange}
                className={styles.inputBase}
                required
              />
            </div>
          </div>
        )}

        {/* Commutation for normal leaves */}
        {!isMonetization && (
          <div className={styles.formGroup}>
            <label>Commutation</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="commutation"
                  value="requested"
                  checked={form.commutation === "requested"}
                  onChange={handleChange}
                  required
                />
                Requested
              </label>
              <label>
                <input
                  type="radio"
                  name="commutation"
                  value="notRequested"
                  checked={form.commutation === "notRequested"}
                  onChange={handleChange}
                  required
                />
                Not Requested
              </label>
            </div>
          </div>
        )}

        {/* No. of Days for Leave Monetization */}
        {isMonetization && (
          <div className={styles.formGroup}>
            <label>No. of Day(s)</label>
            <input
              type="number"
              name="noOfDays"
              value={form.noOfDays}
              onChange={handleChange}
              className={styles.inputBase}
              min={1}
              required
            />
          </div>
        )}

        {/* Details */}
        <div className={styles.formGroup}>
          <label>Details</label>
          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="Enter details..."
            required
          />
        </div>

        {/* Approval Section */}
        <div style={{ marginTop: "2rem" }}>
          <ApprovalSection
            employees={employees}
            onDataChange={setApprovalData}
            initialValues={approvalInitialValues}
          />
        </div>

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn}>
            Save
          </button>
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearBtn}
          >
            Cancel
          </button>
        </div>
      </form>

    </div>
  );
}

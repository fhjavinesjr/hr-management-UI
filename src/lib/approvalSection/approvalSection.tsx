"use client";

import React, { useState, useEffect } from "react";
import styles from "@/styles/approvalSection.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";

export interface ApprovalSectionData {
  recommendingApprovalById: number | null;
  authorizedOfficialId: number | null;
  approvedById: number | null;
  recommendationStatus: string;
  recommendationMessage: string;
  approvedStatus: string;
  approvalMessage: string;
  dueExigencyService: boolean;
}

interface ApprovalSectionProps {
  employees?: Employee[];
  initialValues?: Partial<ApprovalSectionData>;
  onDataChange?: (data: ApprovalSectionData) => void;
  showAuthorizedOfficial?: boolean;
  showDueExigency?: boolean;
}

export default function ApprovalSection({ employees: propEmployees, initialValues, onDataChange, showAuthorizedOfficial = true, showDueExigency = true }: ApprovalSectionProps = {}) {
  const [employees, setEmployees] = useState<Employee[]>(propEmployees ?? []);

  // Fall back to localStorage if no employees were passed as prop
  useEffect(() => {
    if (!propEmployees || propEmployees.length === 0) {
      const stored = localStorageUtil.getEmployees();
      if (stored && stored.length > 0) {
        setEmployees(stored);
      }
    } else {
      setEmployees(propEmployees);
    }
  }, [propEmployees]);

  const resolveEmployeeId = (value: string): number | null => {
    const match = employees.find(
      (emp) => `[${emp.employeeNo}] ${emp.fullName}`.toLowerCase() === value.toLowerCase()
    );
    return match ? Number(match.employeeId) : null;
  };

  const resolveEmployeeName = (id: number | null): string => {
    if (!id) return "";
    const emp = employees.find((e) => Number(e.employeeId) === id);
    return emp ? `[${emp.employeeNo}] ${emp.fullName}` : "";
  };

  const [recommendationStatus, setRecommendationStatus] = useState("Pending");
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [recommendingBy, setRecommendingBy] = useState("");
  const [authorizedOfficial, setAuthorizedOfficial] = useState("");
  const [approvedStatus, setApprovedStatus] = useState("Pending");
  const [dueExigencyService, setDueExigencyService] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvedBy, setApprovedBy] = useState("");

  // Resolved officer IDs
  const [officerIds, setOfficerIds] = useState({
    recommendingApprovalById: null as number | null,
    authorizedOfficialId: null as number | null,
    approvedById: null as number | null,
  });

  // Populate from initialValues (e.g. when editing a record)
  useEffect(() => {
    if (!initialValues) return;
    if (initialValues.recommendationStatus !== undefined) setRecommendationStatus(initialValues.recommendationStatus ?? "");
    if (initialValues.recommendationMessage !== undefined) setRecommendationMessage(initialValues.recommendationMessage ?? "");
    if (initialValues.approvedStatus !== undefined) setApprovedStatus(initialValues.approvedStatus ?? "");
    if (initialValues.approvalMessage !== undefined) setApprovalMessage(initialValues.approvalMessage ?? "");
    if (initialValues.dueExigencyService !== undefined) setDueExigencyService(initialValues.dueExigencyService ?? false);
    if (initialValues.recommendingApprovalById !== undefined) {
      setRecommendingBy(resolveEmployeeName(initialValues.recommendingApprovalById ?? null));
    }
    if (initialValues.authorizedOfficialId !== undefined) {
      setAuthorizedOfficial(resolveEmployeeName(initialValues.authorizedOfficialId ?? null));
    }
    if (initialValues.approvedById !== undefined) {
      setApprovedBy(resolveEmployeeName(initialValues.approvedById ?? null));
    }
    setOfficerIds({
      recommendingApprovalById: initialValues.recommendingApprovalById ?? null,
      authorizedOfficialId: initialValues.authorizedOfficialId ?? null,
      approvedById: initialValues.approvedById ?? null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, employees]);

  const fireChange = (overrides: Partial<ApprovalSectionData>) => {
    onDataChange?.({
      recommendingApprovalById: officerIds.recommendingApprovalById,
      authorizedOfficialId: officerIds.authorizedOfficialId,
      approvedById: officerIds.approvedById,
      recommendationStatus,
      recommendationMessage,
      approvedStatus,
      approvalMessage,
      dueExigencyService,
      ...overrides,
    });
  };

  return (
    <div className={styles.approvalSection}>
      {/* Recommendation Section */}
      <div className={styles.section}>
        <label>Recommendation Status</label>
        <select
          value={recommendationStatus}
          onChange={(e) => {
            setRecommendationStatus(e.target.value);
            fireChange({ recommendationStatus: e.target.value });
          }}
        >
          <option value="" disabled> Select</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Disapproved">Disapproved</option>
          <option value="Cancel">Cancel</option>
        </select>
      </div>

      <div className={styles.section}>
        <label>Recommendation Message</label>
        <textarea
          value={recommendationMessage}
          onChange={(e) => {
            setRecommendationMessage(e.target.value);
            fireChange({ recommendationMessage: e.target.value });
          }}
          placeholder="Enter details here"
        />
      </div>

      <div className={styles.section}>
        <label>
          Recommending Approval By{" "}
          <span className={styles.guide}>(Last Name, First Name or ID No.)</span>
        </label>
        <input
          type="text"
          list="recommending-approval-list"
          value={recommendingBy}
          onChange={(e) => {
            setRecommendingBy(e.target.value);
            const id = resolveEmployeeId(e.target.value);
            const updated = { ...officerIds, recommendingApprovalById: id };
            setOfficerIds(updated);
            fireChange({ recommendingApprovalById: id });
          }}
          placeholder="Search employee name or ID"
        />
        <datalist id="recommending-approval-list">
          {employees.map((emp) => (
            <option
              key={emp.employeeNo}
              value={`[${emp.employeeNo}] ${emp.fullName}`}
            />
          ))}
        </datalist>
      </div>

      {showAuthorizedOfficial && (
        <div className={styles.section}>
          <label>
            Authorized Official{" "}
            <span className={styles.guide}>(Last Name, First Name or ID No.)</span>
          </label>
          <input
            type="text"
            list="authorized-official-list"
            value={authorizedOfficial}
            onChange={(e) => {
              setAuthorizedOfficial(e.target.value);
              const id = resolveEmployeeId(e.target.value);
              const updated = { ...officerIds, authorizedOfficialId: id };
              setOfficerIds(updated);
              fireChange({ authorizedOfficialId: id });
            }}
            placeholder="Search employee name or ID"
          />
          <datalist id="authorized-official-list">
            {employees.map((emp) => (
              <option
                key={emp.employeeNo}
                value={`[${emp.employeeNo}] ${emp.fullName}`}
              />
            ))}
          </datalist>
        </div>
      )}

      {/* Approval Section */}
      <div className={styles.sectionInline}>
        <div className={styles.inlineLeft}>
          <label>Approved Status</label>
          <select
            value={approvedStatus}
            onChange={(e) => {
            setApprovedStatus(e.target.value);
            fireChange({ approvedStatus: e.target.value });
          }}
          >
            <option value="" disabled> Select</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Disapproved">Disapproved</option>
            <option value="Cancel">Cancel</option>
          </select>
        </div>
        {showDueExigency && (
          <div className={styles.inlineRight}>
            <label>
              <input
                type="checkbox"
                checked={dueExigencyService}
                onChange={(e) => {
                  setDueExigencyService(e.target.checked);
                  fireChange({ dueExigencyService: e.target.checked });
                }}
              />
              Due Exigency of Service
            </label>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <label>Approval Message</label>
        <textarea
          value={approvalMessage}
          onChange={(e) => {
            setApprovalMessage(e.target.value);
            fireChange({ approvalMessage: e.target.value });
          }}
          placeholder="Enter details here"
        />
      </div>

      <div className={styles.section}>
        <label>
          Approved By{" "}
          <span className={styles.guide}>(Last Name, First Name or ID No.)</span>
        </label>
        <input
          type="text"
          list="approved-by-list"
          value={approvedBy}
          onChange={(e) => {
            setApprovedBy(e.target.value);
            const id = resolveEmployeeId(e.target.value);
            const updated = { ...officerIds, approvedById: id };
            setOfficerIds(updated);
            fireChange({ approvedById: id });
          }}
          placeholder="Search employee name or ID"
        />
        <datalist id="approved-by-list">
          {employees.map((emp) => (
            <option
              key={emp.employeeNo}
              value={`[${emp.employeeNo}] ${emp.fullName}`}
            />
          ))}
        </datalist>
      </div>
    </div>
  );
}
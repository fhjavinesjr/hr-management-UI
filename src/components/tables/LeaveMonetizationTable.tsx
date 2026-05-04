"use client";

import React, { useState } from "react";
import tableStyles from "@/styles/tables.module.scss";

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

interface LeaveMonetizationTableProps {
  data: MonetizationRecord[];
  onEdit?: (record: MonetizationRecord) => void;
  onDelete?: (record: MonetizationRecord) => void;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Approved" ? tableStyles.approved
    : status === "Disapproved" ? tableStyles.disapproved
    : tableStyles.pending;
  return <span className={`${tableStyles.statusBadge} ${cls}`}>{status}</span>;
}

function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined) return "—";
  return val.toFixed(3);
}

const th: React.CSSProperties = { padding: "8px 10px", background: "#f0f0f0", border: "1px solid #ddd", whiteSpace: "nowrap", textAlign: "left", fontSize: "0.82rem" };
const td: React.CSSProperties = { padding: "6px 10px", border: "1px solid #ddd", whiteSpace: "nowrap", fontSize: "0.82rem" };

export default function LeaveMonetizationTable({ data, onEdit, onDelete }: LeaveMonetizationTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const pageSizeOptions = [25, 50, 100, 300, 500];
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));

  return (
    <div>
      <div className={tableStyles.paginationContainer}>
        <div className={tableStyles.paginationLeft}>
          <label>Rows per page: </label>
          <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            {pageSizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className={tableStyles.recordInfo}>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, data.length)} of {data.length}
          </span>
        </div>
        <div className={tableStyles.paginationRight}>
          <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className={tableStyles.paginationBtn}>First</button>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={tableStyles.paginationBtn}>Prev</button>
          <span className={tableStyles.pageIndicator}>Page {currentPage} of {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={tableStyles.paginationBtn}>Next</button>
          <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className={tableStyles.paginationBtn}>Last</button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Employee</th>
              <th style={th}>Date Filed</th>
              <th style={th}>VL Days</th>
              <th style={th}>SL Days</th>
              <th style={th}>Total</th>
              <th style={th}>VL Before</th>
              <th style={th}>SL Before</th>
              <th style={th}>VL After</th>
              <th style={th}>SL After</th>
              <th style={th}>Rec. Status</th>
              <th style={th}>Approval</th>
              <th style={th}>Payroll</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr><td colSpan={13} style={{ ...td, textAlign: "center" }}>No records.</td></tr>
            ) : paginatedData.map((record) => (
              <tr key={record.id}>
                <td style={td}>{record.employeeName}</td>
                <td style={td}>{record.dateFiled}</td>
                <td style={td}>{fmt(record.noOfDaysVL)}</td>
                <td style={td}>{fmt(record.noOfDaysSL)}</td>
                <td style={td}><strong>{fmt(record.totalDays)}</strong></td>
                <td style={td}>{fmt(record.vlBalanceBefore)}</td>
                <td style={td}>{fmt(record.slBalanceBefore)}</td>
                <td style={td}>{record.vlBalanceAfter !== null ? fmt(record.vlBalanceAfter) : "—"}</td>
                <td style={td}>{record.slBalanceAfter !== null ? fmt(record.slBalanceAfter) : "—"}</td>
                <td style={td}><StatusBadge status={record.recommendationStatus} /></td>
                <td style={td}><StatusBadge status={record.approvalStatus} /></td>
                <td style={td}>
                  <span className={`${tableStyles.statusBadge} ${record.payrollIncluded ? tableStyles.approved : tableStyles.pending}`}>
                    {record.payrollIncluded ? "Yes" : "No"}
                  </span>
                </td>
                <td style={{ ...td, display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                  <button className={tableStyles.editBtn} onClick={() => onEdit?.(record)}>Edit</button>
                  <button className={tableStyles.deleteBtn} onClick={() => onDelete?.(record)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

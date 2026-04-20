"use client";

import React, { useState } from "react";
import styles from "@/styles/LeaveApplication.module.scss";
import tableStyles from "@/styles/tables.module.scss";

interface LeaveMonetizationRecord {
  id: number;
  employee: string;
  dateFiled: string;
  noOfDays: number;
  leaveType: string;
  status: string;
  details?: string;
}

interface LeaveMonetizationTableProps {
  data: LeaveMonetizationRecord[];
  onEdit?: (record: LeaveMonetizationRecord) => void;
  onDelete?: (record: LeaveMonetizationRecord) => void;
}

export default function LeaveMonetizationTable({ data, onEdit, onDelete }: LeaveMonetizationTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const pageSizeOptions = [25, 50, 100, 300, 500, 750, 1000];
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);
  const safeTotalPages = Math.max(1, totalPages);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div>
      <div className={tableStyles.paginationContainer}>
        <div className={tableStyles.paginationLeft}>
          <label>Rows per page: </label>
          <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className={tableStyles.recordInfo}>
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length}
          </span>
        </div>
        <div className={tableStyles.paginationRight}>
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={tableStyles.paginationBtn}
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={tableStyles.paginationBtn}
          >
            Previous
          </button>
          <span className={tableStyles.pageIndicator}>
            Page {currentPage} of {safeTotalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === safeTotalPages}
            className={tableStyles.paginationBtn}
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(safeTotalPages)}
            disabled={currentPage === safeTotalPages}
            className={tableStyles.paginationBtn}
          >
            Last
          </button>
        </div>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Date Filed</th>
            <th>No. of Days</th>
            <th>Leave Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((record) => (
            <tr key={record.id}>
              <td>{record.employee}</td>
              <td>{record.dateFiled}</td>
              <td>{record.noOfDays}</td>
              <td>{record.leaveType}</td>
              <td>
                <span
                  className={`${tableStyles.statusBadge} ${
                    record.status === "Approved"
                      ? tableStyles.approved
                      : record.status === "Pending"
                      ? tableStyles.pending
                      : tableStyles.disapproved
                  }`}
                >
                  {record.status}
                </span>
              </td>
              <td className={tableStyles.actionCell}>
                <button
                  className={tableStyles.editBtn}
                  onClick={() => onEdit?.(record)}
                >
                  Edit
                </button>
                <button
                  className={tableStyles.deleteBtn}
                  onClick={() => onDelete?.(record)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

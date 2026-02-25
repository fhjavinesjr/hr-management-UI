"use client";

import React, { useState } from "react";
import styles from "@/styles/LeaveApplication.module.scss";
import tableStyles from "@/styles/tables.module.scss";

interface CTORecord {
  employee: string;
  dateFiled: string;
  dateWorked: string;
  hours: number | string;
  status: string;
}

interface CompensatoryTimeOffTableProps {
  data: CTORecord[];
}

export default function CompensatoryTimeOffTable({ data }: CompensatoryTimeOffTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const pageSizeOptions = [25, 50, 100, 300, 500, 750, 1000];
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

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
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={tableStyles.paginationBtn}
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
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
            <th>Date Worked</th>
            <th>Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((rec, idx) => (
            <tr key={idx}>
              <td>{rec.employee}</td>
              <td>{rec.dateFiled}</td>
              <td>{rec.dateWorked}</td>
              <td>{rec.hours}</td>
              <td>
                <span
                  className={`${tableStyles.statusBadge} ${
                    rec.status === "Approved"
                      ? tableStyles.approved
                      : rec.status === "Pending"
                      ? tableStyles.pending
                      : tableStyles.disapproved
                  }`}
                >
                  {rec.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

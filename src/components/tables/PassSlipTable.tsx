"use client";

import React, { useState } from "react";
import styles from "@/styles/LeaveApplication.module.scss";
import tableStyles from "@/styles/tables.module.scss";

interface PassSlipRecord {
  employee: string;
  dateFiled: string;
  purpose: string;
  departureOut: string;
  arrivalIn: string;
  details: string;
  status: string;
}

interface PassSlipTableProps {
  data: PassSlipRecord[];
}

export default function PassSlipTable({ data }: PassSlipTableProps) {
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
      <table className={styles.leaveTable}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Date Filed</th>
            <th>Purpose</th>
            <th>Departure Out</th>
            <th>Arrival In</th>
            <th>Details</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((record, index) => (
            <tr key={index}>
              <td>{record.employee}</td>
              <td>{record.dateFiled}</td>
              <td>{record.purpose}</td>
              <td>{record.departureOut}</td>
              <td>{record.arrivalIn}</td>
              <td>{record.details}</td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

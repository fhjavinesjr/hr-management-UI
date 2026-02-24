"use client";

import React, { useState, useMemo } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import OvertimeRequest from "@/components/selfservices/overtimeRequest";
import OvertimeRequestTable from "@/components/tables/OvertimeRequestTable";

interface OvertimeRecord {
  employee: string;
  from: string;
  to: string;
  duration: string;
  status: string;
}

export default function HROvertimeRequestModule() {
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  
  const allOvertimes = useMemo<OvertimeRecord[]>(() => [
    {
      employee: "Dan Joseph Haban",
      from: "02/19/2026 18:00",
      to: "02/19/2026 22:00",
      duration: "4h 0m",
      status: "Approved",
    },
    {
      employee: "Maria Santos",
      from: "02/18/2026 19:00",
      to: "02/18/2026 23:30",
      duration: "4h 30m",
      status: "Pending",
    },
    {
      employee: "John Cruz",
      from: "02/17/2026 17:00",
      to: "02/17/2026 20:00",
      duration: "3h 0m",
      status: "Disapproved",
    },
  ], []);

  // ✅ Unique employee names
  const employeeNames = useMemo(() => {
    return Array.from(new Set(allOvertimes.map((item) => item.employee)));
  }, [allOvertimes]);

  // ✅ Suggestion filtering
  const filteredSuggestions = useMemo(() => {
    if (search.trim() === "") return [];
    return employeeNames.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, employeeNames]);

  // ✅ Overtime filtering - only show when employee is selected
  const filteredOvertimes = useMemo(() => {
    if (selectedEmployee.trim() === "") return [];
    return allOvertimes.filter((item) =>
      item.employee.toLowerCase() === selectedEmployee.toLowerCase()
    );
  }, [selectedEmployee, allOvertimes]);

  const handleSubmitOvertime = (overtime: {
    employee: string;
    from: string;
    to: string;
    duration: string;
    status: string;
  }) => {
    console.log("Overtime submitted:", overtime);

    
  };

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
    if (selectedEmployee && selectedEmployee.trim() !== "") {
      Toast.fire({ icon: "success", title: `Cleared records for ${selectedEmployee}` });
      setActiveTab("table");
    }
    setSearch("");
    setSelectedEmployee("");
    setShowSuggestions(false);
  };

  return (
    <div className={modalStyles.Modal}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.mainTitle}>HR Overtime Request</h2>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={styles.EmploymentRecord}>
            {/* Sticky Header */}
            <div className={styles.stickyHeader}>
              {/* 🔥 Autocomplete Search */}
              <div className={styles.formGroup} style={{ position: "relative" }}>
                <label>Search Employee</label>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Employee No / Last Name"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className={styles.searchInput}
                    />

                    {/* Suggestions */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <ul className={styles.suggestionList}>
                        {filteredSuggestions.map((name, index) => (
                          <li
                            key={index}
                            className={styles.suggestionItem}
                            onMouseDown={() => {
                              setSearch(name);
                              setSelectedEmployee(name);
                              setShowSuggestions(false);
                            }}
                          >
                            {name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <button onClick={handleClear} className={styles.clearButton}>
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className={styles.tabsHeader}>
                <button
                  className={activeTab === "table" ? styles.active : ""}
                  onClick={() => setActiveTab("table")}
                >
                  List
                </button>
                <button
                  className={activeTab === "apply" ? styles.active : ""}
                  onClick={() => setActiveTab("apply")}
                >
                  Application
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === "table" && (
                <>
                  <h3>
                    {selectedEmployee
                      ? `Overtime Requests for "${selectedEmployee}"`
                      : "Search and select an employee to view records"}
                  </h3>

                  {selectedEmployee && filteredOvertimes.length > 0 ? (
                    <OvertimeRequestTable data={filteredOvertimes} />
                  ) : selectedEmployee ? (
                    <p>No records found.</p>
                  ) : null}
                </>
              )}

              {activeTab === "apply" && (
                <>
                  <h3>
                    Request Overtime {search ? `for "${search}"` : ""}
                  </h3>
                  <OvertimeRequest
                    employeeName={selectedEmployee}
                    onSubmitOvertime={handleSubmitOvertime}
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
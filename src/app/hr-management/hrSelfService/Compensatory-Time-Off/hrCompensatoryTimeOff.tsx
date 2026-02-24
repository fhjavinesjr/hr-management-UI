"use client";

import React, { useState, useMemo } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import CompensatoryTimeOff from "@/components/services/CompensatoryTimeOff";
import CompensatoryTimeOffTable from "@/components/tables/CompensatoryTimeOffTable";

interface CTORecord {
  employee: string;
  dateFiled: string;
  dateWorked: string;
  hours: number | string;
  status: string;
}

export default function HRCompensatoryTimeOffModule() {
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // ✅ Static master data for compensatory time off (stable reference)
  const allCTOs = useMemo<CTORecord[]>(() => [
    {
      employee: "Dan Joseph Haban",
      dateFiled: "01/19/2026",
      dateWorked: "01/18/2026",
      hours: 8,
      status: "Approved",
    },
    {
      employee: "Maria Santos",
      dateFiled: "01/15/2026",
      dateWorked: "01/14/2026",
      hours: 4,
      status: "Pending",
    },
    {
      employee: "John Cruz",
      dateFiled: "01/12/2026",
      dateWorked: "01/11/2026",
      hours: 2,
      status: "Disapproved",
    },
  ], []);

  // ✅ Unique employee names
  const employeeNames = useMemo(() => {
    return Array.from(new Set(allCTOs.map((item) => item.employee)));
  }, [allCTOs]);

  // ✅ Suggestion filtering
  const filteredSuggestions = useMemo(() => {
    if (search.trim() === "") return [];
    return employeeNames.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, employeeNames]);

  // ✅ CTO filtering - only show when employee is selected
  const filteredCTOs = useMemo(() => {
    if (selectedEmployee.trim() === "") return [];
    return allCTOs.filter((item) =>
      item.employee.toLowerCase() === selectedEmployee.toLowerCase()
    );
  }, [selectedEmployee, allCTOs]);

  const handleSubmitCTO = (cto: {
    employee: string;
    dateFiled: string;
    dateWorked: string;
    hours: number | string;
    status: string;
  }) => {
    console.log("CTO submitted:", cto);

    // 🔥 Backend call will go here later
    // await fetch('/api/cto', { method: 'POST', body: JSON.stringify(cto) })
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
          <h2 className={modalStyles.mainTitle}>HR Compensatory Time Off</h2>
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
                      ? `Compensatory Time Off for "${selectedEmployee}"`
                      : "Search and select an employee to view records"}
                  </h3>

                  {selectedEmployee && filteredCTOs.length > 0 ? (
                    <CompensatoryTimeOffTable data={filteredCTOs} />
                  ) : selectedEmployee ? (
                    <p>No records found.</p>
                  ) : null}
                </>
              )}

              {activeTab === "apply" && (
                <>
                  <h3>
                    Apply Compensatory Time Off {search ? `for "${search}"` : ""}
                  </h3>
                  <CompensatoryTimeOff
                    employeeName={selectedEmployee}
                    onSubmitCTO={handleSubmitCTO}
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
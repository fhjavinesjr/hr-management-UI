"use client";

import React, { useState, useMemo } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import PassSlip from "@/components/services/passSlip";
import PassSlipTable from "@/components/tables/PassSlipTable";

interface PassSlipRecord {
  employee: string;
  dateFiled: string;
  purpose: string;
  departureOut: string;
  arrivalIn: string;
  details: string;
  status: string;
}

export default function HRPassSlipModule() {
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // ✅ Static master data for pass slips (stable reference)
  const allPassSlips = useMemo<PassSlipRecord[]>(() => [
    {
      employee: "Dan Joseph Haban",
      dateFiled: "01/19/2026",
      purpose: "Personal",
      departureOut: "10:00",
      arrivalIn: "14:30",
      details: "Medical appointment at City Medical Center",
      status: "Approved",
    },
    {
      employee: "Maria Santos",
      dateFiled: "01/15/2026",
      purpose: "Official",
      departureOut: "08:00",
      arrivalIn: "17:00",
      details: "Training conference attendance",
      status: "Approved",
    },
    {
      employee: "John Cruz",
      dateFiled: "01/12/2026",
      purpose: "Personal",
      departureOut: "13:00",
      arrivalIn: "15:30",
      details: "Emergency personal matter",
      status: "Pending",
    },
  ], []);

  // ✅ Unique employee names
  const employeeNames = useMemo(() => {
    return Array.from(new Set(allPassSlips.map((item) => item.employee)));
  }, [allPassSlips]);

  // ✅ Suggestion filtering
  const filteredSuggestions = useMemo(() => {
    if (search.trim() === "") return [];
    return employeeNames.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, employeeNames]);

  // ✅ Pass slip filtering - only show when employee is selected
  const filteredPassSlips = useMemo(() => {
    if (selectedEmployee.trim() === "") return [];
    return allPassSlips.filter((item) =>
      item.employee.toLowerCase() === selectedEmployee.toLowerCase()
    );
  }, [selectedEmployee, allPassSlips]);

  const handleSubmitPassSlip = (passSlip: {
    employee: string;
    dateFiled: string;
    purpose: string;
    departureOut: string;
    arrivalIn: string;
    details: string;
    status: string;
  }) => {
    console.log("Pass slip submitted:", passSlip);

    // 🔥 Backend call will go here later
    // await fetch('/api/pass-slip', { method: 'POST', body: JSON.stringify(passSlip) })
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
          <h2 className={modalStyles.mainTitle}>HR Pass Slip</h2>
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
                      ? `Pass Slips for "${selectedEmployee}"`
                      : "Search and select an employee to view records"}
                  </h3>

                  {selectedEmployee && filteredPassSlips.length > 0 ? (
                    <PassSlipTable data={filteredPassSlips} />
                  ) : selectedEmployee ? (
                    <p>No records found.</p>
                  ) : null}
                </>
              )}

              {activeTab === "apply" && (
                <>
                  <h3>
                    Request Pass Slip {search ? `for "${search}"` : ""}
                  </h3>
                  <PassSlip
                    employeeName={selectedEmployee}
                    onSubmitPassSlip={handleSubmitPassSlip}
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
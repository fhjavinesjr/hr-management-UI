"use client";

import React, { useState, useMemo } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import TimeCorrection from "@/components/selfservices/TimeCorrection";
import TimeCorrectionTable from "@/components/tables/TimeCorrectionTable";

interface TimeCorrectionRecord {
  employee: string;
  dateFiled: string;
  date: string;
  timeIn: string;
  breakOut: string;
  breakIn: string;
  timeOut: string;
  details: string;
  status: string;
}

export default function HRTimeCorrectionModule() {
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");


  const allTimeCorrections = useMemo<TimeCorrectionRecord[]>(() => [
    {
      employee: "Dan Joseph Haban",
      dateFiled: "01/19/2026",
      date: "01/15/2026",
      timeIn: "08:15",
      breakOut: "12:00",
      breakIn: "13:00",
      timeOut: "17:30",
      details: "Adjusted time due to delayed system log-in",
      status: "Approved",
    },
    {
      employee: "Maria Santos",
      dateFiled: "01/15/2026",
      date: "01/14/2026",
      timeIn: "09:00",
      breakOut: "12:30",
      breakIn: "13:30",
      timeOut: "18:00",
      details: "Extended break due to medical appointment",
      status: "Pending",
    },
    {
      employee: "John Cruz",
      dateFiled: "01/12/2026",
      date: "01/10/2026",
      timeIn: "07:45",
      breakOut: "11:30",
      breakIn: "12:30",
      timeOut: "16:45",
      details: "Early departure correction",
      status: "Approved",
    },
    
  ], []);

  // ✅ Unique employee names
  const employeeNames = useMemo(() => {
    return Array.from(new Set(allTimeCorrections.map((item) => item.employee)));
  }, [allTimeCorrections]);

  // ✅ Suggestion filtering
  const filteredSuggestions = useMemo(() => {
    if (search.trim() === "") return [];
    return employeeNames.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, employeeNames]);

  // ✅ Time correction filtering - only show when employee is selected
  const filteredTimeCorrections = useMemo(() => {
    if (selectedEmployee.trim() === "") return [];
    return allTimeCorrections.filter((item) =>
      item.employee.toLowerCase() === selectedEmployee.toLowerCase()
    );
  }, [selectedEmployee, allTimeCorrections]);

  const handleSubmitTimeCorrection = (timeCorrection: {
    employee: string;
    dateFiled: string;
    date: string;
    timeIn: string;
    breakOut: string;
    breakIn: string;
    timeOut: string;
    details: string;
    status: string;
  }) => {
    console.log("Time correction submitted:", timeCorrection);

    // 🔥 Backend call will go here later
    // await fetch('/api/time-correction', { method: 'POST', body: JSON.stringify(timeCorrection) })
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
          <h2 className={modalStyles.mainTitle}>HR Time Correction</h2>
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
                      ? `Time Corrections for "${selectedEmployee}"`
                      : "Search and select an employee to view records"}
                  </h3>

                  {selectedEmployee && filteredTimeCorrections.length > 0 ? (
                    <TimeCorrectionTable data={filteredTimeCorrections} />
                  ) : selectedEmployee ? (
                    <p>No records found.</p>
                  ) : null}
                </>
              )}

              {activeTab === "apply" && (
                <>
                  <h3>
                    Request Time Correction {search ? `for "${search}"` : ""}
                  </h3>
                  <TimeCorrection
                    employeeName={selectedEmployee}
                    onSubmitTimeCorrection={handleSubmitTimeCorrection}
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
"use client";

import React, { useState, useMemo } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import OfficialEngagement from "@/components/services/OfficialEngagement";
import OfficialEngagementTable from "@/components/tables/OfficialEngagementTable";

interface OfficialEngagementRecord {
  employee: string;
  dateFiled: string;
  officialType: string;
  from: string;
  to: string;
  status: string;
}

export default function HROfficialEngagementModule() {
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // ✅ Static master data for official engagements (stable reference)
  const allEngagements = useMemo<OfficialEngagementRecord[]>(() => [
    {
      employee: "Dan Joseph Haban",
      dateFiled: "01/19/2026",
      officialType: "Official Business",
      from: "02/21/2026 09:00",
      to: "02/21/2026 17:00",
      status: "Approved",
    },
    {
      employee: "Maria Santos",
      dateFiled: "01/15/2026",
      officialType: "Official Time",
      from: "02/20/2026 14:00",
      to: "02/20/2026 16:30",
      status: "Pending",
    },
    {
      employee: "John Cruz",
      dateFiled: "01/12/2026",
      officialType: "Official Business",
      from: "03/05/2026 08:00",
      to: "03/05/2026 18:00",
      status: "Disapproved",
    },
  ], []);

  // ✅ Unique employee names
  const employeeNames = useMemo(() => {
    return Array.from(new Set(allEngagements.map((item) => item.employee)));
  }, [allEngagements]);

  // ✅ Suggestion filtering
  const filteredSuggestions = useMemo(() => {
    if (search.trim() === "") return [];
    return employeeNames.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, employeeNames]);

  // ✅ Engagement filtering - only show when employee is selected
  const filteredEngagements = useMemo(() => {
    if (selectedEmployee.trim() === "") return [];
    return allEngagements.filter((item) =>
      item.employee.toLowerCase() === selectedEmployee.toLowerCase()
    );
  }, [selectedEmployee, allEngagements]);

  const handleSubmitEngagement = (engagement: {
    employee: string;
    officialType: string;
    from: string;
    to: string;
    status: string;
  }) => {
    console.log("Engagement submitted:", engagement);

    // 🔥 Backend call will go here later
    // await fetch('/api/engagement', { method: 'POST', body: JSON.stringify(engagement) })
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
          <h2 className={modalStyles.mainTitle}>HR Official Engagement</h2>
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
                      ? `Official Engagements for "${selectedEmployee}"`
                      : "Search and select an employee to view records"}
                  </h3>

                  {selectedEmployee && filteredEngagements.length > 0 ? (
                    <OfficialEngagementTable data={filteredEngagements} />
                  ) : selectedEmployee ? (
                    <p>No records found.</p>
                  ) : null}
                </>
              )}

              {activeTab === "apply" && (
                <>
                  <h3>
                    Request Official Engagement {search ? `for "${search}"` : ""}
                  </h3>
                  <OfficialEngagement
                    employeeName={selectedEmployee}
                    onSubmitEngagement={handleSubmitEngagement}
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
"use client";

import React, { useState, useMemo } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import LeaveApplication from "@/components/services/LeaveApplication";
import LeaveApplicationTable from "@/components/tables/LeaveApplicationTable";
import LeaveMonetizationTable from "@/components/tables/LeaveMonetizationTable";

interface LeaveRecord {
  employee: string;
  dateFiled: string;
  from: string;
  to: string;
  leaveType: string;
  status: string;
}

interface LeaveMonetizationRecord {
  employee: string;
  dateFiled: string;
  noOfDays: number;
  leaveType: string;
  status: string;
}

export default function HRLeaveApplicationModule() {
  const [activeTab, setActiveTab] = useState<"regularLeaves" | "leaveMonetization" | "apply">("regularLeaves");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // static Data for regular Leaves
  const allLeaves = useMemo<LeaveRecord[]>(() => [
    {
      employee: "Dan Joseph Haban",
      dateFiled: "01/19/2026",
      from: "02/21/2026",
      to: "02/24/2026",
      leaveType: "Vacation Leave",
      status: "Approved",
    },
    {
      employee: "Dan Joseph Haban",
      dateFiled: "01/17/2026",
      from: "02/21/2026",
      to: "02/24/2026",
      leaveType: "Sick Leave",
      status: "Approved",
    },
    {
      employee: "Dan Joseph Haban",
      dateFiled: "01/12/2026",
      from: "02/21/2026",
      to: "02/24/2026",
      leaveType: "Solo Parent Leave",
      status: "Approved",
    },
    {
      employee: "Dan Joseph Haban",
      dateFiled: "01/11/2026",
      from: "02/21/2026",
      to: "02/24/2026",
      leaveType: "Adoption Leave",
      status: "Approved",
    },
    {
      employee: "Maria Santos",
      dateFiled: "01/15/2026",
      from: "02/10/2026",
      to: "02/12/2026",
      leaveType: "Sick Leave",
      status: "Pending",
    },
    {
      employee: "John Cruz",
      dateFiled: "01/12/2026",
      from: "03/05/2026",
      to: "03/07/2026",
      leaveType: "Emergency Leave",
      status: "Disapproved",
    },
  ], []);

  //  Static data for leave monetization 
  const allMonetizations = useMemo<LeaveMonetizationRecord[]>(() => [
    {
      employee: "Dan Joseph Haban",
      dateFiled: "01/10/2026",
      noOfDays: 5,
      leaveType: "Leave Monetization",
      status: "Approved",
    },
    {
      employee: "Maria Santos",
      dateFiled: "01/20/2026",
      noOfDays: 3,
      leaveType: "Leave Monetization",
      status: "Pending",
    },
     
  ], []);

  //  Unique employee names
  const employeeNames = useMemo(() => {
    return Array.from(new Set(allLeaves.map((item) => item.employee)));
  }, [allLeaves]);

  //  Suggestion filtering
  const filteredSuggestions = useMemo(() => {
    if (search.trim() === "") return [];
    return employeeNames.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, employeeNames]);

  //  Table filtering - only show when employee is selected
  const filteredLeaves = useMemo(() => {
    if (selectedEmployee.trim() === "") return [];
    return allLeaves.filter((item) =>
      item.employee.toLowerCase() === selectedEmployee.toLowerCase()
    );
  }, [selectedEmployee, allLeaves]);

  // ✅ Monetization filtering - only show when employee is selected
  const filteredMonetizations = useMemo(() => {
    if (selectedEmployee.trim() === "") return [];
    return allMonetizations.filter((item) =>
      item.employee.toLowerCase() === selectedEmployee.toLowerCase()
    );
  }, [selectedEmployee, allMonetizations]);

  const handleSubmitLeave = (leave: {
    employee: string;
    dateFiled: string;
    from: string;
    to: string;
    leaveType: string;
    status: string;
  }) => {
    console.log("Leave submitted:", leave);

    // 🔥 Backend call will go here later
    // await fetch('/api/leave', { method: 'POST', body: JSON.stringify(leave) })
  };

  // Toast mixin for small bottom-end toasts
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
      Toast.fire({
        icon: "success",
        title: `Cleared records for ${selectedEmployee}`,
      });
      setActiveTab("regularLeaves");
    }

    setSearch("");
    setSelectedEmployee("");
    setShowSuggestions(false);
  };

  return (
    <div className={modalStyles.Modal}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.mainTitle}>HR Leave Application</h2>
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
                  className={activeTab === "regularLeaves" ? styles.active : ""}
                  onClick={() => setActiveTab("regularLeaves")}
                >
                  Regular Leaves
                </button>
                <button
                  className={activeTab === "leaveMonetization" ? styles.active : ""}
                  onClick={() => setActiveTab("leaveMonetization")}
                >
                  Leave Monetization
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
              {activeTab === "regularLeaves" && (
                <>
                  <h3>
                    {selectedEmployee
                      ? `Regular Leaves for "${selectedEmployee}"`
                      : "Search and select an employee to view records"}
                  </h3>

                  {selectedEmployee && filteredLeaves.length > 0 && (
                    <LeaveApplicationTable data={filteredLeaves} />
                  )}

                  {selectedEmployee && filteredLeaves.length === 0 && (
                    <p>No regular leave records found.</p>
                  )}
                </>
              )}

              {activeTab === "leaveMonetization" && (
                <>
                  <h3>
                    {selectedEmployee
                      ? `Leave Monetization for "${selectedEmployee}"`
                      : "Search and select an employee to view records"}
                  </h3>

                  {selectedEmployee && filteredMonetizations.length > 0 && (
                    <LeaveMonetizationTable data={filteredMonetizations} />
                  )}

                  {selectedEmployee && filteredMonetizations.length === 0 && (
                    <p>No leave monetization records found.</p>
                  )}
                </>
              )}

              {activeTab === "apply" && (
                <>
                  <h3>
                    Apply Leave {search ? `for "${search}"` : ""}
                  </h3>
                  <LeaveApplication 
                    employeeName={selectedEmployee}
                    onSubmitLeave={handleSubmitLeave}
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
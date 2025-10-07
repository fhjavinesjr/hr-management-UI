"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/EmploymentRecord.module.scss";
import PersonalData from "@/app/hr-management/personaldata/PersonalData";
import CurrentAppointment from "@/app/hr-management/currentappointment/CurrentAppointment";
import ServiceRecord from "@/app/hr-management/servicerecord/ServiceRecord";
import Separation from "@/app/hr-management/separation/Separation";
import modalStyles from "@/styles/Modal.module.scss";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { Employee } from "@/lib/types/Employee";

export default function EmploymentRecord() {
  const [activeTab, setActiveTab] = useState("personal");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  useEffect(() => {
    const storedEmployees = localStorageUtil.getEmployees();
    if (storedEmployees != null && storedEmployees.length > 0) {
      setEmployees(storedEmployees);
    }
  }, []);

  useEffect(() => {
    const role = localStorageUtil.getEmployeeRole();
    const fullname = localStorageUtil.getEmployeeFullname();
    const empNo = localStorageUtil.getEmployeeNo();

    setUserRole(role);

    if (fullname && empNo) {
      const emp = { employeeNo: empNo, fullName: fullname } as Employee;
      setSelectedEmployee(emp);

      if (role === "ROLE_ADMIN") {
        setInputValue(`[${emp.employeeNo}] ${emp.fullName}`);
      }
    }
  }, []);

  // Fetch Employment Record
  const fetchEmploymentRecords = async () => {
    try {
    } catch (err) {
      console.log("Error: " + err);
    }
  };

  return (
    <div id="employmentecordsModal" className={modalStyles.Modal}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.mainTitle}>Employment Record</h2>
        </div>
        <div className={modalStyles.modalBody}>
          <div className={styles.EmploymentRecord}>
            {/* Sticky Section */}
            <div className={styles.stickyHeader}>
              <div className={styles.formGroup}>
                <label htmlFor="employee">Employee Name</label>
                <input
                  id="employee"
                  type="text"
                  list={userRole === "ROLE_ADMIN" ? "employee-list" : undefined}
                  placeholder="Employee No / Lastname"
                  value={
                    userRole === "ROLE_ADMIN"
                      ? inputValue // ✅ Admin can type freely
                      : selectedEmployee
                      ? `[${selectedEmployee.employeeNo}] ${selectedEmployee.fullName}`
                      : ""
                  }
                  readOnly={userRole !== "ROLE_ADMIN"} // ✅ Non-admin can't edit
                  onChange={(e) => {
                    if (userRole === "ROLE_ADMIN") {
                      setInputValue(e.target.value); // ✅ Track admin typing

                      const selected = employees.find(
                        (emp) =>
                          `[${emp.employeeNo}] ${emp.fullName}`.toLowerCase() ===
                          e.target.value.toLowerCase()
                      );
                      setSelectedEmployee(selected || null);
                    }
                  }}
                />
                {userRole === "ROLE_ADMIN" && (
                  <datalist id="employee-list">
                    {employees.map((emp) => (
                      <option
                        key={emp.employeeNo}
                        value={`[${emp.employeeNo}] ${emp.fullName}`}
                      />
                    ))}
                  </datalist>
                )}

                <button
                  className={styles.searchButton}
                  onClick={fetchEmploymentRecords}
                >
                  Search
                </button>
              </div>

              {/* Tab Buttons */}
              <div className={styles.tabsHeader}>
                <button
                  className={activeTab === "personal" ? styles.active : ""}
                  onClick={() => setActiveTab("personal")}
                >
                  Personal Data
                </button>
                <button
                  className={activeTab === "appointment" ? styles.active : ""}
                  onClick={() => setActiveTab("appointment")}
                >
                  Current Appointment
                </button>
                <button
                  className={activeTab === "service" ? styles.active : ""}
                  onClick={() => setActiveTab("service")}
                >
                  Service Record
                </button>
                <button
                  className={activeTab === "separation" ? styles.active : ""}
                  onClick={() => setActiveTab("separation")}
                >
                  Separation
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === "personal" && <PersonalData />}
              {activeTab === "appointment" && <CurrentAppointment/>}
              {activeTab === "service" && <ServiceRecord/>}
              {activeTab === "separation" && <Separation/>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

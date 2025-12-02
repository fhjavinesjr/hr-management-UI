"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/EmploymentRecord.module.scss";
import PersonalData from "@/app/hr-management/personaldata/PersonalData";
import EmployeeAppointment from "@/app/hr-management/employeeappointment/EmployeeAppointment";
import ServiceRecord from "@/app/hr-management/servicerecord/ServiceRecord";
import Separation from "@/app/hr-management/separation/Separation";
import modalStyles from "@/styles/Modal.module.scss";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { Employee } from "@/lib/types/Employee";
import { PersonalDataModel } from "@/lib/types/PersonalData";
import { EmployeeAppointmentModel } from "@/lib/types/EmployeeAppointment";
const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import Swal from "sweetalert2";

export default function EmploymentRecord() {
  const [activeTab, setActiveTab] = useState("personal");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [personalData, setPersonalData] = useState<PersonalDataModel | null>(null);
  const [employeeAppointments, setEmployeeAppointments] = useState<EmployeeAppointmentModel[] | null>(null);

  useEffect(() => {
    const storedEmployees = localStorageUtil.getEmployees();
    if (storedEmployees != null && storedEmployees.length > 0) {
      setEmployees(storedEmployees);
    }
  }, []);

  useEffect(() => {
    const role = localStorageUtil.getEmployeeRole();
    setUserRole(role);
  }, []);

  // Fetch Employment Record
  const fetchEmploymentRecords = async () => {
    try {
      if (!selectedEmployee) {
        Swal.fire({
          icon: "error",
          title: "Please select an employee.",
          text: "",
        });
        return;
      }

      const fetchPersonalDataURL = `${API_BASE_URL_HRM}/api/fetch/personal-data/${selectedEmployee.employeeId}`;
      const personalDataRes = await fetchWithAuth(`${fetchPersonalDataURL}`);

      if (!personalDataRes.ok) {
        const text = await personalDataRes.text();
        throw new Error(`Failed to fetch Personal Data: ${text}`);
      }

      const personalDataJson = await personalDataRes.json();

      const fetchEmployee = await fetchWithAuth(`${API_BASE_URL_HRM}/api/employee/${selectedEmployee.employeeId}`);

      if (!fetchEmployee.ok) {
        const text = await fetchEmployee.text();
        throw new Error(`Failed to fetch Employee: ${text}`);
      }

      const employeeJson = await fetchEmployee.json();

      // merge employee fields into personal data
      const mergedData = {
        ...personalDataJson,
        employeeNo: employeeJson.employeeNo ?? "",
        biometricNo: employeeJson.biometricNo ?? "",
        userRole: employeeJson.role ?? "",
        employeePicture: personalDataJson.employeePicture
          ? `data:image/jpeg;base64,${personalDataJson.employeePicture}`
          : null,
        employeeSignature: personalDataJson.employeeSignature
          ? `data:image/png;base64,${personalDataJson.employeeSignature}`
          : null,
      };

      setPersonalData(mergedData);

      const fetchAllEmployeeAppointmentByEmployeeId = `${API_BASE_URL_HRM}/api/employeeAppointment/get-all/${selectedEmployee.employeeId}`;
      const employeeAppointmentsByEmployeeId = await fetchWithAuth(`${fetchAllEmployeeAppointmentByEmployeeId}`);

      if (!employeeAppointmentsByEmployeeId.ok) {
        const text = await employeeAppointmentsByEmployeeId.text();
        throw new Error(`Failed to fetch Employee Appointment: ${text}`);
      }
      const employeeAppointmentsByEmployeeIdJson = await employeeAppointmentsByEmployeeId.json();
      setEmployeeAppointments(employeeAppointmentsByEmployeeIdJson);

      Swal.fire({
        icon: "success",
        title: "Employment Record Loaded",
        text: `Successfully loaded employment record for ${selectedEmployee.fullName}`,
      });

      selectedEmployee.isSearched = true;
      setSelectedEmployee({ ...selectedEmployee });

    } catch (err) {
      console.log("Error: " + err);
      Swal.fire({
        icon: "error",
        title: "Employee is not found.",
        text: "",
      });
    }
  };

  const clearEmploymentRecordsWithShowMessage = async () => {
    if (!selectedEmployee) {
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Employment Record Cleared",
      text: `Cleared employment record for ${selectedEmployee.fullName}`,
    });

    setInputValue("");
    setSelectedEmployee(null);   // triggers PersonalData reset
    setPersonalData(null);       // also triggers reset
    setEmployeeAppointments(null);
    setActiveTab("personal");
  };

  const clearEmploymentRecordsWithoutShowMessage = async () => {
    if (!selectedEmployee) {
      return;
    }
    
    selectedEmployee.isSearched = false;
    selectedEmployee.isCleared = true;
    setSelectedEmployee({ ...selectedEmployee });
    setPersonalData(null);
  }

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
                  list={userRole === "1" ? "employee-list" : undefined}
                  placeholder="Employee No / Lastname"
                  value={
                    userRole === "1"
                      ? inputValue // ✅ Admin can type freely
                      : selectedEmployee
                      ? `[${selectedEmployee.employeeNo}] ${selectedEmployee.fullName}`
                      : ""
                  }
                  readOnly={userRole !== "1"} // ✅ Non-admin can't edit
                  onChange={(e) => {
                    if (userRole === "1") {
                      setInputValue(e.target.value); // ✅ Track admin typing

                      const selected = employees.find(
                        (emp) =>
                          `[${emp.employeeNo}] ${emp.fullName}`.toLowerCase() ===
                          e.target.value.toLowerCase()
                      );
                      if (selected) {
                        setSelectedEmployee({ ...selected, isSearched: false });
                      } else {
                        // if user clears or types something invalid
                        setSelectedEmployee((prev) =>
                          prev ? { ...prev, isSearched: false, isCleared: true } : null
                        );

                        clearEmploymentRecordsWithoutShowMessage();
                      }
                    }
                  }}
                />
                {userRole === "1" && (
                  <datalist id="employee-list">
                    {employees.map((emp) => (
                      <option
                        key={emp.employeeNo}
                        value={`[${emp.employeeNo}] ${emp.fullName}`}
                      />
                    ))}
                  </datalist>
                )}

                <div>
                  <button
                    className={styles.searchButton}
                    onClick={fetchEmploymentRecords}
                  >
                    Search
                  </button>
                  &nbsp;
                  <button
                    className={styles.clearButton}
                    onClick={clearEmploymentRecordsWithShowMessage}
                  >
                    Clear
                  </button>
                </div>
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
                  Employee Appointment
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
              {activeTab === "personal" && (
                <PersonalData selectedEmployee={selectedEmployee} personalData={personalData} fetchEmploymentRecords={fetchEmploymentRecords} />
              )}
              {activeTab === "appointment" && (
                <EmployeeAppointment selectedEmployee={selectedEmployee} employeeAppointments={employeeAppointments} fetchEmploymentRecords={fetchEmploymentRecords}
                />
              )}
              {activeTab === "service" && <ServiceRecord />}
              {activeTab === "separation" && <Separation />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

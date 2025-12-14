"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Separation.module.scss";
import Swal from "sweetalert2";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import { Employee } from "@/lib/types/Employee";

const API_BASE_URL_ADMINISTRATIVE = process.env.NEXT_PUBLIC_API_BASE_URL_ADMINISTRATIVE;

// Add the type model for the form fields
type SeparationForm = {
  separationDate: string;
  natureOfSeparation: string;
  remarks: string;
  exitInterviewBy: string;
  exitInterviewDate: string;
};

type NatureOfSeparationDTO = {
    natureOfSeparationId: number;
    code: string;
    nature: string;
};

type Props = {
  employees?: Employee[];
  userRole?: string | null;
};

export default function Separation({employees, userRole,}: Props) {
  const [selectedEmployeeInterviewer, setSelectedEmployeeInterviewer] = useState<Employee | null>(null);
  const [inputValueEmployeeInterviewer, setInputValueEmployeeInterviewer] = useState("");

  const [selectedProcessedBy, setSelectedProcessedBy] = useState<Employee | null>(null);
  const [inputValueProcessedBy, setInputValueProcessedBy] = useState("");

  const [selectedApprovedBy, setSelectedApprovedBy] = useState<Employee | null>(null);
  const [inputValueApprovedBy, setInputValueApprovedBy] = useState("");
  
  const [natureList, setNatureList] = useState<NatureOfSeparationDTO[]>([]);
  const [isDisabled, setIsDisabled] = useState(true);
  const [formData, setFormData] = useState<SeparationForm>({
    separationDate: "",
    natureOfSeparation: "",
    remarks: "",
    exitInterviewBy: "",
    exitInterviewDate: "",
  });

  useEffect(() => {
    fetchNatureList();
  }, []);

  const fetchNatureList = async () => {
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL_ADMINISTRATIVE}/api/natureOfSeparation/get-all`
      );

      if (!res.ok) throw new Error("Failed to fetch list");

      const data = await res.json();
      setNatureList(data);
    } catch (error) {
      console.error("Error fetching nature list:", error);
      Swal.fire({ icon: "error", title: "Failed to load Nature of Separation" });
    }
  };


  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted:", formData);
    // TODO: send to API
  };

  const handleEditToggle = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisabled((prev) => {
      return !prev;
    });
  };

  const handleCancel = () => {
    setIsDisabled(true); // disable editing again
  };

  return (
    <form className={styles.Separation} onSubmit={handleSubmit}>
      <div className={styles.actionBtns}>
        {!isDisabled ? (
          <>
            <button type="submit" className={styles.submitBtn}>
              Save
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.editBtn}
            onClick={handleEditToggle}
          >
            Edit
          </button>
        )}
      </div>
      
      <div>&nbsp;</div>

      {/* Separation Details */}
      <section className={styles.section}>
        <h3>Separation Details</h3>
        <div className={styles.grid2}>
          <label>
            Separation Date
            <input
              type="date"
              name="separationDate"
              value={formData.separationDate}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>

          <label>
            Nature of Separation
            <select
              name="natureOfSeparation"
              value={formData.natureOfSeparation}
              onChange={handleChange}
              disabled={isDisabled}
              required={!isDisabled}
            >
              <option value="">-- Select --</option>
              {natureList.map((item) => (
                <option
                  key={item.natureOfSeparationId}
                  value={item.nature}
                >
                  {item.code} - {item.nature}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.remarks}>
          Remarks
          <textarea
            name="remarks"
            rows={3}
            value={formData.remarks}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </label>
      </section>

      {/* Exit Interview */}
      <section className={styles.section}>
        <h3>Exit Interview (Optional)</h3>
        <div className={styles.grid2}>
          <label>
            Exit Interview By
            <input
              id="employeeInterviewerId"
              type="text"
              list={userRole === "1" ? "employee-list" : undefined}
              placeholder="Employee No / Lastname"
              value={
                userRole === "1"
                  ? inputValueEmployeeInterviewer // ✅ Admin can type freely
                  : selectedEmployeeInterviewer
                  ? `[${selectedEmployeeInterviewer.employeeNo}] ${selectedEmployeeInterviewer.fullName}`
                  : ""
              }
              readOnly={userRole !== "1"} // ✅ Non-admin can't edit
              onChange={(e) => {
                if (userRole === "1") {
                  setInputValueEmployeeInterviewer(e.target.value); // ✅ Track admin typing

                  const selected = employees?.find(
                    (emp) =>
                      `[${emp.employeeNo}] ${emp.fullName}`.toLowerCase() ===
                      e.target.value.toLowerCase()
                  );
                  setSelectedEmployeeInterviewer(selected || null);
                }
              }}
            />
            {userRole === "1" && (
              <datalist id="employee-list">
                {employees?.map((emp) => (
                  <option
                    key={emp.employeeNo}
                    value={`[${emp.employeeNo}] ${emp.fullName}`}
                  />
                ))}
              </datalist>
            )}
          </label>
          <label>
            Exit Interview Date
            <input
              type="date"
              name="exitInterviewDate"
              value={formData.exitInterviewDate}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
        </div>
      </section>

      {/* Processing */}
      <section className={styles.section}>
        <h3>Processing</h3>
        <div className={styles.grid2}>
          <label>
            Processed By
            <input
              id="employeeIdProcessingBy"
              type="text"
              list={userRole === "1" ? "employee-list" : undefined}
              placeholder="Employee No / Lastname"
              value={
                userRole === "1"
                  ? inputValueProcessedBy // ✅ Admin can type freely
                  : selectedProcessedBy
                  ? `[${selectedProcessedBy.employeeNo}] ${selectedProcessedBy.fullName}`
                  : ""
              }
              readOnly={userRole !== "1"} // ✅ Non-admin can't edit
              onChange={(e) => {
                if (userRole === "1") {
                  setInputValueProcessedBy(e.target.value); // ✅ Track admin typing

                  const selected = employees?.find(
                    (emp) =>
                      `[${emp.employeeNo}] ${emp.fullName}`.toLowerCase() ===
                      e.target.value.toLowerCase()
                  );
                  setSelectedProcessedBy(selected || null);
                }
              }}
            />
            {userRole === "1" && (
              <datalist id="employee-list">
                {employees?.map((emp) => (
                  <option
                    key={emp.employeeNo}
                    value={`[${emp.employeeNo}] ${emp.fullName}`}
                  />
                ))}
              </datalist>
            )}
          </label>
          <label>
            Approved By
            <input
              id="approvedById"
              type="text"
              list={userRole === "1" ? "employee-list" : undefined}
              placeholder="Employee No / Lastname"
              value={
                userRole === "1"
                  ? inputValueApprovedBy // ✅ Admin can type freely
                  : selectedApprovedBy
                  ? `[${selectedApprovedBy.employeeNo}] ${selectedApprovedBy.fullName}`
                  : ""
              }
              readOnly={userRole !== "1"} // ✅ Non-admin can't edit
              onChange={(e) => {
                if (userRole === "1") {
                  setInputValueApprovedBy(e.target.value); // ✅ Track admin typing

                  const selected = employees?.find(
                    (emp) =>
                      `[${emp.employeeNo}] ${emp.fullName}`.toLowerCase() ===
                      e.target.value.toLowerCase()
                  );
                  setSelectedApprovedBy(selected || null);
                }
              }}
            />
            {userRole === "1" && (
              <datalist id="employee-list">
                {employees?.map((emp) => (
                  <option
                    key={emp.employeeNo}
                    value={`[${emp.employeeNo}] ${emp.fullName}`}
                  />
                ))}
              </datalist>
            )}
          </label>
        </div>
      </section>

      {/* Buttons */}
      <div className={styles.actionBtns}>
        {!isDisabled ? (
          <>
            <button type="submit" className={styles.submitBtn}>
              Save
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.editBtn}
            onClick={handleEditToggle}
          >
            Edit
          </button>
        )}
      </div>
    </form>
  );
}
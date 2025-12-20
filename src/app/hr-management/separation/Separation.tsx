"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "@/styles/Separation.module.scss";
import Swal from "sweetalert2";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import { toCustomFormat, toDateInputValue, customToLocaleDate } from "@/lib/utils/dateFormatUtils";
import { Employee } from "@/lib/types/Employee";
import { SeparationModel } from "@/lib/types/Separation";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";

const API_BASE_URL_ADMINISTRATIVE = process.env.NEXT_PUBLIC_API_BASE_URL_ADMINISTRATIVE;
const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;

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
  selectedEmployee?: Employee | null;
  separations?: SeparationModel[] | null;
  fetchEmploymentRecords?: () => Promise<void>;
};

export default function Separation({employees, userRole, selectedEmployee, separations, fetchEmploymentRecords}: Props) {
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

  const [separationList, setSeparationList] = useState<SeparationModel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  // const formRef = useRef<HTMLFormElement | null>(null);
  const detailsRef = useRef<HTMLElement | null>(null);
  // const [isDeleting, setIsDeleting] = useState(false);
  // animation state for the details section
  const [animateDetails, setAnimateDetails] = useState(false);
  const [highlightDetails, setHighlightDetails] = useState(false);
  // force remount key for details section to ensure animation restarts
  const [detailsKey, setDetailsKey] = useState(0);
  const containerRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    fetchNatureList();
  }, []);

  // Update separation list when prop changes (or selectedEmployee changes). Sort descending by separationDate
  useEffect(() => {
    const list = (separations || []).slice().sort((a, b) => {
      try {
        const aDate = a?.separationDate ? new Date(toDateInputValue(a.separationDate)).getTime() : 0;
        const bDate = b?.separationDate ? new Date(toDateInputValue(b.separationDate)).getTime() : 0;
        return bDate - aDate; // descending: newest first
      } catch (err) {
        console.error("Error sorting separations:", err);
        return 0;
      }
    });
    setSeparationList(list);
  }, [separations, selectedEmployee]);

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

  // Helper to get label for nature id
  const getNatureLabel = (id?: string | null) => {
    if (!id) return "";
    const n = natureList.find((x) => String(x.natureOfSeparationId) === String(id));
    return n ? `${n.code} - ${n.nature}` : String(id);
  };

  // Helper to get employee display name from employees prop
  const getEmployeeLabel = (id?: string | null) => {
    if (!id) return "";
    const emp = employees?.find((e) => String(e.employeeId) === String(id));
    return emp ? `${emp.fullName}` : String(id);
  };


  const handleChange = async (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Special handling for separationDate to prevent duplicates
    if (name === "separationDate") {
      // const prevValue = formData.separationDate;
      setFormData((prev) => ({ ...prev, separationDate: value }));

      // check if any existing separation has the same date (excluding currently editing record)
      const duplicate = separationList.find((item) => {
        try {
          return (
            toDateInputValue(item.separationDate) === value &&
            String(item.separationId) !== String(editingId ?? "")
          );
        } catch {
          return false;
        }
      });

      if (duplicate) {
        // show a small bottom-right toast warning and revert the date automatically
        const Toast = Swal.mixin({
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          didOpen: (toastEl) => {
            toastEl.onmouseenter = Swal.stopTimer;
            toastEl.onmouseleave = Swal.resumeTimer;
          },
        });

        Toast.fire({
          icon: "warning",
          title: `${customToLocaleDate(duplicate.separationDate)} already exists`,
        });

        // revert to previous value (keep UX consistent)
        setFormData((prev) => ({ ...prev, separationDate: "" }));
      }

      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // require selected employee to be provided (adjust if you want a select field instead)
    if (!selectedEmployee?.employeeId) {
      Swal.fire("Validation", "No employee selected for separation.", "warning");
      return;
    }

    // basic validation
    if (!formData.separationDate || !formData.natureOfSeparation || !formData.remarks) {
      Swal.fire("Validation", "Please fill required fields.", "warning");
      return;
    }

    // format dates to backend pattern
    const separationDateStr = toCustomFormat(formData.separationDate, true); // returns MM-dd-yyyy HH:mm:ss
    const exitInterviewDateStr = formData.exitInterviewDate ? toCustomFormat(formData.exitInterviewDate, true) : null;

    // map selected interviewer/processed/approved to numeric IDs
    const payload = {
      employeeId: Number(selectedEmployee.employeeId),
      separationDate: separationDateStr,
      natureOfSeparationId: Number(formData.natureOfSeparation), // ensure this value is the ID
      remarks: formData.remarks,
      employeeInterviewerId: Number(selectedEmployeeInterviewer?.employeeId ?? 0),
      exitInterviewDate: exitInterviewDateStr,
      employeeIdProcessingBy: Number(selectedProcessedBy?.employeeId ?? 0),
      approvedById: Number(selectedApprovedBy?.employeeId ?? 0),
    };

    try {
      // if editingId exists, call update endpoint (PUT), otherwise create (POST)
      let url = `${API_BASE_URL_HRM}/api/separation/create`;
      let method: "POST" | "PUT" = "POST";
      if (editingId) {
        url = `${API_BASE_URL_HRM}/api/separation/update/${encodeURIComponent(editingId)}`;
        method = "PUT";
      }

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || (editingId ? "Failed to update separation" : "Failed to save separation"));
      Swal.fire("Success", editingId ? "Separation updated" : "Separation saved", "success").then(async () => {
        // reset state and editing flag
        setIsDisabled(true);
        setEditingId(null);
        setFormData({
          separationDate: "",
          natureOfSeparation: "",
          remarks: "",
          exitInterviewBy: "",
          exitInterviewDate: "",
        });
        setSelectedEmployeeInterviewer(null);
        setInputValueEmployeeInterviewer("");
        setSelectedProcessedBy(null);
        setInputValueProcessedBy("");
        setSelectedApprovedBy(null);
        setInputValueApprovedBy("");

        // ask parent to refresh list
        await fetchEmploymentRecords?.();
      });
    } catch (err) {
      Swal.fire("Error", (err as Error).message || "Failed to save", "error");
    }
  };

  const handleEditToggle = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisabled((prev) => {
      return !prev;
    });
  };

  const handleCancel = () => {
    setIsDisabled(true); // disable editing again
    setEditingId(null);
    setFormData({
      separationDate: "",
      natureOfSeparation: "",
      remarks: "",
      exitInterviewBy: "",
      exitInterviewDate: "",
    });
    setSelectedEmployeeInterviewer(null);
    setInputValueEmployeeInterviewer("");
    setSelectedProcessedBy(null);
    setInputValueProcessedBy("");
    setSelectedApprovedBy(null);
    setInputValueApprovedBy("");
  };

  // EDIT BUTTON
  const handleEdit = (obj: SeparationModel) => {
    // 1. Enable editing
    setIsDisabled(false);
    setEditingId(String(obj.separationId ?? ""));

    // 2. Populate form fields
    setFormData({
      separationDate: obj.separationDate
        ? toDateInputValue(obj.separationDate)
        : "",
      natureOfSeparation: obj.natureOfSeparationId
        ? String(obj.natureOfSeparationId)
        : "",
      remarks: obj.remarks ?? "",
      exitInterviewBy: "",
      exitInterviewDate: obj.exitInterviewDate
        ? toDateInputValue(obj.exitInterviewDate)
        : "",
    });

    // 3. Populate employee selections
    const interviewer =
      employees?.find(
        (e) => String(e.employeeId) === String(obj.employeeInterviewerId)
      ) || null;

    setSelectedEmployeeInterviewer(interviewer);
    setInputValueEmployeeInterviewer(
      interviewer ? `[${interviewer.employeeNo}] ${interviewer.fullName}` : ""
    );

    const processed =
      employees?.find(
        (e) => String(e.employeeId) === String(obj.employeeIdProcessingBy)
      ) || null;

    setSelectedProcessedBy(processed);
    setInputValueProcessedBy(
      processed ? `[${processed.employeeNo}] ${processed.fullName}` : ""
    );

    const approved =
      employees?.find(
        (e) => String(e.employeeId) === String(obj.approvedById)
      ) || null;

    setSelectedApprovedBy(approved);
    setInputValueApprovedBy(
      approved ? `[${approved.employeeNo}] ${approved.fullName}` : ""
    );

    // 4. Reset animation flags
    setAnimateDetails(false);
    setHighlightDetails(false);

    // 5. Force animation replay
    setDetailsKey((k) => k + 1);

    // 6. Scroll to Separation Details
    requestAnimationFrame(() => {
      const targetElement = document.getElementById('slide-up-target-section');
      if (targetElement) {
        // Scroll the section into view smoothly
        // block: "start" brings the top of the element to the top of the scrollable area
        targetElement?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      // 7. Trigger slide + highlight
      setAnimateDetails(true);
      setHighlightDetails(true);

      setTimeout(() => setHighlightDetails(false), 1400);
    });
  };

  // DELETE with Swal confirm
  const handleDelete = async (id: number) => {
    if (!id) return;
    const result = await Swal.fire({
      title: "Delete Separation",
      text: "Are you sure you want to delete this separation record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      // setIsDeleting(true);
      try {
        const url = `${API_BASE_URL_HRM}/api/separation/delete/${encodeURIComponent(String(id))}`;
        const res = await fetchWithAuth(url, { method: "DELETE" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to delete separation");
        }

        Swal.fire("Deleted", "Separation record has been deleted.", "success").then(async () => {
          // refresh parent list
          await fetchEmploymentRecords?.();
          // also remove locally for instant UI feedback
          setSeparationList((prev) => prev.filter((it) => String(it.separationId) !== String(id)));
        });
      } catch (err) {
        Swal.fire("Error", (err as Error).message || "Failed to delete", "error");
      } finally {
        // setIsDeleting(false);
      }
    }
  };

  return (
    <form ref={containerRef} className={styles.Separation} onSubmit={handleSubmit}>
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
            New
          </button>
        )}
      </div>
      
      <div>&nbsp;</div>

      {/* Separation Details */}
      <section
        key={detailsKey}
        ref={detailsRef}
        className={`${styles.section} ${animateDetails ? styles.slideUp : ""} ${highlightDetails ? styles.highlight : ""}`}
      >
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
                  value={String(item.natureOfSeparationId)}
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
            New
          </button>
        )}
      </div>

      <div>&nbsp;</div>

      <div className={styles.SeparationTable}>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Separation Date</th>
                    <th>Nature of Separation</th>
                    <th>Remarks</th>
                    <th>Employee Interviewer</th>
                    <th>Exit Interview Date</th>
                    <th>Employee Processing By</th>
                    <th>Approved By</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
              {separationList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    No records yet.
                  </td>
                </tr>
              ) : (
                separationList.map((item) => (
                  <tr key={item.separationId}>
                      <td>{customToLocaleDate(item.separationDate)}</td>
                      <td>{getNatureLabel(item.natureOfSeparationId)}</td>
                      <td>{item.remarks}</td>
                      <td>{getEmployeeLabel(item.employeeInterviewerId)}</td>
                      <td>{item.exitInterviewDate ? customToLocaleDate(item.exitInterviewDate) : ""}</td>
                      <td>{getEmployeeLabel(item.employeeIdProcessingBy)}</td>
                      <td>{getEmployeeLabel(item.approvedById)}</td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                              type="button"
                              className={`${styles.iconButton} ${styles.editIcon}`}
                              onClick={() => handleEdit(item)}
                          >
                              <FaRegEdit />
                          </button>
                          <button
                              type="button"
                              className={`${styles.iconButton} ${styles.deleteIcon}`}
                              onClick={() => handleDelete(Number(item.separationId))}
                          >
                              <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                  </tr>
                ))
              )}
            </tbody>
        </table>
      </div>
    </form>
  );
}